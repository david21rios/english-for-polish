import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import * as firestoreSdk from "firebase/firestore";

import { db } from "../firebase";
import { useSession } from "../hooks/useSession.js";
import { createMembershipRepository } from "../services/saas/membership/index.js";
import { createTenantRepository } from "../services/saas/tenant/index.js";
import { REPOSITORY_ERROR_CODES } from "../services/saas/shared/index.js";

export const TenantContext = createContext(null);

const initialState = Object.freeze({
  activeTenantId: null,
  tenant: null,
  membership: null,
  loading: false,
  resolved: false,
  error: null
});

const defaultRepositories = () => ({
  membership: createMembershipRepository({ db, sdk: firestoreSdk }),
  tenant: createTenantRepository({ db, sdk: firestoreSdk })
});

const publicError = (operation, error) => ({
  operation,
  code: Object.values(REPOSITORY_ERROR_CODES).includes(error?.code)
    ? error.code
    : REPOSITORY_ERROR_CODES.UNKNOWN
});

const shadowError = (code, message) => Object.assign(new Error(message), { code });

const membershipsFrom = (result) => (
  Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : []
);

export const TenantProvider = ({ children, dependencies = {} }) => {
  const session = useSession();
  const repositories = useMemo(
    () => dependencies.repositories ?? defaultRepositories(),
    [dependencies.repositories]
  );
  const [state, setState] = useState(initialState);
  const requestRef = useRef(0);

  useEffect(() => {
    const request = ++requestRef.current;
    let disposed = false;
    const activeTenantId = session.activeTenantId ?? null;

    if (session.loading) {
      setState({
        ...initialState,
        activeTenantId,
        loading: true
      });
      return () => {
        disposed = true;
      };
    }

    if (!session.uid || !activeTenantId) {
      setState({
        ...initialState,
        activeTenantId
      });
      return () => {
        disposed = true;
      };
    }

    setState({
      ...initialState,
      activeTenantId,
      loading: true
    });

    const resolveTenant = async () => {
      try {
        const tenant = await repositories.tenant.getTenant(activeTenantId);
        if (tenant?.tenantId !== activeTenantId) {
          throw shadowError(
            REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
            "Resolved Tenant does not match the active tenant selection."
          );
        }
        if (tenant.status !== "active") {
          throw shadowError(
            REPOSITORY_ERROR_CODES.FORBIDDEN,
            "The selected Tenant is not active."
          );
        }

        const membershipPage = await repositories.membership.listOwnMembershipsForTenant(
          activeTenantId,
          session.uid,
          { status: "approved", pageSize: 50 }
        );
        const membership = membershipsFrom(membershipPage).find((candidate) => (
          candidate?.tenantId === activeTenantId &&
          candidate?.uid === session.uid &&
          candidate?.status === "approved"
        ));

        if (!membership) {
          throw shadowError(
            REPOSITORY_ERROR_CODES.NOT_FOUND,
            "No approved Membership exists for the active Tenant."
          );
        }

        if (disposed || request !== requestRef.current) return;
        setState({
          activeTenantId,
          tenant,
          membership,
          loading: false,
          resolved: true,
          error: null
        });
      } catch (error) {
        if (disposed || request !== requestRef.current) return;
        setState({
          ...initialState,
          activeTenantId,
          error: publicError("resolveActiveTenant", error)
        });
      }
    };

    void resolveTenant();

    return () => {
      disposed = true;
    };
  }, [repositories, session.activeTenantId, session.loading, session.status, session.uid]);

  const value = useMemo(() => state, [state]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantProvider;
