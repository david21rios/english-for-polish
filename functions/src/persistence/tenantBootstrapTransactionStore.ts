import { AUDIT_RESULTS } from "@mipymetic/saas-contracts/audit";
import { COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES, validateBootstrapTenantResult } from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  membershipDocumentPath, membershipKeyDocumentPath, platformAuthorityRegistryDocumentPath,
  privilegedCommandDocumentPath, tenantAdminAuthorityStateDocumentPath, tenantBrandingDocumentPath,
  tenantDocumentPath, tenantSettingsDocumentPath, validateMembershipKey, validatePersistedTenant,
  validateTenantAdminAuthorityState, validateTenantBranding, validateTenantSettings,
} from "@mipymetic/saas-contracts/persistence";
import { PLATFORM_AUTHORITY_REGISTRY_STATES, validatePlatformAuthorityRegistry } from "@mipymetic/saas-contracts/authority";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { writeAuditEvent } from "../audit/auditWriter.js";
import { validatePersistedCommandRecord } from "../commands/commandRecord.js";
import { BackendError } from "../errors/backendError.js";
import { serverOwnedTimestamp, type TransactionRunnerPort } from "./ports.js";
import { runAuthoritativeTransaction } from "./transactionBoundary.js";

export interface BootstrapTenantAggregate {
  readonly commandId:string; readonly correlationId:string; readonly payloadHash:string;
  readonly tenantId:string; readonly membershipId:string; readonly uidKey:string;
  readonly actor:AuthorityResolution; readonly tenant:Readonly<Record<string,unknown>>;
  readonly settings:Readonly<Record<string,unknown>>; readonly branding:Readonly<Record<string,unknown>>;
  readonly membership:Readonly<Record<string,unknown>>; readonly membershipKey:Readonly<Record<string,unknown>>;
  readonly authorityState:Readonly<Record<string,unknown>>; readonly result:Readonly<Record<string,JsonValue>>;
}
export interface TenantBootstrapTransactionStore { execute(input:BootstrapTenantAggregate):Promise<Readonly<{replayed:boolean}>> }

export const validateBootstrapTenantPersistedResult=(value:unknown,expected:Readonly<{commandId:string;correlationId:string;tenantId:string}>):void=>{
  const validation=validateBootstrapTenantResult(value);
  if(!validation.ok)contract("BootstrapTenant persisted result is malformed.");
  const persisted=value as Readonly<Record<string,unknown>>;
  if(persisted.commandId!==expected.commandId||persisted.correlationId!==expected.correlationId
    ||persisted.operation!==COMMAND_TYPES.BOOTSTRAP_TENANT||persisted.resourceType!=="tenant"
    ||persisted.resourceId!==expected.tenantId||persisted.status!==COMMAND_STATUSES.SUCCEEDED
    ||persisted.replayed!==false)contract("BootstrapTenant persisted result binding is incoherent.");
};

const conflict=(message:string):never=>{throw new BackendError(BACKEND_ERROR_CODES.CONFLICT,message)};
const contract=(message:string):never=>{throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION,message)};
const exists=(message:string):never=>{throw new BackendError(BACKEND_ERROR_CODES.ALREADY_EXISTS,message)};
const exactMembership=(value:unknown,input:BootstrapTenantAggregate):boolean=>{
  if(typeof value!=="object"||value===null||Array.isArray(value))return false;
  const v=value as Readonly<Record<string,unknown>>, fields=["membershipId","tenantId","uid","role","status","originRequestId","createdAt","approvedAt","approvedBy","updatedAt","suspendedAt","removedAt"];
  return Object.keys(v).length===fields.length&&fields.every(field=>Object.prototype.hasOwnProperty.call(v,field))
    &&v.membershipId===input.membershipId&&v.tenantId===input.tenantId;
};
const membershipKeyMatches=(value:unknown,input:BootstrapTenantAggregate):boolean=>{
  if(typeof value!=="object"||value===null||Array.isArray(value))return false;
  const key=value as Readonly<Record<string,unknown>>;
  return key.tenantId===input.tenantId&&key.uid===input.membershipKey.uid&&key.membershipId===input.membershipId;
};

export const createTenantBootstrapTransactionStore=(runner:TransactionRunnerPort):TenantBootstrapTransactionStore=>Object.freeze({execute:async(input:BootstrapTenantAggregate)=>runAuthoritativeTransaction(runner,async({transaction})=>{
  const commandPath=privilegedCommandDocumentPath(input.commandId), commandSnapshot=await transaction.get(commandPath,"privileged_command");
  if(commandSnapshot.exists){const command=validatePersistedCommandRecord(commandSnapshot.data);if(command.commandType!==COMMAND_TYPES.BOOTSTRAP_TENANT||command.payloadHash!==input.payloadHash||command.correlationId!==input.correlationId)conflict("BootstrapTenant command binding conflicts.");if(command.status!==COMMAND_STATUSES.SUCCEEDED||command.stage!==PRIVILEGED_COMMAND_STAGES.COMPLETED)conflict("BootstrapTenant command state conflicts.");if(command.tenantId!==input.tenantId)contract("BootstrapTenant command target is incoherent.");validateBootstrapTenantPersistedResult(command.result,{commandId:command.commandId,correlationId:command.correlationId,tenantId:input.tenantId});return Object.freeze({replayed:true})}
  const paths={registry:platformAuthorityRegistryDocumentPath(),tenant:tenantDocumentPath(input.tenantId),settings:tenantSettingsDocumentPath(input.tenantId),branding:tenantBrandingDocumentPath(input.tenantId),membership:membershipDocumentPath(input.tenantId,input.membershipId),key:membershipKeyDocumentPath(input.tenantId,input.uidKey),state:tenantAdminAuthorityStateDocumentPath(input.tenantId)};
  const [registry,tenant,settings,branding,membership,key,state]=await Promise.all([
    transaction.get(paths.registry,"platform_authority_registry"),transaction.get(paths.tenant,"tenant"),transaction.get(paths.settings,"tenant_settings"),transaction.get(paths.branding,"tenant_branding"),transaction.get(paths.membership,"membership"),transaction.get(paths.key,"membership_key"),transaction.get(paths.state,"tenant_admin_authority_state")]);
  if(!registry.exists)contract("Platform Registry is missing or malformed.");const registryValidation=validatePlatformAuthorityRegistry(registry.data);const registryValue="value" in registryValidation?registryValidation.value:contract("Platform Registry is missing or malformed.");if(registryValue.bootstrapState!==PLATFORM_AUTHORITY_REGISTRY_STATES.COMPLETED)throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"Platform Registry is not completed.");
  if(tenant.exists){if(!validatePersistedTenant(tenant.data).ok)contract("Tenant collision is malformed.");exists("Tenant already exists.")}
  if(settings.exists){if(!validateTenantSettings(settings.data).ok)contract("Settings collision is malformed.");exists("Tenant Settings already exist.")}
  if(branding.exists){if(!validateTenantBranding(branding.data).ok)contract("Branding collision is malformed.");exists("Tenant Branding already exists.")}
  if(membership.exists){if(!exactMembership(membership.data,input))contract("Membership collision is malformed.");exists("Membership already exists.")}
  if(key.exists){const keyValidation=validateMembershipKey(key.data);if(!keyValidation.ok)contract("MembershipKey collision is malformed.");if(!membershipKeyMatches(key.data,input))contract("MembershipKey collision points to a foreign Membership.");exists("MembershipKey already exists.")}
  if(state.exists){if(!validateTenantAdminAuthorityState(state.data).ok)contract("Authority State collision is malformed.");exists("Authority State already exists.")}
  if(!validateBootstrapTenantResult(input.result).ok)contract("BootstrapTenant result is malformed.");const command={commandId:input.commandId,commandType:COMMAND_TYPES.BOOTSTRAP_TENANT,payloadHash:input.payloadHash,actorUid:input.actor.actorUid,actorType:input.actor.actorType,authority:input.actor.authority,tenantId:input.tenantId,status:COMMAND_STATUSES.SUCCEEDED,stage:PRIVILEGED_COMMAND_STAGES.COMPLETED,startedAt:serverOwnedTimestamp(),completedAt:serverOwnedTimestamp(),failedAt:null,result:input.result,errorCode:null,attemptCount:1,correlationId:input.correlationId,expiresAt:null,leaseExpiresAt:null,schemaVersion:COMMAND_SCHEMA_VERSION};validatePersistedCommandRecord({...command,startedAt:registryValue.updatedAt,completedAt:registryValue.updatedAt});
  transaction.create(paths.tenant,input.tenant);transaction.create(paths.settings,input.settings);transaction.create(paths.branding,input.branding);transaction.create(paths.membership,input.membership);transaction.create(paths.key,input.membershipKey);transaction.create(paths.state,input.authorityState);transaction.create(commandPath,command);
  const common={commandId:input.commandId,correlationId:input.correlationId,level:"critical" as const,operation:"BootstrapTenant.create",resourceType:"tenant",resourceId:input.tenantId,result:AUDIT_RESULTS.SUCCEEDED,errorCode:null,beforeSummary:{tenantExists:false},afterSummary:{tenantStatus:"active",firstAdminStatus:"approved",tenantAdminActiveCount:1},metadata:{stage:"completed",tenantType:input.tenant.tenantType as string}};
  writeAuditEvent(transaction,{...common,auditId:`${input.commandId}-tenant-create`,authority:Object.freeze({...input.actor,tenantId:input.tenantId})});writeAuditEvent(transaction,{...common,auditId:`${input.commandId}-platform-create`,authority:input.actor});
  return Object.freeze({replayed:false});
})});
