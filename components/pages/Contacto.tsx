import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { LifebuoyIcon, UserIcon, EnvelopeIcon } from '../icons';

const Contacto: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { user, showToast } = context;
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      showToast('Por favor, completa todos los campos.', 'error');
      return;
    }
    setIsLoading(true);

    // Simulating API call
    setTimeout(() => {
      setIsLoading(false);
      showToast('Mensaje enviado con éxito. ¡Gracias por tu feedback!', 'success');
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <LifebuoyIcon className="h-10 w-10 text-indigo-400" />
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100">
            Contacto y Soporte
          </h1>
          <p className="text-slate-400 mt-1">
            ¿Tienes una pregunta, sugerencia o problema? Envíanos un mensaje.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-6"
          >
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Asunto
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Problema con facturación, sugerencia para inventario..."
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Mensaje
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe tu consulta con el mayor detalle posible."
                required
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-1">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 sticky top-8">
            <h3 className="font-bold text-lg mb-4 text-slate-200">
              Tu Información
            </h3>
            <p className="text-slate-400 mb-4 text-sm">
              Tu mensaje se enviará con los siguientes datos para que podamos identificarte y responderte.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-slate-500" />
                <span className="text-slate-300">{user.full_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                <span className="text-slate-300">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacto;