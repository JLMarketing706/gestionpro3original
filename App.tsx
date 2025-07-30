


import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Layout from './components/Layout';
import { AppContextProvider } from './contexts/AppContext';
import { supabase } from './services/supabase';
import { UserProfile, Role } from './types';
import { showToast } from './components/common/Toast';
import { OnboardingProvider } from './components/common/Onboarding';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const fetchUserProfileAndRole = async (session: Session): Promise<UserProfile> => {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`*`)
            .eq('id', session.user.id)
            .maybeSingle();

        if (profileError) {
            console.error("Error fetching profile:", profileError);
            throw profileError;
        }
            
        let roleData: Role | null = null;
        if (profile && profile.role_id) {
            const { data: fetchedRole, error: roleError } = await supabase
                .from('roles')
                .select('*')
                .eq('id', profile.role_id)
                .single();
            
            if (roleError) {
                console.error("Could not fetch role details:", roleError);
                showToast('No se pudieron cargar los permisos del rol.', 'error');
            } else {
                roleData = fetchedRole;
            }
        }
        
        return { 
            id: session.user.id, 
            email: session.user.email!, 
            full_name: profile?.full_name || session.user.email!,
            avatar_url: profile?.avatar_url || null,
            config: (profile?.config as any) || { base_currency: 'ARS', active_plan: 'Comercios' },
            role: roleData,
            role_id: profile?.role_id || null,
            sucursal_id: profile?.sucursal_id || null
        };
    };

    // Explicitly check the session on initial component mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        try {
            if (session) {
                const userProfile = await fetchUserProfileAndRole(session);
                setUser(userProfile);
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Error on initial session fetch:", error);
            showToast("Ocurrió un error al cargar tu sesión.", 'error');
            setUser(null);
            setIsLoggedIn(false);
        } finally {
            setLoading(false);
        }
    });

    // Listen for future auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
            if (session) {
                const userProfile = await fetchUserProfileAndRole(session);
                setUser(userProfile);
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Error on auth state change:", error);
            // Don't set loading here as this is for subsequent changes
        }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error);
      showToast("Ocurrió un error al intentar cerrar la sesión.", 'error');
    }
    // The onAuthStateChange listener will handle the state update
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
