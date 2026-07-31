// Agregar el ícono de usuarios
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  UserPlusIcon,  // ← NUEVO ÍCONO
} from '@heroicons/react/24/outline';

// En el array de menuItems, agregar:
const menuItems = [
  // ... otros items ...
  {
    to: '/admin/users',
    label: 'Administrar Usuarios',
    icon: UserPlusIcon,
    iconSolid: UserPlusIcon,
    roles: ['admin'],  // SOLO ADMIN
  },
];