

import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Layout from './components/Layout';
import { AppContextProvider } from './contexts/AppContext';
import { supabase } from './services/supabase';
import { UserProfile, Role } from './types';
import { showToast } from './components/common/Toast';
import { OnboardingProvider } from './components/common/Onboarding';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // onAuthStateChange is the single source of truth for auth state.
    // It fires once on initial load with the current session (or null),
    // and then again whenever the auth state changes (login, logout).
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session) {
          // Step 1: Fetch profile without the implicit join that was causing errors.
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`*`)
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Error fetching profile on auth state change:", profileError);
            throw profileError; // Let the catch block handle it
          }
            
          let roleData: Role | null = null;
          // Step 2: If the profile has a role_id, fetch the role details separately.
          if (profile && profile.role_id) {
              const { data: fetchedRole, error: roleError } = await supabase
                  .from('roles')
                  .select('*')
                  .eq('id', profile.role_id)
                  .single();
              
              if (roleError) {
                  // Log the error but don't block login. The user can proceed without role permissions.
                  console.error("Could not fetch role details:", roleError);
                  showToast('No se pudieron cargar los permisos del rol.', 'error');
              } else {
                  roleData = fetchedRole;
              }
          }
          
          // Step 3: Construct the final user profile object.
          const userProfile: UserProfile = { 
            id: session.user.id, 
            email: session.user.email!, 
            full_name: profile?.full_name || session.user.email!,
            avatar_url: profile?.avatar_url || null,
            config: (profile?.config as any) || { base_currency: 'ARS', active_plan: 'Comercios' },
            role: roleData,
            role_id: profile?.role_id || null,
            sucursal_id: profile?.sucursal_id || null
          };
          setUser(userProfile);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Failed to process auth state change:", error);
        showToast("Ocurrió un error al cargar tu perfil.", 'error');
        // Ensure state is cleared on error
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        // This is crucial: always stop loading, regardless of success or failure.
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // Calling signOut will trigger the onAuthStateChange listener,
    // which will handle clearing the user state and showing the login form.
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error);
      showToast("Ocurrió un error al intentar cerrar la sesión.", 'error');
    }
  };
  
  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-100">
          <p>Iniciando aplicación...</p>
       </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
       {isLoggedIn && user ? (
         <AppContextProvider user={user} setUser={setUser}>
            <OnboardingProvider>
              <Layout onLogout={handleLogout} />
            </OnboardingProvider>
         </AppContextProvider>
        ) : (
          <div className="flex items-center justify-center p-4 min-h-screen bg-black/30">
            <AuthForm />
          </div>
        )}
    </div>
  );
};

export default App;