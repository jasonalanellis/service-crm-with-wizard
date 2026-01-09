import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Tenant } from '../lib/supabase';

type TenantContextType = {
  tenant: Tenant | null;
  tenants: Tenant[];
  setTenant: (tenant: Tenant) => void;
  loading: boolean;
  needsSetup: boolean;
  refreshTenants: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children, explicitTenantId }: { children: ReactNode; explicitTenantId?: string | null }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    setLoading(true);
      if (explicitTenantId) {
        // Public portal mode: fetch only the specified tenant
        const { data } = await supabase.from('tenants').select('*').eq('id', explicitTenantId).single();
        if (data) {
          setTenants([data]);
          setTenant(data);
        }
      } else {
        // Admin mode: fetch only tenants the user has access to via user_profiles
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get tenant IDs the user has access to
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('auth_id', user.id);

        if (profiles && profiles.length > 0) {
          const tenantIds = profiles.map(p => p.tenant_id).filter(Boolean);

          if (tenantIds.length > 0) {
            const { data } = await supabase
              .from('tenants')
              .select('*')
              .in('id', tenantIds)
              .order('name');

            if (data && data.length > 0) {
              setTenants(data);
              const saved = localStorage.getItem('selectedTenantId');
              const found = data.find(t => t.id === saved);
              // Auto-select first tenant if none saved or saved not found
              const selectedTenant = found || data[0];
              setTenant(selectedTenant);
              localStorage.setItem('selectedTenantId', selectedTenant.id);
            }
          }
        }
      }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, [explicitTenantId]);

  const needsSetup = !loading && tenants.length === 0;

  const handleSetTenant = (t: Tenant) => {
    setTenant(t);
    localStorage.setItem('selectedTenantId', t.id);
  };

  return (
    <TenantContext.Provider value={{ tenant, tenants, setTenant: handleSetTenant, loading, needsSetup, refreshTenants: fetchTenants }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
