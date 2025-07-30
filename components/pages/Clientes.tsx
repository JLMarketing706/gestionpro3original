
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { UsersIcon, PlusIcon } from '../icons';
import { Customer } from '../../types';
import Modal from '../common/Modal';
import DataTable, { Column } from '../common/DataTable';

type CustomerFormProps = {
    customer?: Customer; 
    onSave: (customer: Customer) => Promise<void>; 
    onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        cuit: customer?.cuit || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...customer, // includes id and created_at if editing
            ...formData,
            // these fields are not on the form, so they should be taken from original `customer` or default
            id: customer?.id || '',
            created_at: customer?.created_at || new Date().toISOString(),
            user_id: customer?.user_id || '',
        }
        await onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <input type="text" name="name" placeholder="Nombre completo" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <input type="email" name="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <input type="tel" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <input type="text" name="address" placeholder="Dirección" value={formData.address} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <input type="text" name="cuit" placeholder="CUIT / CUIL" value={formData.cuit} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Guardar</button>
            </div>
        </form>
    );
};


const Clientes: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { user, customers, addCustomer, updateCustomer, deleteCustomer, showToast } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (customerData: Customer) => {
        try {
            if (customerData.id) {
                const { id, created_at, user_id, ...updateData } = customerData;
                await updateCustomer(id, updateData);
                showToast('Cliente actualizado con éxito', 'success');
            } else {
                const { id, created_at, ...insertData } = customerData;
                await addCustomer({ ...insertData, user_id: user.id });
                showToast('Cliente creado con éxito', 'success');
            }
            closeModal();
        } catch (error) {
            console.error("Failed to save customer:", error);
            showToast(`Error al guardar el cliente: ${(error as Error).message}`, 'error');
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            try {
                await deleteCustomer(id);
                showToast('Cliente eliminado', 'success');
            } catch (error) {
                console.error("Failed to delete customer:", error);
                showToast(`Error al eliminar el cliente: ${(error as Error).message}`, 'error');
            }
        }
    };

    const openModal = () => {
        setEditingCustomer(undefined);
        setIsModalOpen(true);
    };
    
    const closeModal = () => setIsModalOpen(false);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.cuit && c.cuit.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [customers, searchTerm]);

    const columns: Column<Customer>[] = [
        { header: 'Nombre', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Teléfono', accessor: 'phone' },
        { header: 'CUIT', accessor: 'cuit' },
    ];

    return (
        <div className="w-full animate-fade-in">
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <UsersIcon className="h-10 w-10 text-indigo-400" />
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">Clientes</h1>
                        <p className="text-slate-400 mt-1">Gestiona tu base de clientes.</p>
                    </div>
                </div>
                <button onClick={openModal} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                    <PlusIcon className="h-5 w-5" />
                    <span>Nuevo Cliente</span>
                </button>
            </div>
            
            <DataTable
                columns={columns}
                data={filteredCustomers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Buscar por nombre, email o CUIT..."
            />

            {isModalOpen && (
                <Modal onClose={closeModal}>
                    <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Clientes;
