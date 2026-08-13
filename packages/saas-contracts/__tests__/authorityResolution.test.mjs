import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORITY_ACTOR_TYPES, AUTHORITY_RESOLUTION_FIELDS, SYSTEM_OPERATOR_AUTHORITIES,
  validateAuthorityResolution,
} from "../src/authority/index.js";
import { MEMBERSHIP_ROLES, PLATFORM_ROLES, ROLE_CAPABILITY_MATRIX } from "../src/domain/index.js";

const platform = () => ({actorUid:"admin-1",actorType:AUTHORITY_ACTOR_TYPES.PLATFORM_ADMIN,authority:PLATFORM_ROLES.PLATFORM_ADMIN,tenantId:null,roles:[PLATFORM_ROLES.PLATFORM_ADMIN],capabilities:[...ROLE_CAPABILITY_MATRIX.platformRoles.platform_admin]});
const tenant = (role=MEMBERSHIP_ROLES.TENANT_ADMIN) => ({actorUid:"user-1",actorType:AUTHORITY_ACTOR_TYPES.IDENTITY,authority:role,tenantId:"tenant-1",roles:[role],capabilities:[...ROLE_CAPABILITY_MATRIX.membershipRoles[role]]});
const system = (authority=SYSTEM_OPERATOR_AUTHORITIES.PLATFORM_SYSTEM) => ({actorUid:"operator-1",actorType:AUTHORITY_ACTOR_TYPES.SYSTEM,authority,tenantId:null,roles:[],capabilities:[]});
const reject = (value) => assert.equal(validateAuthorityResolution(value).ok,false);

test("authority resolution catalogs and positive variants are closed",()=>{
  assert.deepEqual(AUTHORITY_RESOLUTION_FIELDS,["actorUid","actorType","authority","tenantId","roles","capabilities"]);
  assert.deepEqual(Object.values(AUTHORITY_ACTOR_TYPES),["identity","platform_admin","system"]);
  assert.deepEqual(Object.values(SYSTEM_OPERATOR_AUTHORITIES),["platform_system","platform_recovery"]);
  for(const value of [platform(),tenant(MEMBERSHIP_ROLES.STUDENT),tenant(MEMBERSHIP_ROLES.TEACHER),tenant(),system(),system(SYSTEM_OPERATOR_AUTHORITIES.PLATFORM_RECOVERY)]){
    const result=validateAuthorityResolution(value);assert.equal(result.ok,true);assert.equal(Object.isFrozen(result),true);if(result.ok)assert.equal(result.value,value);
  }
});

test("authority resolution rejects malformed and non-exact shapes",()=>{
  for(const value of [undefined,null,"authority",[],{},...AUTHORITY_RESOLUTION_FIELDS.map(field=>{const value=platform();delete value[field];return value}),{...platform(),metadata:{}},{...platform(),roles:"platform_admin"},{...platform(),capabilities:{}},{...platform(),actorUid:null}])reject(value);
  for(const actorUid of [""," ",".","..","a/b"])reject({...platform(),actorUid});
});

test("human authority enforces actor, scope, singleton role and exact canonical capabilities",()=>{
  const p=platform(),t=tenant();
  for(const value of [{...p,actorType:"identity"},{...p,authority:"tenant_admin"},{...p,tenantId:"tenant-1"},{...p,roles:[]},{...p,roles:["platform_admin","platform_admin"]},{...p,roles:["tenant_admin"]},{...p,capabilities:p.capabilities.slice(1)},{...p,capabilities:[...p.capabilities,"tenant.update"]},{...p,capabilities:[p.capabilities[1],p.capabilities[0],...p.capabilities.slice(2)]},{...p,capabilities:[p.capabilities[0],...p.capabilities]},{...p,capabilities:["unknown.capability"]},{...t,actorType:"platform_admin"},{...t,tenantId:null},{...t,tenantId:"a/b"},{...t,roles:["student"]},{...t,authority:"unknown"}])reject(value);
});

test("system authority permits only closed operators with empty arrays and global scope",()=>{
  const s=system();
  for(const value of [{...s,authority:"platform_admin"},{...s,authority:"tenant_admin"},{...s,authority:"unknown"},{...s,tenantId:"tenant-1"},{...s,roles:["platform_system"]},{...s,capabilities:["platform.tenant_create"]},{...s,actorType:"identity"},{...system(SYSTEM_OPERATOR_AUTHORITIES.PLATFORM_RECOVERY),actorType:"platform_admin"}])reject(value);
});

test("validation proves portable composition, not authenticated authority",()=>{
  const result=validateAuthorityResolution(platform());assert.equal(result.ok,true);
  assert.equal(Object.prototype.hasOwnProperty.call(result,"authenticated"),false);
});
