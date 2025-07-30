
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { UserGroupIcon, PlusIcon, MailIcon } from '../icons';
import { SystemUser, Role, Sucursal } from '../../types';
import Modal from '../common/Modal';
import DataTable, { Column } from '../common/DataTable';
import { showToast } from '../common/Toast';

type InviteUserFormProps = {
    roles: Role[];
    sucursales: Sucursal[];
    onInvite: (email: string, roleId: string, sucursalId: string | null) => Promise<void>;
    onCancel: () => void;
};

const InviteUserForm: React.FC<InviteUserFormProps> = ({ roles, sucursales, onInvite, onCancel }) => {
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState<string>('');
    const [sucursalId, setSucursalId] = useState<string>('');
    
    // Filtra solo los roles activos para el selector
    const activeRoles = useMemo(() => roles.filter(r => r.estado), [roles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !roleId) {
            showToast('Por favor, complete el email y seleccione un rol.', 'error');
            return;
        }
        await onInvite(email, roleId, sucursalId || null);
    };

    const noRolesAvailable = activeRoles.length === 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Invitar Nuevo Usuario</h2>
            <p className="text-slate-400">Se enviará una invitación por correo para que el usuario se una y configure su contraseña.</p>
             {noRolesAvailable && (
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-sm rounded-lg p-3">
                    <strong>Atención:</strong> No hay roles activos definidos en el sistema. Por favor, crea los roles necesarios en la sección de configuración antes de invitar usuarios.
                </div>
            )}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email del Usuario</label>
                <input type="email" name="email" id="email" placeholder="usuario@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1">Rol</label>
                    <select 
                        name="role" 
                        id="role" 
                        value={roleId} 
                        onChange={(e) => setRoleId(e.target.value)} 
                        required 
                        disabled={noRolesAvailable}
                        className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>{noRolesAvailable ? 'No hay roles disponibles' : 'Seleccionar un rol'}</option>
                        {activeRoles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="sucursal" className="block text-sm font-medium text-slate-300 mb-1">Sucursal (Opcional)</label>
                    <select name="sucursal" id="sucursal" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="">Sin asignar</option>
                        {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button 
                    type="submit" 
                    disabled={noRolesAvailable}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold disabled:bg-slate-500 disabled:cursor-not-allowed">
                    <MailIcon className="h-5 w-5"/>
                    <span>Enviar Invitación</span>
                </button>
            </div>
        </form>
    );
};

const Usuarios: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { users, roles, sucursales, inviteUserByEmail, showToast } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleInvite = async (email: string, roleId: string, sucursalId: string | null) => {
        try {
            await inviteUserByEmail(email, roleId, sucursalId);
            closeModal();
        } catch (error) {
            console.error("Failed to invite user:", error);
            showToast(`Error al invitar al usuario: ${(error as Error).message}`, 'error');
        }
    };
    
    const closeModal = () => setIsModalOpen(false);

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, searchTerm]);

    const columns: Column<SystemUser>[] = [
        {
            header: 'Nombre',
            accessor: 'full_name',
            render: (value, item) => (
                <div className="flex items-center gap-3">
                    <img src={item.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${value || item.id}`} alt={value || 'avatar'} className="w-10 h-10 rounded-full object-cover bg-slate-700"/>
                    <div>
                        <p className="font-bold">{value || '(Sin nombre)'}</p>
                    </div>
                </div>
            )
        },
        { 
            header: 'Rol', 
            accessor: 'role',
            render: (role: Role) => role ? <span className="px-2 py-1 text-sm font-semibold rounded-full bg-indigo-500/20 text-indigo-300">{role.nombre}</span> : 'Sin Rol'
        },
        { 
            header: 'Sucursal', 
            accessor: 'sucursal_id',
            render: (sucursal_id) => {
                const sucursal = sucursales.find(s => s.id === sucursal_id);
                return sucursal ? sucursal.name : 'N/A';
            }
        },
    ];

    return (
        <div className="w-full animate-fade-in">
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <UserGroupIcon className="h-10 w-10 text-indigo-400" />
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">Usuarios del Sistema</h1>
                        <p className="text-slate-400 mt-1">Gestiona los roles y permisos de tu equipo.</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                    <PlusIcon className="h-5 w-5" />
                    <span>Invitar Usuario</span>
                </button>
            </div>
            
            <DataTable
                columns={columns}
                data={filteredUsers}
                // onEdit and onDelete will be added later
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchPlaceholder="Buscar por nombre..."
            />

            {isModalOpen && (
                <Modal onClose={closeModal}>
                    <InviteUserForm
                        roles={roles}
                        sucursales={sucursales}
                        onInvite={handleInvite}
                        onCancel={closeModal}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Usuarios;
