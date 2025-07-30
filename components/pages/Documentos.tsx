import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { DocumentTextIcon, ShoppingCartIcon } from '../icons';
import { DocumentStatus, DocumentType, SaleDocument, Customer, EcommerceOrder, EcommerceOrderStatus } from '../../types';
import DocumentViewerModal from '../common/DocumentViewerModal';

const Documentos: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { documents, ecommerceOrders } = context;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<DocumentType | 'Todos'>('Todos');
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'Todos'>('Todos');
    const [viewingDocument, setViewingDocument] = useState<SaleDocument | null>(null);

    const filteredDocuments = useMemo(() => {
        return documents
            .filter(doc => {
                const typeMatch = filterType === 'Todos' || doc.type === filterType;
                const statusMatch = filterStatus === 'Todos' || doc.status === filterStatus;
                const customer = doc.customer as Customer; // Type assertion
                const searchMatch = doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    customer.name.toLowerCase().includes(searchTerm.toLowerCase());
                return typeMatch && statusMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [documents, searchTerm, filterType, filterStatus]);

    const getStatusChip = (status: string) => {
        const styles: {[key: string]: string} = {
            'Pagada': 'bg-green-500/20 text-green-300',
            'Pendiente de pago': 'bg-yellow-500/20 text-yellow-300',
            'Parcialmente pagada': 'bg-orange-500/20 text-orange-300',
        }
        return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    const getTypeChip = (type: string) => {
        const styles: {[key: string]: string} = {
            'Factura': 'bg-blue-500/20 text-blue-300',
            'Presupuesto': 'bg-purple-500/20 text-purple-300',
            'Reserva': 'bg-teal-500/20 text-teal-300',
        }
        return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[type]}`}>{type}</span>;
    }

    const getEcomStatusChip = (status: EcommerceOrderStatus) => {
        const styles: {[key in EcommerceOrderStatus]: string} = {
            'received': 'bg-blue-500/20 text-blue-300',
            'processed': 'bg-green-500/20 text-green-300',
            'error': 'bg-red-500/20 text-red-300',
            'stock_unavailable': 'bg-yellow-500/20 text-yellow-300',
        }
        const labels: {[key in EcommerceOrderStatus]: string} = {
            'received': 'Recibido',
            'processed': 'Procesado',
            'error': 'Error',
            'stock_unavailable': 'Stock Insuficiente',
        }
        return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{labels[status]}</span>;
    };


  return (
    <>
    {viewingDocument && <DocumentViewerModal doc={viewingDocument} onClose={() => setViewingDocument(null)} />}
    <div className="w-full animate-fade-in space-y-8">
      <div className="mb-0">
        <div className="flex items-center gap-4">
            <DocumentTextIcon className="h-10 w-10 text-indigo-400" />
            <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">
                Documentos
            </h1>
            <p className="text-slate-400 mt-1">Busca y gestiona tus comprobantes y pedidos online.</p>
            </div>
        </div>
      </div>
      
       <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Comprobantes de Venta</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input 
                    type="text"
                    placeholder="Buscar por ID o cliente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="md:col-span-2 w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="Todos">Todos los Tipos</option>
                    <option value="Factura">Factura</option>
                    <option value="Presupuesto">Presupuesto</option>
                    <option value="Reserva">Reserva</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="Todos">Todos los Estados</option>
                    <option value="Pagada">Pagada</option>
                    <option value="Pendiente de pago">Pendiente de pago</option>
                    <option value="Parcialmente pagada">Parcialmente pagada</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-700 text-sm text-slate-400">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">ID</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocuments.map(doc => (
                            <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                                <td className="p-4 font-mono text-xs">#{doc.id.slice(-8)}</td>
                                <td className="p-4 font-medium">{(doc.customer as Customer).name}</td>
                                <td className="p-4">{getTypeChip(doc.type)}</td>
                                <td className="p-4">{getStatusChip(doc.status)}</td>
                                <td className="p-4 text-right font-mono">${doc.total.toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => setViewingDocument(doc)} className="font-bold text-indigo-400 hover:text-indigo-300">Ver PDF</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredDocuments.length === 0 && <p className="text-center text-slate-400 py-8">No se encontraron documentos.</p>}
            </div>
       </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <ShoppingCartIcon className="h-6 w-6 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-100">Pedidos E-commerce Entrantes</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-700 text-sm text-slate-400">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">ID Pedido</th>
                            <th className="p-4">Plataforma</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ecommerceOrders.map(order => (
                            <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-4">{new Date(order.created_at).toLocaleString()}</td>
                                <td className="p-4 font-mono text-xs">{order.original_order_id}</td>
                                <td className="p-4 font-medium">{order.source_platform}</td>
                                <td className="p-4">{getEcomStatusChip(order.status)}</td>
                                <td className="p-4 text-slate-400 text-xs">{order.error_message || 'Procesado correctamente.'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {ecommerceOrders.length === 0 && <p className="text-center text-slate-400 py-8">No hay pedidos de e-commerce recientes.</p>}
            </div>
       </div>
    </div>
    </>
  );
};

export default Documentos;