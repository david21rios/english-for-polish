import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import * as firestoreSdk from "firebase/firestore";

import { auth, db } from "../firebase";
import { createIdentityRepository } from "../services/saas/identity/index.js";
import { createMembershipRepository } from "../services/saas/membership/index.js";
import { createTenantRepository } from "../services/saas/tenant/index.js";
import {
  REPOSITORY_ERROR_CODES,
  validateTenantId
} from "../services/saas/shared/index.js";

export const SESSION_STORAGE_KEY = "mipymetic.saas.session.activeTenant.v1";

export const SESSION_STATUS = Object.freeze({
  ANONYMOUS: "anonymous",
  AUTHENTICATED_UNVERIFIED: "authenticated_unverified",
  USER_GLOBALLY_INACTIVE: "user_globally_inactive",
  TENANT_SELECTION_REQUIRED: "tenant_selection_required",
  TENANT_SUSPENDED: "tenant_suspended",
  MEMBERSHIP_SUSPENDED: "membership_suspended",
  MEMBERSHIP_REJECTED: "membership_rejected",
  MEMBERSHIP_PENDING: "membership_pending",
  EMAIL_VERIFIED_WITHOUT_MEMBERSHIP: "email_verified_without_membership",
  APPROVED_WITHOUT_ENROLLMENT: "approved_without_enrollment",
  ACTIVE: "active"
});

const APPROVED = "approved";
const ACTIVE = "active";
const DEFINITIVE_CODES = new Set([
  REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  REPOSITORY_ERROR_CODES.NOT_FOUND,
  REPOSITORY_ERROR_CODES.FORBIDDEN,
  REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
]);
const SAFE_ERROR_CODES = new Set(Object.values(REPOSITORY_ERROR_CODES));

export const SessionContext = createContext(null);

const initialState = Object.freeze({
  user: null,
  uid: null,
  identity: null,
  activeTenantId: null,
  status: null,
  loading: true,
  error: null
});

const safeError = (operation, error) => ({
  operation,
  code: typeof error?.code === "string" && SAFE_ERROR_CODES.has(error.code)
    ? error.code
    : REPOSITORY_ERROR_CODES.UNKNOWN
});

const isDefinitive = (error) => DEFINITIVE_CODES.has(error?.code);

const normalizeMembershipPage = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  return [];
};

const isActiveTenant = (tenant) => tenant?.status === ACTIVE;

const statusForMembership = (membership) => (
  membership?.role === "student"
    ? SESSION_STATUS.APPROVED_WITHOUT_ENROLLMENT
    : SESSION_STATUS.ACTIVE
);

const readStoredSelection = (storage) => {
  if (!storage) return null;

  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      typeof parsed.uid !== "string" ||
      typeof parsed.activeTenantId !== "string"
    ) {
      return { invalid: true };
    }

    return {
      uid: parsed.uid,
      activeTenantId: parsed.activeTenantId
    };
  } catch {
    return { invalid: true };
  }
};

const writeStoredSelection = (storage, uid, activeTenantId) => {
  if (!storage) return;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ uid, activeTenantId }));
};

const clearStoredSelection = (storage) => {
  if (!storage) return;
  storage.removeItem(SESSION_STORAGE_KEY);
};

const getStorage = () => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

const defaultRepositories = () => ({
  identity: createIdentityRepository({ db, sdk: firestoreSdk }),
  membership: createMembershipRepository({ db, sdk: firestoreSdk }),
  tenant: createTenantRepository({ db, sdk: firestoreSdk })
});

const validateTenantCandidate = async ({
  tenantId,
  uid,
  membershipHint,
  repositories
}) => {
  validateTenantId(tenantId);

  let membership = membershipHint;
  if (typeof repositories.membership.getOwnMembership === "function") {
    if (membershipHint?.membershipId) {
      membership = await repositories.membership.getOwnMembership(
        tenantId,
        membershipHint.membershipId,
        uid
      );
    } else if (typeof repositories.membership.listOwnMembershipsForTenant === "function") {
      const page = await repositories.membership.listOwnMembershipsForTenant(
        tenantId,
        uid,
        { pageSize: 50 }
      );
      membership = normalizeMembershipPage(page).find(
        (candidate) => candidate?.tenantId === tenantId
      );
    }
  }

  if (
    !membership ||
    membership.uid !== uid ||
    membership.tenantId !== tenantId ||
    membership.status !== APPROVED
  ) {
    const error = new Error("Membership is not approved for this tenant.");
    error.code = membership?.status === "suspended"
      ? REPOSITORY_ERROR_CODES.FORBIDDEN
      : REPOSITORY_ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const tenant = await repositories.tenant.getTenant(tenantId);
  if (!isActiveTenant(tenant)) {
    const error = new Error("Tenant is not active.");
    error.code = REPOSITORY_ERROR_CODES.FORBIDDEN;
    error.sessionStatus = SESSION_STATUS.TENANT_SUSPENDED;
    throw error;
  }

  return { membership, tenant };
};

const membershipLifecycleStatus = (memberships) => {
  const statuses = new Set(memberships.map((membership) => membership?.status));
  if (statuses.has("suspended")) return SESSION_STATUS.MEMBERSHIP_SUSPENDED;
  if (statuses.has("pending")) return SESSION_STATUS.MEMBERSHIP_PENDING;
  if (statuses.has("rejected") || statuses.has("removed")) {
    return SESSION_STATUS.MEMBERSHIP_REJECTED;
  }
  return SESSION_STATUS.EMAIL_VERIFIED_WITHOUT_MEMBERSHIP;
};

const statusForInvalidMembership = (membership) => {
  if (membership?.status === "suspended") return SESSION_STATUS.MEMBERSHIP_SUSPENDED;
  if (membership?.status === "pending") return SESSION_STATUS.MEMBERSHIP_PENDING;
  if (membership?.status === "removed" || membership?.status === "rejected") {
    return SESSION_STATUS.MEMBERSHIP_REJECTED;
  }
  return null;
};

export const SessionProvider = ({ children, dependencies = {} }) => {
  const authInstance = dependencies.auth ?? auth;
  const repositories = useMemo(
    () => dependencies.repositories ?? defaultRepositories(),
    [dependencies.repositories]
  );
  const storage = dependencies.storage ?? getStorage();
  const [state, setState] = useState(initialState);
  const stateRef = useRef(initialState);
  const generationRef = useRef(0);
  const currentUserRef = useRef(null);
  const currentMembershipsRef = useRef([]);
  const activeTenantRef = useRef(null);

  const updateIfCurrent = useCallback((generation, nextState) => {
    if (generation !== generationRef.current) return false;
    setState(nextState);
    activeTenantRef.current = nextState.activeTenantId;
    return true;
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const resolveAuthenticatedSession = useCallback(async (
    user,
    generation,
    { preserveOnFailure = false, operation = "initialize" } = {}
  ) => {
    const uid = user.uid;
    currentUserRef.current = user;

    if (!user.emailVerified) {
      clearStoredSelection(storage);
      updateIfCurrent(generation, {
        user,
        uid,
        identity: null,
        activeTenantId: null,
        status: SESSION_STATUS.AUTHENTICATED_UNVERIFIED,
        loading: false,
        error: null
      });
      return { ok: true };
    }

    try {
      const identity = await repositories.identity.getIdentity(uid);
      if (generation !== generationRef.current) return;

      if (identity?.isActive === false || identity?.status === "inactive") {
        clearStoredSelection(storage);
        updateIfCurrent(generation, {
          user,
          uid,
          identity,
          activeTenantId: null,
          status: SESSION_STATUS.USER_GLOBALLY_INACTIVE,
          loading: false,
          error: null
        });
        return { ok: true };
      }

      const page = await repositories.membership.listOwnMembershipsAcrossTenants(uid, {
        pageSize: 50
      });
      const memberships = normalizeMembershipPage(page);
      currentMembershipsRef.current = memberships;

      const approvedMemberships = memberships.filter(
        (membership) => membership?.status === APPROVED
      );
      const stored = readStoredSelection(storage);

      if (stored?.invalid || (stored && stored.uid !== uid)) {
        clearStoredSelection(storage);
      }

      let storedError = null;
      let storedInvalidationStatus = null;
      if (stored && !stored.invalid && stored.uid === uid) {
        const storedMembershipRecord = memberships.find(
          (membership) => membership?.tenantId === stored.activeTenantId
        );
        const storedMembership = approvedMemberships.find(
          (membership) => membership?.tenantId === stored.activeTenantId
        );

        if (storedMembership) {
          try {
            const validated = await validateTenantCandidate({
              tenantId: stored.activeTenantId,
              uid,
              membershipHint: storedMembership,
              repositories
            });
            writeStoredSelection(storage, uid, stored.activeTenantId);
            updateIfCurrent(generation, {
              user,
              uid,
              identity,
              activeTenantId: stored.activeTenantId,
              status: statusForMembership(validated.membership),
              loading: false,
              error: null
            });
            return { ok: true };
          } catch (error) {
            if (!isDefinitive(error)) {
              storedError = safeError("initialize", error);
            } else {
              clearStoredSelection(storage);
              storedInvalidationStatus = error?.sessionStatus ?? null;
            }
          }
        } else if (storedMembershipRecord) {
          clearStoredSelection(storage);
          storedInvalidationStatus = statusForInvalidMembership(storedMembershipRecord);
        } else {
          clearStoredSelection(storage);
        }
      }

      if (storedInvalidationStatus) {
        updateIfCurrent(generation, {
          user,
          uid,
          identity,
          activeTenantId: null,
          status: storedInvalidationStatus,
          loading: false,
          error: null
        });
        return { ok: true };
      }

      if (approvedMemberships.length === 1) {
        try {
          const onlyMembership = approvedMemberships[0];
          const validated = await validateTenantCandidate({
            tenantId: onlyMembership.tenantId,
            uid,
            membershipHint: onlyMembership,
            repositories
          });
          writeStoredSelection(storage, uid, onlyMembership.tenantId);
          updateIfCurrent(generation, {
            user,
            uid,
            identity,
            activeTenantId: onlyMembership.tenantId,
            status: statusForMembership(validated.membership),
            loading: false,
            error: storedError
          });
          return { ok: true };
        } catch (error) {
          if (error?.sessionStatus === SESSION_STATUS.TENANT_SUSPENDED) {
            clearStoredSelection(storage);
          }
          const fallback = preserveOnFailure ? stateRef.current : {
            user,
            uid,
            identity,
            activeTenantId: null,
            status: error?.sessionStatus ?? null
          };
          updateIfCurrent(generation, {
            ...fallback,
            user,
            uid,
            loading: false,
            error: error?.sessionStatus ? null : safeError(operation, error)
          });
          return error?.sessionStatus
            ? { ok: true }
            : { ok: false, code: safeError(operation, error).code };
        }
      }

      if (approvedMemberships.length > 1) {
        updateIfCurrent(generation, {
          user,
          uid,
          identity,
          activeTenantId: null,
          status: SESSION_STATUS.TENANT_SELECTION_REQUIRED,
          loading: false,
          error: storedError
        });
        return { ok: true };
      }

      updateIfCurrent(generation, {
        user,
        uid,
        identity,
        activeTenantId: null,
        status: membershipLifecycleStatus(memberships),
        loading: false,
        error: storedError
      });
      return { ok: true };
    } catch (error) {
      if (generation !== generationRef.current) return;
      const fallback = preserveOnFailure ? stateRef.current : {
        user,
        uid,
        identity: null,
        activeTenantId: null,
        status: null
      };
      updateIfCurrent(generation, {
        ...fallback,
        user,
        uid,
        loading: false,
        error: safeError(operation, error)
      });
      return { ok: false, code: safeError(operation, error).code };
    }
  }, [repositories, storage, updateIfCurrent]);

  useEffect(() => {
    let disposed = false;
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      const generation = ++generationRef.current;
      currentMembershipsRef.current = [];
      currentUserRef.current = user;

      if (!user) {
        clearStoredSelection(storage);
        activeTenantRef.current = null;
        if (!disposed) {
          setState({
            user: null,
            uid: null,
            identity: null,
            activeTenantId: null,
            status: SESSION_STATUS.ANONYMOUS,
            loading: false,
            error: null
          });
        }
        return;
      }

      activeTenantRef.current = null;
      if (!disposed) {
        setState({
          user,
          uid: user.uid,
          identity: null,
          activeTenantId: null,
          status: null,
          loading: true,
          error: null
        });
      }
      void resolveAuthenticatedSession(user, generation);
    });

    return () => {
      disposed = true;
      generationRef.current += 1;
      unsubscribe?.();
    };
  }, [authInstance, resolveAuthenticatedSession, storage]);

  const setActiveTenantId = useCallback(async (targetTenantId) => {
    const user = currentUserRef.current;
    const generation = generationRef.current;
    const previousTenantId = activeTenantRef.current;
    if (!user) return { ok: false, code: REPOSITORY_ERROR_CODES.UNAUTHENTICATED };
    if (!user.emailVerified) {
      return { ok: false, code: REPOSITORY_ERROR_CODES.UNAUTHENTICATED };
    }

    try {
      validateTenantId(targetTenantId);
      const hint = currentMembershipsRef.current.find(
        (membership) => membership?.tenantId === targetTenantId
      );
      const validated = await validateTenantCandidate({
        tenantId: targetTenantId,
        uid: user.uid,
        membershipHint: hint,
        repositories
      });
      if (generation !== generationRef.current || currentUserRef.current?.uid !== user.uid) {
        return { ok: false, code: REPOSITORY_ERROR_CODES.UNAUTHENTICATED };
      }
      writeStoredSelection(storage, user.uid, targetTenantId);
      activeTenantRef.current = targetTenantId;
      setState((current) => ({
        ...current,
        activeTenantId: targetTenantId,
        status: statusForMembership(validated.membership),
        loading: false,
        error: null
      }));
      return { ok: true };
    } catch (error) {
      if (generation !== generationRef.current || currentUserRef.current?.uid !== user.uid) {
        return { ok: false, code: REPOSITORY_ERROR_CODES.UNAUTHENTICATED };
      }
      setState((current) => ({
        ...current,
        activeTenantId: previousTenantId,
        error: safeError("switchTenant", error)
      }));
      return { ok: false, code: safeError("switchTenant", error).code };
    }
  }, [repositories, storage]);

  const refresh = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user) {
      return { ok: true };
    }

    const generation = ++generationRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await resolveAuthenticatedSession(user, generation, {
        preserveOnFailure: true,
        operation: "refresh"
      });
      if (generation !== generationRef.current) {
        return { ok: false, code: REPOSITORY_ERROR_CODES.UNAUTHENTICATED };
      }
      return result ?? { ok: true };
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: safeError("refresh", error)
      }));
      return { ok: false, code: safeError("refresh", error).code };
    }
  }, [resolveAuthenticatedSession]);

  const logout = useCallback(async () => {
    try {
      clearStoredSelection(storage);
      await signOut(authInstance);
      generationRef.current += 1;
      currentUserRef.current = null;
      currentMembershipsRef.current = [];
      activeTenantRef.current = null;
      setState({
        user: null,
        uid: null,
        identity: null,
        activeTenantId: null,
        status: SESSION_STATUS.ANONYMOUS,
        loading: false,
        error: null
      });
      return { ok: true };
    } catch (error) {
      const publicError = safeError("logout", error);
      setState((current) => ({ ...current, error: publicError }));
      return { ok: false, code: publicError.code };
    }
  }, [authInstance, storage]);

  const value = useMemo(() => ({
    ...state,
    setActiveTenantId,
    refresh,
    logout
  }), [logout, refresh, setActiveTenantId, state]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionProvider;
