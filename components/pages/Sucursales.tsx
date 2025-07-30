

import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { OfficeBuildingIcon, PlusIcon } from '../icons';
import { Sucursal } from '../../types';
import Modal from '../common/Modal';
import DataTable, { Column } from '../common/DataTable';

type SucursalFormProps = {
    sucursal?: Sucursal; 
    onSave: (sucursal: Omit<Sucursal, 'created_at' | 'user_id' | 'updated_at'>) => Promise<void>; 
    onCancel: () => void;
}

const SucursalForm: React.FC<SucursalFormProps> = ({ sucursal, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        id: sucursal?.id || '',
        name: sucursal?.name || '',
        address: sucursal?.address || '',
        phone: sucursal?.phone || '',
        email: sucursal?.email || '',
        priority_order: sucursal?.priority_order || 1,
        is_ecommerce_source: sucursal?.is_ecommerce_source || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        
        let processedValue: string | number | boolean;

        if (type === 'checkbox') {
            processedValue = checked;
        } else if (name === 'priority_order') {
            // Ensure priority_order is always treated as a number
            processedValue = parseInt(value, 10) || 0;
        } else {
            processedValue = value;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue as any }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">{sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
            <input type="text" name="name" placeholder="Nombre de la sucursal" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <input type="text" name="address" placeholder="Dirección" value={formData.address || ''} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="tel" name="phone" placeholder="Teléfono de contacto" value={formData.phone || ''} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <input type="email" name="email" placeholder="Email de contacto" value={formData.email || ''} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="priority_order" className="block text-sm font-medium text-slate-400 mb-1">Prioridad de Pedidos (e-commerce)</label>
              <input type="number" name="priority_order" id="priority_order" value={formData.priority_order} onChange={handleChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-slate-500 mt-1">Menor número = mayor prioridad.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_ecommerce_source" checked={formData.is_ecommerce_source} onChange={handleChange} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
              <span>Usar stock de esta sucursal para el e-commerce (si está activada la opción)</span>
            </label>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Guardar</button>
            </div>
        </form>
    );
};


const Sucursales: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { user, sucursales, addSucursal, updateSucursal, deleteSucursal, showToast } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSucursal, setEditingSucursal] = useState<Sucursal | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (sucursalData: Omit<Sucursal, 'created_at' | 'user_id' | 'updated_at'>) => {
        try {
            if (sucursalData.id) {
                const { id, ...updateData } = sucursalData;
                await updateSucursal(id, updateData);
                showToast('Sucursal actualizada con éxito', 'success');
            } else {
                const { id, ...insertData } = sucursalData;
                await addSucursal({ ...insertData, user_id: user.id });
                showToast('Sucursal creada con éxito', 'success');
            }
            closeModal();
        } catch (error) {
            console.error("Failed to save sucursal:", error);
            const errorMessage = (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') 
                ? (error as any).message 
                : 'Ocurrió un error inesperado.';
            showToast(`Error al guardar la sucursal: ${errorMessage}`, 'error');
        }
    };

    const handleEdit = (sucursal: Sucursal) => {
        setEditingSucursal(sucursal);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta sucursal? Esta acción es irreversible.')) {
            try {
                await deleteSucursal(id);
                showToast('Sucursal eliminada', 'success');
            } catch (error) {
                console.error("Failed to delete sucursal:", error);
                const errorMessage = (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') 
                    ? (error as any).message 
                    : 'Ocurrió un error inesperado.';
                showToast(`Error al eliminar la sucursal: ${errorMessage}`, 'error');
            }
        }
    };

    const openModal = () => {
        setEditingSucursal(undefined);
        setIsModalOpen(true);
    };
    
    const closeModal = () => setIsModalOpen(false);

    const filteredSucursales = useMemo(() => {
        return sucursales.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [sucursales, searchTerm]);

    const columns: Column<Sucursal>[] = [
        { header: 'Nombre', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Teléfono', accessor: 'phone' },
        { header: 'Prioridad', accessor: 'priority_order' },
    ];

    return (
        <div className="w-full animate-fade-in">
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <OfficeBuildingIcon className="h-10 w-10 text-indigo-400" />
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">Sucursales</h1>
                        <p className="text-slate-400 mt-1">Administra tus diferentes puntos de venta.</p>
                    </div>
                </div>
                <button onClick={openModal} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                    <PlusIcon className="h-5 w-5" />
                    <span>Nueva Sucursal</span>
                </button>
            </div>
            
            <DataTable
                columns={columns}
                data={filteredSucursales}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Buscar por nombre o dirección..."
            />

            {isModalOpen && (
                <Modal onClose={closeModal}>
                    <SucursalForm sucursal={editingSucursal} onSave={handleSave} onCancel={closeModal} />
                </Modal>
            )}
        </div>
    );
};

export default Sucursales;