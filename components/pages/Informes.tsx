
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ChartBarIcon, CreditCardIcon, ShoppingCartIcon, UsersIcon, CubeIcon, ArrowPathIcon } from '../icons';
import { SaleDocument, Customer, Sucursal, SyncLog, IntegrationPlatform } from '../../types';
import PieChart from '../common/PieChart';

const StatCard: React.FC<{ icon: React.FC<{className?: string}>, title: string, value: string, subtext?: string, color: string }> = ({ icon: Icon, title, value, subtext, color }) => (
    <div className="bg-slate-800/50 backdrop-blur-lg p-6 rounded-2xl border border-slate-700 flex items-center gap-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-8 w-8 text-white"/>
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
            {subtext && <p className="text-slate-500 text-xs">{subtext}</p>}
        </div>
    </div>
);

const getSyncStatusChip = (status: 'success' | 'error') => {
    const styles = {
        'success': 'bg-green-500/20 text-green-300',
        'error': 'bg-red-500/20 text-red-300',
    }
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status === 'success' ? 'Éxito' : 'Error'}</span>;
};

const getSyncDirectionChip = (direction: 'pwa_to_ecom' | 'ecom_to_pwa') => {
    const styles = {
        'pwa_to_ecom': 'bg-blue-500/20 text-blue-300',
        'ecom_to_pwa': 'bg-purple-500/20 text-purple-300',
    }
     const labels = {
        'pwa_to_ecom': 'Saliente',
        'ecom_to_pwa': 'Entrante',
    }
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[direction]}`}>{labels[direction]}</span>;
};


const Informes: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { documents, ecommerceOrders, sucursales, syncLogs, config } = context;

    const stats = useMemo(() => {
        const physicalSales = documents.filter(doc => doc.type === 'Factura' && doc.payment_method !== 'E-commerce');
        const ecommerceSalesDocs = documents.filter(doc => doc.payment_method === 'E-commerce');
        
        const physicalRevenue = physicalSales.reduce((acc, doc) => acc + doc.total, 0);
        const ecommerceRevenue = ecommerceSalesDocs.reduce((acc, doc) => acc + doc.total, 0);
        const totalRevenue = physicalRevenue + ecommerceRevenue;

        const salesByBranch = sucursales.map(sucursal => {
            const branchSales = documents.filter(doc => doc.sucursal_id === sucursal.id && doc.type === 'Factura');
            const total = branchSales.reduce((acc, doc) => acc + doc.total, 0);
            return {
                id: sucursal.id,
                name: sucursal.name,
                salesCount: branchSales.length,
                totalRevenue: total,
            };
        });

        return {
            totalRevenue,
            physicalRevenue,
            ecommerceRevenue,
            physicalSalesCount: physicalSales.length,
            ecommerceOrdersCount: ecommerceOrders.length,
            salesByBranch,
        };
    }, [documents, ecommerceOrders, sucursales]);

    const channelData = [
        { label: 'Ventas Físicas', value: stats.physicalRevenue, color: '#4f46e5' }, // indigo-600
        { label: 'E-commerce', value: stats.ecommerceRevenue, color: '#10b981' }, // emerald-500
    ];

    return (
    <div className="w-full animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <ChartBarIcon className="h-10 w-10 text-indigo-400" />
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">
            Informes y Estadísticas
          </h1>
          <p className="text-slate-400 mt-1">Visualiza los datos y el rendimiento de tu negocio omnicanal.</p>
        </div>
      </div>
      
      {/* Tarjetas de KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon={CreditCardIcon} title="Ingresos Totales" value={`$${stats.totalRevenue.toFixed(2)}`} subtext={`en ${config.base_currency}`} color="bg-green-600" />
          <StatCard icon={ShoppingCartIcon} title="Ventas Físicas" value={stats.physicalSalesCount.toString()} subtext={`$${stats.physicalRevenue.toFixed(2)} en ingresos`} color="bg-blue-600" />
          <StatCard icon={CubeIcon} title="Pedidos E-commerce" value={stats.ecommerceOrdersCount.toString()} subtext={`$${stats.ecommerceRevenue.toFixed(2)} en ingresos`} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-full">
                <h3 className="text-xl font-bold text-slate-100 mb-4">Distribución por Canal</h3>
                <PieChart data={channelData} />
            </div>
          </div>
          <div className="lg:col-span-3">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-full">
                  <h3 className="text-xl font-bold text-slate-100 mb-4">Ventas por Sucursal</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="border-b border-slate-700 text-sm text-slate-400">
                           <tr>
                                <th className="p-3">Sucursal</th>
                                <th className="p-3">N° Ventas</th>
                                <th className="p-3 text-right">Ingresos Totales</th>
                           </tr>
                        </thead>
                        <tbody>
                            {stats.salesByBranch.map(branch => (
                                <tr key={branch.id} className="border-b border-slate-800">
                                    <td className="p-3 font-medium">{branch.name}</td>
                                    <td className="p-3">{branch.salesCount}</td>
                                    <td className="p-3 text-right font-mono">${branch.totalRevenue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                  </div>
              </div>
          </div>
      </div>
      
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <ArrowPathIcon className="h-6 w-6 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-100">Registros de Sincronización</h2>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
              {syncLogs.length > 0 ? (
                  <table className="w-full text-left">
                      <thead className="border-b border-slate-700 text-sm text-slate-400 sticky top-0 bg-slate-800/50">
                          <tr>
                              <th className="p-3">Fecha</th>
                              <th className="p-3">Dirección</th>
                              <th className="p-3">Plataforma</th>
                              <th className="p-3">Estado</th>
                              <th className="p-3">Mensaje</th>
                          </tr>
                      </thead>
                      <tbody>
                          {syncLogs.map(log => (
                              <tr key={log.id} className="border-b border-slate-800">
                                  <td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="p-3">{getSyncDirectionChip(log.direction)}</td>
                                  <td className="p-3 font-medium">{log.platform}</td>
                                  <td className="p-3">{getSyncStatusChip(log.status)}</td>
                                  <td className="p-3 text-slate-400 text-xs font-mono">{log.message}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              ) : <p className="text-slate-400 text-center py-8">No hay registros de sincronización.</p>}
          </div>
      </div>
    </div>
  );
};

export default Informes;