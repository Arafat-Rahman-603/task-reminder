export type Role = "owner" | "admin" | "member" | "viewer";

export interface IWorkspacePermissions {
  tasks?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean; assign?: boolean };
  projects?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  routines?: { view?: boolean; manage?: boolean };
  customSections?: { view?: boolean; manage?: boolean };
  files?: { view?: boolean; upload?: boolean };
  members?: { view?: boolean; manage?: boolean };
  finance?: { view?: boolean; manage?: boolean };
  settings?: { manage?: boolean };
  auditLogs?: { view?: boolean };
}

export function getDefaultPermissions(role: Role): IWorkspacePermissions {
  if (role === "owner" || role === "admin") {
    return {
      tasks: { view: true, create: true, edit: true, delete: true, assign: true },
      projects: { view: true, create: true, edit: true, delete: true },
      routines: { view: true, manage: true },
      customSections: { view: true, manage: true },
      files: { view: true, upload: true },
      members: { view: true, manage: true },
      finance: { view: true, manage: true },
      settings: { manage: role === "owner" },
      auditLogs: { view: true },
    };
  }

  if (role === "member") {
    return {
      tasks: { view: true, create: true, edit: true, delete: false, assign: true },
      projects: { view: true, create: true, edit: true, delete: false },
      routines: { view: true, manage: true },
      customSections: { view: true, manage: true },
      files: { view: true, upload: true },
      members: { view: true, manage: false },
      finance: { view: false, manage: false },
      settings: { manage: false },
      auditLogs: { view: false },
    };
  }

  // viewer
  return {
    tasks: { view: true, create: false, edit: false, delete: false, assign: false },
    projects: { view: true, create: false, edit: false, delete: false },
    routines: { view: true, manage: false },
    customSections: { view: true, manage: false },
    files: { view: true, upload: false },
    members: { view: true, manage: false },
    finance: { view: false, manage: false },
    settings: { manage: false },
    auditLogs: { view: false },
  };
}

export function hasModulePermission(
  membership: { role: string; permissions?: IWorkspacePermissions | null },
  module: keyof IWorkspacePermissions,
  action: string
): boolean {
  if (membership.role === "owner") return true;

  // If custom permissions exist for this module, consult them
  if (membership.permissions && membership.permissions[module]) {
    const modPerms = membership.permissions[module] as Record<string, boolean | undefined>;
    if (typeof modPerms[action] === "boolean") {
      return !!modPerms[action];
    }
  }

  // Fallback to role defaults
  const defaults = getDefaultPermissions(membership.role as Role);
  const modDefaults = defaults[module] as Record<string, boolean | undefined>;
  return !!modDefaults?.[action];
}

export const roleHierarchy: Record<Role, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
