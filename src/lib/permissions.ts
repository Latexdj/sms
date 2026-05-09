type Role = "SUPER_ADMIN" | "ADMIN" | "HEADTEACHER" | "TEACHER" | "ACCOUNTANT" | "PARENT" | "STUDENT" | "LIBRARIAN";

// Core logic array structurally identifying exact Access Matrices inherently securely
export type PermissionNode = 
  | "all"
  | "attendance"
  | "assignments"
  | "exams"
  | "timetable"
  | "timetable_read"
  | "fees"
  | "accounting"
  | "reports"
  | "billing"
  | "settings"
  | "inventory"
  | "library";

// Logic mathematically defining access rights mapped cleanly securely
export const ROLE_PERMISSIONS: Record<Role, PermissionNode[]> = {
  SUPER_ADMIN: ["all"],
  ADMIN: ["all"],
  HEADTEACHER: [
     "attendance", 
     "assignments", 
     "exams", 
     "timetable", 
     "fees", 
     "accounting", 
     "reports", 
     "inventory", 
     "library"
  ], // All EXCEPT settings & billing 
  TEACHER: [
     "attendance", 
     "assignments", 
     "exams", 
     "timetable_read"
  ],
  ACCOUNTANT: [
     "fees", 
     "accounting", 
     "reports"
  ],
  PARENT: [
     // Specific scopes that will intersect later mathematically natively analyzing specific children limits safely 
     "attendance", 
     "exams", 
     "fees"
  ],
  STUDENT: [
     "attendance",
     "assignments",
     "exams",
     "timetable_read"
  ],
  LIBRARIAN: [
     "library"
  ]
};

/**
 * Functional limit executing checks natively mapping boundaries seamlessly!
 */
export const hasPermission = (userRole: Role | undefined | string, module: PermissionNode): boolean => {
  if (!userRole) return false;
  
  // Cast logic constraints parsing accurately
  const role = userRole as Role;
  const limits = ROLE_PERMISSIONS[role];
  
  if (!limits) return false;
  
  // The 'all' array mathematically executes total boundaries resolving successfully preventing string matching locks
  if (limits.includes("all")) return true;
  
  return limits.includes(module);
};
