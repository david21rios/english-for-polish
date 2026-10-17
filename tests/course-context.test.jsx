import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({}));
vi.mock("../src/firebase", () => ({ db: {} }));

const sessionHook = vi.hoisted(() => ({ useSession: vi.fn() }));
const tenantHook = vi.hoisted(() => ({ useActiveTenant: vi.fn() }));
vi.mock("../src/hooks/useSession.js", () => sessionHook);
vi.mock("../src/hooks/useActiveTenant.js", () => tenantHook);

import { CourseProvider } from "../src/context/CourseContext.jsx";
import { useCourse } from "../src/hooks/useCourse.js";

const session = (overrides = {}) => ({
  uid: "user-1",
  activeTenantId: "tenant-1",
  loading: false,
  ...overrides
});

const membership = (overrides = {}) => ({
  membershipId: "membership-1",
  tenantId: "tenant-1",
  uid: "user-1",
  role: "student",
  status: "approved",
  ...overrides
});

const tenant = (overrides = {}) => ({
  activeTenantId: "tenant-1",
  tenant: { tenantId: "tenant-1", status: "active" },
  membership: membership(),
  loading: false,
  resolved: true,
  error: null,
  ...overrides
});

const course = (overrides = {}) => ({
  courseId: "course-1",
  tenantId: "tenant-1",
  status: "active",
  ...overrides
});

const renderState = () => JSON.parse(screen.getByTestId("course").textContent);

function Probe() {
  return <output data-testid="course">{JSON.stringify(useCourse())}</output>;
}

const renderProvider = ({ sessionValue = session(), tenantValue = tenant(), repositories, requestedCourseId = null } = {}) => {
  sessionHook.useSession.mockReturnValue(sessionValue);
  tenantHook.useActiveTenant.mockReturnValue(tenantValue);
  return render(
    <CourseProvider dependencies={{ repositories }} requestedCourseId={requestedCourseId}>
      <Probe />
    </CourseProvider>
  );
};

const repositories = ({ enrollments = [], courses = {}, enrollmentError, courseError } = {}) => ({
  enrollment: {
    listOwnEnrollmentsForMembership: vi.fn(async () => {
      if (enrollmentError) throw enrollmentError;
      return { items: enrollments };
    })
  },
  course: {
    getCourse: vi.fn(async (_tenantId, courseId) => {
      if (courseError) throw courseError;
      if (courses[courseId] === undefined) {
        const error = new Error("missing");
        error.code = "NOT_FOUND";
        throw error;
      }
      return courses[courseId];
    })
  }
});

afterEach(() => {
  cleanup();
  sessionHook.useSession.mockReset();
  tenantHook.useActiveTenant.mockReset();
});

describe("CourseContext shadow contract", () => {
  it("exposes idle while upstream authority is unresolved", () => {
    renderProvider({ sessionValue: session({ loading: true }), tenantValue: tenant({ resolved: false }) });
    expect(renderState()).toMatchObject({ loading: true, resolved: false, resolutionState: "idle" });
  });

  it("resolves zero active enrollments as no_enrollment", async () => {
    const repos = repositories();
    renderProvider({ repositories: repos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolved: true, resolutionState: "no_enrollment", candidateCourseIds: [] }));
    expect(repos.enrollment.listOwnEnrollmentsForMembership).toHaveBeenCalledWith("tenant-1", "membership-1", { status: "active" });
  });

  it("resolves one active enrollment to an active course", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }], courses: { "course-1": course() } });
    renderProvider({ repositories: repos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolved: true, resolutionState: "ready", courseId: "course-1" }));
  });

  it("requires selection for multiple active enrollments without a request", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }, { courseId: "course-2" }] });
    renderProvider({ repositories: repos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolved: true, resolutionState: "selection_required", candidateCourseIds: ["course-1", "course-2"] }));
    expect(repos.course.getCourse).not.toHaveBeenCalled();
  });

  it("resolves a valid requested course from multiple enrollments", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }, { courseId: "course-2" }], courses: { "course-2": course({ courseId: "course-2" }) } });
    renderProvider({ repositories: repos, requestedCourseId: "course-2" });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-2" }));
    expect(repos.course.getCourse).toHaveBeenCalledWith("tenant-1", "course-2");
  });

  it("rejects an invalid requested course without resolving it", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }, { courseId: "course-2" }] });
    renderProvider({ repositories: repos, requestedCourseId: "course-9" });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "selection_required", course: null, courseId: null, candidateCourseIds: ["course-1", "course-2"], error: null }));
    expect(repos.course.getCourse).not.toHaveBeenCalled();
  });

  it("maps a missing student course to course_unavailable", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }] });
    renderProvider({ repositories: repos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "course_unavailable", course: null, courseId: "course-1", error: null }));
  });

  it("maps an inactive student course to course_unavailable", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }], courses: { "course-1": course({ status: "archived" }) } });
    renderProvider({ repositories: repos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "course_unavailable", courseId: "course-1", error: null }));
  });

  it("does not resolve a teacher course without an operation request", async () => {
    const repos = repositories();
    renderProvider({ repositories: repos, tenantValue: tenant({ membership: membership({ role: "teacher" }) }) });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "not_required", resolved: true }));
    expect(repos.enrollment.listOwnEnrollmentsForMembership).not.toHaveBeenCalled();
    expect(repos.course.getCourse).not.toHaveBeenCalled();
  });

  it("resolves a teacher operation course", async () => {
    const repos = repositories({ courses: { "course-1": course() } });
    renderProvider({ repositories: repos, tenantValue: tenant({ membership: membership({ role: "teacher" }) }), requestedCourseId: "course-1" });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-1" }));
  });

  it("does not expose an archived course to a teacher", async () => {
    const repos = repositories({ courses: { "course-1": course({ status: "archived" }) } });
    renderProvider({ repositories: repos, tenantValue: tenant({ membership: membership({ role: "teacher" }) }), requestedCourseId: "course-1" });
    await waitFor(() => expect(renderState()).toMatchObject({
      resolutionState: "course_unavailable",
      course: null,
      courseId: "course-1",
      error: null
    }));
  });

  it("does not resolve a tenant admin course without an operation request", async () => {
    const repos = repositories();
    renderProvider({ repositories: repos, tenantValue: tenant({ membership: membership({ role: "tenant_admin" }) }) });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "not_required", resolved: true }));
    expect(repos.course.getCourse).not.toHaveBeenCalled();
  });

  it("resolves a tenant admin operation course", async () => {
    const repos = repositories({ courses: { "course-1": course() } });
    renderProvider({ repositories: repos, tenantValue: tenant({ membership: membership({ role: "tenant_admin" }) }), requestedCourseId: "course-1" });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-1" }));
  });

  it("allows a tenant admin to resolve an archived course", async () => {
    const repos = repositories({ courses: { "course-1": course({ status: "archived" }) } });
    renderProvider({ repositories: repos, tenantValue: tenant({ membership: membership({ role: "tenant_admin" }) }), requestedCourseId: "course-1" });
    await waitFor(() => expect(renderState()).toMatchObject({
      resolutionState: "ready",
      course: { courseId: "course-1", status: "archived" },
      courseId: "course-1"
    }));
  });

  it("normalizes enrollment and course failures", async () => {
    const enrollmentRepos = repositories({ enrollmentError: { code: "UNAVAILABLE", message: "secret" } });
    renderProvider({ repositories: enrollmentRepos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "error", error: { operation: "resolveStudentCourse", code: "UNAVAILABLE" } }));
    expect(JSON.stringify(renderState())).not.toContain("secret");

    cleanup();
    const courseRepos = repositories({ enrollments: [{ courseId: "course-1" }], courseError: { code: "FORBIDDEN", message: "provider detail" } });
    renderProvider({ repositories: courseRepos });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "error", error: { operation: "resolveStudentCourse", code: "FORBIDDEN" } }));
  });

  it("clears prior course immediately when tenant changes", async () => {
    const repos = {
      enrollment: {
        listOwnEnrollmentsForMembership: vi.fn(async () => ({ items: [{ courseId: "course-1" }] }))
      },
      course: {
        getCourse: vi.fn(async (tenantId, courseId) => course({ tenantId, courseId }))
      }
    };
    let currentSession = session();
    let currentTenant = tenant();
    tenantHook.useActiveTenant.mockImplementation(() => currentTenant);
    sessionHook.useSession.mockImplementation(() => currentSession);
    const view = render(<CourseProvider dependencies={{ repositories: repos }} requestedCourseId="course-1"><Probe /></CourseProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-1" }));
    currentSession = session({ activeTenantId: "tenant-2" });
    view.rerender(<CourseProvider dependencies={{ repositories: repos }} requestedCourseId="course-1"><Probe /></CourseProvider>);
    expect(renderState()).toMatchObject({ course: null, courseId: null, loading: true, resolved: false, resolutionState: "idle" });
    currentTenant = tenant({ activeTenantId: "tenant-2", tenant: { tenantId: "tenant-2", status: "active" }, membership: membership({ tenantId: "tenant-2", membershipId: "membership-2" }) });
    view.rerender(<CourseProvider dependencies={{ repositories: repos }} requestedCourseId="course-1"><Probe /></CourseProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-1", course: { tenantId: "tenant-2" } }));
  });

  it("ignores stale success and stale error from a prior tenant", async () => {
    const first = { resolve: null, reject: null, promise: null };
    first.promise = new Promise((resolve, reject) => { first.resolve = resolve; first.reject = reject; });
    const repos = {
      enrollment: {
        listOwnEnrollmentsForMembership: vi.fn((tenantId) => tenantId === "tenant-1"
          ? first.promise
          : Promise.resolve({ items: [{ courseId: "course-2" }] }))
      },
      course: { getCourse: vi.fn(async (tenantId, courseId) => course({ tenantId, courseId })) }
    };
    let currentSession = session();
    let currentTenant = tenant();
    tenantHook.useActiveTenant.mockImplementation(() => currentTenant);
    sessionHook.useSession.mockImplementation(() => currentSession);
    const view = render(<CourseProvider dependencies={{ repositories: repos }}><Probe /></CourseProvider>);
    currentSession = session({ activeTenantId: "tenant-2" });
    currentTenant = tenant({ activeTenantId: "tenant-2", tenant: { tenantId: "tenant-2", status: "active" }, membership: membership({ tenantId: "tenant-2", membershipId: "membership-2" }) });
    view.rerender(<CourseProvider dependencies={{ repositories: repos }}><Probe /></CourseProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-2" }));
    await act(async () => { first.resolve({ items: [{ courseId: "course-1" }] }); });
    expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-2" });
  });

  it("ignores a stale error from a prior tenant", async () => {
    const first = { reject: null, promise: null };
    first.promise = new Promise((_resolve, reject) => { first.reject = reject; });
    const repos = {
      enrollment: {
        listOwnEnrollmentsForMembership: vi.fn((tenantId) => tenantId === "tenant-1"
          ? first.promise
          : Promise.resolve({ items: [{ courseId: "course-2" }] }))
      },
      course: { getCourse: vi.fn(async (tenantId, courseId) => course({ tenantId, courseId })) }
    };
    let currentSession = session();
    let currentTenant = tenant();
    tenantHook.useActiveTenant.mockImplementation(() => currentTenant);
    sessionHook.useSession.mockImplementation(() => currentSession);
    const view = render(<CourseProvider dependencies={{ repositories: repos }}><Probe /></CourseProvider>);
    currentSession = session({ activeTenantId: "tenant-2" });
    currentTenant = tenant({ activeTenantId: "tenant-2", tenant: { tenantId: "tenant-2", status: "active" }, membership: membership({ tenantId: "tenant-2", membershipId: "membership-2" }) });
    view.rerender(<CourseProvider dependencies={{ repositories: repos }}><Probe /></CourseProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-2" }));
    await act(async () => { first.reject({ code: "UNKNOWN" }); });
    expect(renderState()).toMatchObject({ resolutionState: "ready", courseId: "course-2" });
  });

  it("rejects a wrong-tenant course returned by the repository", async () => {
    const repos = repositories({
      enrollments: [{ courseId: "course-1" }],
      courses: { "course-1": course({ tenantId: "tenant-2" }) }
    });
    renderProvider({ repositories: repos });
    await waitFor(() => expect(renderState()).toMatchObject({
      resolutionState: "error",
      course: null,
      courseId: null,
      error: { operation: "resolveStudentCourse", code: "CONTRACT_VIOLATION" }
    }));
    expect(JSON.stringify(renderState())).not.toContain("tenant-2");
  });

  it("does not persist requested course selection or expose a setter", async () => {
    const repos = repositories({ enrollments: [{ courseId: "course-1" }], courses: { "course-1": course() } });
    renderProvider({ repositories: repos, requestedCourseId: "course-1" });
    await waitFor(() => expect(renderState()).toMatchObject({ resolutionState: "ready" }));
    expect(renderState()).not.toHaveProperty("setActiveCourse");
    expect(renderState()).not.toHaveProperty("activeCourseId");
  });

  it("fails clearly when useCourse is outside its provider", () => {
    expect(() => render(<Probe />)).toThrow("useCourse must be used within a CourseProvider.");
  });
});
