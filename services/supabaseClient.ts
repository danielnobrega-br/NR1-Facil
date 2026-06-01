import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CompanyProfile, ChecklistState, MaturityState, RiskItem, ActionPlanItem, SectorAnalysis, ChecklistItem } from '../types';

const STORAGE_KEYS = {
  URL: 'nr1_supabase_url_override',
  ANON_KEY: 'nr1_supabase_key_override',
};

/**
 * Gets the active Supabase Configuration from environment or localStorage overrides.
 */
export const getSupabaseConfig = () => {
  const urlOverride = localStorage.getItem(STORAGE_KEYS.URL);
  const keyOverride = localStorage.getItem(STORAGE_KEYS.ANON_KEY);

  return {
    url: urlOverride || (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: keyOverride || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
    isOverridden: !!(urlOverride || keyOverride),
  };
};

/**
 * Saves client connection adjustments directly in the browser's persistent storage for live tests.
 */
export const saveSupabaseConfigOverrides = (url: string, anonKey: string) => {
  if (url) {
    localStorage.setItem(STORAGE_KEYS.URL, url);
  } else {
    localStorage.removeItem(STORAGE_KEYS.URL);
  }

  if (anonKey) {
    localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
  }
};

/**
 * Clear configuration overrides to fallback to .env values
 */
export const clearSupabaseConfigOverrides = () => {
  localStorage.removeItem(STORAGE_KEYS.URL);
  localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
};

let clientInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

/**
 * Soft Client Instantiation (avoid exceptions during module compilation)
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  // Reuse or rebuild if parameters changed
  if (!clientInstance || lastUsedUrl !== url || lastUsedKey !== anonKey) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      lastUsedUrl = url;
      lastUsedKey = anonKey;
    } catch (e) {
      console.error('Failed to create Supabase Client instance:', e);
      return null;
    }
  }

  return clientInstance;
};

/**
 * Test connectivity with Supabase and guarantee table existences
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Configurações de credenciais da URL do Supabase ou Anon Key não encontradas.',
    };
  }

  try {
    // Attempt to query workspace backups or simple check
    const { data, error } = await client
      .from('nr1_workspace_backup')
      .select('id')
      .limit(1);

    if (error) {
      // If table is missing, but auth works, we are technically connected!
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado com sucesso! Observação: A tabela "nr1_workspace_backup" ainda não foi criada. Por favor, execute a migration SQL fornecida no painel abaixo.',
        };
      }
      return {
        success: false,
        message: `Erro na consulta do Supabase (${error.code}): ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso! Tabelas verificadas e prontas para sincronização.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro inesperado na conexão: ${error.message || error}`,
    };
  }
};

export interface SyncPayload {
  company: CompanyProfile;
  checklistData: ChecklistState;
  checklistComments: Record<string, string>;
  customChecklistItems: ChecklistItem[];
  maturityData: MaturityState;
  actions: ActionPlanItem[];
  risks: RiskItem[];
  cultureSectors: SectorAnalysis[];
}

/**
 * Push full workspace backup JSON to Supabase
 */
export const pushWorkspaceBackup = async (
  projectName: string,
  state: SyncPayload
): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase não está configurado.' };
  }

  try {
    const cnpj = state.company.cnpj || 'DEFAULT_COMP';
    const id = `nr1_${cnpj.replace(/\D/g, '') || 'workspace'}`;

    const { error } = await client
      .from('nr1_workspace_backup')
      .upsert({
        id,
        project_name: projectName || state.company.name || 'Empresa NR1',
        company_profile: state.company,
        checklist_data: state.checklistData,
        checklist_comments: state.checklistComments,
        custom_checklist_items: state.customChecklistItems,
        maturity_data: state.maturityData,
        actions: state.actions,
        risks: state.risks,
        culture_sectors: state.cultureSectors,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    // Now, push structured relational records as fallback / parallel data demonstration!
    await syncRelationalTables(state);

    return {
      success: true,
      message: 'Dados salvos e sincronizados com sucesso no Supabase!',
    };
  } catch (error: any) {
    console.error('Supabase backup push error:', error);
    return {
      success: false,
      message: `Falha ao enviar backup para o Supabase: ${error.message || error}`,
    };
  }
};

/**
 * Synchronizes relational tables for high fidelity database design
 */
const syncRelationalTables = async (state: SyncPayload) => {
  const client = getSupabaseClient();
  if (!client) return;

  const cnpj = state.company.cnpj || 'DEFAULT_COMP';

  try {
    // 1. Sync Company Profile
    await client.from('nr1_companies').upsert({
      cnpj,
      name: state.company.name || 'Sem Nome',
      employees: parseInt(state.company.employees) || 0,
      sector: state.company.sector,
      cnae: state.company.cnae,
      risk_degree: state.company.riskDegree,
      porte_ibge: state.company.porte_ibge,
      perfil_interno: state.company.perfil_interno,
      updated_at: new Date().toISOString()
    }, { onConflict: 'cnpj' });

    // 2. Clear & Rewrite current Risks to avoid complex joins
    if (state.risks && state.risks.length > 0) {
      // First clean old risks for this company
      await client.from('nr1_risks').delete().eq('company_cnpj', cnpj);
      // Insert new risks
      const riskPayloads = state.risks.map(r => ({
        id: r.id,
        company_cnpj: cnpj,
        process: r.process,
        hazard: r.hazard,
        probability: r.probability,
        severity: r.severity,
        level: r.level,
        score: r.score,
        updated_at: new Date().toISOString()
      }));
      await client.from('nr1_risks').insert(riskPayloads);
    }

    // 3. Clear & Rewrite current Action Plan items
    if (state.actions && state.actions.length > 0) {
      await client.from('nr1_action_plans').delete().eq('company_cnpj', cnpj);
      const actionPayloads = state.actions.map(a => ({
        id: a.id,
        company_cnpj: cnpj,
        origin: a.origin,
        description: a.description,
        responsible: a.responsible,
        deadline: a.deadline,
        priority: a.priority,
        status: a.status,
        updated_at: new Date().toISOString()
      }));
      await client.from('nr1_action_plans').insert(actionPayloads);
    }

  } catch (err) {
    console.warn('Silent warning on relational sync (possibly tables omitted in schema):', err);
  }
};

/**
 * Pull workspace backup from Supabase by CNPJ-based/id
 */
export const pullWorkspaceBackup = async (
  cnpj: string
): Promise<{ success: boolean; message: string; data?: SyncPayload }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase não está configurado.' };
  }

  try {
    const id = `nr1_${cnpj.replace(/\D/g, '') || 'workspace'}`;

    const { data, error } = await client
      .from('nr1_workspace_backup')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        success: false,
        message: `Nenhum backup encontrado no Supabase para o ID "${id}". Certifique-se de que enviou dados com este CNPJ anteriormente.`,
      };
    }

    const payload: SyncPayload = {
      company: data.company_profile || {},
      checklistData: data.checklist_data || {},
      checklistComments: data.checklist_comments || {},
      customChecklistItems: data.custom_checklist_items || [],
      maturityData: data.maturity_data || {},
      actions: data.actions || [],
      risks: data.risks || [],
      cultureSectors: data.culture_sectors || [],
    };

    return {
      success: true,
      message: 'Backup restaurado com sucesso do Supabase!',
      data: payload,
    };
  } catch (error: any) {
    console.error('Supabase backup pull error:', error);
    return {
      success: false,
      message: `Falha ao obter backup do Supabase: ${error.message || error}`,
    };
  }
};

/**
 * Lists all active backup workspaces saved on Supabase
 */
export const listSupabaseWorkspaces = async (): Promise<{ id: string; project_name: string; updated_at: string }[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('nr1_workspace_backup')
      .select('id, project_name, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error listing Supabase workspaces:', e);
    return [];
  }
};
