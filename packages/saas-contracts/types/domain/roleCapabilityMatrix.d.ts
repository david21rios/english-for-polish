export const ROLE_CAPABILITY_MATRIX: Readonly<{
    membershipRoles: Readonly<{
        student: readonly ("membership.read_self" | "course.list" | "course.read" | "enrollment.read_self" | "enrollment.cancel_self")[];
        teacher: readonly ("membership.read_self" | "course.list" | "course.read" | "course.create" | "course.update" | "enrollment.read_self" | "enrollment.list" | "enrollment.cancel_self")[];
        tenant_admin: readonly ("tenant.read" | "tenant.update" | "tenant.manage_settings" | "tenant.manage_branding" | "membership.read_self" | "membership.list" | "membership.suspend" | "membership.restore" | "membership.remove" | "membership.change_role" | "registration_request.list" | "registration_request.review" | "course.list" | "course.read" | "course.create" | "course.update" | "course.activate" | "course.archive" | "enrollment.read_self" | "enrollment.list" | "enrollment.create" | "enrollment.update_status" | "enrollment.cancel_self")[];
    }>;
    platformRoles: Readonly<{
        platform_admin: readonly ("platform.tenant_list" | "platform.tenant_read" | "platform.tenant_create" | "platform.tenant_update" | "platform.tenant_suspend" | "platform.tenant_restore" | "platform.tenant_archive" | "platform.identity_read")[];
    }>;
}>;
