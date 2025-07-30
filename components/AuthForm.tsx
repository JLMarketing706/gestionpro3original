import React, { useState } from 'react';
import { MailIcon, LockIcon, GoogleIcon, SparklesIcon, UserIcon, CheckCircleIcon } from './icons';
import { supabase } from '../services/supabase';

// This component no longer needs the onLoginSuccess prop, as App.tsx listens for auth changes directly from Supabase.
const EmailConfirmationModal: React.FC<{ name: string, onClose: () => void }> = ({ name, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 text-center border border-slate-700">
      <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-slate-100 mb-2">¡Revisa tu correo!</h2>
      <p className="text-slate-300 mb-6">
        Hola <span className="font-bold text-indigo-400">{name}</span>. Te hemos enviado un correo de confirmación. Por favor, haz clic en el enlace para activar tu cuenta y poder iniciar sesión.
      </p>
      <button
        onClick={onClose}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        Entendido
      </button>
    </div>
  </div>
);


const AuthForm: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    setIsLoading(false);
    if (error) {
      if (error.message === 'Password should be at least 6 characters.') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (error.message === 'Error sending confirmation email') {
        setError('Error al enviar el correo. Es posible que se haya alcanzado el límite de envíos. Por favor, intenta de nuevo más tarde.');
      } else {
        setError(error.message);
      }
    } else if (data.user) {
      if (data.user.identities && data.user.identities.length === 0) {
        setError("Este correo ya está registrado pero no confirmado. Revisa tu bandeja de entrada o intenta con otro correo.");
      } else {
        setShowConfirmation(true);
      }
    } else {
      // Fallback for unexpected API response where there's no user and no error.
      setError("No se pudo crear la cuenta. Por favor, verifica tus datos e inténtalo de nuevo.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Changed to signInWithPassword for supabase-js v2
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    setIsLoading(false);
    if (error) {
        if (error.message === 'Invalid login credentials') {
            setError('Correo electrónico o contraseña incorrectos.');
        } else if (error.message === 'Email not confirmed') {
            setError('Tu correo no ha sido confirmado. Por favor, revisa tu bandeja de entrada.');
        } else {
            setError(error.message);
        }
    }
    // onLoginSuccess is handled by the onAuthStateChange listener in App.tsx
  };

  const handleSwitchView = () => {
    setIsLoginView(!isLoginView);
    clearForm();
  }
  
  const closeConfirmationModal = () => {
    setShowConfirmation(false);
    setIsLoginView(true);
    clearForm();
  }

  return (
    <>
      {showConfirmation && <EmailConfirmationModal name={name} onClose={closeConfirmationModal} />}
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/30">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <SparklesIcon className="w-10 h-10 text-indigo-400" />
            <h1 className="text-4xl font-bold text-slate-100">Gestión Pro</h1>
          </div>
          <p className="text-slate-400 h-5">
            {isLoginView ? 'Bienvenido de nuevo. Inicia sesión.' : 'Crea tu cuenta para empezar.'}
          </p>
        </div>
        
        <form className="space-y-4" onSubmit={isLoginView ? handleLogin : handleRegister}>
          {!isLoginView && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                className="w-full pl-10 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-500"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="h-5 w-5 text-slate-500" />
            </div>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              className="w-full pl-10 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-500"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="h-5 w-5 text-slate-500" />
            </div>
            <input
              id="password" name="password" type="password"
              autoComplete={isLoginView ? "current-password" : "new-password"}
              required
              className="w-full pl-10 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-500"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLoginView && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="confirm-password" name="confirm-password" type="password"
                autoComplete="new-password" required
                className="w-full pl-10 p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-500"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          {isLoginView && (
            <div className="flex items-center justify-end text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Procesando...' : (isLoginView ? 'Ingresar' : 'Crear cuenta')}
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-500">O continúa con</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="w-full inline-flex justify-center items-center gap-3 py-3 px-4 border border-slate-700 rounded-lg shadow-sm bg-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors"
          >
            <GoogleIcon className="h-5 w-5"/>
            <span>{isLoginView ? 'Iniciar sesión con Google' : 'Registrarse con Google'}</span>
          </button>
        </div>

        <div className="text-sm text-center">
            <button onClick={handleSwitchView} className="font-medium text-indigo-400 hover:text-indigo-300 bg-transparent border-none cursor-pointer p-1">
              {isLoginView ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
            </button>
          </div>
      </div>
    </>
  );
};

export default AuthForm;