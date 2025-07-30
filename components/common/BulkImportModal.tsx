
import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, XMarkIcon } from '../icons';
import { ProductUpdate } from '../../types';
import { ToastType } from './Toast';

declare global {
    interface Window {
        XLSX: any;
    }
}

type Step = 'upload' | 'validate' | 'importing' | 'result';
type ConflictResolution = 'skip' | 'overwrite';

type ProductImportRow = {
    product: ProductUpdate;
    stock: {
        cost_price: number | null;
        sale_price: number;
        stock: number;
        min_stock: number;
    }
}

type Props = {
    onClose: () => void;
    onImport: (products: ProductImportRow[], conflictResolution: ConflictResolution) => Promise<{ successCount: number; errorCount: number; errors: string[] }>;
    showToast: (message: string, type: ToastType) => void;
    userId: string;
}

type InvalidRow = {
    rowIndex: number;
    data: any;
    error: string;
}

const TEMPLATE_HEADERS = [
    'sku', 'nombre', 'descripcion', 'precio_costo', 'precio', 'stock', 'stock_minimo', 'categoria', 'estado', 'imagen_url',
    // E-commerce fields (for future use)
    'barcode', 'descripcion_larga', 'precio_promocional', 'subcategoria', 'marca', 'visibilidad', 'galeria_url', 'atributos', 'variante_padre'
];
const REQUIRED_FIELDS = ['sku', 'nombre', 'precio', 'stock', 'categoria'];

const BulkImportModal: React.FC<Props> = ({ onClose, onImport, showToast, userId }) => {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [validRows, setValidRows] = useState<ProductImportRow[]>([]);
    const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
    const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('skip');
    const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setValidRows([]);
        setInvalidRows([]);
        setImportResult(null);
    }

    const downloadTemplate = () => {
        const csvContent = TEMPLATE_HEADERS.join(',') + '\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "plantilla_productos.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const parseAndValidateFile = (fileToProcess: File) => {
        if (!fileToProcess) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = window.XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = window.XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    showToast("El archivo está vacío o no tiene el formato correcto.", 'error');
                    return;
                }

                const newValidRows: ProductImportRow[] = [];
                const newInvalidRows: InvalidRow[] = [];

                json.forEach((row, index) => {
                    // Validation logic
                    const missingFields = REQUIRED_FIELDS.filter(field => !row[field]);
                    if (missingFields.length > 0) {
                        newInvalidRows.push({ rowIndex: index + 2, data: row, error: `Faltan campos obligatorios: ${missingFields.join(', ')}` });
                        return;
                    }

                    const price = parseFloat(row.precio);
                    const stock = parseInt(row.stock, 10);

                    if (isNaN(price) || isNaN(stock)) {
                        newInvalidRows.push({ rowIndex: index + 2, data: row, error: 'Los campos "precio" y "stock" deben ser números.' });
                        return;
                    }
                    
                    newValidRows.push({
                        product: {
                            user_id: userId,
                            sku: String(row.sku),
                            name: String(row.nombre),
                            description: row.descripcion ? String(row.descripcion) : null,
                            category: String(row.categoria),
                            is_active: row.estado ? String(row.estado).toLowerCase() === 'publicado' : true,
                            image_url: row.imagen_url ? String(row.imagen_url) : null,
                            unit: 'unidad', // Default unit
                        },
                        stock: {
                            cost_price: row.precio_costo ? parseFloat(String(row.precio_costo)) : null,
                            sale_price: price,
                            stock: stock,
                            min_stock: row.stock_minimo ? parseInt(String(row.stock_minimo), 10) : 0,
                        }
                    });
                });
                setValidRows(newValidRows);
                setInvalidRows(newInvalidRows);
                setStep('validate');
            } catch (err) {
                console.error(err);
                showToast("Error al procesar el archivo. Asegúrate que el formato sea correcto.", "error");
                resetState();
            }
        };
        reader.readAsBinaryString(fileToProcess);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseAndValidateFile(selectedFile);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
            parseAndValidateFile(droppedFile);
        } else {
            showToast("Formato de archivo no válido. Sube un .csv o .xlsx", 'error');
        }
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };
    
    const handleImport = async () => {
        if (validRows.length === 0) {
            showToast("No hay productos válidos para importar.", "error");
            return;
        }
        setStep('importing');
        const result = await onImport(validRows, conflictResolution);
        setImportResult(result);
        setStep('result');
    };

    const renderContent = () => {
        switch(step) {
            case 'upload':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Importación Masiva de Productos</h2>
                        <p className="text-slate-400 mb-6">Sube un archivo CSV o Excel para agregar múltiples productos a tu inventario de una sola vez.</p>
                        <div 
                            onDrop={handleDrop}
                            onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents}
                            className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-slate-700/50' : 'border-slate-600 hover:border-indigo-600'}`}>
                            <input type="file" id="file-upload" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                                <p className="font-bold text-slate-300">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                                <p className="text-sm text-slate-500 mt-1">Soportado: .xlsx, .csv</p>
                            </label>
                        </div>
                        <div className="mt-6 text-center">
                            <button onClick={downloadTemplate} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                                ¿No tienes una plantilla? Descarga el modelo aquí.
                            </button>
                        </div>
                    </div>
                );
            case 'validate':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-4">Validación de Datos</h2>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 bg-green-900/50 p-4 rounded-lg text-center">
                                <p className="text-3xl font-bold text-green-300">{validRows.length}</p>
                                <p className="text-sm text-green-400">Productos listos para importar</p>
                            </div>
                            <div className="flex-1 bg-red-900/50 p-4 rounded-lg text-center">
                                <p className="text-3xl font-bold text-red-300">{invalidRows.length}</p>
                                <p className="text-sm text-red-400">Productos con errores</p>
                            </div>
                        </div>

                        {invalidRows.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-lg text-red-400 mb-2">Detalle de Errores</h3>
                                <div className="max-h-40 overflow-y-auto bg-slate-900/50 rounded-lg p-2">
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {invalidRows.map(({ rowIndex, error }) => (
                                            <tr key={rowIndex} className="border-b border-slate-700">
                                                <td className="p-2 font-mono text-slate-500">Fila {rowIndex}</td>
                                                <td className="p-2 text-slate-300">{error}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {validRows.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-lg text-slate-300 mb-2">Manejo de Duplicados (por SKU)</h3>
                                <div className="flex gap-4">
                                    <button onClick={() => setConflictResolution('skip')} className={`flex-1 p-3 rounded-lg border-2 ${conflictResolution === 'skip' ? 'border-indigo-500 bg-indigo-900/50' : 'border-slate-700 bg-slate-800'}`}>Omitir Duplicados</button>
                                    <button onClick={() => setConflictResolution('overwrite')} className={`flex-1 p-3 rounded-lg border-2 ${conflictResolution === 'overwrite' ? 'border-indigo-500 bg-indigo-900/50' : 'border-slate-700 bg-slate-800'}`}>Sobrescribir Duplicados</button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={resetState} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleImport} disabled={validRows.length === 0} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold disabled:bg-slate-500 disabled:cursor-not-allowed">
                                Importar {validRows.length} productos
                            </button>
                        </div>
                    </div>
                );
            case 'importing':
                return (
                     <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-slate-100">Importando Productos...</h2>
                        <p className="text-slate-400 mt-2">Por favor, no cierres esta ventana.</p>
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto mt-6"></div>
                    </div>
                );
            case 'result':
                return (
                    <div className="text-center p-4">
                        {importResult && importResult.errorCount === 0 ? (
                           <>
                            <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-100">Importación Exitosa</h2>
                            <p className="text-slate-300 mt-2">{importResult.successCount} productos han sido importados o actualizados en tu inventario.</p>
                           </>
                        ) : (
                            <>
                            <XMarkIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-100">Error en la Importación</h2>
                            <p className="text-slate-300 mt-2">{importResult?.successCount || 0} productos importados.</p>
                            <p className="text-slate-300">{importResult?.errorCount || 'Algunos'} productos no se pudieron importar.</p>
                            {importResult?.errors && importResult.errors.length > 0 &&
                                <p className="text-xs text-red-400 mt-4 bg-slate-800 p-2 rounded">{importResult.errors[0]}</p>
                            }
                           </>
                        )}
                        <div className="mt-8">
                             <button onClick={onClose} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-bold">Finalizar</button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <Modal onClose={onClose}>
            {renderContent()}
        </Modal>
    )
}

export default BulkImportModal;
