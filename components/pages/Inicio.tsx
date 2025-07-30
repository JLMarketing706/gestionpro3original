
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { OnboardingGuide } from '../common/Onboarding';

const Inicio: React.FC = () => {
  const context = useContext(AppContext);
  const userName = context?.user?.full_name || 'Usuario';

  const tourSteps = [
    {
      target: '#ventas-nav-link',
      content: 'Aquí puedes cargar nuevas ventas, presupuestos o reservas.',
    },
    {
      target: '#inventario-nav-link',
      content: 'Gestiona todos tus productos, precios y stock desde aquí.',
    },
    {
      target: '#configuracion-nav-link',
      content: 'Configura los datos de tu perfil, negocio y suscripción.',
    },
    {
      target: '#informes-nav-link',
      content: 'Visualiza reportes y estadísticas de tu negocio.',
    },
  ];

  return (
    <div className="w-full animate-fade-in">
        <OnboardingGuide tourKey="main-tour" steps={tourSteps} />
        <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">
                Inicio
            </h1>
            <p className="text-slate-400 mt-1">Resumen de tu actividad reciente.</p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
                ¡Bienvenido de nuevo, <span className="text-indigo-400">{userName}</span>!
            </h2>
            <p className="text-slate-300 leading-relaxed">
                Este es tu tablero principal. Explora las diferentes secciones desde el menú lateral para gestionar tu negocio.
                Si es tu primera vez, te recomendamos seguir el tour interactivo para conocer las funciones principales.
            </p>
        </div>
    </div>
  );
};

export default Inicio;
