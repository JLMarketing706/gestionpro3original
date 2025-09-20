
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { CubeIcon, PlusIcon, CameraIcon, ArrowUpTrayIcon, ArrowPathIcon } from '../icons';
import { Product, Sucursal, BranchStock } from '../../types';
import Modal from '../common/Modal';
import DataTable, { Column } from '../common/DataTable';
import BulkImportModal from '../common/BulkImportModal';

type StockData = {
    sucursal_id: string;
    stock: number;
    min_stock: number;
    cost_price: number;
    sale_price: number;
    profit_margin: number;
};

type ProductFormProps = {
    product?: Product; 
    sucursales: Sucursal[];
    branchStocks: BranchStock[];
    onSave: (product: Product, stockData: StockData[], imageFile?: File | null) => Promise<void>; 
    onCancel: () => void;
    onSync: (product: Product) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

const ProductForm: React.FC<ProductFormProps> = ({ product, sucursales, branchStocks, onSave, onCancel, onSync, showToast }) => {
    const [formData, setFormData] = useState({
        sku: product?.sku || '',
        name: product?.name || '',
        unit: product?.unit || 'unidad',
        image_url: product?.image_url || '',
        is_active: product?.is_active ?? true,
        description: product?.description || '',
        category: product?.category || '',
        subcategory: '', // Nuevo campo
        long_description: '', // Nuevo campo para e-commerce
        supplier: '', // Nuevo campo proveedor
        barcode: '', // Campo adicional temporal
        brand: ''   // Campo adicional temporal
    });

    // Estados para categorías, subcategorías, marcas y proveedores
    const [categories, setCategories] = useState<string[]>(['Alimentos', 'Bebidas', 'Limpieza', 'Tecnología']);
    const [subcategories, setSubcategories] = useState<string[]>(['Lácteos', 'Carnes', 'Frutas', 'Verduras']);
    const [brands, setBrands] = useState<string[]>(['Sin marca', 'Coca Cola', 'Samsung', 'Apple']);
    const [suppliers, setSuppliers] = useState<string[]>(['Proveedor A', 'Proveedor B', 'Distribuidora Central']);
    
    // Estados para mostrar/ocultar formularios de nuevos elementos
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [showNewSubcategory, setShowNewSubcategory] = useState(false);
    const [showNewBrand, setShowNewBrand] = useState(false);
    const [showNewSupplier, setShowNewSupplier] = useState(false);
    
    // Estados para nuevos elementos
    const [newCategory, setNewCategory] = useState('');
    const [newSubcategory, setNewSubcategory] = useState('');
    const [newBrand, setNewBrand] = useState('');
    const [newSupplier, setNewSupplier] = useState('');
    
    const [stockBySucursal, setStockBySucursal] = useState<StockData[]>(() => 
        sucursales.map(s => {
            const existingStock = product ? branchStocks.find(bs => bs.product_id === product.id && bs.sucursal_id === s.id) : null;
            const cost = existingStock?.cost_price || 0;
            const sale = existingStock?.sale_price || 0;
            const profit = cost > 0 ? ((sale / cost) - 1) * 100 : 0;
            
            return {
                sucursal_id: s.id,
                stock: existingStock?.stock || 0,
                min_stock: existingStock?.min_stock || 0,
                cost_price: cost,
                sale_price: sale,
                profit_margin: profit,
            }
        })
    );

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState(product?.image_url || '');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories(prev => [...prev, newCategory.trim()]);
            setFormData(prev => ({ ...prev, category: newCategory.trim() }));
            setNewCategory('');
            setShowNewCategory(false);
        }
    };

    const handleAddBrand = () => {
        if (newBrand.trim() && !brands.includes(newBrand.trim())) {
            setBrands(prev => [...prev, newBrand.trim()]);
            setFormData(prev => ({ ...prev, brand: newBrand.trim() }));
            setNewBrand('');
            setShowNewBrand(false);
        }
    };

    const handleAddSubcategory = () => {
        if (newSubcategory.trim() && !subcategories.includes(newSubcategory.trim())) {
            setSubcategories(prev => [...prev, newSubcategory.trim()]);
            setFormData(prev => ({ ...prev, subcategory: newSubcategory.trim() }));
            setNewSubcategory('');
            setShowNewSubcategory(false);
        }
    };

    const handleAddSupplier = () => {
        if (newSupplier.trim() && !suppliers.includes(newSupplier.trim())) {
            setSuppliers(prev => [...prev, newSupplier.trim()]);
            setFormData(prev => ({ ...prev, supplier: newSupplier.trim() }));
            setNewSupplier('');
            setShowNewSupplier(false);
        }
    };
    
    const handleStockChange = (sucursalId: string, field: keyof StockData, value: string) => {
        // For stock and min_stock, we want integers. For others, float.
        const numericValue = ['stock', 'min_stock'].includes(field) ? parseInt(value, 10) : parseFloat(value);
        
        // If parsing results in NaN (e.g., empty input), treat as 0 for calculation, but don't break.
        const cleanValue = isNaN(numericValue) ? 0 : numericValue;

        setStockBySucursal(prev => prev.map(s => {
            if (s.sucursal_id !== sucursalId) return s;

            // Start with the changed field
            let updatedStock = { ...s, [field]: cleanValue };
            
            // Recalculate based on which field was changed
            if (field === 'cost_price' || field === 'profit_margin') {
                const cost = updatedStock.cost_price;
                const profitMargin = updatedStock.profit_margin;
                if (cost > 0) {
                    updatedStock.sale_price = parseFloat((cost * (1 + profitMargin / 100)).toFixed(2));
                }
            } else if (field === 'sale_price') {
                const sale = updatedStock.sale_price;
                const cost = updatedStock.cost_price;
                if (cost > 0) {
                    updatedStock.profit_margin = parseFloat((((sale / cost) - 1) * 100).toFixed(2));
                } else {
                    updatedStock.profit_margin = 0;
                }
            }
            
            return updatedStock;
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const getCurrentProductState = (): Product => {
        return {
            ...product,
            ...formData,
            id: product?.id || '',
            created_at: product?.created_at || new Date().toISOString(),
            user_id: product?.user_id || '',
        };
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = getCurrentProductState();
        await onSave(payload, stockBySucursal, imageFile);
    };
    
    const handleSync = () => {
        if (product) {
            onSync(getCurrentProductState());
        }
    };

    // Componente para búsqueda con autocompletado
    const SearchableSelect: React.FC<{
        label: string;
        value: string;
        onChange: (value: string) => void;
        options: string[];
        showNew: boolean;
        onToggleNew: () => void;
        newValue: string;
        onNewValueChange: (value: string) => void;
        onSaveNew: () => void;
        onCancelNew: () => void;
        placeholder: string;
        required?: boolean;
    }> = ({
        label, value, onChange, options, showNew, onToggleNew,
        newValue, onNewValueChange, onSaveNew, onCancelNew, placeholder, required = false
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState(value);

        const filteredOptions = options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            setSearchTerm(inputValue);
            onChange(inputValue);
            setIsOpen(true);
        };

        const handleOptionClick = (option: string) => {
            setSearchTerm(option);
            onChange(option);
            setIsOpen(false);
        };

        return (
            <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-300">
                    {label} {required && '*'}
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={() => setIsOpen(true)}
                            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                            placeholder={placeholder}
                            required={required}
                            className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {isOpen && filteredOptions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredOptions.map((option, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleOptionClick(option)}
                                        className="p-2 hover:bg-slate-700 cursor-pointer text-slate-200"
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button 
                        type="button" 
                        onClick={onToggleNew} 
                        className="px-3 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
                    >
                        +
                    </button>
                </div>
                {showNew && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={`Nuevo ${label.toLowerCase()}`}
                            value={newValue}
                            onChange={(e) => onNewValueChange(e.target.value)}
                            className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded"
                        />
                        <button 
                            type="button" 
                            onClick={onSaveNew} 
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                        >
                            Agregar
                        </button>
                        <button 
                            type="button" 
                            onClick={onCancelNew} 
                            className="px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded text-white text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
            <h2 className="text-2xl font-bold text-slate-100">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                    <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="w-full aspect-square bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg"/>
                            ) : (
                                <div className="text-center text-slate-500">
                                    <CameraIcon className="h-12 w-12 mx-auto mb-2"/>
                                    <p className="font-semibold text-slate-400">Subir Imagen</p>
                                </div>
                            )}
                        </div>
                    </label>
                    <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange}/>
                </div>
                <div className="w-full sm:w-2/3 space-y-4">
                    <input type="text" name="name" placeholder="Nombre del producto" value={formData.name} onChange={handleFormChange} required className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <input type="text" name="sku" placeholder="SKU (autogenerado si vacío)" value={formData.sku} onChange={handleFormChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            <span className="text-xs text-slate-400">Se autogenera si está vacío</span>
                        </div>
                        <input type="text" name="barcode" placeholder="Código de Barras (opcional)" value={formData.barcode} onChange={handleFormChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <select name="unit" value={formData.unit} onChange={handleFormChange} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="unidad">Unidad</option>
                        <option value="kg">Kilo</option>
                        <option value="litro">Litro</option>
                        <option value="caja">Caja</option>
                        <option value="metro">Metro</option>
                        <option value="par">Par</option>
                    </select>

                    <textarea name="description" placeholder="Descripción breve del producto" value={formData.description} onChange={handleFormChange} required rows={2} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    
                    <textarea name="long_description" placeholder="Descripción detallada para e-commerce (opcional)" value={formData.long_description} onChange={handleFormChange} rows={3} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    
                    {/* Categoría con búsqueda */}
                    <SearchableSelect
                        label="Categoría"
                        value={formData.category}
                        onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        options={categories}
                        showNew={showNewCategory}
                        onToggleNew={() => setShowNewCategory(!showNewCategory)}
                        newValue={newCategory}
                        onNewValueChange={setNewCategory}
                        onSaveNew={handleAddCategory}
                        onCancelNew={() => setShowNewCategory(false)}
                        placeholder="Buscar o escribir categoría"
                        required
                    />

                    {/* Subcategoría con búsqueda */}
                    <SearchableSelect
                        label="Subcategoría"
                        value={formData.subcategory}
                        onChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                        options={subcategories}
                        showNew={showNewSubcategory}
                        onToggleNew={() => setShowNewSubcategory(!showNewSubcategory)}
                        newValue={newSubcategory}
                        onNewValueChange={setNewSubcategory}
                        onSaveNew={handleAddSubcategory}
                        onCancelNew={() => setShowNewSubcategory(false)}
                        placeholder="Buscar o escribir subcategoría"
                    />

                    {/* Marca con búsqueda */}
                    <SearchableSelect
                        label="Marca"
                        value={formData.brand}
                        onChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                        options={brands}
                        showNew={showNewBrand}
                        onToggleNew={() => setShowNewBrand(!showNewBrand)}
                        newValue={newBrand}
                        onNewValueChange={setNewBrand}
                        onSaveNew={handleAddBrand}
                        onCancelNew={() => setShowNewBrand(false)}
                        placeholder="Buscar o escribir marca"
                    />

                    {/* Proveedor con búsqueda */}
                    <SearchableSelect
                        label="Proveedor"
                        value={formData.supplier}
                        onChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}
                        options={suppliers}
                        showNew={showNewSupplier}
                        onToggleNew={() => setShowNewSupplier(!showNewSupplier)}
                        newValue={newSupplier}
                        onNewValueChange={setNewSupplier}
                        onSaveNew={handleAddSupplier}
                        onCancelNew={() => setShowNewSupplier(false)}
                        placeholder="Buscar o escribir proveedor"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Inventario y Precios por Sucursal</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-sm text-slate-400">
                            <tr>
                                <th className="p-2">Sucursal</th>
                                <th className="p-2">Costo</th>
                                <th className="p-2">% Gan.</th>
                                <th className="p-2">Venta</th>
                                <th className="p-2">Stock</th>
                                <th className="p-2">S. Mín.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sucursales.map(sucursal => {
                                const stockInfo = stockBySucursal.find(s => s.sucursal_id === sucursal.id);
                                if (!stockInfo) return null;
                                return (
                                <tr key={sucursal.id} className="bg-slate-900/50">
                                    <td className="p-2 font-semibold">{sucursal.name}</td>
                                    <td><input type="number" step="0.01" value={stockInfo.cost_price} onChange={e => handleStockChange(sucursal.id, 'cost_price', e.target.value)} className="w-24 p-2 bg-slate-800 border-slate-700 rounded" /></td>
                                    <td><input type="number" step="0.01" value={stockInfo.profit_margin} onChange={e => handleStockChange(sucursal.id, 'profit_margin', e.target.value)} className="w-20 p-2 bg-slate-800 border-slate-700 rounded" /></td>
                                    <td><input type="number" step="0.01" value={stockInfo.sale_price} onChange={e => handleStockChange(sucursal.id, 'sale_price', e.target.value)} className="w-24 p-2 bg-slate-800 border-slate-700 rounded" /></td>
                                    <td><input type="number" value={stockInfo.stock} onChange={e => handleStockChange(sucursal.id, 'stock', e.target.value)} className="w-20 p-2 bg-slate-800 border-slate-700 rounded" /></td>
                                    <td><input type="number" value={stockInfo.min_stock} onChange={e => handleStockChange(sucursal.id, 'min_stock', e.target.value)} className="w-20 p-2 bg-slate-800 border-slate-700 rounded" /></td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                 {sucursales.length === 0 && <p className="text-center text-slate-500 p-4">No hay sucursales creadas. Crea una en la sección de Sucursales para poder asignar stock.</p>}
            </div>

             <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleFormChange} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span>Producto Activo (visible para la venta)</span>
            </label>
            <div className="flex justify-between items-center gap-4 pt-4">
                 <div className="flex gap-2">
                     {product && (
                         <button type="button" onClick={handleSync} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors font-bold text-sm">
                            <ArrowPathIcon className="h-5 w-5"/>
                            <span>Sincronizar con E-commerce</span>
                        </button>
                     )}
                     <button 
                         type="button" 
                         onClick={() => showToast('Funcionalidad próximamente disponible', 'info')} 
                         className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-bold text-sm"
                     >
                         <ArrowUpTrayIcon className="h-5 w-5"/>
                         <span>Subir a Tienda</span>
                     </button>
                 </div>
                <div className="flex justify-end gap-4 flex-grow">
                    <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Guardar Producto</button>
                </div>
            </div>
        </form>
    );
};

const Inventario: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { user, products, addProduct, updateProduct, deleteProduct, upsertProducts, showToast, sucursales, branchStocks, syncProductToEcommerce } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const getConsolidatedStock = (productId: string) => {
        return branchStocks
            .filter(bs => bs.product_id === productId)
            .reduce((total, bs) => total + bs.stock, 0);
    };

    const handleSave = async (productData: Product, stockData: StockData[]) => {
        try {
            // Omitir subida de imagen temporalmente
            // let imageUrl = productData.image_url;
            // if (imageFile) { ... }

            // Validar campos obligatorios de producto
            if (!productData.name || !productData.unit || !productData.description || !productData.category) {
                showToast('Completa todos los campos obligatorios: nombre, unidad, descripción y categoría', 'error');
                return;
            }

            // Filtrar solo las sucursales que tienen algún dato ingresado (stock, costo o precio)
            const sucursalesWithData = stockData.filter(s => 
                (s.stock && s.stock > 0) || 
                (s.cost_price && s.cost_price > 0) || 
                (s.sale_price && s.sale_price > 0)
            );

            // Validar que las sucursales con datos tengan precio de venta
            for (const s of sucursalesWithData) {
                if (!s.sale_price || s.sale_price <= 0) {
                    const sucursal = sucursales.find(suc => suc.id === s.sucursal_id);
                    showToast(`La sucursal "${sucursal?.name}" requiere un precio de venta válido`, 'error');
                    return;
                }
            }

            if (productData.id) {
                // Actualizar producto existente y branch_stock
                const { id, created_at, user_id, ...updateData } = { ...productData };
                // Filtrar campos que no están en la BD
                const { barcode, brand, subcategory, long_description, supplier, ...cleanUpdateData } = updateData as any;
                
                // Filtrar solo sucursales con datos válidos para actualización
                const cleanStockDataForUpdate = sucursalesWithData.map(({ profit_margin, ...rest }) => ({
                    ...rest,
                    product_id: id,
                }));
                try {
                    await updateProduct(id, cleanUpdateData, cleanStockDataForUpdate);
                    showToast('Producto actualizado con éxito', 'success');
                } catch (err) {
                    showToast('Error al actualizar producto o inventario', 'error');
                    return;
                }
            } else {
                // Crear producto con inventario en una sola operación
                const { id, created_at, ...insertData } = productData;
                // Filtrar campos que no están en la BD
                const { barcode, brand, subcategory, long_description, supplier, ...cleanProductData } = insertData as any;
                const newProductData = { 
                    ...cleanProductData, 
                    user_id: user.id, 
                    sku: insertData.sku || `SKU-${Date.now().toString().slice(-6)}` 
                };
                
                // Filtrar solo sucursales con datos válidos para inserción
                const cleanStockDataForInsert = sucursalesWithData.map(({ profit_margin, ...rest }) => rest);
                
                try {
                    if (cleanStockDataForInsert.length > 0) {
                        await addProduct(newProductData, cleanStockDataForInsert);
                        showToast('Producto e inventario creados con éxito', 'success');
                    } else {
                        // Crear solo el producto sin inventario
                        await addProduct(newProductData, []);
                        showToast('Producto creado con éxito. Puedes agregar inventario después.', 'success');
                    }
                } catch (err) {
                    showToast('Error al crear producto o inventario', 'error');
                    return;
                }
            }
            closeModal();
        } catch (error) {
            console.error("Failed to save product:", error);
            showToast(`Error inesperado: ${(error as Error).message}`, 'error');
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await deleteProduct(id);
                showToast('Producto eliminado', 'success');
            } catch (error) {
                console.error("Failed to delete product:", error);
                showToast(`Error al eliminar el producto: ${(error as Error).message}`, 'error');
            }
        }
    };

    const openModal = () => {
        setEditingProduct(undefined);
        setIsModalOpen(true);
    };
    
    const closeModal = () => setIsModalOpen(false);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);
    
    const columns: Column<Product>[] = [
        {
            header: 'Imagen',
            accessor: 'image_url',
            render: (value: string | null, item: Product) => <img src={value || 'https://via.placeholder.com/40'} alt={item.name} className="w-10 h-10 rounded-md object-cover"/>
        },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Nombre', accessor: 'name' },
        {
            header: 'Precio Venta',
            accessor: 'id',
            render: (productId: string) => {
                const prices = branchStocks.filter(bs => bs.product_id === productId).map(bs => bs.sale_price);
                if(prices.length === 0) return '$0.00';
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
            }
        },
        {
            header: 'Stock Total',
            accessor: 'id',
            render: (productId: string) => {
                 const totalStock = getConsolidatedStock(productId);
                 const totalMinStock = branchStocks.filter(bs => bs.product_id === productId).reduce((acc, bs) => acc + bs.min_stock, 0);
                 return <span className={totalStock <= totalMinStock ? 'text-red-400 font-bold' : ''}>{totalStock}</span>
            }
        },
        {
            header: 'Estado',
            accessor: 'is_active',
            render: (value: boolean) => (
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${value ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>
                    {value ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
    ];

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
            <CubeIcon className="h-10 w-10 text-indigo-400" />
            <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">
                Productos / Inventario
            </h1>
            <p className="text-slate-400 mt-1">Controla tu stock, productos y precios por sucursal.</p>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-slate-700 transition-colors shadow-lg">
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Importar</span>
            </button>
            <button onClick={openModal} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                <span>Nuevo Producto</span>
            </button>
        </div>
      </div>
      
      <DataTable
          columns={columns}
          data={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchPlaceholder="Buscar por nombre o SKU..."
      />

      {isModalOpen && (
          <Modal onClose={closeModal}>
              <ProductForm 
                product={editingProduct} 
                onSave={handleSave} 
                onCancel={closeModal} 
                sucursales={sucursales}
                branchStocks={branchStocks}
                onSync={syncProductToEcommerce}
                showToast={showToast}
              />
          </Modal>
      )}

      {isImportModalOpen && (
        <BulkImportModal
            onClose={() => setIsImportModalOpen(false)}
            onImport={upsertProducts}
            showToast={showToast}
            userId={user.id}
        />
      )}
    </div>
  );
};

export default Inventario;
