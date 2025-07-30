import React, { ReactNode } from 'react';
import { XMarkIcon } from '../icons';

interface ModalProps {
    onClose: () => void;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700 relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
