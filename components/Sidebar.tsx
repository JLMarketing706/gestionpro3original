
import React from 'react';
import { 
    HomeIcon, 
    ShoppingCartIcon, 
    UsersIcon, 
    CreditCardIcon, 
    CubeIcon, 
    OfficeBuildingIcon, 
    CogIcon, 
    UserGroupIcon, 
    ChartBarIcon, 
    DocumentTextIcon, 
    SparklesIcon,
    LifebuoyIcon,
    BuildingStorefrontIcon
} from './icons';
import { PageId } from './Layout';

interface SidebarProps {
    activePage: PageId;
    onNavigate: (pageId: PageId) => void;
}

const menuItems: { id: PageId; icon: React.FC<{className?: string}>; label: string }[] = [
    { id: 'inicio', icon: HomeIcon, label: 'Inicio' },
    { id: 'ventas', icon: ShoppingCartIcon, label: 'Ventas' },
    { id: 'clientes', icon: UsersIcon, label: 'Clientes' },
    { id: 'cuentas', icon: CreditCardIcon, label: 'Cuentas' },
    { id: 'inventario', icon: CubeIcon, label: 'Inventario' },
    { id: 'proveedores', icon: BuildingStorefrontIcon, label: 'Proveedores' },
    { id: 'sucursales', icon: OfficeBuildingIcon, label: 'Sucursales' },
    { id: 'usuarios', icon: UserGroupIcon, label: 'Usuarios' },
    { id: 'informes', icon: ChartBarIcon, label: 'Informes' },
    { id: 'documentos', icon: DocumentTextIcon, label: 'Documentos' },
    { id: 'contacto', icon: LifebuoyIcon, label: 'Contacto y Soporte' },
    { id: 'configuracion', icon: CogIcon, label: 'Configuración' },
];

const NavLink: React.FC<{
    id: string; 
    icon: React.FC<{className?: string}>, 
    label: string, 
    active?: boolean,
    onClick: () => void 
}> = ({ id, icon: Icon, label, active, onClick }) => (
    <button 
        id={id}
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left ${
            active 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
    >
        <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
        <span>{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
    return (
        <div className="w-full h-full bg-slate-800 p-4 flex flex-col">
            <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-slate-700">
                 <SparklesIcon className="w-10 h-10 text-indigo-400" />
                 <h1 className="text-2xl font-bold text-slate-100">Gestión Pro</h1>
            </div>
            <nav className="flex flex-col gap-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink 
                        key={item.id}
                        id={`${item.id}-nav-link`}
                        icon={item.icon} 
                        label={item.label}
                        active={activePage === item.id}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>
            <div className="mt-auto pt-4 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Gestión Pro</p>
                <p>v1.2.0</p>
            </div>
        </div>
    );
};

export default Sidebar;