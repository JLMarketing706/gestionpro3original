
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { BuildingStorefrontIcon, PlusIcon } from '../icons';
import { Supplier } from '../../types';
import Modal from '../common/Modal';
import DataTable, { Column } from '../common/DataTable';

type SupplierFormProps = {
    supplier?: Supplier;
    onSave: (supplier: Supplier) => Promise<void>;
    onCancel: () => void;
};

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        cuit: supplier?.cuit || '',
        contact_person: supplier?.contact_person || '',
        notes: supplier?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Supplier = {
            ...supplier,
            ...formData,
            id: supplier?.id || '',
            created_at: supplier?.created_at || new Date().toISOString(),
            user_id: supplier?.user_id || '',
        };
        await onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
            <h2 className="text-2xl font-bold text-slate-100">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Nombre / Razón Social" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <input type="text" name="cuit" placeholder="CUIT" value={formData.cuit} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="email" name="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <input type="tel" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input type="text" name="contact_person" placeholder="Persona de Contacto" value={formData.contact_person} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <input type="text" name="address" placeholder="Dirección" value={formData.address} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <textarea name="notes" placeholder="Notas Adicionales (ej: horarios, datos bancarios)" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Guardar</button>
            </div>
        </form>
    );
};


const Proveedores: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { user, suppliers, addSupplier, updateSupplier, deleteSupplier, showToast } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (supplierData: Supplier) => {
        try {
            if (supplierData.id) {
                const { id, created_at, user_id, ...updateData } = supplierData;
                await updateSupplier(id, updateData);
                showToast('Proveedor actualizado con éxito', 'success');
            } else {
                const { id, created_at, ...insertData } = supplierData;
                await addSupplier({ ...insertData, user_id: user.id });
                showToast('Proveedor creado con éxito', 'success');
            }
            closeModal();
        } catch (error) {
            console.error("Failed to save supplier:", error);
            showToast(`Error al guardar el proveedor: ${(error as Error).message}`, 'error');
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
            try {
                await deleteSupplier(id);
                showToast('Proveedor eliminado', 'success');
            } catch (error) {
                console.error("Failed to delete supplier:", error);
                showToast(`Error al eliminar el proveedor: ${(error as Error).message}`, 'error');
            }
        }
    };

    const openModal = () => {
        setEditingSupplier(undefined);
        setIsModalOpen(true);
    };
    
    const closeModal = () => setIsModalOpen(false);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.cuit && s.cuit.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [suppliers, searchTerm]);

    const columns: Column<Supplier>[] = [
        { header: 'Nombre', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Teléfono', accessor: 'phone' },
        { header: 'Contacto', accessor: 'contact_person' },
        { header: 'CUIT', accessor: 'cuit' },
    ];

    return (
        <div className="w-full animate-fade-in">
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BuildingStorefrontIcon className="h-10 w-10 text-indigo-400" />
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">Proveedores</h1>
                        <p className="text-slate-400 mt-1">Gestiona la información de tus proveedores.</p>
                    </div>
                </div>
                <button onClick={openModal} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                    <PlusIcon className="h-5 w-5" />
                    <span>Nuevo Proveedor</span>
                </button>
            </div>
            
            <DataTable
                columns={columns}
                data={filteredSuppliers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Buscar por nombre, email, CUIT o contacto..."
            />

            {isModalOpen && (
                <Modal onClose={closeModal}>
                    <SupplierForm supplier={editingSupplier} onSave={handleSave} onCancel={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Proveedores;
