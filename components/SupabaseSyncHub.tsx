import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Terminal, 
  Key, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink,
  Info,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfigOverrides, 
  clearSupabaseConfigOverrides, 
  testSupabaseConnection, 
  pushWorkspaceBackup, 
  pullWorkspaceBackup,
  listSupabaseWorkspaces,
  SyncPayload
} from '../services/supabaseClient';
import { CompanyProfile, ChecklistState, MaturityState, ActionPlanItem, RiskItem, SectorAnalysis, ChecklistItem } from '../types';

interface SupabaseSyncHubProps {
  company: CompanyProfile;
  checklistData: ChecklistState;
  checklistComments: Record<string, string>;
  customChecklistItems: ChecklistItem[];
  maturityData: MaturityState;
  actions: ActionPlanItem[];
  risks: RiskItem[];
  cultureSectors: SectorAnalysis[];
  onImportData: (
    newChecklist: ChecklistState, 
    newCompany?: CompanyProfile, 
    newComments?: Record<string, string>,
    newCustomItems?: ChecklistItem[],
    newMaturity?: MaturityState,
    newActions?: ActionPlanItem[],
    newRisks?: RiskItem[],
    newCultureSectors?: SectorAnalysis[]
  ) => void;
}

const SQL_MIGRATION_CODE = `-- =========================================================
-- SYSTEM MIGRATION: CONFIGURAÇÃO DE TABELAS DO SAFETYDIAGNOSTIC (NR-1 / GRO)
-- COM PROFILE E ID_CLIENTE (VINCULADO AO USUÁRIO AUTENTICADO)
-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SEU PROJETO SUPABASE
-- =========================================================

-- 1. Criação da Tabela de Perfis de Usuário (id_cliente)
CREATE TABLE IF NOT EXISTS nr1_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para perfis
ALTER TABLE nr1_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para perfis
DROP POLICY IF EXISTS "Leitura de perfil próprio" ON nr1_profiles;
CREATE POLICY "Leitura de perfil próprio" ON nr1_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Modificação de perfil próprio" ON nr1_profiles;
CREATE POLICY "Modificação de perfil próprio" ON nr1_profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Gatilho automático para inserção de novo usuário no Supabase Auth criar perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.nr1_profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário Safety'),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tabela relacional de empresas (Cadastro Principal) com id_cliente
CREATE TABLE IF NOT EXISTS nr1_companies (
    cnpj TEXT PRIMARY KEY,
    id_cliente UUID REFERENCES nr1_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    employees INTEGER DEFAULT 0,
    sector TEXT NOT NULL,
    cnae TEXT,
    risk_degree TEXT,
    porte_ibge TEXT,
    perfil_interno TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criação do backup completo da área de trabalho (Workspace Backups) com id_cliente
CREATE TABLE IF NOT EXISTS nr1_workspace_backup (
    id TEXT PRIMARY KEY,
    id_cliente UUID REFERENCES nr1_profiles(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    company_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    checklist_comments JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    maturity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    culture_sectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela relacional de Inventário de Riscos Ocupacionais (PGR)
CREATE TABLE IF NOT EXISTS nr1_risks (
    id TEXT PRIMARY KEY,
    company_cnpj TEXT REFERENCES nr1_companies(cnpj) ON DELETE CASCADE,
    process TEXT NOT NULL,
    hazard TEXT NOT NULL,
    probability INTEGER NOT NULL,
    severity INTEGER NOT NULL,
    level TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela relacional de Planos de Ação GRO / PGR
CREATE TABLE IF NOT EXISTS nr1_action_plans (
    id TEXT PRIMARY KEY,
    company_cnpj TEXT REFERENCES nr1_companies(cnpj) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    description TEXT NOT NULL,
    responsible TEXT NOT NULL,
    deadline TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================
-- CONFIGURAÇÃO DE POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =========================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE nr1_workspace_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE nr1_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE nr1_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nr1_action_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS restritas para o id_cliente
DROP POLICY IF EXISTS "Leitura de backup individual" ON nr1_workspace_backup;
CREATE POLICY "Leitura de backup individual" ON nr1_workspace_backup
    FOR SELECT USING (id_cliente = auth.uid());

DROP POLICY IF EXISTS "Modificação de backup individual" ON nr1_workspace_backup;
CREATE POLICY "Modificação de backup individual" ON nr1_workspace_backup
    FOR ALL USING (id_cliente = auth.uid()) WITH CHECK (id_cliente = auth.uid());

DROP POLICY IF EXISTS "Leitura de empresas individual" ON nr1_companies;
CREATE POLICY "Leitura de empresas individual" ON nr1_companies
    FOR SELECT USING (id_cliente = auth.uid());

DROP POLICY IF EXISTS "Modificação de empresas individual" ON nr1_companies;
CREATE POLICY "Modificação de empresas individual" ON nr1_companies
    FOR ALL USING (id_cliente = auth.uid()) WITH CHECK (id_cliente = auth.uid());

DROP POLICY IF EXISTS "Acesso total de riscos por empresa do usuario" ON nr1_risks;
CREATE POLICY "Acesso total de riscos por empresa do usuario" ON nr1_risks
    FOR ALL USING (
        company_cnpj IN (SELECT cnpj FROM nr1_companies WHERE id_cliente = auth.uid())
    ) WITH CHECK (
        company_cnpj IN (SELECT cnpj FROM nr1_companies WHERE id_cliente = auth.uid())
    );

DROP POLICY IF EXISTS "Acesso total de acoes por empresa do usuario" ON nr1_action_plans;
CREATE POLICY "Acesso total de acoes por empresa do usuario" ON nr1_action_plans
    FOR ALL USING (
        company_cnpj IN (SELECT cnpj FROM nr1_companies WHERE id_cliente = auth.uid())
    ) WITH CHECK (
        company_cnpj IN (SELECT cnpj FROM nr1_companies WHERE id_cliente = auth.uid())
    );
`;

export const SupabaseSyncHub: React.FC<SupabaseSyncHubProps> = ({
  company,
  checklistData,
  checklistComments,
  customChecklistItems,
  maturityData,
  actions,
  risks,
  cultureSectors,
  onImportData
}) => {
  const [config, setConfig] = useState(getSupabaseConfig());
  const [inputUrl, setInputUrl] = useState(config.url);
  const [inputKey, setInputKey] = useState(config.anonKey);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CHECKING' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'SYNC' | 'MIGRATION' | 'CREDENTIALS'>('SYNC');
  
  // Sync state actions
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [recentBackups, setRecentBackups] = useState<{ id: string; project_name: string; updated_at: string }[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Load configuration and list backups if possible
  useEffect(() => {
    const activeConf = getSupabaseConfig();
    setConfig(activeConf);
    setInputUrl(activeConf.url);
    setInputKey(activeConf.anonKey);
    
    if (activeConf.url && activeConf.anonKey) {
      verifyConnectionQuietly();
    }
  }, []);

  const verifyConnectionQuietly = async () => {
    setConnectionStatus('CHECKING');
    const result = await testSupabaseConnection();
    if (result.success) {
      setConnectionStatus('CONNECTED');
      setStatusMessage(result.message);
      fetchBackups();
    } else {
      setConnectionStatus('ERROR');
      setStatusMessage(result.message);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('CHECKING');
    setStatusMessage('Estabelecendo conexão...');
    const result = await testSupabaseConnection();
    if (result.success) {
      setConnectionStatus('CONNECTED');
      setStatusMessage(result.message);
      fetchBackups();
    } else {
      setConnectionStatus('ERROR');
      setStatusMessage(result.message);
    }
  };

  const handleSaveCredentials = () => {
    saveSupabaseConfigOverrides(inputUrl, inputKey);
    const activeConf = getSupabaseConfig();
    setConfig(activeConf);
    handleTestConnection();
  };

  const handleClearCredentials = () => {
    clearSupabaseConfigOverrides();
    setInputUrl('');
    setInputKey('');
    setConfig(getSupabaseConfig());
    setConnectionStatus('DISCONNECTED');
    setStatusMessage('Credenciais redefinidas para o padrão do ambiente.');
    setRecentBackups([]);
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    const savedUser = localStorage.getItem('nr1_facil_user_v1');
    const u = savedUser ? JSON.parse(savedUser) : null;
    const backups = await listSupabaseWorkspaces(u?.id);
    setRecentBackups(backups);
    setLoadingBackups(false);
  };

  const handlePushData = async () => {
    if (!company.name && !company.cnpj) {
      alert('Favor cadastrar ao menos o CNPJ ou Nome da empresa no Checklist para identificar o backup!');
      return;
    }
    
    setSyncing(true);
    const payload: SyncPayload = {
      company,
      checklistData,
      checklistComments,
      customChecklistItems,
      maturityData,
      actions,
      risks,
      cultureSectors
    };

    const name = company.name || 'Empresa Sem Nome';
    const savedUser = localStorage.getItem('nr1_facil_user_v1');
    const u = savedUser ? JSON.parse(savedUser) : null;
    const result = await pushWorkspaceBackup(name, payload, u?.id);
    
    if (result.success) {
      alert(result.message);
      fetchBackups();
    } else {
      alert(result.message);
    }
    setSyncing(false);
  };

  const handlePullData = async (targetCnpj?: string) => {
    const cnpjToQuery = targetCnpj || company.cnpj;
    if (!cnpjToQuery) {
      alert('Digite ou configure o CNPJ da empresa que deseja buscar do Supabase!');
      return;
    }

    setPulling(true);
    const savedUser = localStorage.getItem('nr1_facil_user_v1');
    const u = savedUser ? JSON.parse(savedUser) : null;
    const result = await pullWorkspaceBackup(cnpjToQuery, u?.id);
    
    if (result.success && result.data) {
      const d = result.data;
      onImportData(
        d.checklistData,
        d.company,
        d.checklistComments,
        d.customChecklistItems,
        d.maturityData,
        d.actions,
        d.risks,
        d.cultureSectors
      );
      alert('Dados importados e restaurados do Supabase com sucesso!');
    } else {
      alert(result.message);
    }
    setPulling(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_CODE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-6 md:p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
            <Database className="text-emerald-400" size={32} />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Sincronização Supabase Cloud
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-700">
                Ativo
              </span>
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Conecte seu sistema ao banco de dados Supabase Postgres para salvar checklists, inventários PGR, planos de ação e análises com total persistência.
            </p>
          </div>
        </div>
        
        {/* Connection Status indicator */}
        <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="relative">
            <span className={`flex h-3.5 w-3.5 rounded-full ${
              connectionStatus === 'CONNECTED' ? 'bg-emerald-500' :
              connectionStatus === 'CHECKING' ? 'bg-amber-400 animate-pulse' :
              connectionStatus === 'ERROR' ? 'bg-rose-500' : 'bg-slate-600'
            }`} />
            {connectionStatus === 'CONNECTED' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 left-0 top-0" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status da Conexão</p>
            <p className="text-xs font-semibold text-slate-200">
              {connectionStatus === 'CONNECTED' && 'Conectado ao Supabase'}
              {connectionStatus === 'CHECKING' && 'Verificando...'}
              {connectionStatus === 'ERROR' && 'Erro de Conectividade'}
              {connectionStatus === 'DISCONNECTED' && 'Não Configurado'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950">
        <button
          onClick={() => setActiveTab('SYNC')}
          className={`flex-1 md:flex-initial px-6 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'SYNC' 
              ? 'border-emerald-500 text-white bg-slate-900/50' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <RefreshCw size={16} />
          Sincronização & Backups
        </button>
        <button
          onClick={() => setActiveTab('MIGRATION')}
          className={`flex-1 md:flex-initial px-6 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'MIGRATION' 
              ? 'border-emerald-500 text-white bg-slate-900/50' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Terminal size={16} />
          Estrutura SQL & RLS
        </button>
        <button
          onClick={() => setActiveTab('CREDENTIALS')}
          className={`flex-1 md:flex-initial px-6 py-3.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === 'CREDENTIALS' 
              ? 'border-emerald-500 text-white bg-slate-900/50' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Sliders size={16} />
          Configurar Credenciais
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="p-6 md:p-8 bg-slate-900/40">
        {activeTab === 'CREDENTIALS' && (
          <div className="space-y-6">
            <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <Key size={18} className="text-emerald-400" />
                Configuração Manual da Instância
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você pode utilizar variáveis <code className="text-slate-300 font-mono bg-slate-900 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> e <code className="text-slate-300 font-mono bg-slate-900 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> no seu arquivo <code className="text-slate-300 font-mono bg-slate-900 px-1.5 py-0.5">.env.local</code> para configurar de forma definitiva, ou inserir manualmente aqui no painel para efetuar testes temporários em tempo de execução.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supabase Project URL</label>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://exemplo-seu-id.supabase.co"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supabase Anon Key (PublicKey)</label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ii..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveCredentials}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/40 transition-colors"
              >
                Conectar e Validar Instância
              </button>
              
              {config.isOverridden && (
                <button
                  onClick={handleClearCredentials}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-700 transition-colors"
                >
                  Restaurar Valores Padrão (Clean)
                </button>
              )}
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                connectionStatus === 'CONNECTED' 
                  ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-200' 
                  : 'bg-rose-950/20 border-rose-900/60 text-rose-200'
              }`}>
                {connectionStatus === 'CONNECTED' ? (
                  <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">{connectionStatus === 'CONNECTED' ? 'Conexão Estabelecida!' : 'Aviso / Erro:'}</p>
                  <p className="opacity-80 mt-1">{statusMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'MIGRATION' && (
          <div className="space-y-6">
            {/* CRITICAL ANTI-TS-ERROR PANEL FOR SUPABASE SQL EDITOR */}
            <div className="bg-rose-950/30 border border-rose-900/50 p-5 rounded-xl flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex-shrink-0 animate-pulse">
                <AlertTriangle size={24} className="text-rose-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-bold text-rose-200 text-sm md:text-base">⚠️ PARE! NÃO COPIE CÓDIGO TYPESCRIPT NO SUPABASE</h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  <strong>Diagnóstico de Erro de Sintaxe:</strong> Se você recebeu o erro de sintaxe <code className="bg-rose-950/80 px-1 py-0.5 rounded text-white font-mono">syntax error at or near {"\"{\""}</code> no Supabase, significa que você colou código JavaScript/TypeScript (como <code className="bg-rose-950/80 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">import &#123; createClient &#125; ...</code>) no <strong>SQL Editor</strong> do site do Supabase.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong>O que fazer:</strong> NÃO use o código de arquivos TypeScript do aplicativo no site do Supabase! Você deve copiar <strong>APENAS</strong> o script SQL puro que está listado na caixa abaixo (<code className="text-slate-300">migrations.sql</code>) e colá-lo no SQL Editor do seu projeto Supabase para habilitar o banco. Ele funcionará perfeitamente.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex-shrink-0">
                <Info size={24} className="text-blue-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm md:text-base">O que este SQL faz?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Este script cria a tabela central de backups dinâmicos (<code className="text-slate-300 font-mono">nr1_workspace_backup</code>) e três tabelas estruturadas adicionais para demonstrar um excelente projeto relacional de dados (<code className="text-slate-300 font-mono">nr1_companies</code>, <code className="text-slate-300 font-mono">nr1_risks</code> e <code className="text-slate-300 font-mono">nr1_action_plans</code>). Ele também habilita as políticas RLS seguras para as operações do aplicativo.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950 px-5 py-3 rounded-t-xl border-t border-x border-slate-800">
              <span className="text-xs font-mono text-slate-400 font-bold">migrations.sql</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            
            <div className="bg-slate-950 rounded-b-xl border-b border-x border-slate-800 p-4 overflow-hidden">
              <pre className="text-[10px] md:text-xs font-mono text-slate-300 overflow-x-auto max-h-[350px] leading-relaxed p-2 select-all whitespace-pre">
                {SQL_MIGRATION_CODE}
              </pre>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-slate-950/20 border border-slate-800/80 p-5 rounded-xl">
              <div className="flex-1 space-y-2">
                <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Server size={16} className="text-amber-400" /> Como Executar?
                </h5>
                <ol className="text-xs text-slate-400 list-decimal pl-4 space-y-1.5">
                  <li>Acesse o painel do seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Supabase</a>.</li>
                  <li>No menu esquerdo, navegue até a seção <strong>SQL Editor</strong> (ícone de folha de código).</li>
                  <li>Clique em <strong>New Query</strong> para criar uma nova aba de comandos.</li>
                  <li>Cole este SQL na tela e clique no botão verde <strong>Run</strong> ou pressione <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 text-[10px]">Ctrl+Enter</kbd>.</li>
                </ol>
              </div>
              <div className="flex-1 space-y-2">
                <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Vantagens de habilitar RLS & Policies
                </h5>
                <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1.5">
                  <li><strong>Segurança Absoluta</strong>: O banco impede queries externas sem credenciais autorizadas.</li>
                  <li><strong>Conformidade LGPD</strong>: Os dados de funcionários e de PGR ficam protegidos.</li>
                  <li><strong>Integridade Referencial</strong>: Os riscos e planos de ação são interligados.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SYNC' && (
          <div className="space-y-6">
            {connectionStatus !== 'CONNECTED' ? (
              <div className="bg-amber-950/25 border border-amber-900/60 p-6 rounded-xl text-center space-y-4 max-w-xl mx-auto">
                <AlertTriangle className="text-amber-500 mx-auto" size={40} />
                <div className="space-y-1.5">
                  <h4 className="font-bold text-amber-200">Conecte o Supabase para Sincronizar</h4>
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    Você ainda não se conectou com sucesso à sua nuvem Supabase. Insira as credenciais no menu "Configurar Credenciais" ou configure as variáveis locais no arquivo <code className="bg-amber-950 px-1 py-0.5 rounded">.env.local</code>.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('CREDENTIALS')}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-900 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all"
                >
                  Ir para Tela de Credenciais
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Real-time actions & Push status */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-5">
                    <h4 className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                      <Sliders size={18} className="text-emerald-400" />
                      Sincronização de Dados da Empresa Atual
                    </h4>

                    {/* Active profile review */}
                    <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Empresa Atual Ativa</p>
                        <p className="text-sm font-bold text-slate-200 mt-1">{company.name || 'Sem Razão Social'}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">CNPJ: {company.cnpj || 'Sem CNPJ'}</p>
                      </div>
                      <span className="bg-emerald-900/40 text-emerald-300 text-xs px-2.5 py-1 rounded-full border border-emerald-800/60 font-medium">
                        {checklistData ? Object.keys(checklistData).length : 0} respostas diagnosticadas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Push to cloud block */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60 space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider">SALVAR NA NUVEM</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Envia todos os dados editados ou simulados localmente para as tabelas no Supabase Postgres.
                          </p>
                        </div>
                        <button
                          onClick={handlePushData}
                          disabled={syncing}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {syncing ? <RefreshCw className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                          {syncing ? 'Enviando...' : 'Fazer Push para Nuvem'}
                        </button>
                      </div>

                      {/* Pull from cloud block */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60 space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider">RESTAURAR DA NUVEM</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Busca do Supabase as respostas e inventários salvos sob o CNPJ atual da empresa e substitui o estado do navegador.
                          </p>
                        </div>
                        <button
                          onClick={() => handlePullData()}
                          disabled={pulling || !company.cnpj}
                          className="w-full bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-800 transition-colors disabled:opacity-50"
                        >
                          {pulling ? <RefreshCw className="animate-spin" size={14} /> : <DownloadCloud size={14} />}
                          {pulling ? 'Puxando...' : 'Fazer Pull da Nuvem'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl flex items-start gap-3">
                    <Info size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sempre que você modifica dados no seu diagnóstico, eles são salvos no cache local do seu navegador. Recomenda-se realizar o <strong>Push para a Nuvem</strong> regularmente para guardar snapshots que poderão ser restaurados em qualquer máquina.
                    </p>
                  </div>
                </div>

                {/* Backups List Sidebar */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-4 flex flex-col h-full">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h4 className="font-bold text-white text-xs md:text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <Database size={14} className="text-emerald-400" />
                        Histórico do Supabase
                      </h4>
                      <button 
                        onClick={fetchBackups} 
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Atualizar lista"
                      >
                        <RefreshCw size={14} className={loadingBackups ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] pr-1">
                      {loadingBackups ? (
                        <div className="text-center py-8 text-xs text-slate-500">
                          <RefreshCw className="animate-spin mx-auto text-emerald-500 mb-2" size={18} />
                          Buscando backups...
                        </div>
                      ) : recentBackups.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-500 space-y-1">
                          <p>Nenhum backup encontrado.</p>
                          <p className="opacity-70 text-[10px]">Efetue um Push para preencher este histórico.</p>
                        </div>
                      ) : (
                        recentBackups.map((w) => {
                          const isMatch = w.id === `nr1_${company.cnpj.replace(/\D/g, '')}`;
                          return (
                            <div 
                              key={w.id} 
                              className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-4 ${
                                isMatch 
                                  ? 'bg-slate-900 border-emerald-500/50 hover:bg-slate-900/90' 
                                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900/80'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">{w.project_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {w.id}</p>
                                <p className="text-[9px] text-slate-500 mt-1">
                                  Salvo em: {new Date(w.updated_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Deseja carregar as configurações do backup "${w.project_name}"? Isso substituirá seus dados locais.`)) {
                                    // Extract simple cnpj or pass id
                                    const matchCnpj = w.id.replace('nr1_', '');
                                    handlePullData(matchCnpj);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                                title="Carregar este backup"
                              >
                                <DownloadCloud size={14} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Instructions indicator */}
      <div className="bg-slate-950 p-4 px-6 md:px-8 border-t border-slate-800 text-slate-500 text-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-slate-400" />
          Problemas de conexão? Verifique se preencheu o arquivo <code className="text-slate-300 font-mono bg-slate-900 px-1 rounded">.env.local</code> e as tabelas Postgres.
        </p>
        <span className="text-slate-600 font-mono text-[10px]">SAFETYDIAGNOSTIC-CONNECT-V1.0</span>
      </div>
    </div>
  );
};
