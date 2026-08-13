import { AUDIT_RESULTS } from "@mipymetic/saas-contracts/audit";
import { COMMAND_SCHEMA_VERSION, COMMAND_STATUSES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES, validateBootstrapTenantResult } from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  encodeMembershipUidKey, membershipDocumentPath, membershipKeyDocumentPath, platformAuthorityRegistryDocumentPath,
  privilegedCommandDocumentPath, tenantAdminAuthorityStateDocumentPath, tenantBrandingDocumentPath,
  tenantDocumentPath, tenantSettingsDocumentPath, validateMembershipKey, validatePersistedTenant,
  validatePersistedMembership, validateTenantAdminAuthorityState, validateTenantBranding, validateTenantSettings,
} from "@mipymetic/saas-contracts/persistence";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, TENANT_STATUSES } from "@mipymetic/saas-contracts/domain";
import { PLATFORM_AUTHORITY_REGISTRY_STATES, validatePlatformAuthorityRegistry } from "@mipymetic/saas-contracts/authority";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { writeAuditEvent } from "../audit/auditWriter.js";
import { validatePersistedCommandRecord } from "../commands/commandRecord.js";
import { BackendError } from "../errors/backendError.js";
import { isServerOwnedTimestamp, serverOwnedTimestamp, type TransactionRunnerPort } from "./ports.js";
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
const timestampFields=Object.freeze({
  tenant:Object.freeze({createdAt:false,updatedAt:false,suspendedAt:true,archivedAt:true}),
  settings:Object.freeze({updatedAt:false}),branding:Object.freeze({updatedAt:false}),
  membership:Object.freeze({createdAt:false,approvedAt:false,updatedAt:false,suspendedAt:true,removedAt:true}),
  membershipKey:Object.freeze({updatedAt:false}),authorityState:Object.freeze({updatedAt:false}),
});
const plain=(value:unknown):value is Readonly<Record<string,unknown>>=>value!==null&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const containsTimestampToken=(value:unknown):boolean=>isServerOwnedTimestamp(value)
  ||(Array.isArray(value)?value.some(containsTimestampToken):plain(value)&&Object.values(value).some(containsTimestampToken));
const logicalCandidate=(value:unknown,fields:Readonly<Record<string,boolean>>,logicalTimestamp:string):Readonly<Record<string,unknown>>=>{
  if(!plain(value))return contract("BootstrapTenant write candidate is malformed.");
  const candidate:Record<string,unknown>={...value};
  for(const [field,nullable] of Object.entries(fields)){
    if(!Object.prototype.hasOwnProperty.call(candidate,field))contract("BootstrapTenant server timestamp field is missing.");
    if(candidate[field]===null&&nullable)continue;
    if(!isServerOwnedTimestamp(candidate[field]))contract("BootstrapTenant server timestamp token is invalid.");
    candidate[field]=logicalTimestamp;
  }
  if(containsTimestampToken(candidate))contract("BootstrapTenant server timestamp token is unexpected.");
  return candidate;
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
  if(membership.exists){if(!validatePersistedMembership(membership.data).ok)contract("Membership collision is malformed.");const value=membership.data!;if(value.membershipId!==input.membershipId||value.tenantId!==input.tenantId)contract("Membership collision is incoherent.");exists("Membership already exists.")}
  if(key.exists){const keyValidation=validateMembershipKey(key.data);if(!keyValidation.ok)contract("MembershipKey collision is malformed.");if(!membershipKeyMatches(key.data,input))contract("MembershipKey collision points to a foreign Membership.");exists("MembershipKey already exists.")}
  if(state.exists){if(!validateTenantAdminAuthorityState(state.data).ok)contract("Authority State collision is malformed.");exists("Authority State already exists.")}
  const logicalTenant=logicalCandidate(input.tenant,timestampFields.tenant,registryValue.updatedAt),logicalSettings=logicalCandidate(input.settings,timestampFields.settings,registryValue.updatedAt),logicalBranding=logicalCandidate(input.branding,timestampFields.branding,registryValue.updatedAt),logicalMembership=logicalCandidate(input.membership,timestampFields.membership,registryValue.updatedAt),logicalKey=logicalCandidate(input.membershipKey,timestampFields.membershipKey,registryValue.updatedAt),logicalState=logicalCandidate(input.authorityState,timestampFields.authorityState,registryValue.updatedAt);
  if(!validatePersistedTenant(logicalTenant).ok||!validateTenantSettings(logicalSettings).ok||!validateTenantBranding(logicalBranding).ok||!validatePersistedMembership(logicalMembership).ok||!validateMembershipKey(logicalKey).ok||!validateTenantAdminAuthorityState(logicalState).ok)contract("BootstrapTenant aggregate violates shared contracts.");
  if(logicalTenant.tenantId!==input.tenantId||logicalSettings.tenantId!==input.tenantId||logicalBranding.tenantId!==input.tenantId||logicalMembership.tenantId!==input.tenantId||logicalKey.tenantId!==input.tenantId||logicalState.tenantId!==input.tenantId)contract("BootstrapTenant aggregate Tenant binding is incoherent.");
  if(logicalTenant.status!==TENANT_STATUSES.ACTIVE||logicalTenant.suspendedAt!==null||logicalTenant.archivedAt!==null)contract("BootstrapTenant initial Tenant lifecycle is incoherent.");
  if(logicalMembership.membershipId!==input.membershipId||logicalMembership.uid!==logicalKey.uid||logicalMembership.role!==MEMBERSHIP_ROLES.TENANT_ADMIN||logicalMembership.status!==MEMBERSHIP_STATUSES.APPROVED||logicalMembership.originRequestId!==null||logicalMembership.approvedBy!==input.actor.actorUid||logicalMembership.suspendedAt!==null||logicalMembership.removedAt!==null)contract("BootstrapTenant first Membership is incoherent.");
  if(logicalKey.membershipId!==input.membershipId||logicalKey.status!==logicalMembership.status||logicalKey.originRequestId!==logicalMembership.originRequestId||input.uidKey!==encodeMembershipUidKey(logicalMembership.uid))contract("BootstrapTenant MembershipKey composition is incoherent.");
  if(logicalState.activeCount!==1||logicalState.revision!==1||logicalState.lastCommandId!==input.commandId)contract("BootstrapTenant Authority State initial tuple is incoherent.");
  validateBootstrapTenantPersistedResult(input.result,{commandId:input.commandId,correlationId:input.correlationId,tenantId:input.tenantId});const command={commandId:input.commandId,commandType:COMMAND_TYPES.BOOTSTRAP_TENANT,payloadHash:input.payloadHash,actorUid:input.actor.actorUid,actorType:input.actor.actorType,authority:input.actor.authority,tenantId:input.tenantId,status:COMMAND_STATUSES.SUCCEEDED,stage:PRIVILEGED_COMMAND_STAGES.COMPLETED,startedAt:serverOwnedTimestamp(),completedAt:serverOwnedTimestamp(),failedAt:null,result:input.result,errorCode:null,attemptCount:1,correlationId:input.correlationId,expiresAt:null,leaseExpiresAt:null,schemaVersion:COMMAND_SCHEMA_VERSION};validatePersistedCommandRecord({...command,startedAt:registryValue.updatedAt,completedAt:registryValue.updatedAt});
  transaction.create(paths.tenant,input.tenant);transaction.create(paths.settings,input.settings);transaction.create(paths.branding,input.branding);transaction.create(paths.membership,input.membership);transaction.create(paths.key,input.membershipKey);transaction.create(paths.state,input.authorityState);transaction.create(commandPath,command);
  const common={commandId:input.commandId,correlationId:input.correlationId,level:"critical" as const,operation:"BootstrapTenant.create",resourceType:"tenant",resourceId:input.tenantId,result:AUDIT_RESULTS.SUCCEEDED,errorCode:null,beforeSummary:{tenantExists:false},afterSummary:{tenantStatus:"active",firstAdminStatus:"approved",tenantAdminActiveCount:1},metadata:{stage:"completed",tenantType:input.tenant.tenantType as string}};
  writeAuditEvent(transaction,{...common,auditId:`${input.commandId}-tenant-create`,authority:Object.freeze({...input.actor,tenantId:input.tenantId})});writeAuditEvent(transaction,{...common,auditId:`${input.commandId}-platform-create`,authority:input.actor});
  return Object.freeze({replayed:false});
})});
