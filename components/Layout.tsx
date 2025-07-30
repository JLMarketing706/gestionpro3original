import React, { useState, useContext } from 'react';
import Sidebar from './Sidebar';
import { ArrowLeftOnRectangleIcon, UserIcon, Bars3Icon } from './icons';
import { AppContext } from '../contexts/AppContext';
import ToastContainer from './common/Toast';

// Import all page components
import Inicio from './pages/Inicio';
import Ventas from './pages/Ventas';
import Clientes from './pages/Clientes';
import CuentasCorrientes from './pages/CuentasCorrientes';
import Inventario from './pages/Inventario';
import Proveedores from './pages/Proveedores';
import Sucursales from './pages/Sucursales';
import Configuracion from './pages/Configuracion';
import Usuarios from './pages/Usuarios';
import Informes from './pages/Informes';
import Documentos from './pages/Documentos';
import Contacto from './pages/Contacto';

interface LayoutProps {
  onLogout: () => void;
}

export type PageId = 'inicio' | 'ventas' | 'clientes' | 'cuentas' | 'inventario' | 'proveedores' | 'sucursales' | 'configuracion' | 'usuarios' | 'informes' | 'documentos' | 'contacto';

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState<PageId>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const context = useContext(AppContext);

  if (!context) {
    return <div>Cargando...</div>; // Or some loading indicator
  }
  const { user } = context;

  const handleMobileNavigation = (pageId: PageId) => {
    setActivePage(pageId);
    setIsMobileMenuOpen(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'inicio':
        return <Inicio />;
      case 'ventas':
        return <Ventas />;
      case 'clientes':
        return <Clientes />;
      case 'cuentas':
        return <CuentasCorrientes />;
      case 'inventario':
        return <Inventario />;
      case 'proveedores':
        return <Proveedores />;
      case 'sucursales':
        return <Sucursales />;
      case 'configuracion':
        return <Configuracion />;
      case 'usuarios':
        return <Usuarios />;
      case 'informes':
        return <Informes />;
      case 'documentos':
        return <Documentos />;
      case 'contacto':
        return <Contacto />;
      default:
        return <Inicio />;
    }
  };


  return (
    <>
      <ToastContainer />
      <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
        
        {/* Desktop Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-700 hidden md:block">
            <Sidebar activePage={activePage} onNavigate={setActivePage} />
        </aside>

        {/* Mobile Sidebar (Overlay) */}
        <div 
          className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={!isMobileMenuOpen}
        >
            <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className={`relative z-10 w-64 h-full transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar activePage={activePage} onNavigate={handleMobileNavigation} />
            </aside>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between md:justify-end h-16 px-6">
                <button 
                  className="md:hidden p-1 -ml-1 text-slate-300 hover:text-white"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Abrir menú"
                >
                  <Bars3Icon className="h-6 w-6"/>
                </button>

              <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-700 mr-3 flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                          <UserIcon className="h-6 w-6 text-slate-400" />
                      )}
                  </div>
                  <span className="text-slate-300 mr-4">
                    Hola, <span className="font-bold text-indigo-400">{user?.full_name}</span>
                  </span>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    aria-label="Cerrar Sesión"
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                  </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
            {renderActivePage()}
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
