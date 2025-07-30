

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Config, Customer, Product, SaleDocument, DocumentStatus, Supplier, UserProfile, SaleItem, ProductUpdate, Role, Sucursal, SystemUser, BranchStock, EcommerceIntegration, IntegrationPlatform, EcommerceOrder, SimulatedOrderLineItem, SyncLog, SyncConfig } from '../types';
import { supabase } from '../services/supabase';
import { showToast, ToastType } from '../components/common/Toast';
import { Database, Json } from '../services/database.types';

// Type Aliases for DB operations using snake_case
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
type RoleInsert = Database['public']['Tables']['roles']['Insert'];
type RoleUpdate = Database['public']['Tables']['roles']['Update'];
type SucursalInsert = Database['public']['Tables']['sucursales']['Insert'];
type SucursalUpdate = Database['public']['Tables']['sucursales']['Update'];
type BranchStockInsert = Database['public']['Tables']['branch_stock']['Insert'];
type BranchStockUpdate = Database['public']['Tables']['branch_stock']['Update'];
type EcommerceIntegrationInsert = Database['public']['Tables']['ecommerce_integrations']['Insert'];
type EcommerceIntegrationUpdate = Database['public']['Tables']['ecommerce_integrations']['Update'];


// This structure should match the one in BulkImportModal
type ProductImportRow = {
    product: ProductUpdate;
    stock: {
        cost_price: number | null;
        sale_price: number;
        stock: number;
        min_stock: number;
    }
}


interface AppContextType {
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    users: SystemUser[];
    roles: Role[];
    sucursales: Sucursal[];
    branchStocks: BranchStock[];
    config: Config;
    customers: Customer[];
    products: Product[];
    documents: SaleDocument[];
    suppliers: Supplier[];
    ecommerceIntegrations: EcommerceIntegration[];
    ecommerceOrders: EcommerceOrder[];
    syncLogs: SyncLog[];
    updateProfile: (updates: ProfileUpdate) => Promise<void>;
    uploadFile: (file: File, bucket: string, path: string) => Promise<string | null>;
    addCustomer: (customer: CustomerInsert) => Promise<void>;
    updateCustomer: (id: string, customer: CustomerUpdate) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    addProduct: (product: ProductInsert, stockData: Omit<BranchStockInsert, 'product_id'>[]) => Promise<void>;
    updateProduct: (id: string, product: ProductUpdate, stockData: BranchStockUpdate[]) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    syncProductToEcommerce: (product: Product) => void;
    addSaleDocument: (doc: Omit<DocumentInsert, 'id' | 'created_at' | 'status' | 'paid_amount' | 'user_id'>) => Promise<SaleDocument | null>;
    applyPayment: (amount: number, docIds: string[]) => Promise<void>;
    addSupplier: (supplier: SupplierInsert) => Promise<void>;
    updateSupplier: (id: string, supplier: SupplierUpdate) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    addSucursal: (sucursal: SucursalInsert) => Promise<void>;
    updateSucursal: (id: string, sucursal: SucursalUpdate) => Promise<void>;
    deleteSucursal: (id: string) => Promise<void>;
    upsertProducts: (data: ProductImportRow[], conflictResolution: 'overwrite' | 'skip') => Promise<{ successCount: number; errorCount: number; errors: string[] }>;
    inviteUserByEmail: (email: string, roleId: string, sucursalId: string | null) => Promise<void>;
    addRole: (role: RoleInsert) => Promise<void>;
    updateRole: (id: string, role: RoleUpdate) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    addEcommerceIntegration: (integration: EcommerceIntegrationInsert) => Promise<void>;
    updateEcommerceIntegration: (id: string, integration: EcommerceIntegrationUpdate) => Promise<void>;
    deleteEcommerceIntegration: (id: string) => Promise<void>;
    processIncomingOrder: (platform: IntegrationPlatform, items: SimulatedOrderLineItem[]) => Promise<boolean>;
    showToast: (message: string, type: ToastType) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppContextProvider: React.FC<{ children: ReactNode, user: UserProfile, setUser: React.Dispatch<React.SetStateAction<UserProfile | null>> }> = ({ children, user, setUser }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [documents, setDocuments] = useState<SaleDocument[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [branchStocks, setBranchStocks] = useState<BranchStock[]>([]);
    const [ecommerceIntegrations, setEcommerceIntegrations] = useState<EcommerceIntegration[]>([]);
    const [ecommerceOrders, setEcommerceOrders] = useState<EcommerceOrder[]>([]);
    const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Step 1: Fetch primary data, but without the failing `profiles` join.
                const [customersRes, productsRes, documentsRes, suppliersRes, profilesRes, rolesRes, sucursalesRes, integrationsRes, ordersRes] = await Promise.all([
                    supabase.from('customers').select('*').eq('user_id', user.id),
                    supabase.from('products').select('*').eq('user_id', user.id),
                    supabase.from('documents').select('*').eq('user_id', user.id),
                    supabase.from('suppliers').select('*').eq('user_id', user.id),
                    supabase.from('profiles').select('*'), // Fetch profiles without the join
                    supabase.from('roles').select('*'),
                    supabase.from('sucursales').select('*').eq('user_id', user.id),
                    supabase.from('ecommerce_integrations').select('*').eq('user_id', user.id),
                    supabase.from('ecommerce_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                ]);

                // Abort if any critical fetch fails
                if (customersRes.error) throw customersRes.error;
                if (productsRes.error) throw productsRes.error;
                if (documentsRes.error) throw documentsRes.error;
                if (suppliersRes.error) throw suppliersRes.error;
                if (profilesRes.error) throw profilesRes.error;
                if (rolesRes.error) throw rolesRes.error;
                if (sucursalesRes.error) throw sucursalesRes.error;
                if (integrationsRes.error) throw integrationsRes.error;
                if (ordersRes.error) throw ordersRes.error;
                
                // Set state for primary data
                setCustomers(customersRes.data || []);
                setProducts(productsRes.data || []);
                setDocuments((documentsRes.data as unknown as SaleDocument[]) || []);
                setSuppliers(suppliersRes.data || []);
                const rolesData = rolesRes.data || [];
                setRoles(rolesData);
                const sucursalesData = sucursalesRes.data || [];
                setSucursales(sucursalesData);
                setEcommerceIntegrations(integrationsRes.data || []);
                setEcommerceOrders(ordersRes.data || []);

                // Step 2: Manually join profiles with roles to create the `users` list
                const profilesData = profilesRes.data || [];
                const usersWithRoles: SystemUser[] = profilesData.map(profile => {
                    const role = rolesData.find(r => r.id === profile.role_id) || null;
                    return { ...profile, role };
                });
                setUsers(usersWithRoles);

                // Step 3: Fetch dependent data (branch_stock) using the results from Step 1.
                if (sucursalesData.length > 0) {
                    const sucursalIds = sucursalesData.map(s => s.id);
                    const { data: branchStocksData, error: branchStocksError } = await supabase
                        .from('branch_stock')
                        .select('*')
                        .in('sucursal_id', sucursalIds);
                    
                    if (branchStocksError) throw branchStocksError;
                    setBranchStocks(branchStocksData || []);
                } else {
                    setBranchStocks([]); // No sucursales means no branch stock
                }

            } catch (error) {
                console.error("Error loading initial data:", error);
                const errorMessage = (error && typeof error === 'object' && 'message' in error) ? String((error as any).message) : 'Ocurrió un error inesperado al cargar datos.';
                showToast(`Error al cargar los datos: ${errorMessage}`, 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [user]);

    // --- LOGGING/SIMULATION ---
    const addSyncLog = (log: Omit<SyncLog, 'id' | 'timestamp'>) => {
        const newLog: SyncLog = {
            ...log,
            id: `log_${Date.now()}_${Math.random()}`,
            timestamp: new Date().toISOString(),
        };
        setSyncLogs(prev => [newLog, ...prev]);
        showToast(newLog.message, newLog.status === 'success' ? 'info' : 'error');
    };
    
    // --- ACTIONS ---

    const updateProfile = async (updates: ProfileUpdate) => {
        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) { showToast('Error al actualizar el perfil.', 'error'); console.error(error); throw error; }
        showToast('Perfil actualizado con éxito.', 'success');
        setUser(currentUser => {
            if (!currentUser) return null;
            const currentConfigObject = (typeof currentUser.config === 'object' && currentUser.config !== null && !Array.isArray(currentUser.config)) ? currentUser.config : {};
            let newConfig: Json | null = currentUser.config;
            if (updates.config !== undefined) {
                if (typeof updates.config === 'object' && updates.config !== null && !Array.isArray(updates.config)) {
                    newConfig = { ...currentConfigObject, ...updates.config };
                } else {
                    newConfig = updates.config;
                }
            }
            return { ...currentUser, ...updates, config: newConfig };
        });
    };
    
    const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
        await supabase.storage.from(bucket).remove([path]);
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: true });
        if (uploadError) { showToast('Error al subir la imagen.', 'error'); console.error(`Supabase upload error to bucket ${bucket}:`, uploadError); return null; }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return `${data.publicUrl}?t=${new Date().getTime()}`;
    };

    // --- Customer Actions ---
    const addCustomer = async (customer: CustomerInsert) => {
        const { data, error } = await supabase.from('customers').insert(customer).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) setCustomers(prev => [...prev, data as Customer]);
    };

    const updateCustomer = async (id: string, customer: CustomerUpdate) => {
        const { data, error } = await supabase.from('customers').update(customer).eq('id', id).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) setCustomers(prev => prev.map(c => c.id === id ? (data as Customer) : c));
    };
    
    const deleteCustomer = async (id: string) => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) { showToast(error.message, 'error'); throw error; }
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    // --- Product and Stock Actions ---
    const addProduct = async (product: ProductInsert, stockData: Omit<BranchStockInsert, 'product_id'>[]) => {
        const { data: newProduct, error: productError } = await supabase.from('products').insert(product).select().single();
        if (productError) { showToast(`Error al crear producto: ${productError.message}`, 'error'); throw productError; }
        if (!newProduct) { showToast('No se pudo obtener el nuevo producto.', 'error'); return; }

        const stockToInsert = stockData.map(sd => ({ ...sd, product_id: newProduct.id }));
        const { data: newStock, error: stockError } = await supabase.from('branch_stock').insert(stockToInsert).select();
        
        if (stockError) { showToast(`Producto creado, pero falló al guardar stock: ${stockError.message}`, 'error'); throw stockError; }
        
        setProducts(prev => [...prev, newProduct as Product]);
        if (newStock) setBranchStocks(prev => [...prev, ...newStock as BranchStock[]]);
    };

    const updateProduct = async (id: string, product: ProductUpdate, stockData: BranchStockUpdate[]) => {
        const { data: updatedProduct, error: productError } = await supabase.from('products').update(product).eq('id', id).select().single();
        if (productError) { showToast(`Error al actualizar producto: ${productError.message}`, 'error'); throw productError; }
        
        const { data: updatedStocks, error: stockError } = await supabase.from('branch_stock').upsert(stockData, { onConflict: 'product_id,sucursal_id' }).select();
        if (stockError) { showToast(`Producto actualizado, pero falló al guardar stock: ${stockError.message}`, 'error'); throw stockError; }

        if (updatedProduct) {
            setProducts(prev => prev.map(p => p.id === id ? (updatedProduct as Product) : p));
            syncProductToEcommerce(updatedProduct as Product);
        }
        if (updatedStocks) {
            setBranchStocks(prev => {
                const otherStocks = prev.filter(bs => !updatedStocks.some(us => us.id === bs.id));
                return [...otherStocks, ...updatedStocks as BranchStock[]];
            });
        }
    };


    const deleteProduct = async (id: string) => {
        const { error: stockError } = await supabase.from('branch_stock').delete().eq('product_id', id);
        if (stockError) { showToast(`Error al eliminar stock asociado: ${stockError.message}`, 'error'); throw stockError; }

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) { showToast(error.message, 'error'); throw error; }

        setProducts(prev => prev.filter(p => p.id !== id));
        setBranchStocks(prev => prev.filter(bs => bs.product_id !== id));
    };
    
    const addSaleDocument = async (doc: Omit<DocumentInsert, 'id' | 'created_at' | 'status' | 'paid_amount' | 'user_id'>): Promise<SaleDocument | null> => {
        const docItems = doc.items as unknown as SaleItem[];
        const sucursalIdForSale = doc.sucursal_id || sucursales[0]?.id;
        if (!sucursalIdForSale) {
            showToast('No se pudo determinar la sucursal para la venta.', 'error');
            return null;
        }

        if (doc.type === 'Factura' || doc.type === 'Reserva') {
            for (const item of docItems) {
                const { error: rpcError } = await supabase.rpc('decrease_stock', { p_product_id: item.product_id, p_quantity: item.quantity, p_sucursal_id: sucursalIdForSale });
                if (rpcError) { showToast(`Error al actualizar stock: ${rpcError.message}`, 'error'); throw rpcError; }
                const product = products.find(p => p.id === item.product_id);
                if(product) syncProductToEcommerce(product);
            }
        }
        
        let paidAmount = 0;
        let status: DocumentStatus = 'Pendiente de pago';
        if (doc.type === 'Factura' && doc.payment_method !== 'Cuenta corriente') {
            paidAmount = doc.total;
            status = 'Pagada';
        } else if (doc.type !== 'Factura') {
            paidAmount = doc.total;
            status = 'Pagada';
        }
        
        const insertData: DocumentInsert = { ...doc, user_id: user.id, paid_amount: paidAmount, status: status, sucursal_id: sucursalIdForSale };
        const { data: newDocument, error } = await supabase.from('documents').insert(insertData).select().single();
        
        if (error) { showToast(`No se pudo finalizar la venta: ${error.message}`, 'error'); throw error; }
        
        const typedDoc = newDocument as SaleDocument;
        setDocuments(prev => [...prev, typedDoc]);
        setBranchStocks(prev => prev.map(bs => {
            const soldItem = docItems.find(item => item.product_id === bs.product_id);
            if (soldItem && bs.sucursal_id === sucursalIdForSale) {
                return { ...bs, stock: bs.stock - soldItem.quantity };
            }
            return bs;
        }));
        return typedDoc;
    };

    const applyPayment = async (amount: number, docIds: string[]) => {
        let remainingAmount = amount;
        const docsToUpdate = docIds.map(id => documents.find(d => d.id === id)).filter(Boolean) as SaleDocument[];
        for (const doc of docsToUpdate) {
            if (remainingAmount <= 0) break;
            const debt = doc.total - doc.paid_amount;
            if (debt > 0) {
                const paymentForDoc = Math.min(remainingAmount, debt);
                const newPaidAmount = doc.paid_amount + paymentForDoc;
                const newStatus: DocumentStatus = newPaidAmount >= doc.total ? 'Pagada' : 'Parcialmente pagada';
                const { error } = await supabase.from('documents').update({ paid_amount: newPaidAmount, status: newStatus }).eq('id', doc.id);
                if (error) { showToast(`Error al actualizar documento ${doc.id}: ${error.message}`, 'error'); continue; }
                setDocuments(prev => prev.map(d => d.id === doc.id ? {...d, paid_amount: newPaidAmount, status: newStatus} : d));
                remainingAmount -= paymentForDoc;
            }
        }
        if (remainingAmount > 0) showToast(`Sobran $${remainingAmount.toFixed(2)} del pago.`, 'info');
    };

    // --- Supplier Actions ---
    const addSupplier = async (supplier: SupplierInsert) => {
        const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) setSuppliers(prev => [...prev, data as Supplier]);
    };

    const updateSupplier = async (id: string, supplier: SupplierUpdate) => {
        const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', id).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) setSuppliers(prev => prev.map(s => s.id === id ? (data as Supplier) : s));
    };

    const deleteSupplier = async (id: string) => {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) { showToast(error.message, 'error'); throw error; }
        setSuppliers(prev => prev.filter(s => s.id !== id));
    };

    // --- Sucursal Actions ---
    const addSucursal = async (sucursal: SucursalInsert) => {
        const { data, error } = await supabase.from('sucursales').insert(sucursal).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) setSucursales(prev => [...prev, data as Sucursal]);
    };
    const updateSucursal = async (id: string, sucursal: SucursalUpdate) => {
        const { data, error } = await supabase.from('sucursales').update(sucursal).eq('id', id).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) setSucursales(prev => prev.map(s => s.id === id ? data as Sucursal : s));
    };
    const deleteSucursal = async (id: string) => {
        const { error } = await supabase.from('sucursales').delete().eq('id', id);
        if (error) { showToast(error.message, 'error'); throw error; }
        setSucursales(prev => prev.filter(s => s.id !== id));
    };
    
    const upsertProducts = async (data: ProductImportRow[], conflictResolution: 'overwrite' | 'skip'): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
        setIsLoading(true);
        const results = { successCount: 0, errorCount: 0, errors: [] as string[] };

        try {
            if (sucursales.length === 0) {
                throw new Error("No hay sucursales configuradas. Por favor, crea al menos una sucursal para importar productos.");
            }
            const defaultSucursalId = sucursales[0].id;

            const productsToUpsert = data.map(d => d.product);
            
            const { data: upsertedProducts, error: productError } = await supabase
                .from('products')
                .upsert(productsToUpsert, {
                    onConflict: 'sku',
                    ignoreDuplicates: conflictResolution === 'skip'
                })
                .select('id, sku');
            
            if (productError) throw productError;
            
            if (!upsertedProducts && conflictResolution === 'overwrite') {
                throw new Error("La operación de importación de productos no devolvió resultados.");
            }

            if (upsertedProducts && upsertedProducts.length > 0) {
                const stockToUpsert: BranchStockInsert[] = [];
                for (const upsertedProduct of upsertedProducts) {
                    const originalRow = data.find(d => d.product.sku === upsertedProduct.sku);
                    if (originalRow) {
                        stockToUpsert.push({
                            product_id: upsertedProduct.id,
                            sucursal_id: defaultSucursalId,
                            cost_price: originalRow.stock.cost_price,
                            sale_price: originalRow.stock.sale_price,
                            stock: originalRow.stock.stock,
                            min_stock: originalRow.stock.min_stock,
                        });
                    }
                }

                if (stockToUpsert.length > 0) {
                    const { error: stockError } = await supabase
                        .from('branch_stock')
                        .upsert(stockToUpsert, { onConflict: 'product_id,sucursal_id' });

                    if (stockError) {
                        throw new Error(`Error al actualizar el stock: ${stockError.message}`);
                    }
                }
                
                results.successCount = upsertedProducts.length;
                showToast(`${results.successCount} productos importados/actualizados correctamente.`, 'success');

                const [productsRes, branchStocksRes] = await Promise.all([
                     supabase.from('products').select('*').eq('user_id', user.id),
                     supabase.from('branch_stock').select('*')
                ]);
                if (productsRes.data) setProducts(productsRes.data);
                if (branchStocksRes.data) setBranchStocks(branchStocksRes.data);

            } else if (conflictResolution === 'skip') {
                showToast(`No se importaron nuevos productos. Se omitieron los duplicados.`, 'info');
            }

        } catch (error: any) {
            console.error("Bulk import failed:", error);
            showToast(error.message, 'error');
            results.errorCount = data.length - results.successCount;
            results.errors.push(error.message);
        } finally {
            setIsLoading(false);
        }

        return results;
    };

    const inviteUserByEmail = async (email: string, roleId: string, sucursalId: string | null) => {
        const { error } = await supabase.rpc('invite_user', { p_email: email, p_role_id: roleId, p_sucursal_id: sucursalId });
        if (error) { showToast(error.message, 'error'); throw error; }
        showToast(`Invitación enviada a ${email}`, 'success');
    };

    // --- Role Management ---
    const addRole = async (role: RoleInsert) => {
        const { data, error } = await supabase.from('roles').insert(role).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) { setRoles(prev => [...prev, data as Role]); showToast('Rol creado con éxito.', 'success'); }
    };

    const updateRole = async (id: string, role: RoleUpdate) => {
        const { data, error } = await supabase.from('roles').update(role).eq('id', id).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) { setRoles(prev => prev.map(r => r.id === id ? (data as Role) : r)); showToast('Rol actualizado con éxito.', 'success'); }
    };

    const deleteRole = async (id: string) => {
        const { count, error: usersError } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role_id', id);
        if (usersError) { showToast(usersError.message, 'error'); throw usersError; }
        if (count && count > 0) { showToast('No se puede eliminar el rol porque está asignado a uno o más usuarios.', 'error'); throw new Error('Role is in use'); }
        const { error } = await supabase.from('roles').delete().eq('id', id);
        if (error) { showToast(error.message, 'error'); throw error; }
        setRoles(prev => prev.filter(r => r.id !== id));
        showToast('Rol eliminado correctamente.', 'success');
    };
    
    // --- E-commerce Integrations ---
    const addEcommerceIntegration = async (integration: EcommerceIntegrationInsert) => {
        const { data, error } = await supabase.from('ecommerce_integrations').insert(integration).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) { setEcommerceIntegrations(prev => [...prev, data as EcommerceIntegration]); showToast('Integración añadida.', 'success'); }
    };
    
    const updateEcommerceIntegration = async (id: string, integration: EcommerceIntegrationUpdate) => {
        const { data, error } = await supabase.from('ecommerce_integrations').update(integration).eq('id', id).select().single();
        if (error) { showToast(error.message, 'error'); throw error; }
        if (data) { setEcommerceIntegrations(prev => prev.map(i => i.id === id ? data as EcommerceIntegration : i)); showToast('Integración actualizada.', 'success'); }
    };

    const deleteEcommerceIntegration = async (id: string) => {
        const { error } = await supabase.from('ecommerce_integrations').delete().eq('id', id);
        if (error) { showToast(error.message, 'error'); throw error; }
        setEcommerceIntegrations(prev => prev.filter(i => i.id !== id));
        showToast('Integración eliminada.', 'success');
    };

    const syncProductToEcommerce = (product: Product) => {
        const activeIntegrations = ecommerceIntegrations.filter(i => i.is_active);
        if (activeIntegrations.length === 0) return;

        const getStockForIntegration = (integration: EcommerceIntegration) => {
            const config = integration.sync_config as unknown as SyncConfig;
            if (config.stock_source === 'branch') {
                return branchStocks.find(bs => bs.sucursal_id === config.branch_id && bs.product_id === product.id)?.stock ?? 0;
            }
            return branchStocks.filter(bs => bs.product_id === product.id).reduce((sum, item) => sum + item.stock, 0);
        };
        
        for (const integration of activeIntegrations) {
            const stock = getStockForIntegration(integration);
             addSyncLog({
                direction: 'pwa_to_ecom',
                platform: integration.platform,
                status: 'success',
                product_sku: product.sku,
                message: `(Sim) Stock de ${product.sku} actualizado a ${stock} en ${integration.platform}.`
            });
        }
    };


    const processIncomingOrder = async (platform: IntegrationPlatform, items: SimulatedOrderLineItem[]): Promise<boolean> => {
        addSyncLog({
            direction: 'ecom_to_pwa',
            platform: platform,
            status: 'success',
            message: `(Sim) Pedido entrante recibido de ${platform}.`
        });
        
        const originalOrderId = `${platform.slice(0, 3).toUpperCase()}-${Date.now()}`;
    
        const { data: newOrder, error: orderCreationError } = await supabase
            .from('ecommerce_orders')
            .insert({
                user_id: user.id,
                source_platform: platform,
                original_order_id: originalOrderId,
                order_data: { items } as unknown as Json,
                status: 'received'
            })
            .select()
            .single();
        
        if (orderCreationError || !newOrder) {
            showToast('Error crítico: No se pudo registrar el pedido entrante.', 'error');
            console.error(orderCreationError);
            return false;
        }
    
        setEcommerceOrders(prev => [newOrder as EcommerceOrder, ...prev]);
    
        try {
            let assignedBranchId: string | null = null;
            const customerForEcommerce = customers.find(c => c.name.toLowerCase() === 'cliente e-commerce');
            const defaultCustomer = customerForEcommerce || { id: 'cf', name: 'Consumidor Final' };
    
            const firstItem = items[0];
            const { data: branchId, error: assignmentError } = await supabase.rpc('assign_order_to_branch', {
                p_product_id: firstItem.product_id,
                p_quantity: firstItem.quantity
            });
    
            if (assignmentError || !branchId) {
                const productName = products.find(p => p.id === firstItem.product_id)?.name || 'producto';
                throw new Error(assignmentError?.message || `Stock insuficiente para ${productName}.`);
            }
            assignedBranchId = branchId;
    
            const saleItems: SaleItem[] = [];
            let subtotal = 0;
    
            for (const item of items) {
                const product = products.find(p => p.id === item.product_id);
                if (!product) throw new Error(`Producto con ID ${item.product_id} no encontrado.`);
    
                const stockInfo = branchStocks.find(bs => bs.product_id === item.product_id && bs.sucursal_id === assignedBranchId);
                if (!stockInfo || stockInfo.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name} en la sucursal asignada.`);
                }
    
                const unitPrice = stockInfo.sale_price;
                const itemSubtotal = unitPrice * item.quantity;
                subtotal += itemSubtotal;
    
                saleItems.push({
                    product_id: item.product_id,
                    product_name: product.name,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    subtotal: itemSubtotal,
                });
            }
            
            const tax = subtotal * 0.21;
            const total = subtotal + tax;
            
            const newDoc = await addSaleDocument({
                type: 'Reserva',
                customer: defaultCustomer,
                items: saleItems as unknown as Json,
                subtotal,
                tax,
                total,
                payment_method: 'E-commerce',
                payment_currency: (user.config as unknown as Config).base_currency,
                exchange_rate: null,
                responsable_id: user.id,
                sucursal_id: assignedBranchId,
            });
    
            if (!newDoc) {
                throw new Error("No se pudo crear el documento de reserva interno.");
            }
            
            const { error: updateError } = await supabase
                .from('ecommerce_orders')
                .update({ status: 'processed', processed_at: new Date().toISOString() })
                .eq('id', newOrder.id);
            
            if (updateError) throw updateError;
            
            setEcommerceOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'processed', processed_at: new Date().toISOString() } as EcommerceOrder : o));
    
            const assignedBranchName = sucursales.find(s => s.id === assignedBranchId)?.name || 'Desconocida';
            showToast(`Pedido #${originalOrderId} procesado y asignado a sucursal: ${assignedBranchName}.`, 'success');
            
            addSyncLog({
                direction: 'ecom_to_pwa',
                platform: platform,
                status: 'success',
                message: `Pedido #${originalOrderId} procesado y asignado a ${assignedBranchName}.`
            });
    
            return true;
            
        } catch (error: any) {
            const errorMessage = error.message || 'Error desconocido durante el procesamiento.';
            console.error(`Failed to process order ${originalOrderId}:`, error);
    
            const { error: updateError } = await supabase
                .from('ecommerce_orders')
                .update({ status: 'error', error_message: errorMessage })
                .eq('id', newOrder.id);
            
            if (updateError) console.error("Failed to update order status to error:", updateError);
    
            setEcommerceOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'error', error_message: errorMessage } as EcommerceOrder : o));
            showToast(`Error al procesar pedido: ${errorMessage}`, 'error');
            
            addSyncLog({
                direction: 'ecom_to_pwa',
                platform: platform,
                status: 'error',
                message: `Error procesando pedido: ${errorMessage}`
            });
            return false;
        }
    }


    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-100">
                <p>Cargando datos de tu cuenta...</p>
            </div>
        );
    }
    
    const value: AppContextType = {
        user,
        setUser,
        users,
        roles,
        sucursales,
        branchStocks,
        config: user.config as unknown as Config,
        customers,
        products,
        documents,
        suppliers,
        ecommerceIntegrations,
        ecommerceOrders,
        syncLogs,
        updateProfile,
        uploadFile,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        syncProductToEcommerce,
        addSaleDocument,
        applyPayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSucursal,
        updateSucursal,
        deleteSucursal,
        upsertProducts,
        inviteUserByEmail,
        addRole,
        updateRole,
        deleteRole,
        addEcommerceIntegration,
        updateEcommerceIntegration,
        deleteEcommerceIntegration,
        processIncomingOrder,
        showToast,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};