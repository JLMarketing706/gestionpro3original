import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { CreditCardIcon, PlusIcon } from '../icons';
import { Customer, SaleDocument, DocumentStatus } from '../../types';
import Modal from '../common/Modal';

const ApplyPaymentForm: React.FC<{
  customerDocs: SaleDocument[];
  onSave: (amount: number, docIds: string[]) => void;
  onCancel: () => void;
}> = ({ customerDocs, onSave, onCancel }) => {
  const [amount, setAmount] = useState<number>(0);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const pendingDocs = customerDocs.filter(doc => doc.status !== 'Pagada' && doc.type === 'Factura');
  const totalDebt = pendingDocs.reduce((acc, doc) => acc + (doc.total - doc.paid_amount), 0);

  const handleDocSelection = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || selectedDocs.length === 0) {
      alert("Por favor, ingrese un monto y seleccione al menos un documento.");
      return;
    }
    onSave(amount, selectedDocs);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-100">Aplicar Pago</h2>
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Monto a Pagar</label>
        <input 
          type="number"
          value={amount}
          onChange={e => setAmount(parseFloat(e.target.value) || 0)}
          className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
          required
          min="0.01"
          step="0.01"
        />
      </div>
       <div>
        <h3 className="text-lg font-bold text-slate-300 mb-2">Seleccionar Documentos</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-900/50 rounded-lg">
          {pendingDocs.map(doc => (
            <label key={doc.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
              <input 
                type="checkbox"
                checked={selectedDocs.includes(doc.id)}
                onChange={() => handleDocSelection(doc.id)}
                className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-grow flex justify-between">
                <span>Factura #{doc.id.slice(-6)}</span>
                <span className="font-mono text-slate-400">Saldo: ${(doc.total - doc.paid_amount).toFixed(2)}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Aplicar Pago</button>
      </div>
    </form>
  )
}


const CuentasCorrientes: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { customers, documents, applyPayment, showToast } = context;
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const customersWithDebt = useMemo(() => {
    const customerDebts: { [key: string]: number } = {};
    documents.forEach(doc => {
      const customer = doc.customer as Customer;
      if (customer.id !== 'cf' && doc.type === 'Factura' && doc.status !== 'Pagada') {
        const debt = doc.total - doc.paid_amount;
        if (debt > 0) {
          customerDebts[customer.id] = (customerDebts[customer.id] || 0) + debt;
        }
      }
    });
    return customers.filter(c => customerDebts[c.id] > 0);
  }, [documents, customers]);

  const selectedCustomerDocs = useMemo(() => {
    if (!selectedCustomer) return [];
    return documents
        .filter(doc => (doc.customer as Customer).id === selectedCustomer.id && doc.type === 'Factura')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [documents, selectedCustomer]);

  const selectedCustomerDebt = useMemo(() => {
     if (!selectedCustomer) return 0;
     return selectedCustomerDocs.reduce((acc, doc) => {
        if (doc.status !== 'Pagada') {
            return acc + (doc.total - doc.paid_amount);
        }
        return acc;
     }, 0);
  }, [selectedCustomerDocs]);

  const handleApplyPayment = async (amount: number, docIds: string[]) => {
    if (!selectedCustomer) return;
    try {
        await applyPayment(amount, docIds);
        showToast('Pago aplicado correctamente', 'success');
        setIsModalOpen(false);
    } catch (error) {
        showToast((error as Error).message, 'error');
    }
  };
  
  const getStatusChip = (status: string) => {
    const styles: {[key: string]: string} = {
        'Pagada': 'bg-green-500/20 text-green-300',
        'Pendiente de pago': 'bg-yellow-500/20 text-yellow-300',
        'Parcialmente pagada': 'bg-orange-500/20 text-orange-300',
    }
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status}</span>;
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <CreditCardIcon className="h-10 w-10 text-indigo-400" />
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">
            Cuentas Corrientes
          </h1>
          <p className="text-slate-400 mt-1">Gestiona los saldos y pagos de tus clientes.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-slate-200">Clientes con Saldo</h3>
            <div className="space-y-2">
                {customersWithDebt.length > 0 ? customersWithDebt.map(c => (
                     <button 
                        key={c.id} 
                        onClick={() => setSelectedCustomer(c)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedCustomer?.id === c.id ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                        {c.name}
                    </button>
                )) : <p className="text-slate-400">No hay clientes con saldos pendientes.</p>}
            </div>
        </div>
        <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            {selectedCustomer ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-xl text-slate-100">{selectedCustomer.name}</h3>
                            <p className="font-bold text-2xl text-red-400">Saldo: ${selectedCustomerDebt.toFixed(2)}</p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            disabled={selectedCustomerDebt <= 0}
                            className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Aplicar Pago
                        </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                       {selectedCustomerDocs.map(doc => (
                        <div key={doc.id} className="p-4 bg-slate-900/70 rounded-lg flex justify-between items-center">
                            <div>
                               <p className="font-bold">Factura #{doc.id.slice(-6)}</p>
                               <p className="text-sm text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                             <div>{getStatusChip(doc.status)}</div>
                            <div className="text-right">
                                <p className="font-bold font-mono text-lg">${doc.total.toFixed(2)}</p>
                                <p className="text-sm font-mono text-slate-400">Pagado: ${doc.paid_amount.toFixed(2)}</p>
                            </div>
                        </div>
                       ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                     <h2 className="text-xl font-bold text-slate-200">Seleccione un Cliente</h2>
                     <p className="text-slate-400 mt-2">Elige un cliente de la lista para ver su estado de cuenta.</p>
                </div>
            )}
        </div>
      </div>
      {isModalOpen && selectedCustomer && (
        <Modal onClose={() => setIsModalOpen(false)}>
            <ApplyPaymentForm 
                customerDocs={selectedCustomerDocs}
                onSave={handleApplyPayment}
                onCancel={() => setIsModalOpen(false)}
            />
        </Modal>
      )}
    </div>
  );
};

export default CuentasCorrientes;