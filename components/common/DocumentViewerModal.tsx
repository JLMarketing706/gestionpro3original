import React, { useMemo } from 'react';
import Modal from './Modal';
import { SaleDocument, Customer, SaleItem } from '../../types';
import { PrinterIcon, ArrowDownTrayIcon, EnvelopeIcon } from '../icons';

// Ensure jsPDF types are available from the global scope
declare global {
    interface Window {
        jspdf: any;
        jsPDF: any; // The shim in index.html should create this
    }
}

const DocumentViewerModal: React.FC<{ doc: SaleDocument; onClose: () => void }> = ({ doc, onClose }) => {
    
    const generatePdf = (action: 'save' | 'print' | 'dataurl') => {
        if (typeof window.jsPDF === 'undefined') {
            console.error("jsPDF library is not loaded.");
            if (action === 'dataurl') return { output: () => '' }; // Return dummy object for src
            return null;
        }

        const pdf = new window.jsPDF('p', 'mm', 'a4');
        const customer = doc.customer as Customer;

        // Header
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(48, 79, 254); // Indigo
        pdf.text('Gestión Pro', 15, 20);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139); // Slate-500
        pdf.text('Tu Socio Digital', 15, 27);

        // Document Info
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42); // Slate-800
        pdf.text(doc.type.toUpperCase(), 195, 20, { align: 'right' });
        
        pdf.setFontSize(10);
        pdf.text(`N°: ${doc.id.slice(-8)}`, 195, 27, { align: 'right' });
        pdf.text(`Fecha: ${new Date(doc.created_at).toLocaleDateString()}`, 195, 32, { align: 'right' });

        // Customer Info
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(226, 232, 240); // Slate-200
        pdf.line(15, 40, 195, 40);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cliente:', 15, 48);
        pdf.setFont('helvetica', 'normal');
        pdf.text(customer.name, 35, 48);
        if ('email' in customer && customer.email) {
            pdf.text(customer.email, 35, 53);
        }
        if ('cuit' in customer && customer.cuit) {
             pdf.text(`CUIT: ${customer.cuit}`, 35, 58);
        }

        // Table
        if (typeof pdf.autoTable === 'function') {
            const items = doc.items as unknown as SaleItem[];
            pdf.autoTable({
                startY: 70,
                head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
                body: items.map(item => [
                    item.product_name,
                    item.quantity,
                    `$${item.unit_price.toFixed(2)}`,
                    `$${item.subtotal.toFixed(2)}`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [48, 79, 254], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 2.5 },
            });
        } else {
            console.error("jspdf-autotable plugin not loaded correctly.");
            pdf.setTextColor(239, 68, 68); // Red color
            pdf.text("Error: No se pudo generar la tabla de productos.", 15, 80);
            pdf.setTextColor(15, 23, 42); // Reset color
        }


        // Totals
        const finalY = (pdf as any).lastAutoTable?.finalY || 80;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        
        const totalsX = 150;
        const totalsY = finalY + 10;
        
        pdf.text('Subtotal:', totalsX, totalsY, { align: 'right' });
        pdf.text(`$${doc.subtotal.toFixed(2)}`, 195, totalsY, { align: 'right' });
        
        pdf.text('IVA (21%):', totalsX, totalsY + 7, { align: 'right' });
        pdf.text(`$${doc.tax.toFixed(2)}`, 195, totalsY + 7, { align: 'right' });

        pdf.setLineWidth(0.5);
        pdf.line(140, totalsY + 10, 195, totalsY + 10);
        
        pdf.setFontSize(16);
        pdf.text('Total:', totalsX, totalsY + 16, { align: 'right' });
        pdf.text(`$${doc.total.toFixed(2)}`, 195, totalsY + 16, { align: 'right' });

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Comprobante no válido como factura fiscal.`, 105, 285, { align: 'center' });


        if (action === 'save') {
            pdf.save(`${doc.type}_${doc.id.slice(-6)}.pdf`);
        } else if (action === 'print') {
            pdf.autoPrint();
            pdf.output('dataurlnewwindow');
        }
        return pdf;
    };

    const pdfDataUri = useMemo(() => {
        try {
            const pdf = generatePdf('dataurl');
            if (pdf && typeof pdf.output === 'function') {
                return pdf.output('datauristring');
            }
            return '';
        } catch (error) {
            console.error("Error generating PDF preview:", error);
            return '';
        }
    }, [doc]);


    const handlePrint = () => generatePdf('print');
    const handleDownload = () => generatePdf('save');
    const handleEmail = () => {
        const customer = doc.customer as Customer;
        if ('email' in customer && customer.email) {
            const subject = encodeURIComponent(`Tu ${doc.type} de Gestión Pro`);
            const body = encodeURIComponent(`Hola ${customer.name},\n\nAdjuntamos tu ${doc.type.toLowerCase()}.\n\nGracias,\nEl equipo de Gestión Pro`);
            window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
        } else {
            alert('Este cliente no tiene un correo electrónico registrado.');
        }
    };

    const baseButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-indigo-600 rounded-lg transition-colors font-semibold disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed";

    return (
        <Modal onClose={onClose}>
            <div className="flex flex-col h-[85vh]">
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{doc.type}</h2>
                        <p className="text-slate-400">ID: {doc.id}</p>
                    </div>
                </div>
                
                {/* PDF Preview */}
                <div className="flex-grow my-4 bg-slate-900/50 rounded-lg overflow-hidden">
                    {pdfDataUri ? (
                        <iframe 
                            src={pdfDataUri}
                            className="w-full h-full border-0"
                            title="Document Preview"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-center p-4">
                            <p className="text-red-400">No se pudo generar la vista previa del PDF.<br/>Verifica tu conexión a internet.</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-700">
                    <button onClick={handlePrint} className={baseButtonClasses}>
                        <PrinterIcon className="h-5 w-5"/>
                        <span>Imprimir</span>
                    </button>
                    <button onClick={handleDownload} className={baseButtonClasses}>
                        <ArrowDownTrayIcon className="h-5 w-5"/>
                        <span>Descargar PDF</span>
                    </button>
                    <button onClick={handleEmail} className={baseButtonClasses}
                     disabled={!(doc.customer as Customer).email}
                    >
                        <EnvelopeIcon className="h-5 w-5"/>
                        <span>Enviar por E-mail</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DocumentViewerModal;