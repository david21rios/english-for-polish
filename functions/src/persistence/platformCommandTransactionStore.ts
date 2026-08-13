import { PLATFORM_AUTHORITY, PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION, PLATFORM_AUTHORITY_REGISTRY_STATES, PLATFORM_AUTHORITY_SCHEMA_VERSION, PLATFORM_AUTHORITY_STATUSES, validatePlatformAuthority, validatePlatformAuthorityRegistry } from "@mipymetic/saas-contracts/authority";
import { COMMAND_STATUSES, COMMAND_TYPES, PRIVILEGED_COMMAND_STAGES } from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { platformAuthorityDocumentPath, platformAuthorityRegistryDocumentPath, privilegedCommandDocumentPath } from "@mipymetic/saas-contracts/persistence";
import type { AuthorityResolution, CommandRecord, CommandStatus, JsonValue, PrivilegedCommandStage } from "../contracts/types.js";
import { writeAuditEvent } from "../audit/auditWriter.js";
import { validatePersistedCommandRecord } from "../commands/commandRecord.js";
import { BackendError } from "../errors/backendError.js";
import { serverOwnedTimestamp, type TransactionRunnerPort } from "./ports.js";
import { runAuthoritativeTransaction } from "./transactionBoundary.js";

type RegistryState = (typeof PLATFORM_AUTHORITY_REGISTRY_STATES)[keyof typeof PLATFORM_AUTHORITY_REGISTRY_STATES];
type AuthorityStatus = (typeof PLATFORM_AUTHORITY_STATUSES)[keyof typeof PLATFORM_AUTHORITY_STATUSES];
interface PlatformAuthority { readonly schemaVersion: 2; readonly transitionCommandId: string|null; readonly uid: string; readonly authority: "platform_admin"; readonly status: AuthorityStatus; readonly createdAt: string; readonly createdBy: string; readonly updatedAt: string; readonly updatedBy: string; readonly activatedAt: string|null; readonly revokedAt: string|null; readonly revokedBy: string|null; readonly bootstrapCommandId: string|null; readonly lastClaimSyncAt: string|null }
interface PlatformRegistry { readonly schemaVersion: 1; readonly bootstrapState: RegistryState; readonly activeCount: number; readonly revision: number; readonly lastCommandId: string|null; readonly updatedAt: string }

export interface PlatformAuthorityTransition { readonly uid: string; readonly expectedStatus: AuthorityStatus|null; readonly nextStatus: AuthorityStatus; readonly bootstrapCommandId: string|null; readonly recordClaimSync?: boolean }
export interface PlatformCommandStoreMutation {
  readonly commandId: string; readonly correlationId: string; readonly payloadHash: string;
  readonly nextCommandStatus: CommandStatus; readonly nextCommandStage: PrivilegedCommandStage;
  readonly commandResult: JsonValue; readonly commandErrorCode: string|null;
  readonly nextRegistryState: RegistryState; readonly activeCountDelta: -1|0|1|2;
  readonly authorities: readonly PlatformAuthorityTransition[];
  readonly audit: Readonly<{ auditId: string; authority: AuthorityResolution; operation: string; resourceType: string; resourceId: string; result: "succeeded"|"failed"|"recovery_required"; errorCode: string|null; beforeSummary: Readonly<Record<string,JsonValue>>; afterSummary: Readonly<Record<string,JsonValue>>; metadata: Readonly<Record<string,JsonValue>> }>;
}
export interface RecoveryOwnershipInput {
  readonly commandId:string; readonly correlationId:string; readonly payloadHash:string; readonly targetUid:string;
  readonly audit: PlatformCommandStoreMutation["audit"];
}
export interface RecoveryOwnershipHandoffInput extends RecoveryOwnershipInput { readonly priorCommandId:string }
type StoreResult = Readonly<{ command: CommandRecord; registry: PlatformRegistry; authorities: readonly PlatformAuthority[] }>;
export interface PlatformCommandTransactionStore {
  mutate(input: PlatformCommandStoreMutation): Promise<StoreResult>;
  claimActiveRecoveryOwnership(input: RecoveryOwnershipInput): Promise<StoreResult>;
  handoffRecoveryOwnership(input: RecoveryOwnershipHandoffInput): Promise<StoreResult>;
  markActiveRecoveryRequired(input: RecoveryOwnershipInput): Promise<StoreResult>;
}

const fail = (message:string):never => { throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION,message); };
const conflict = (message:string):never => { throw new BackendError(BACKEND_ERROR_CODES.CONFLICT,message); };
const registryValue = (value:unknown):PlatformRegistry => { const result=validatePlatformAuthorityRegistry(value); return result.ok ? result.value as PlatformRegistry : fail("Persisted Registry is invalid."); };
const authorityValue = (value:unknown):PlatformAuthority => { const result=validatePlatformAuthority(value); return result.ok ? result.value as PlatformAuthority : fail("Persisted Authority is invalid."); };
const rank = Object.freeze({not_started:0,prepared:1,completed:2});
const transitional = new Set<string>([PLATFORM_AUTHORITY_STATUSES.PROVISIONING,PLATFORM_AUTHORITY_STATUSES.REVOKING,PLATFORM_AUTHORITY_STATUSES.RECOVERY_REQUIRED]);

const assertRecoverBinding=(command:CommandRecord,input:RecoveryOwnershipInput):void=>{
  if(command.commandType!==COMMAND_TYPES.RECOVER_PLATFORM_ADMIN) fail("Recovery ownership requires a Recover command.");
  if(command.commandId!==input.commandId) fail("Command path identity is invalid.");
  if(command.payloadHash!==input.payloadHash||command.correlationId!==input.correlationId) conflict("Command binding conflicts.");
};

const recoveryOwnership=async(runner:TransactionRunnerPort,input:RecoveryOwnershipInput,priorCommandId:string|null):Promise<StoreResult>=>runAuthoritativeTransaction(runner,async({transaction})=>{
  const registryPath=platformAuthorityRegistryDocumentPath(), commandPath=privilegedCommandDocumentPath(input.commandId), authorityPath=platformAuthorityDocumentPath(input.targetUid);
  const registrySnapshot=await transaction.get(registryPath,"platform_authority_registry"), commandSnapshot=await transaction.get(commandPath,"privileged_command"), authoritySnapshot=await transaction.get(authorityPath,"platform_authority");
  const priorSnapshot=priorCommandId===null?null:await transaction.get(privilegedCommandDocumentPath(priorCommandId),"privileged_command");
  if(!registrySnapshot.exists||!commandSnapshot.exists||!authoritySnapshot.exists) fail("Recovery ownership documents must exist.");
  const registry=registryValue(registrySnapshot.data), command=validatePersistedCommandRecord(commandSnapshot.data), authority=authorityValue(authoritySnapshot.data);
  assertRecoverBinding(command,input);
  const resumable=(command.status===COMMAND_STATUSES.RUNNING||command.status===COMMAND_STATUSES.RECOVERY_REQUIRED)&&command.stage===PRIVILEGED_COMMAND_STAGES.PREPARED;
  if(priorCommandId===null){
    if(authority.status!==PLATFORM_AUTHORITY_STATUSES.ACTIVE) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"Active Recovery ownership requires active Authority.");
    if(resumable&&authority.transitionCommandId===input.commandId)return Object.freeze({command,registry,authorities:Object.freeze([authority])});
  }else if(resumable&&authority.status===PLATFORM_AUTHORITY_STATUSES.PROVISIONING&&authority.transitionCommandId===input.commandId)return Object.freeze({command,registry,authorities:Object.freeze([authority])});
  if(command.status!==COMMAND_STATUSES.PENDING||command.stage!==PRIVILEGED_COMMAND_STAGES.NOT_STARTED) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"New Recover command is not pending.");
  if(priorCommandId===null){
    if(authority.transitionCommandId!==null) conflict("Authority is owned by another command.");
  }else{
    const persistedPrior=priorSnapshot;
    if(persistedPrior===null||!persistedPrior.exists) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION,"Prior Recover command is missing.");
    const prior=validatePersistedCommandRecord(persistedPrior.data);
    if(prior.commandId!==priorCommandId||prior.commandType!==COMMAND_TYPES.RECOVER_PLATFORM_ADMIN) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"Prior owner is not an eligible Recover command.");
    if(prior.status!==COMMAND_STATUSES.RECOVERY_REQUIRED||prior.stage!==PRIVILEGED_COMMAND_STAGES.PREPARED) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"Prior Recover command is not handoff-eligible.");
    if(authority.status!==PLATFORM_AUTHORITY_STATUSES.RECOVERY_REQUIRED||authority.transitionCommandId!==priorCommandId) conflict("Authority ownership changed concurrently.");
  }
  const nextStatus=priorCommandId===null?PLATFORM_AUTHORITY_STATUSES.ACTIVE:PLATFORM_AUTHORITY_STATUSES.PROVISIONING;
  const logicalAuthority=authorityValue({...authority,status:nextStatus,transitionCommandId:input.commandId,updatedBy:input.commandId});
  const nextRegistry=registryValue({...registry,bootstrapState:PLATFORM_AUTHORITY_REGISTRY_STATES.IN_PROGRESS,revision:registry.revision+1,lastCommandId:input.commandId});
  const nextCommand=validatePersistedCommandRecord({...command,status:COMMAND_STATUSES.RUNNING,stage:PRIVILEGED_COMMAND_STAGES.PREPARED,leaseExpiresAt:null});
  transaction.update(authorityPath,{status:logicalAuthority.status,transitionCommandId:input.commandId,updatedAt:serverOwnedTimestamp(),updatedBy:input.commandId});
  transaction.set(registryPath,{...nextRegistry,updatedAt:serverOwnedTimestamp()});
  transaction.update(commandPath,{status:COMMAND_STATUSES.RUNNING,stage:PRIVILEGED_COMMAND_STAGES.PREPARED,leaseExpiresAt:null});
  writeAuditEvent(transaction,{...input.audit,commandId:input.commandId,correlationId:input.correlationId,level:"critical"});
  return Object.freeze({command:nextCommand,registry:nextRegistry,authorities:Object.freeze([logicalAuthority])});
});

const markActiveRecoveryRequired=async(runner:TransactionRunnerPort,input:RecoveryOwnershipInput):Promise<StoreResult>=>runAuthoritativeTransaction(runner,async({transaction})=>{
  const registryPath=platformAuthorityRegistryDocumentPath(),commandPath=privilegedCommandDocumentPath(input.commandId),authorityPath=platformAuthorityDocumentPath(input.targetUid);
  const registrySnapshot=await transaction.get(registryPath,"platform_authority_registry"),commandSnapshot=await transaction.get(commandPath,"privileged_command"),authoritySnapshot=await transaction.get(authorityPath,"platform_authority");
  if(!registrySnapshot.exists||!commandSnapshot.exists||!authoritySnapshot.exists) fail("Active Recovery checkpoint documents must exist.");
  const registry=registryValue(registrySnapshot.data),command=validatePersistedCommandRecord(commandSnapshot.data),authority=authorityValue(authoritySnapshot.data);
  assertRecoverBinding(command,input);
  if(authority.status!==PLATFORM_AUTHORITY_STATUSES.ACTIVE||authority.transitionCommandId!==input.commandId) conflict("Active Recovery checkpoint ownership is invalid.");
  if(command.status===COMMAND_STATUSES.RECOVERY_REQUIRED&&command.stage===PRIVILEGED_COMMAND_STAGES.PREPARED)return Object.freeze({command,registry,authorities:Object.freeze([authority])});
  if(command.status!==COMMAND_STATUSES.RUNNING||command.stage!==PRIVILEGED_COMMAND_STAGES.PREPARED) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"Active Recovery checkpoint requires running/prepared.");
  const nextRegistry=registryValue({...registry,bootstrapState:PLATFORM_AUTHORITY_REGISTRY_STATES.RECOVERY_REQUIRED,revision:registry.revision+1,lastCommandId:input.commandId});
  const nextCommand=validatePersistedCommandRecord({...command,status:COMMAND_STATUSES.RECOVERY_REQUIRED,stage:PRIVILEGED_COMMAND_STAGES.PREPARED,leaseExpiresAt:null});
  transaction.set(registryPath,{...nextRegistry,updatedAt:serverOwnedTimestamp()});
  transaction.update(commandPath,{status:COMMAND_STATUSES.RECOVERY_REQUIRED,stage:PRIVILEGED_COMMAND_STAGES.PREPARED,leaseExpiresAt:null});
  writeAuditEvent(transaction,{...input.audit,commandId:input.commandId,correlationId:input.correlationId,level:"critical"});
  return Object.freeze({command:nextCommand,registry:nextRegistry,authorities:Object.freeze([authority])});
});

export const createPlatformCommandTransactionStore = (runner:TransactionRunnerPort):PlatformCommandTransactionStore => Object.freeze({
  claimActiveRecoveryOwnership: (input:RecoveryOwnershipInput)=>recoveryOwnership(runner,input,null),
  handoffRecoveryOwnership: (input:RecoveryOwnershipHandoffInput)=>recoveryOwnership(runner,input,input.priorCommandId),
  markActiveRecoveryRequired: (input:RecoveryOwnershipInput)=>markActiveRecoveryRequired(runner,input),
  mutate: async (input: PlatformCommandStoreMutation) => runAuthoritativeTransaction(runner, async ({transaction}) => {
    const commandPath=privilegedCommandDocumentPath(input.commandId), registryPath=platformAuthorityRegistryDocumentPath();
    const registrySnapshot=await transaction.get(registryPath,"platform_authority_registry");
    // The Registry is the shared serialization point for every platform command.
    // Reading it first gives competing transactions a single lock order.
    const commandSnapshot=await transaction.get(commandPath,"privileged_command");
    if(!commandSnapshot.exists||!registrySnapshot.exists) return fail("Command and Registry must exist.");
    const command=validatePersistedCommandRecord(commandSnapshot.data), registry=registryValue(registrySnapshot.data);
    if(command.commandId!==input.commandId) return fail("Command path identity is invalid.");
    if(command.payloadHash!==input.payloadHash||command.correlationId!==input.correlationId) return conflict("Command binding conflicts.");
    if(command.status===COMMAND_STATUSES.SUCCEEDED&&command.stage===PRIVILEGED_COMMAND_STAGES.COMPLETED
      &&input.nextCommandStatus===COMMAND_STATUSES.SUCCEEDED&&input.nextCommandStage===PRIVILEGED_COMMAND_STAGES.COMPLETED){
      return Object.freeze({command,registry,authorities:Object.freeze([])});
    }
    const currentRank=rank[command.stage], nextRank=rank[input.nextCommandStage];
    if(nextRank<currentRank||nextRank>currentRank+1) return fail("Stage transition is invalid.");
    if(command.commandType===COMMAND_TYPES.BOOTSTRAP_PLATFORM_ADMINS){
      if(registry.bootstrapState!==PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED&&registry.lastCommandId!==input.commandId) return conflict("Bootstrap is already claimed.");
      if(input.nextCommandStage===PRIVILEGED_COMMAND_STAGES.PREPARED&&input.activeCountDelta!==0) return fail("Bootstrap prepare delta is invalid.");
      if(input.nextCommandStage===PRIVILEGED_COMMAND_STAGES.COMPLETED&&input.activeCountDelta!==2) return fail("Bootstrap completion delta is invalid.");
    } else if(command.commandType===COMMAND_TYPES.RECOVER_PLATFORM_ADMIN){ if(input.activeCountDelta!==0&&input.activeCountDelta!==1) return fail("Recovery delta is invalid."); }
    else if(command.commandType===COMMAND_TYPES.REVOKE_PLATFORM_ADMIN){
      if(input.nextCommandStage===PRIVILEGED_COMMAND_STAGES.PREPARED&&input.activeCountDelta!==-1) return fail("Revoke prepare delta is invalid.");
      if(input.nextCommandStage===PRIVILEGED_COMMAND_STAGES.COMPLETED&&input.activeCountDelta!==0) return fail("Revoke completion delta is invalid.");
      if(input.activeCountDelta===-1&&registry.activeCount<=1) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION,"Last Platform administrator cannot be revoked.");
    }
    const authorityWrites: Array<Readonly<{ path:string; current:PlatformAuthority|null; candidate:PlatformAuthority; write:Record<string,unknown> }>>=[];
    for(const change of input.authorities){
      const allowedTransitionFields=new Set(["uid","expectedStatus","nextStatus","bootstrapCommandId","recordClaimSync"]);
      if(typeof change!=="object"||change===null||Array.isArray(change)||Object.keys(change).some(key=>!allowedTransitionFields.has(key))) return fail("Authority transition shape is invalid.");
      const path=platformAuthorityDocumentPath(change.uid), snapshot=await transaction.get(path,"platform_authority");
      const current=snapshot.exists?authorityValue(snapshot.data):null;
      if(change.expectedStatus===null?current!==null:current?.status!==change.expectedStatus) return conflict("Authority changed concurrently.");
      if(current?.transitionCommandId!==null&&current?.transitionCommandId!==undefined&&current.transitionCommandId!==input.commandId) return conflict("Authority is owned by another command.");
      const logicalNow=current?.updatedAt??command.startedAt;
      const nextOwner=transitional.has(change.nextStatus)?input.commandId:null;
      const candidate=authorityValue({schemaVersion:PLATFORM_AUTHORITY_SCHEMA_VERSION,transitionCommandId:nextOwner,uid:change.uid,authority:PLATFORM_AUTHORITY,status:change.nextStatus,createdAt:current?.createdAt??logicalNow,createdBy:current?.createdBy??input.commandId,updatedAt:logicalNow,updatedBy:input.commandId,activatedAt:change.nextStatus===PLATFORM_AUTHORITY_STATUSES.ACTIVE?logicalNow:(current?.activatedAt??null),revokedAt:change.nextStatus===PLATFORM_AUTHORITY_STATUSES.REVOKED?logicalNow:null,revokedBy:change.nextStatus===PLATFORM_AUTHORITY_STATUSES.REVOKED?command.actorUid:null,bootstrapCommandId:change.bootstrapCommandId,lastClaimSyncAt:change.recordClaimSync?logicalNow:(current?.lastClaimSyncAt??null)});
      const write=current===null
        ? {...candidate,createdAt:serverOwnedTimestamp(),updatedAt:serverOwnedTimestamp(),...(change.nextStatus===PLATFORM_AUTHORITY_STATUSES.ACTIVE?{activatedAt:serverOwnedTimestamp()}:{}),...(change.nextStatus===PLATFORM_AUTHORITY_STATUSES.REVOKED?{revokedAt:serverOwnedTimestamp()}:{}),...(change.recordClaimSync?{lastClaimSyncAt:serverOwnedTimestamp()}: {})}
        : {transitionCommandId:candidate.transitionCommandId,status:candidate.status,updatedAt:serverOwnedTimestamp(),updatedBy:candidate.updatedBy,revokedAt:change.nextStatus===PLATFORM_AUTHORITY_STATUSES.REVOKED?serverOwnedTimestamp():null,revokedBy:candidate.revokedBy,bootstrapCommandId:candidate.bootstrapCommandId,...(change.nextStatus===PLATFORM_AUTHORITY_STATUSES.ACTIVE?{activatedAt:serverOwnedTimestamp()}:{}),...(change.recordClaimSync?{lastClaimSyncAt:serverOwnedTimestamp()}: {})};
      authorityWrites.push(Object.freeze({path,current,candidate,write}));
    }
    const count=registry.activeCount+input.activeCountDelta; if(!Number.isInteger(count)||count<0) return fail("activeCount is invalid.");
    const nextRegistry=registryValue({schemaVersion:PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION,bootstrapState:input.nextRegistryState,activeCount:count,revision:registry.revision+1,lastCommandId:input.commandId,updatedAt:registry.updatedAt});
    const nextCommand=validatePersistedCommandRecord({...command,status:input.nextCommandStatus,stage:input.nextCommandStage,result:input.commandResult,errorCode:input.commandErrorCode,completedAt:input.nextCommandStatus===COMMAND_STATUSES.SUCCEEDED?command.startedAt:command.completedAt,failedAt:input.nextCommandStatus===COMMAND_STATUSES.FAILED_RETRYABLE||input.nextCommandStatus===COMMAND_STATUSES.FAILED_TERMINAL?command.startedAt:command.failedAt,leaseExpiresAt:null});
    for(const {path,current,write} of authorityWrites){ if(current===null) transaction.create(path,write); else transaction.update(path,write); }
    transaction.set(registryPath,{...nextRegistry,updatedAt:serverOwnedTimestamp()});
    transaction.update(commandPath,{status:nextCommand.status,stage:nextCommand.stage,result:nextCommand.result,errorCode:nextCommand.errorCode,leaseExpiresAt:null,...(input.nextCommandStatus===COMMAND_STATUSES.SUCCEEDED?{completedAt:serverOwnedTimestamp()}:{}),...((input.nextCommandStatus===COMMAND_STATUSES.FAILED_RETRYABLE||input.nextCommandStatus===COMMAND_STATUSES.FAILED_TERMINAL)?{failedAt:serverOwnedTimestamp()}: {})});
    writeAuditEvent(transaction,{...input.audit,commandId:input.commandId,correlationId:input.correlationId,level:"critical"});
    return Object.freeze({command:nextCommand,registry:nextRegistry,authorities:Object.freeze(authorityWrites.map(({candidate})=>candidate))});
  })
});
