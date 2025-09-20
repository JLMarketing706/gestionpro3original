
import React, { useState, useContext, useMemo, useRef, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { CubeIcon, PlusIcon, CameraIcon, ArrowUpTrayIcon, ArrowPathIcon } from '../icons';
import { Product, Sucursal, BranchStock, Brand, Category, Subcategory, Supplier } from '../../types';
import Modal from '../common/Modal';
import DataTable, { Column } from '../common/DataTable';
import BulkImportModal from '../common/BulkImportModal';
import { supabase } from '../../services/supabase';

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
    brands: Brand[];
    categories: Category[];
    subcategories: Subcategory[];
    suppliers: Supplier[];
    user: { id: string; [key: string]: any };
    onSave: (product: Product, stockData: StockData[], imageFile?: File | null) => Promise<void>; 
    onCancel: () => void;
    onSync: (product: Product) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

const ProductForm: React.FC<ProductFormProps> = ({ product, sucursales, branchStocks, brands, categories, subcategories, suppliers, user, onSave, onCancel, onSync, showToast }) => {
    // Función auxiliar para obtener nombre por ID
    const getBrandNameById = (id: string | null) => id ? brands.find(b => b.id === id)?.name || '' : '';
    const getSubcategoryNameById = (id: string | null) => id ? subcategories.find(s => s.id === id)?.name || '' : '';
    const getSupplierNameById = (id: string | null) => id ? suppliers.find(s => s.id === id)?.name || '' : '';

    const [formData, setFormData] = useState({
        sku: product?.sku || '',
        name: product?.name || '',
        unit: product?.unit || 'unidad',
        image_url: product?.image_url || '',
        is_active: product?.is_active ?? true,
        description: product?.description || '',
        category: product?.category || '',
        subcategory: getSubcategoryNameById((product as any)?.subcategory_id || null),
        long_description: (product as any)?.long_description || '',
        supplier: getSupplierNameById((product as any)?.supplier_id || null),
        barcode: (product as any)?.barcode || '',
        brand: getBrandNameById((product as any)?.brand_id || null)
    });

    // Estados para categorías, subcategorías, marcas y proveedores
    const [categoriesList, setCategoriesList] = useState<string[]>(categories.map(c => c.name));
    const [subcategoriesList, setSubcategoriesList] = useState<string[]>(subcategories.map(s => s.name));
    const [brandsList, setBrandsList] = useState<string[]>(brands.map(b => b.name));
    const [suppliersList, setSuppliersList] = useState<string[]>(suppliers.map(s => s.name));
    
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

    const handleAddCategory = useCallback(async () => {
        if (!newCategory.trim() || categoriesList.includes(newCategory.trim())) return;
        
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{ 
                    id: crypto.randomUUID(),
                    name: newCategory.trim(),
                    description: null 
                }])
                .select()
                .single();

            if (error) throw error;

            setCategoriesList(prev => [...prev, newCategory.trim()]);
            setFormData(prev => ({ ...prev, category: newCategory.trim() }));
            setNewCategory('');
            setShowNewCategory(false);
            showToast('Categoría creada correctamente', 'success');
            
        } catch (error) {
            console.error('Error al crear categoría:', error);
            showToast('Error al crear la categoría', 'error');
        }
    }, [newCategory, categoriesList, showToast]);

    const handleAddBrand = useCallback(async () => {
        if (!newBrand.trim() || brandsList.includes(newBrand.trim())) return;
        
        try {
            console.log('Intentando guardar marca:', newBrand.trim());
            const { data, error } = await supabase
                .from('brands')
                .insert([{ 
                    id: crypto.randomUUID(),
                    name: newBrand.trim()
                }])
                .select()
                .single();

            console.log('Respuesta Supabase brands:', data);
            console.log('Error si existe:', error);

            if (error) throw error;

            setBrandsList(prev => [...prev, newBrand.trim()]);
            setFormData(prev => ({ ...prev, brand: newBrand.trim() }));
            setNewBrand('');
            setShowNewBrand(false);
            showToast('Marca creada correctamente', 'success');
            
        } catch (error) {
            console.error('Error al crear marca:', error);
            showToast('Error al crear la marca', 'error');
        }
    }, [newBrand, brandsList, showToast]);

    const handleAddSubcategory = useCallback(async () => {
        if (!newSubcategory.trim() || subcategoriesList.includes(newSubcategory.trim())) return;
        
        try {
            const categoryId = categories.find(c => c.name === formData.category)?.id;
            if (!categoryId) {
                showToast('Selecciona una categoría válida', 'error');
                return;
            }

            const { data, error } = await supabase
                .from('subcategories')
                .insert([{ 
                    id: crypto.randomUUID(),
                    name: newSubcategory.trim(),
                    category_id: categoryId
                }])
                .select()
                .single();

            if (error) throw error;

            setSubcategoriesList(prev => [...prev, newSubcategory.trim()]);
            setFormData(prev => ({ ...prev, subcategory: newSubcategory.trim() }));
            setNewSubcategory('');
            setShowNewSubcategory(false);
            showToast('Subcategoría creada correctamente', 'success');
            
        } catch (error) {
            console.error('Error al crear subcategoría:', error);
            showToast('Error al crear la subcategoría', 'error');
        }
    }, [newSubcategory, subcategoriesList, categories, formData.category, showToast]);

    const handleAddSupplier = useCallback(async () => {
        if (!newSupplier.trim() || suppliersList.includes(newSupplier.trim())) return;
        
        try {
            console.log('Intentando guardar proveedor:', newSupplier.trim());
            const { data, error } = await supabase
                .from('suppliers')
                .insert([{ 
                    id: crypto.randomUUID(),
                    name: newSupplier.trim(),
                    user_id: user.id
                }])
                .select()
                .single();

            console.log('Respuesta Supabase suppliers:', data);
            console.log('Error si existe:', error);

            if (error) throw error;

            setSuppliersList(prev => [...prev, newSupplier.trim()]);
            setFormData(prev => ({ ...prev, supplier: newSupplier.trim() }));
            setNewSupplier('');
            setShowNewSupplier(false);
            showToast('Proveedor creado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            showToast('Error al crear el proveedor', 'error');
        }
    }, [newSupplier, suppliersList, user.id, showToast]);
    
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

    // Funciones memoizadas para evitar re-renderizados de SearchableSelect
    const handleCategoryChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    }, []);

    const handleSubcategoryChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, subcategory: value }));
    }, []);

    const handleBrandChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, brand: value }));
    }, []);

    const handleSupplierChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, supplier: value }));
    }, []);

    const toggleNewCategory = useCallback(() => {
        setShowNewCategory(prev => !prev);
    }, []);

    const toggleNewSubcategory = useCallback(() => {
        setShowNewSubcategory(prev => !prev);
    }, []);

    const toggleNewBrand = useCallback(() => {
        setShowNewBrand(prev => !prev);
    }, []);

    const toggleNewSupplier = useCallback(() => {
        setShowNewSupplier(prev => !prev);
    }, []);

    const cancelNewCategory = useCallback(() => {
        setShowNewCategory(false);
    }, []);

    const cancelNewSubcategory = useCallback(() => {
        setShowNewSubcategory(false);
    }, []);

    const cancelNewBrand = useCallback(() => {
        setShowNewBrand(false);
    }, []);

    const cancelNewSupplier = useCallback(() => {
        setShowNewSupplier(false);
    }, []);

    // Funciones memoizadas para manejar cambios en nuevos valores
    const handleNewCategoryChange = useCallback((value: string) => {
        setNewCategory(value);
    }, []);

    const handleNewSubcategoryChange = useCallback((value: string) => {
        setNewSubcategory(value);
    }, []);

    const handleNewBrandChange = useCallback((value: string) => {
        setNewBrand(value);
    }, []);

    const handleNewSupplierChange = useCallback((value: string) => {
        setNewSupplier(value);
    }, []);

    // Componente para búsqueda con autocompletado - VERSIÓN MEMOIZADA
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
    }> = React.memo(({
        label, value, onChange, options, showNew, onToggleNew,
        newValue, onNewValueChange, onSaveNew, onCancelNew, placeholder, required = false
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState(value);
        const [isFocused, setIsFocused] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);

        // Sincronizar searchTerm con value solo cuando no está enfocado
        React.useEffect(() => {
            if (!isFocused && value !== searchTerm) {
                setSearchTerm(value);
            }
        }, [value]); // Removimos isFocused de las dependencias

        // Cerrar dropdown al hacer clic fuera
        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                    setIsFocused(false);
                    // Solo actualizar el padre si el valor cambió
                    if (searchTerm !== value) {
                        onChange(searchTerm);
                    }
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [searchTerm, value, onChange]);

        const filteredOptions = options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            setSearchTerm(inputValue);
            // NO LLAMAR onChange aquí - esto causa el re-renderizado
            setIsOpen(true);
        };

        const handleOptionClick = (option: string) => {
            setSearchTerm(option);
            onChange(option); // Solo aquí actualizamos el padre
            setIsOpen(false);
            setIsFocused(false);
        };

        const handleFocus = () => {
            setIsFocused(true);
            setIsOpen(true);
        };

        const handleBlur = () => {
            // Delay para permitir que el click en las opciones funcione
            setTimeout(() => {
                if (!dropdownRef.current?.matches(':hover')) {
                    setIsFocused(false);
                    setIsOpen(false);
                    // Actualizar el padre solo al perder el foco
                    if (searchTerm !== value) {
                        onChange(searchTerm);
                    }
                }
            }, 150);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && filteredOptions.length > 0) {
                e.preventDefault();
                handleOptionClick(filteredOptions[0]);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setIsFocused(false);
                inputRef.current?.blur();
            }
        };

        // Función optimizada para campos "nuevo" - evita re-renderizado
        const handleNewValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            onNewValueChange(value);
        };

        return (
            <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-sm font-medium text-slate-300">
                    {label} {required && '*'}
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            required={required}
                            className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {isOpen && filteredOptions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredOptions.map((option, index) => (
                                    <div
                                        key={`${option}-${index}`}
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
                        className="px-3 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold shrink-0"
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
                            onChange={handleNewValueChange}
                            className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded"
                        />
                        <button 
                            type="button" 
                            onClick={onSaveNew} 
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm shrink-0"
                        >
                            Agregar
                        </button>
                        <button 
                            type="button" 
                            onClick={onCancelNew} 
                            className="px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded text-white text-sm shrink-0"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        );
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
            <h2 className="text-2xl font-bold text-slate-100">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3 flex-shrink-0">
                    <label htmlFor="image-upload" className="cursor-pointer block">
                        <div className="w-full aspect-square bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors relative overflow-hidden">
                            {imagePreview ? (
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <div className="text-center text-slate-500 p-4">
                                    <CameraIcon className="h-12 w-12 mx-auto mb-2"/>
                                    <p className="font-semibold text-slate-400">Subir Imagen</p>
                                </div>
                            )}
                        </div>
                    </label>
                    <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange}/>
                </div>
                <div className="w-full sm:w-2/3 space-y-4 min-w-0">{/* min-w-0 prevents flex overflow */}
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
                        onChange={handleCategoryChange}
                        options={categoriesList}
                        showNew={showNewCategory}
                        onToggleNew={toggleNewCategory}
                        newValue={newCategory}
                        onNewValueChange={handleNewCategoryChange}
                        onSaveNew={handleAddCategory}
                        onCancelNew={cancelNewCategory}
                        placeholder="Buscar o escribir categoría"
                        required
                    />

                    {/* Subcategoría con búsqueda */}
                    <SearchableSelect
                        label="Subcategoría"
                        value={formData.subcategory}
                        onChange={handleSubcategoryChange}
                        options={subcategoriesList}
                        showNew={showNewSubcategory}
                        onToggleNew={toggleNewSubcategory}
                        newValue={newSubcategory}
                        onNewValueChange={handleNewSubcategoryChange}
                        onSaveNew={handleAddSubcategory}
                        onCancelNew={cancelNewSubcategory}
                        placeholder="Buscar o escribir subcategoría"
                    />

                    {/* Marca con búsqueda */}
                    <SearchableSelect
                        label="Marca"
                        value={formData.brand}
                        onChange={handleBrandChange}
                        options={brandsList}
                        showNew={showNewBrand}
                        onToggleNew={toggleNewBrand}
                        newValue={newBrand}
                        onNewValueChange={handleNewBrandChange}
                        onSaveNew={handleAddBrand}
                        onCancelNew={cancelNewBrand}
                        placeholder="Buscar o escribir marca"
                    />

                    {/* Proveedor con búsqueda */}
                    <SearchableSelect
                        label="Proveedor"
                        value={formData.supplier}
                        onChange={handleSupplierChange}
                        options={suppliersList}
                        showNew={showNewSupplier}
                        onToggleNew={toggleNewSupplier}
                        newValue={newSupplier}
                        onNewValueChange={handleNewSupplierChange}
                        onSaveNew={handleAddSupplier}
                        onCancelNew={cancelNewSupplier}
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

    const { user, products, addProduct, updateProduct, deleteProduct, upsertProducts, showToast, sucursales, branchStocks, brands, categories, subcategories, suppliers, syncProductToEcommerce } = context;
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
            console.log('💾 HandleSave iniciado - ProductData:', productData);
            console.log('📦 StockData:', stockData);
            
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
                
                // Convertir strings a IDs para campos relacionales
                const processedUpdateData = {
                    ...updateData,
                    brand_id: (updateData as any).brand ? brands.find(b => b.name === (updateData as any).brand)?.id || null : null,
                    subcategory_id: (updateData as any).subcategory ? subcategories.find(s => s.name === (updateData as any).subcategory)?.id || null : null,
                    supplier_id: (updateData as any).supplier ? suppliers.find(s => s.name === (updateData as any).supplier)?.id || null : null,
                    long_description: (updateData as any).long_description || null,
                    barcode: (updateData as any).barcode || null
                };
                
                // Remover campos temporales UI
                const { brand, subcategory, supplier, ...cleanUpdateData } = processedUpdateData as any;
                
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
                
                // Convertir strings a IDs para campos relacionales
                const processedInsertData = {
                    ...insertData,
                    brand_id: (insertData as any).brand ? brands.find(b => b.name === (insertData as any).brand)?.id || null : null,
                    subcategory_id: (insertData as any).subcategory ? subcategories.find(s => s.name === (insertData as any).subcategory)?.id || null : null,
                    supplier_id: (insertData as any).supplier ? suppliers.find(s => s.name === (insertData as any).supplier)?.id || null : null,
                    long_description: (insertData as any).long_description || null,
                    barcode: (insertData as any).barcode || null
                };
                
                // Remover campos temporales UI
                const { brand, subcategory, supplier, ...cleanProductData } = processedInsertData as any;
                
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
                brands={brands}
                categories={categories}
                subcategories={subcategories}
                suppliers={suppliers}
                user={user}
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
