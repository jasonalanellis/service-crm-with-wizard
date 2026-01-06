import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Tenant } from '../lib/supabase';

type TenantContextType = {
  tenant: Tenant | null;
  tenants: Tenant[];
  setTenant: (tenant: Tenant) => void;
  loading: boolean;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children, explicitTenantId }: { children: ReactNode; explicitTenantId?: string | null }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      if (explicitTenantId) {
        // Public portal mode: fetch only the specified tenant
        const { data } = await supabase.from('tenants').select('*').eq('id', explicitTenantId).single();
        if (data) {
          setTenants([data]);
          setTenant(data);
        }
      } else {
        // Admin mode: fetch all tenants user has access to
        const { data } = await supabase.from('tenants').select('*').order('name');
        if (data) {
          setTenants(data);
          const saved = localStorage.getItem('selectedTenantId');
          const found = data.find(t => t.id === saved);
          if (found) setTenant(found);
        }
      }
      setLoading(false);
    };
    fetchTenants();
  }, [explicitTenantId]);

  const handleSetTenant = (t: Tenant) => {
    setTenant(t);
    localStorage.setItem('selectedTenantId', t.id);
  };

  return (
    <TenantContext.Provider value={{ tenant, tenants, setTenant: handleSetTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
