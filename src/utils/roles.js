export const ROLE_DEFINITIONS = {
  admin: {
    label: 'Administrador',
    permissions: {
      dashboard: true,
      rooms: true,
      guests: true,
      reservations: true,
      payments: true,
      reports: true,
      manageUsers: true,
      manageSettings: true,
    },
  },
  manager: {
    label: 'Gerente',
    permissions: {
      dashboard: true,
      rooms: true,
      guests: true,
      reservations: true,
      payments: true,
      reports: true,
      manageUsers: false,
      manageSettings: false,
    },
  },
  receptionist: {
    label: 'Recepcionista',
    permissions: {
      dashboard: true,
      rooms: true,
      guests: true,
      reservations: true,
      payments: false,
      reports: false,
      manageUsers: false,
      manageSettings: false,
    },
  },
  cleaning_staff: {
    label: 'Personal de Limpieza',
    permissions: {
      dashboard: true,
      rooms: true,
      guests: false,
      reservations: false,
      payments: false,
      reports: false,
      manageUsers: false,
      manageSettings: false,
    },
  },
};

export const ROLE_HIERARCHY = {
  admin: ['admin'],
  manager: ['admin', 'manager'],
  receptionist: ['admin', 'manager', 'receptionist'],
  cleaning_staff: ['admin', 'manager', 'cleaning_staff'],
};

export const getUserRole = (user) => user?.user_metadata?.role || 'receptionist';

export const hasPermission = (user, permission) => {
  const role = getUserRole(user);
  return ROLE_DEFINITIONS[role]?.permissions?.[permission] || false;
};

export const hasRoleAccess = (user, requiredRole) => {
  const userRole = getUserRole(user);
  return ROLE_HIERARCHY[requiredRole]?.includes(userRole) || false;
};
