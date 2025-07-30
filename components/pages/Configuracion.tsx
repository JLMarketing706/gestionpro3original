
import React, { useContext, useState, useRef, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { CogIcon, CheckIcon, UserIcon, PencilIcon, PlusIcon, ServerStackIcon, UserGroupIcon, ShoppingCartIcon } from '../icons';
import { Plan, PlanName, Config, Role, EcommerceIntegration, IntegrationPlatform, ApiCredentials, SyncConfig, Sucursal, Product, SimulatedOrderLineItem } from '../../types';
import { Json } from '../../services/database.types';
import Modal from '../common/Modal';
import DataTable, { Column, Action } from '../common/DataTable';

// --- Reusable Components (can be moved to separate files later) ---

const TabButton: React.FC<{
    label: string;
    icon: React.FC<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-lg transition-colors ${
            isActive ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </button>
);


// --- Page Specific Components ---

const plans: Plan[] = [
    { name: 'Emprendedor', price: 'Gratis', target: 'Para monotributistas o personas que inician.', features: ['Gestión básica de ventas', 'Gestión de productos y clientes', 'Emisión de presupuestos simples'], color: 'border-slate-500' },
    { name: 'Comercios', price: '$15 USD/mes', target: 'Para monotributistas o RI que necesitan facturación.', features: ['Todo del Plan Emprendedor', 'Facturación Electrónica (ARCA)', 'Integración con Mercado Pago'], color: 'border-indigo-500', integrations: ['Mercado Pago', 'ARCA'] },
    { name: 'Pymes', price: '$45 USD/mes', target: 'Para negocios avanzados con múltiples usuarios.', features: ['Todo del Plan Comercios', 'API para desarrolladores', 'Integraciones avanzadas'], color: 'border-amber-500', integrations: ['Make', 'Zapier', 'n8n', 'WooCommerce', 'Tienda Nube', 'Shopify'] }
];

// Define a type for the form data to decouple it from the database schema type
interface RoleFormData {
    nombre: string;
    descripcion: string | null;
    permisos: string; // JSON as a string from the textarea
    estado: boolean;
}

type RoleFormProps = {
    role?: Role;
    onSave: (roleData: RoleFormData & { id?: string }) => Promise<void>;
    onCancel: () => void;
};

const RoleForm: React.FC<RoleFormProps> = ({ role, onSave, onCancel }) => {
    const [formData, setFormData] = useState<RoleFormData>({
        nombre: role?.nombre || '',
        descripcion: role?.descripcion || '',
        permisos: role?.permisos ? JSON.stringify(role.permisos, null, 2) : '{\n  "puede_ver_ventas": true\n}',
        estado: role?.estado ?? true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, id: role?.id };
        await onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">{role ? 'Editar Rol' : 'Nuevo Rol'}</h2>
            <input type="text" name="nombre" placeholder="Nombre del Rol" value={formData.nombre} onChange={handleChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <textarea name="descripcion" placeholder="Descripción del Rol" value={formData.descripcion || ''} onChange={handleChange} rows={2} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            <div>
                <label htmlFor="permisos" className="block text-sm font-medium text-slate-300 mb-1">Permisos (formato JSON)</label>
                <textarea name="permisos" id="permisos" placeholder='{ "puede_hacer_algo": true }' value={formData.permisos} onChange={handleChange} rows={5} className="w-full p-3 bg-slate-900 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"></textarea>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="estado" checked={formData.estado} onChange={handleChange} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Rol Activo (disponible para asignar)</span>
            </label>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Guardar Rol</button>
            </div>
        </form>
    );
};

type IntegrationFormProps = {
    integration?: EcommerceIntegration;
    sucursales: Sucursal[];
    onSave: (integrationData: EcommerceIntegration) => Promise<void>;
    onCancel: () => void;
};

const IntegrationForm: React.FC<IntegrationFormProps> = ({ integration, sucursales, onSave, onCancel }) => {
    const context = useContext(AppContext);
    
    const [platform, setPlatform] = useState<IntegrationPlatform>(integration?.platform || 'Shopify');
    const [apiCredentials, setApiCredentials] = useState<ApiCredentials>((integration?.api_credentials as unknown as ApiCredentials) || {});
    const [syncConfig, setSyncConfig] = useState<SyncConfig>((integration?.sync_config as unknown as SyncConfig) || { stock_source: 'global', branch_id: null, sync_prices: true });
    const [isActive, setIsActive] = useState<boolean>(integration?.is_active ?? true);

    const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiCredentials(prev => ({...prev, [e.target.name]: e.target.value }));
    }

    const handleSyncConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setSyncConfig(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: EcommerceIntegration = {
            id: integration?.id || '',
            created_at: integration?.created_at || new Date().toISOString(),
            user_id: context!.user.id,
            platform,
            api_credentials: apiCredentials as unknown as Json,
            sync_config: syncConfig as unknown as Json,
            is_active: isActive,
        }
        await onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">{integration ? 'Editar Integración' : 'Nueva Integración'}</h2>
            
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plataforma</label>
                <select value={platform} onChange={e => setPlatform(e.target.value as IntegrationPlatform)} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="Shopify">Shopify</option>
                    <option value="WooCommerce">WooCommerce</option>
                    <option value="Tienda Nube">Tienda Nube</option>
                </select>
            </div>

            <fieldset className="border border-slate-700 p-4 rounded-lg">
                <legend className="px-2 font-semibold text-slate-300">Credenciales de API</legend>
                <div className="space-y-4">
                    {platform === 'WooCommerce' && <input type="text" name="store_url" placeholder="URL de la Tienda (ej: https://mitienda.com)" value={apiCredentials.store_url || ''} onChange={handleCredentialChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg" />}
                    <input type="text" name="api_key" placeholder="API Key / Consumer Key / App ID" value={apiCredentials.api_key || ''} onChange={handleCredentialChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg" />
                    <input type="password" name="api_secret" placeholder="API Secret / Consumer Secret / Access Token" value={apiCredentials.api_secret || ''} onChange={handleCredentialChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg" />
                </div>
            </fieldset>

            <fieldset className="border border-slate-700 p-4 rounded-lg">
                <legend className="px-2 font-semibold text-slate-300">Configuración de Sincronización</legend>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Fuente de Stock</label>
                        <select name="stock_source" value={syncConfig.stock_source} onChange={handleSyncConfigChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg">
                            <option value="global">Stock Global Consolidado</option>
                            <option value="branch">Stock de una Sucursal Específica</option>
                        </select>
                    </div>
                    {syncConfig.stock_source === 'branch' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Seleccionar Sucursal</label>
                            <select name="branch_id" value={syncConfig.branch_id || ''} onChange={handleSyncConfigChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg">
                                <option value="" disabled>Selecciona una sucursal...</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                     <label className="flex items-center gap-3 cursor-pointer pt-2">
                        <input type="checkbox" name="sync_prices" checked={syncConfig.sync_prices} onChange={handleSyncConfigChange} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                        <span>Sincronizar precios con esta plataforma</span>
                    </label>
                 </div>
            </fieldset>

             <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Activar esta integración</span>
            </label>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Guardar Integración</button>
            </div>
        </form>
    );
};

type SimulateOrderModalProps = {
    integration: EcommerceIntegration;
    products: Product[];
    onSubmit: (items: SimulatedOrderLineItem[]) => void;
    onCancel: () => void;
};

const SimulateOrderModal: React.FC<SimulateOrderModalProps> = ({ integration, products, onSubmit, onCancel }) => {
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    
    const availableProducts = products.filter(p => p.is_active);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || quantity <= 0) {
            alert('Por favor, selecciona un producto y una cantidad válida.');
            return;
        }
        onSubmit([{ product_id: selectedProductId, quantity }]);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Simular Pedido de <span className="text-indigo-400">{integration.platform}</span></h2>
            <p className="text-slate-400">Esto simulará un webhook de un nuevo pedido para probar el sistema de asignación y reserva de stock.</p>
            <div>
                <label htmlFor="product" className="block text-sm font-medium text-slate-300 mb-1">Producto</label>
                <select 
                    name="product" 
                    id="product" 
                    value={selectedProductId} 
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg"
                >
                    <option value="" disabled>Seleccionar un producto...</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-1">Cantidad</label>
                <input 
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value, 10))}
                    min="1"
                    required
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg"
                />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold">
                    <ShoppingCartIcon className="h-5 w-5"/>
                    <span>Generar Pedido</span>
                </button>
            </div>
        </form>
    );
}

const Configuracion: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { user, updateProfile, uploadFile, showToast, roles, addRole, updateRole, deleteRole, ecommerceIntegrations, sucursales, addEcommerceIntegration, updateEcommerceIntegration, deleteEcommerceIntegration, products, processIncomingOrder } = context;

    const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'integrations' | 'subscription'>('profile');

    // --- Profile State & Handlers ---
    const [fullName, setFullName] = useState(user.full_name);
    const [config, setConfig] = useState<Config>(user.config as unknown as Config);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // --- Role State & Handlers ---
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

    // --- Integration State & Handlers ---
    const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState<EcommerceIntegration | undefined>(undefined);
    const [simulatingIntegration, setSimulatingIntegration] = useState<EcommerceIntegration | null>(null);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({...prev, [name]: value}));
    };

    const handleSaveChanges = async () => {
        let newAvatarUrl: string | undefined = user.avatar_url;
    
        try {
            if (avatarFile) {
                const filePath = `${user.id}/avatar`;
                const uploadedUrl = await uploadFile(avatarFile, 'avatars', filePath);
                if (!uploadedUrl) return; 
                newAvatarUrl = uploadedUrl;
            }
        
            const cleanConfig = { ...config };
            Object.keys(cleanConfig).forEach(key => {
                const configKey = key as keyof Config;
                if (cleanConfig[configKey] === undefined || cleanConfig[configKey] === null) {
                    delete cleanConfig[configKey];
                }
            });

            await updateProfile({
                full_name: fullName,
                config: cleanConfig as unknown as Json,
                avatar_url: newAvatarUrl,
            });
        } catch (error) {
            showToast('Ocurrió un error al guardar los cambios.', 'error');
            console.error("Error saving profile changes:", error);
        }
    };
    
    const roleColumns: Column<Role>[] = useMemo(() => [
        { header: 'Nombre', accessor: 'nombre' },
        { header: 'Descripción', accessor: 'descripcion', render: (value: string | null) => <span className="text-slate-400">{value || 'N/A'}</span> },
        {
            header: 'Estado',
            accessor: 'estado',
            render: (value: boolean) => (
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${value ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>
                    {value ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
    ], []);

    const integrationColumns: Column<EcommerceIntegration>[] = useMemo(() => [
        { header: 'Plataforma', accessor: 'platform' },
        { 
            header: 'Fuente de Stock', 
            accessor: 'sync_config',
            render: (value: Json) => {
                const cfg = value as unknown as SyncConfig;
                if (cfg && cfg.stock_source === 'branch') {
                    const branchName = sucursales.find(s => s.id === cfg.branch_id)?.name || 'Sucursal no encontrada';
                    return `Sucursal: ${branchName}`;
                }
                return 'Global Consolidado';
            }
        },
        {
            header: 'Estado',
            accessor: 'is_active',
            render: (value: boolean) => (
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${value ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>
                    {value ? 'Activa' : 'Inactiva'}
                </span>
            )
        },
    ], [sucursales]);

    const handleSaveRole = async (roleData: RoleFormData & { id?: string }) => {
        try {
            let permisosJson: Json | null = null;
            if (roleData.permisos && roleData.permisos.trim()) {
                try {
                    permisosJson = JSON.parse(roleData.permisos);
                } catch (e) {
                    showToast('El JSON de permisos no es válido.', 'error');
                    return;
                }
            }
        
            const payload = { ...roleData, permisos: permisosJson };
            
            if (payload.id) { // Editing existing role
                const { id, ...updateData } = payload;
                await updateRole(id, updateData);
            } else { // Creating new role
                const { id, ...insertData } = payload;
                await addRole({ ...insertData, creado_por: user.id });
            }
            setIsRoleModalOpen(false);
        } catch(error) {
            console.error("Failed to save role", error);
            showToast(`Error al guardar el rol: ${(error as Error).message}`, 'error');
        }
    };

    const handleDeleteRole = async (id: string) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.')) {
            try {
                await deleteRole(id);
            } catch (error) {
                console.error("Failed to delete role:", error);
                // The context function already shows a toast on error, so we just log it.
            }
        }
    };

    const handleSaveIntegration = async (integrationData: EcommerceIntegration) => {
        try {
            if (integrationData.id) {
                const { id, created_at, user_id, ...updateData } = integrationData;
                await updateEcommerceIntegration(id, updateData);
            } else {
                const { id, created_at, ...insertData } = integrationData;
                await addEcommerceIntegration(insertData);
            }
            setIsIntegrationModalOpen(false);
        } catch(error) {
            console.error("Failed to save integration", error);
            showToast(`Error al guardar la integración: ${(error as Error).message}`, 'error');
        }
    };

    const handleDeleteIntegration = async (id: string) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar esta integración? Se perderá la configuración de sincronización.')) {
            try {
                await deleteEcommerceIntegration(id);
            } catch (error) {
                console.error("Failed to delete integration:", error);
                showToast(`Error al eliminar la integración: ${(error as Error).message}`, 'error');
            }
        }
    };

    const handleSimulateOrder = async (items: SimulatedOrderLineItem[]) => {
        if (!simulatingIntegration) return;
        await processIncomingOrder(simulatingIntegration.platform, items);
        setSimulatingIntegration(null);
    };
    
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-8">
                        {/* User Profile */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h2 className="text-xl font-bold text-slate-200 mb-4">Perfil de Usuario</h2>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="h-12 w-12 text-slate-400" />}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden"/>
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full border-2 border-slate-800">
                                        <PencilIcon className="h-4 w-4 text-white"/>
                                    </button>
                                </div>
                                <div className="flex-grow">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-400 mb-2">Nombre Completo</label>
                                    <input type="text" id="fullName" value={fullName || ''} onChange={e => setFullName(e.target.value)}
                                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Config */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h2 className="text-xl font-bold text-slate-200 mb-4">Datos del Negocio</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="business_name" className="block text-sm font-medium text-slate-400 mb-2">Nombre del Negocio</label>
                                    <input type="text" id="business_name" name="business_name" value={config.business_name || ''} onChange={handleConfigChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg"/>
                                </div>
                                <div>
                                    <label htmlFor="business_phone" className="block text-sm font-medium text-slate-400 mb-2">Teléfono de Contacto</label>
                                    <input type="text" id="business_phone" name="business_phone" value={config.business_phone || ''} onChange={handleConfigChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg"/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="business_address" className="block text-sm font-medium text-slate-400 mb-2">Dirección del Negocio</label>
                                    <input type="text" id="business_address" name="business_address" value={config.business_address || ''} onChange={handleConfigChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg"/>
                                </div>
                                <div>
                                    <label htmlFor="base_currency" className="block text-sm font-medium text-slate-400 mb-2">Moneda Base</label>
                                    <select id="base_currency" name="base_currency" value={config.base_currency} onChange={handleConfigChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg">
                                        <option value="ARS">Peso Argentino (ARS)</option>
                                        <option value="USD">Dólar Estadounidense (USD)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                );
            case 'roles':
                 return (
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-200">Gestión de Roles</h2>
                            <button onClick={() => { setEditingRole(undefined); setIsRoleModalOpen(true); }} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                                <PlusIcon className="h-5 w-5" />
                                <span>Nuevo Rol</span>
                            </button>
                        </div>
                        <DataTable<Role>
                            columns={roleColumns}
                            data={roles}
                            onEdit={(role) => { setEditingRole(role); setIsRoleModalOpen(true); }}
                            onDelete={handleDeleteRole}
                            searchTerm=""
                            setSearchTerm={() => {}}
                            searchPlaceholder="Buscar roles..."
                        />
                    </div>
                );
            case 'integrations':
                return (
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-200">Integraciones E-commerce</h2>
                            <button onClick={() => { setEditingIntegration(undefined); setIsIntegrationModalOpen(true); }} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                                <PlusIcon className="h-5 w-5" />
                                <span>Nueva Integración</span>
                            </button>
                        </div>
                        <DataTable<EcommerceIntegration>
                            columns={integrationColumns}
                            data={ecommerceIntegrations}
                            onEdit={(int) => { setEditingIntegration(int); setIsIntegrationModalOpen(true); }}
                            onDelete={handleDeleteIntegration}
                            actions={[
                                {
                                  icon: ShoppingCartIcon,
                                  label: 'Simular Pedido',
                                  onClick: (int) => {
                                      if(int.is_active) {
                                          setSimulatingIntegration(int);
                                      } else {
                                          showToast('La integración debe estar activa para simular un pedido.', 'error');
                                      }
                                  },
                                  disabled: (int) => !int.is_active
                                }
                              ]}
                            searchTerm=""
                            setSearchTerm={() => {}}
                            searchPlaceholder="Buscar integraciones..."
                        />
                    </div>
                );
            case 'subscription':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.map(plan => <PlanCard key={plan.name} plan={plan} isActive={plan.name === config.active_plan}/>)}
                    </div>
                );
        }
    }

    return (
    <div className="w-full animate-fade-in">
        <div className="mb-8 flex items-center gap-4">
            <CogIcon className="h-10 w-10 text-indigo-400" />
            <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">Configuración</h1>
            <p className="text-slate-400 mt-1">Ajusta las preferencias de tu cuenta, roles e integraciones.</p>
            </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* --- Navigation Tabs --- */}
            <div className="lg:col-span-1">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex lg:flex-col gap-2">
                    <TabButton label="Perfil y Negocio" icon={UserIcon} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    <TabButton label="Roles de Usuario" icon={UserGroupIcon} isActive={activeTab === 'roles'} onClick={() => setActiveTab('roles')} />
                    <TabButton label="Integraciones" icon={ServerStackIcon} isActive={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
                    <TabButton label="Suscripción" icon={CheckIcon} isActive={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} />
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className="lg:col-span-3">
                {renderActiveTabContent()}
            </div>
        </div>

        {/* --- Modals --- */}
        {isRoleModalOpen && (
            <Modal onClose={() => setIsRoleModalOpen(false)}>
                <RoleForm role={editingRole} onSave={handleSaveRole} onCancel={() => setIsRoleModalOpen(false)} />
            </Modal>
        )}
        {isIntegrationModalOpen && (
            <Modal onClose={() => setIsIntegrationModalOpen(false)}>
                <IntegrationForm 
                    integration={editingIntegration} 
                    onSave={handleSaveIntegration} 
                    onCancel={() => setIsIntegrationModalOpen(false)}
                    sucursales={sucursales}
                />
            </Modal>
        )}
        {simulatingIntegration && (
            <Modal onClose={() => setSimulatingIntegration(null)}>
                <SimulateOrderModal 
                    integration={simulatingIntegration}
                    products={products}
                    onSubmit={handleSimulateOrder}
                    onCancel={() => setSimulatingIntegration(null)}
                />
            </Modal>
        )}
    </div>
  );
};

// Simple PlanCard component moved here for cohesion
const PlanCard: React.FC<{ plan: Plan, isActive: boolean }> = ({ plan, isActive }) => (
    <div className={`bg-slate-800/50 p-6 rounded-2xl border-2 ${isActive ? plan.color : 'border-slate-700'} flex flex-col`}>
        <h3 className={`text-2xl font-bold ${isActive ? plan.color.replace('border-', 'text-') : 'text-slate-100'}`}>{plan.name}</h3>
        <p className="text-slate-400 text-sm mt-1 mb-4">{plan.target}</p>
        <p className="text-4xl font-bold mb-6">{plan.price}</p>
        <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map(feat => (
                <li key={feat} className="flex items-start gap-3">
                    <CheckIcon className="h-5 w-5 text-green-400 mt-1 flex-shrink-0"/>
                    <span className="text-slate-300">{feat}</span>
                </li>
            ))}
        </ul>
        {plan.integrations && (
             <div className="mb-6">
                <h4 className="font-bold text-slate-200 mb-2">Integraciones:</h4>
                <div className="flex flex-wrap gap-2">
                    {plan.integrations.map(int => <span key={int} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{int}</span>)}
                </div>
            </div>
        )}
        <button className={`w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors ${ isActive ? 'bg-slate-600 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700' }`}>
            {isActive ? 'Plan Actual' : 'Actualizar Plan'}
        </button>
    </div>
);

export default Configuracion;
