import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import * as firestoreSdk from "firebase/firestore";

import { db } from "../firebase";
import { useActiveTenant } from "../hooks/useActiveTenant.js";
import { useSession } from "../hooks/useSession.js";
import { createCourseRepository } from "../services/saas/course/index.js";
import { createEnrollmentRepository } from "../services/saas/enrollment/index.js";
import { REPOSITORY_ERROR_CODES } from "../services/saas/shared/index.js";
import { COURSE_STATUSES, ENROLLMENT_STATUSES } from "../domain/academic/enums.js";
import { MEMBERSHIP_ROLES } from "../domain/organization/enums.js";

export const COURSE_RESOLUTION_STATES = Object.freeze({
  IDLE: "idle",
  NOT_REQUIRED: "not_required",
  NO_ENROLLMENT: "no_enrollment",
  SELECTION_REQUIRED: "selection_required",
  COURSE_UNAVAILABLE: "course_unavailable",
  READY: "ready",
  ERROR: "error"
});

export const CourseContext = createContext(null);

const emptyCandidateIds = () => Object.freeze([]);

const initialState = Object.freeze({
  activeTenantId: null,
  course: null,
  courseId: null,
  loading: false,
  resolved: false,
  resolutionState: COURSE_RESOLUTION_STATES.IDLE,
  candidateCourseIds: emptyCandidateIds(),
  error: null
});

const SAFE_ERROR_CODES = new Set(Object.values(REPOSITORY_ERROR_CODES));

const publicError = (operation, error) => ({
  operation,
  code: typeof error?.code === "string" && SAFE_ERROR_CODES.has(error.code)
    ? error.code
    : REPOSITORY_ERROR_CODES.UNKNOWN
});

const courseBindingError = () => Object.assign(
  new Error("Resolved Course does not match the active tenant request."),
  { code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION }
);

const defaultRepositories = () => ({
  course: createCourseRepository({ db, sdk: firestoreSdk }),
  enrollment: createEnrollmentRepository({ db, sdk: firestoreSdk })
});

const pageItems = (result) => (
  Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : []
);

const uniqueCourseIds = (items) => {
  const seen = new Set();
  const ids = [];
  for (const item of items) {
    if (typeof item?.courseId !== "string" || seen.has(item.courseId)) continue;
    seen.add(item.courseId);
    ids.push(item.courseId);
  }
  return Object.freeze(ids);
};

const unavailable = (activeTenantId, courseId) => ({
  activeTenantId,
  course: null,
  courseId,
  loading: false,
  resolved: true,
  resolutionState: COURSE_RESOLUTION_STATES.COURSE_UNAVAILABLE,
  candidateCourseIds: emptyCandidateIds(),
  error: null
});

const ready = (activeTenantId, course) => ({
  activeTenantId,
  course,
  courseId: course.courseId,
  loading: false,
  resolved: true,
  resolutionState: COURSE_RESOLUTION_STATES.READY,
  candidateCourseIds: emptyCandidateIds(),
  error: null
});

const notRequired = (activeTenantId) => ({
  activeTenantId,
  course: null,
  courseId: null,
  loading: false,
  resolved: true,
  resolutionState: COURSE_RESOLUTION_STATES.NOT_REQUIRED,
  candidateCourseIds: emptyCandidateIds(),
  error: null
});

export const CourseProvider = ({ children, dependencies = {}, requestedCourseId = null }) => {
  const session = useSession();
  const tenant = useActiveTenant();
  const repositories = useMemo(
    () => dependencies.repositories ?? null,
    [dependencies.repositories]
  );
  const [state, setState] = useState(initialState);
  const requestRef = useRef(0);
  const previousTenantRef = useRef(null);

  useEffect(() => {
    const request = ++requestRef.current;
    let disposed = false;
    const activeTenantId = tenant.activeTenantId ?? null;
    const sessionTenantId = session.activeTenantId ?? null;
    const tenantChanged = previousTenantRef.current !== null &&
      previousTenantRef.current !== activeTenantId;
    previousTenantRef.current = activeTenantId;
    const membership = tenant.membership;
    const base = {
      ...initialState,
      activeTenantId,
      candidateCourseIds: emptyCandidateIds()
    };

    if (session.loading || tenant.loading || sessionTenantId !== activeTenantId) {
      setState({ ...base, loading: true });
      return () => {
        disposed = true;
      };
    }

    if (!session.uid || !activeTenantId || !tenant.resolved || !membership) {
      setState(base);
      return () => {
        disposed = true;
      };
    }

    setState({ ...base, loading: true });

    const commit = (nextState) => {
      if (disposed || request !== requestRef.current) return;
      setState(nextState);
    };

    const resolveCourse = async () => {
      const role = membership.role;
      const requestedInput = tenantChanged ? null : requestedCourseId;
      const requested = typeof requestedInput === "string" && requestedInput.trim()
        ? requestedInput
        : null;

      if (role !== MEMBERSHIP_ROLES.STUDENT) {
        if (!requested) {
          commit(notRequired(activeTenantId));
          return;
        }
        try {
          const activeRepositories = repositories ?? defaultRepositories();
          const course = await activeRepositories.course.getCourse(activeTenantId, requested);
          if (course?.tenantId !== activeTenantId || course?.courseId !== requested) {
            throw courseBindingError();
          }
          if (
            role === MEMBERSHIP_ROLES.TEACHER &&
            ![COURSE_STATUSES.DRAFT, COURSE_STATUSES.ACTIVE].includes(course.status)
          ) {
            commit(unavailable(activeTenantId, requested));
            return;
          }
          commit(ready(activeTenantId, course));
        } catch (error) {
          if (error?.code === REPOSITORY_ERROR_CODES.NOT_FOUND) {
            commit(unavailable(activeTenantId, requested));
          } else {
            commit({
              ...base,
              resolved: true,
              resolutionState: COURSE_RESOLUTION_STATES.ERROR,
              error: publicError("resolveCourse", error)
            });
          }
        }
        return;
      }

      try {
        const activeRepositories = repositories ?? defaultRepositories();
        const page = await activeRepositories.enrollment.listOwnEnrollmentsForMembership(
          activeTenantId,
          membership.membershipId,
          { status: ENROLLMENT_STATUSES.ACTIVE }
        );
        const candidateCourseIds = uniqueCourseIds(pageItems(page));

        if (candidateCourseIds.length === 0) {
          commit({
            ...base,
            resolved: true,
            resolutionState: COURSE_RESOLUTION_STATES.NO_ENROLLMENT,
            candidateCourseIds
          });
          return;
        }

        if ((candidateCourseIds.length > 1 && !requested) ||
            (requested !== null && !candidateCourseIds.includes(requested))) {
          commit({
            ...base,
            resolved: true,
            resolutionState: COURSE_RESOLUTION_STATES.SELECTION_REQUIRED,
            candidateCourseIds
          });
          return;
        }

        const courseId = requested ?? candidateCourseIds[0];
        try {
          const course = await activeRepositories.course.getCourse(activeTenantId, courseId);
          if (course?.tenantId !== activeTenantId || course?.courseId !== courseId) {
            throw courseBindingError();
          }
          if (course.status !== COURSE_STATUSES.ACTIVE) {
            commit(unavailable(activeTenantId, courseId));
            return;
          }
          commit({ ...ready(activeTenantId, course), candidateCourseIds });
        } catch (error) {
          if (error?.code === REPOSITORY_ERROR_CODES.NOT_FOUND) {
            commit(unavailable(activeTenantId, courseId));
            return;
          }
          throw error;
        }
      } catch (error) {
        commit({
          ...base,
          resolved: true,
          resolutionState: COURSE_RESOLUTION_STATES.ERROR,
          error: publicError("resolveStudentCourse", error)
        });
      }
    };

    void resolveCourse();

    return () => {
      disposed = true;
    };
  }, [repositories, requestedCourseId, session.activeTenantId, session.loading, session.uid, tenant.activeTenantId,
    tenant.loading, tenant.membership, tenant.resolved]);

  const value = useMemo(() => {
    const { activeTenantId: _activeTenantId, ...publicState } = state;
    const sessionTenantId = session.activeTenantId ?? null;
    const contextTenantId = tenant.activeTenantId ?? null;
    const stateTenantId = state.activeTenantId ?? null;
    const tenantIdentityIsCoherent = sessionTenantId === contextTenantId &&
      stateTenantId === sessionTenantId;
    if (!tenantIdentityIsCoherent) {
      return {
        ...publicState,
        course: null,
        courseId: null,
        loading: true,
        resolved: false,
        resolutionState: COURSE_RESOLUTION_STATES.IDLE,
        candidateCourseIds: emptyCandidateIds(),
        error: null
      };
    }
    return publicState;
  }, [session.activeTenantId, state, tenant.activeTenantId]);

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseProvider;
