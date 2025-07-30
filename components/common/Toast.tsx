import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircleIcon, XMarkIcon } from '../icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastIcons = {
  success: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
  error: <XMarkIcon className="h-6 w-6 text-red-400" />,
  info: <CheckCircleIcon className="h-6 w-6 text-blue-400" />,
};

const toastColors = {
  success: 'border-green-500',
  error: 'border-red-500',
  info: 'border-blue-500',
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`flex items-center gap-4 w-full max-w-sm p-4 bg-slate-800 text-slate-100 rounded-lg shadow-lg border-l-4 ${toastColors[type]} animate-toast-in`}>
      {toastIcons[type]}
      <p className="flex-grow">{message}</p>
      <button onClick={onClose} className="text-slate-500 hover:text-white">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => <div id="toast-container" className="fixed top-5 right-5 z-[9999] space-y-2"></div>;

export const showToast = (message: string, type: ToastType = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = `toast-${Date.now()}`;
  const toastWrapper = document.createElement('div');
  toastWrapper.id = toastId;
  container.appendChild(toastWrapper);
  
  const root = createRoot(toastWrapper);

  const handleClose = () => {
    root.unmount();
    if (toastWrapper.parentNode) {
      toastWrapper.parentNode.removeChild(toastWrapper);
    }
  };
  
  root.render(<Toast message={message} type={type} onClose={handleClose} />);
};

export default ToastContainer;
