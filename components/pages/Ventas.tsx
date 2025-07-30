
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ShoppingCartIcon, PlusIcon, TrashIcon, UserIcon } from '../icons';
import { Customer, Product, SaleItem, PaymentMethod, Currency, DocumentType, SaleDocument, SystemUser, BranchStock, Sucursal } from '../../types';
import { fetchExchangeRate } from '../../services/apiService';
import DocumentViewerModal from '../common/DocumentViewerModal';
import { Json } from '../../services/database.types';

const Ventas: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { user, users, customers, products, sucursales, branchStocks, config, addSaleDocument, showToast } = context;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [responsable, setResponsable] = useState<SystemUser>(user);
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(sucursales?.[0] || null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(config.base_currency);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [documentToShow, setDocumentToShow] = useState<SaleDocument | null>(null);

  const IVA_RATE = 0.21;

  useEffect(() => {
    const getRate = async () => {
      try {
        const rate = await fetchExchangeRate();
        setExchangeRate(rate);
      } catch (error) {
        console.error("Failed to fetch exchange rate", error);
        showToast('Error al obtener tipo de cambio.', 'error');
      }
    };
    getRate();
  }, [showToast]);

  useEffect(() => {
    setResponsable(user);
    if (!selectedSucursal && sucursales.length > 0) {
        setSelectedSucursal(sucursales[0]);
    }
  }, [user, sucursales, selectedSucursal]);
  
  const getConsolidatedStock = (productId: string) => {
    return branchStocks
      .filter(bs => bs.product_id === productId)
      .reduce((acc, curr) => acc + curr.stock, 0);
  };
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => 
        p.is_active && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ).slice(0, 5);
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (!selectedSucursal) {
        showToast('Por favor, selecciona una sucursal para la venta.', 'error');
        return;
    }

    const stockInfo = branchStocks.find(bs => bs.product_id === product.id && bs.sucursal_id === selectedSucursal.id);
    const salePrice = stockInfo?.sale_price || 0;

    if (salePrice <= 0) {
        showToast('Este producto no tiene un precio de venta asignado en esta sucursal.', 'error');
        return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price } 
          : item
        );
      }
      return [...prevCart, { 
        product_id: product.id, 
        product_name: product.name,
        quantity: 1, 
        unit_price: salePrice,
        subtotal: salePrice
      }];
    });
    setSearchTerm('');
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    setCart(cart.map(item => 
      item.product_id === productId 
      ? { ...item, quantity, subtotal: quantity * item.unit_price } 
      : item
    ).filter(item => item.quantity > 0));
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };
  
  const saleSummary = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const tax = subtotal * IVA_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart]);
  
  const getConvertedTotal = () => {
    if (!exchangeRate) return null;
    if (config.base_currency === paymentCurrency) return saleSummary.total;
    if (config.base_currency === 'ARS' && paymentCurrency === 'USD') return saleSummary.total / exchangeRate;
    if (config.base_currency === 'USD' && paymentCurrency === 'ARS') return saleSummary.total * exchangeRate;
    return saleSummary.total;
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCustomer(null);
    setResponsable(user);
    setSearchTerm('');
    setPaymentCurrency(config.base_currency);
    setPaymentMethod('Efectivo');
  }

  const handleFinalizeSale = async (type: DocumentType) => {
    if (cart.length === 0) {
        showToast('El carrito está vacío.', 'error');
        return;
    }
    if (!responsable) {
        showToast('Debes seleccionar un responsable para la venta.', 'error');
        return;
    }
    if (!selectedSucursal) {
        showToast('Debes seleccionar una sucursal para la venta.', 'error');
        return;
    }

    try {
        const newDoc = await addSaleDocument({
          type,
          customer: selectedCustomer || { id: 'cf', name: 'Consumidor Final' },
          items: cart as unknown as Json,
          subtotal: saleSummary.subtotal,
          tax: saleSummary.tax,
          total: saleSummary.total,
          payment_method: paymentMethod,
          payment_currency: paymentCurrency,
          exchange_rate: paymentCurrency !== config.base_currency ? exchangeRate : null,
          responsable_id: responsable.id,
          sucursal_id: selectedSucursal.id,
        });
        if (newDoc) {
            showToast(`${type} generada exitosamente.`, 'success');
            setDocumentToShow(newDoc);
        }
    } catch(error) {
        console.error("Failed to finalize sale:", error);
        showToast(`Error al finalizar la venta: ${(error as Error).message}`, 'error');
    }
  };

  const handleCloseViewer = () => {
    setDocumentToShow(null);
    resetForm();
  }

  return (
    <>
    {documentToShow && (
        <DocumentViewerModal
            doc={documentToShow}
            onClose={handleCloseViewer}
        />
    )}
    <div className="w-full animate-fade-in">
        <div className="mb-8 flex items-center gap-4">
            <ShoppingCartIcon className="h-10 w-10 text-indigo-400" />
            <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">Ventas</h1>
            <p className="text-slate-400 mt-1">Carga operaciones y gestiona transacciones.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-slate-200">1. Cliente</h3>
                            <div className="flex items-center gap-4">
                                <select 
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={selectedCustomer?.id || ''}
                                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                                >
                                    <option value="">Consumidor Final</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button className="bg-indigo-600 p-3 rounded-lg hover:bg-indigo-700 transition-colors"><PlusIcon className="h-6 w-6" /></button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-slate-200">Sucursal de Venta</h3>
                             <div className="relative">
                                <select 
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                                    value={selectedSucursal?.id || ''}
                                    onChange={(e) => setSelectedSucursal(sucursales.find(s => s.id === e.target.value) || null)}
                                >
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-200">2. Productos</h3>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {filteredProducts.length > 0 && (
                            <ul className="absolute z-10 w-full bg-slate-700 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                                {filteredProducts.map(p => (
                                    <li 
                                        key={p.id}
                                        className="p-3 hover:bg-indigo-600 cursor-pointer flex items-center gap-4"
                                        onClick={() => addToCart(p)}
                                    >
                                        <img src={p.image_url || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 rounded-md object-cover"/>
                                        <div>
                                            <p className="font-bold">{p.name}</p>
                                            <p className="text-sm text-slate-400">SKU: {p.sku} - Stock Global: {getConsolidatedStock(p.id)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-200">3. Carrito de Compras</h3>
                    <div className="space-y-4">
                        {cart.length === 0 ? (
                            <p className="text-slate-400 text-center py-4">El carrito está vacío.</p>
                        ) : (
                            cart.map(item => (
                                <div key={item.product_id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                                    <div className="flex-grow">
                                        <p className="font-bold">{item.product_name}</p>
                                        <p className="text-sm text-slate-300">
                                            {item.quantity} x ${item.unit_price.toFixed(2)} {config.base_currency}
                                        </p>
                                    </div>
                                    <input 
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                                        className="w-20 bg-slate-800 border-2 border-slate-700 rounded-lg p-2 text-center"
                                        min="1"
                                    />
                                    <p className="font-bold w-24 text-right">${item.subtotal.toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-300">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 sticky top-8">
                    <h3 className="font-bold text-lg mb-4 text-slate-200">4. Resumen y Pago</h3>
                    
                    <div className="space-y-3 text-slate-300">
                        <div className="flex justify-between"><p>Subtotal:</p> <p className="font-mono">${saleSummary.subtotal.toFixed(2)}</p></div>
                        <div className="flex justify-between"><p>IVA (21%):</p> <p className="font-mono">${saleSummary.tax.toFixed(2)}</p></div>
                        <hr className="border-slate-700" />
                        <div className="flex justify-between text-2xl font-bold text-white">
                            <p>Total ({config.base_currency}):</p> 
                            <p className="font-mono">${saleSummary.total.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Moneda de Pago</label>
                             <select
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={paymentCurrency}
                                onChange={(e) => setPaymentCurrency(e.target.value as Currency)}
                            >
                                <option value="ARS">Pesos (ARS)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>
                        {paymentCurrency !== config.base_currency && exchangeRate && (
                            <div className="bg-indigo-900/50 p-3 rounded-lg text-center">
                                <p className="text-xl font-bold text-indigo-300">
                                    Total: ${getConvertedTotal()?.toFixed(2)} {paymentCurrency}
                                </p>
                                <p className="text-xs text-indigo-400">Tipo de cambio aplicado: 1 USD = {exchangeRate.toFixed(2)} ARS</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Forma de Pago</label>
                            <select
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            >
                                <option>Efectivo</option>
                                <option>Tarjeta de débito</option>
                                <option>Tarjeta de crédito</option>
                                <option>Transferencia bancaria</option>
                                <option>Cuenta corriente</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button onClick={() => handleFinalizeSale('Factura')} className="w-full text-lg font-bold bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors">Facturar</button>
                        <button onClick={() => handleFinalizeSale('Presupuesto')} className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">Presupuesto</button>
                        <button onClick={() => handleFinalizeSale('Reserva')} className="w-full font-bold bg-yellow-600 hover:bg-yellow-700 text-slate-900 py-2 rounded-lg transition-colors">Reserva</button>
                        <button onClick={() => {resetForm(); showToast('Venta cancelada.', 'info')}} className="w-full font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg transition-colors">Cancelar</button>
                    </div>
                 </div>
            </div>
        </div>
    </div>
    </>
  );
};

export default Ventas;
