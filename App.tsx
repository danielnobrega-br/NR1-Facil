
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, CheckSquare, BarChart, ShieldCheck, FileWarning, GraduationCap, Users, Menu, X, ClipboardList, Package, Brain, Trash, FileCheck, HelpCircle, PlayCircle, Database } from 'lucide-react';
import { ToolType, ChecklistState, MaturityState, CompanyProfile, ActionPlanItem, InternalProfile, SectorType, RiskItem, SectorAnalysis, ChecklistItem } from './types';
import { ChecklistTool } from './components/ChecklistTool';
import { MaturityTool } from './components/MaturityTool';
import { ResultsDashboard } from './components/ResultsDashboard';
import { RiskAssessmentHub } from './components/RiskAssessmentHub';
import { TrainingHub } from './components/TrainingHub';
import { CultureErgoHub } from './components/CultureErgoHub';
import { ActionPlanHub } from './components/ActionPlanHub';
import { MentalHealthHub } from './components/MentalHealthHub';
import { GlobalReportHub } from './components/GlobalReportHub';
import { FaqHub } from './components/FaqHub';
import { TutorialGuide } from './components/TutorialGuide';
import { SupabaseSyncHub } from './components/SupabaseSyncHub';
import { getSupabaseClient, pushWorkspaceBackup } from './services/supabaseClient';

const STORAGE_KEY = 'nr1_facil_db_v1';

const App: React.FC = () => {
  // Updated default state to point to Dashboard
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.DASHBOARD);
  const [checklistData, setChecklistData] = useState<ChecklistState>({});
  const [checklistComments, setChecklistComments] = useState<Record<string, string>>({}); // New: Observations
  const [customChecklistItems, setCustomChecklistItems] = useState<ChecklistItem[]>([]); // New: Custom Items
  
  const [maturityData, setMaturityData] = useState<MaturityState>({});
  
  // State to control deep linking into Mental Health module
  const [mentalHealthInitialTab, setMentalHealthInitialTab] = useState<'DASHBOARD' | 'SURVEY' | 'CAMPAIGN' | 'ANALYSIS'>('ANALYSIS');
  
  // Lifted Action Plan State to allow cross-module integration
  const [actions, setActions] = useState<ActionPlanItem[]>([]);
  // Lifted Risks State to allow PGR Generation
  const [risks, setRisks] = useState<RiskItem[]>([]);
  // Lifted Culture Sectors State to allow integration with Action Plan
  const [cultureSectors, setCultureSectors] = useState<SectorAnalysis[]>([]);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const [company, setCompany] = useState<CompanyProfile>({
    name: '', 
    cnpj: '', 
    employees: '', 
    sector: 'COMERCIO_SERVICOS', // Default
    cnae: '', 
    riskDegree: '1',
    porte_ibge: 'Micro',
    perfil_interno: InternalProfile.MICRO_LITE,
    branches: []
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Supabase Real-time Cloud Sync State
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR' | 'OFFLINE'>('IDLE');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const mainScrollRef = useRef<HTMLElement>(null);

  // 1. Load Data from LocalStorage on Mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed.company) setCompany(parsed.company);
            if (parsed.checklistData) setChecklistData(parsed.checklistData);
            if (parsed.checklistComments) setChecklistComments(parsed.checklistComments);
            if (parsed.customChecklistItems) setCustomChecklistItems(parsed.customChecklistItems);
            if (parsed.maturityData) setMaturityData(parsed.maturityData);
            if (parsed.actions) setActions(parsed.actions);
            if (parsed.risks) setRisks(parsed.risks);
            if (parsed.cultureSectors) setCultureSectors(parsed.cultureSectors);
            console.log("Dados restaurados com sucesso.");
        } catch (error) {
            console.error("Erro ao carregar dados salvos:", error);
        }
    }
    setIsDataLoaded(true);
  }, []);

  // 2. Auto-Save Data to LocalStorage & Supabase Cloud on Change
  useEffect(() => {
    if (!isDataLoaded) return; // Prevent overwriting with empty state during init

    const stateToSave = {
        company,
        checklistData,
        checklistComments,
        customChecklistItems,
        maturityData,
        actions,
        risks,
        cultureSectors
    };
    
    const handler = setTimeout(async () => {
        // Save locally first
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

        // Check if Supabase is connected / configured
        const client = getSupabaseClient();
        if (client) {
            setSupabaseSyncStatus('SYNCING');
            try {
                const projectName = company.name || 'Empresa NR1';
                const result = await pushWorkspaceBackup(projectName, stateToSave);
                if (result.success) {
                    setSupabaseSyncStatus('SUCCESS');
                    setLastSyncTime(new Date());
                } else {
                    console.warn('Silent database auto-sync issue:', result.message);
                    setSupabaseSyncStatus('ERROR');
                }
            } catch (error) {
                console.error('Real-time database sync exception:', error);
                setSupabaseSyncStatus('ERROR');
            }
        } else {
            setSupabaseSyncStatus('OFFLINE');
        }
    }, 800); // 800ms debounce to prevent spamming transactions on fast typing

    return () => clearTimeout(handler);
  }, [company, checklistData, checklistComments, customChecklistItems, maturityData, actions, risks, cultureSectors, isDataLoaded]);

  // Scroll to top when switching tabs
  useEffect(() => {
      if (mainScrollRef.current) {
          mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [activeTab]);

  // URL Parameter Handling (Deep Linking via Hash to avoid 404s)
  useEffect(() => {
    const handleHashChange = () => {
        // Remove the '#' character and parse parameters
        const hash = window.location.hash.substring(1); 
        const params = new URLSearchParams(hash);
        const moduleParam = params.get('module');
        const tabParam = params.get('tab');
        
        if (moduleParam === 'mental_health') {
            setActiveTab(ToolType.MENTAL_HEALTH);
            if (tabParam === 'analysis') {
                setMentalHealthInitialTab('ANALYSIS');
            } else if (tabParam === 'survey') {
                setMentalHealthInitialTab('SURVEY');
            } else {
                setMentalHealthInitialTab('DASHBOARD');
            }
        }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes (in case user navigates within same session)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Classification Logic
  useEffect(() => {
    const numEmployees = parseInt(company.employees) || 0;
    const sector = company.sector;
    let porte = 'Micro';
    let perfil = InternalProfile.MICRO_LITE;

    if (numEmployees > 1000) {
        porte = 'Grande (>1000)';
        perfil = InternalProfile.ENTERPRISE_CUSTOM;
    } else if (sector === 'COMERCIO_SERVICOS') {
        if (numEmployees <= 9) {
            porte = 'Micro';
            perfil = InternalProfile.MICRO_LITE;
        } else if (numEmployees <= 49) {
            porte = 'Pequena';
            perfil = InternalProfile.PEQUENA_STANDARD;
        } else if (numEmployees <= 99) {
            porte = 'Média';
            perfil = InternalProfile.MEDIA_GESTAO;
        } else {
            porte = 'Grande';
            perfil = InternalProfile.GRANDE_ATE_1000;
        }
    } else { // INDUSTRIA
        if (numEmployees <= 19) {
            porte = 'Micro';
            perfil = InternalProfile.MICRO_LITE;
        } else if (numEmployees <= 99) {
            porte = 'Pequena';
            perfil = InternalProfile.PEQUENA_STANDARD;
        } else if (numEmployees <= 499) {
            porte = 'Média';
            perfil = InternalProfile.MEDIA_GESTAO;
        } else {
            porte = 'Grande';
            perfil = InternalProfile.GRANDE_ATE_1000;
        }
    }

    // Only update if changed to avoid loops
    if (porte !== company.porte_ibge || perfil !== company.perfil_interno) {
        setCompany(prev => ({ ...prev, porte_ibge: porte, perfil_interno: perfil }));
    }
  }, [company.employees, company.sector]);

  // --- Handlers ---

  const handleChecklistChange = (id: string, value: number) => {
    setChecklistData(prev => ({ ...prev, [id]: value }));
  };

  const handleChecklistCommentChange = (id: string, text: string) => {
    setChecklistComments(prev => ({ ...prev, [id]: text }));
  };

  const handleAddCustomChecklistItem = (item: ChecklistItem) => {
    setCustomChecklistItems(prev => [...prev, item]);
  };

  const handleDeleteCustomChecklistItem = (id: string) => {
    setCustomChecklistItems(prev => prev.filter(i => i.id !== id));
    // Also cleanup data
    const newData = { ...checklistData };
    delete newData[id];
    setChecklistData(newData);
  };

  // New handler for batch updates (File Import)
  const handleBatchChecklistUpdate = (
      newChecklist: ChecklistState, 
      newCompany?: CompanyProfile, 
      newComments?: Record<string, string>,
      newCustomItems?: ChecklistItem[]
  ) => {
      setChecklistData(newChecklist);
      if (newCompany) setCompany(prev => ({ ...prev, ...newCompany }));
      if (newComments) setChecklistComments(newComments);
      if (newCustomItems) setCustomChecklistItems(newCustomItems);
  };

  const handleSupabaseImport = (
      newChecklist: ChecklistState, 
      newCompany?: CompanyProfile, 
      newComments?: Record<string, string>,
      newCustomItems?: ChecklistItem[],
      newMaturity?: MaturityState,
      newActions?: ActionPlanItem[],
      newRisks?: RiskItem[],
      newCultureSectors?: SectorAnalysis[]
  ) => {
      if (newChecklist) setChecklistData(newChecklist);
      if (newCompany) setCompany(newCompany);
      if (newComments) setChecklistComments(newComments || {});
      if (newCustomItems) setCustomChecklistItems(newCustomItems || []);
      if (newMaturity) setMaturityData(newMaturity);
      if (newActions) setActions(newActions || []);
      if (newRisks) setRisks(newRisks || []);
      if (newCultureSectors) setCultureSectors(newCultureSectors || []);
  };

  const handleMaturityChange = (id: string, value: number) => {
    setMaturityData(prev => ({ ...prev, [id]: value }));
  };

  const handleCompanyChange = (field: keyof CompanyProfile, value: any) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  };

  // Callback for Mental Health module to inject actions
  const addAction = (action: Omit<ActionPlanItem, 'id' | 'status'>) => {
      const newAction: ActionPlanItem = {
          ...action,
          id: Date.now().toString() + Math.random(),
          status: 'TODO'
      };
      setActions(prev => [...prev, newAction]);
  };

  const loadLogisticsSimulation = () => {
    if(!window.confirm("Isso substituirá seus dados atuais pelos dados da simulação. Deseja continuar?")) return;

    // 1. Set Company Profile
    setCompany({
        name: 'Logística Express Ltda',
        cnpj: '12.345.678/0001-90',
        employees: '30',
        sector: 'COMERCIO_SERVICOS',
        cnae: '52.11-7 - Armazenagem',
        riskDegree: '3',
        porte_ibge: 'Pequena',
        perfil_interno: InternalProfile.PEQUENA_STANDARD,
        businessTypeId: '5', // New ID for Logistica & Armazenagem
        branches: []
    });

    // 2. Set Checklist (Simulation of a typical logistics company with some gaps)
    setChecklistData({
        'a1': 1, 'a2': 2, 'a3': 1, 'a4': 0, 'a5': 1, // Structure
        'b1': 0, 'b2': 2, 'b3': 1, 'b4': 0, 'b5': 1, // Routine
        'c1': 1, 'c2': 0, 'c3': 1, 'c4': 1, 'c5': 0, // Communication
        'd1': 2, 'd2': 2, 'd3': 0, 'd4': 2, 'd5': 1  // Training
    });

    // 3. Set Maturity (Average scores)
    setMaturityData({
        'm1': 3, // Liderança
        'm2': 2, // Cultura (baixa participação)
        'm3': 3, // Processos
        'm4': 2, // Aprendizado (foco em culpa)
        'm5': 1  // Melhoria Contínua (inexistente)
    });

    // 4. Set Culture Sectors (Mock Data for simulation)
    setCultureSectors([
        { id: '1', name: 'Expedição', respondents: 15, scores: { consciencia: 4.2, lideranca: 2.5, comunicacao: 3.0 } },
        { id: '2', name: 'Recebimento', respondents: 8, scores: { consciencia: 4.8, lideranca: 4.0, comunicacao: 3.5 } },
        { id: '3', name: 'Administrativo', respondents: 7, scores: { consciencia: 3.0, lideranca: 4.5, comunicacao: 4.2 } },
    ]);

    // Clear others
    setActions([]);
    setRisks([]);
    setChecklistComments({});
    setCustomChecklistItems([]);

    // Navigate to Dashboard to show results
    setActiveTab(ToolType.DASHBOARD);
    setIsMobileMenuOpen(false);
  };

  const handleResetData = () => {
      if(window.confirm("ATENÇÃO: Isso apagará TODOS os dados salvos neste navegador (Empresa, Checklist, Riscos, etc). Deseja continuar?")) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
      }
  };

  const handleNavigate = (tab: ToolType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const supportedTutorialTabs = [ToolType.CHECKLIST, ToolType.RISK_TOOLS, ToolType.ACTION_PLAN];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      <TutorialGuide activeTab={activeTab} isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-30 sticky top-0">
         <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-emerald-500" />
            <h1 className="font-bold">NR1 Fácil</h1>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col z-20 transition-transform duration-300 ease-in-out h-screen`}>
        <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg">
             <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">NR1 Fácil</h1>
            <p className="text-xs text-slate-400">Gestão Inteligente</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => handleNavigate(ToolType.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-4 ${activeTab === ToolType.DASHBOARD ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Visão Geral</span>
          </button>

          <div className="px-4 pb-2 pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Módulo 1: Diagnóstico</span>
          </div>
          <button 
            onClick={() => handleNavigate(ToolType.CHECKLIST)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.CHECKLIST ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <CheckSquare size={18} />
            <span>Checklist NR-1</span>
          </button>
          <button 
            onClick={() => handleNavigate(ToolType.MATURITY)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.MATURITY ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <BarChart size={18} />
            <span>Maturidade GRO</span>
          </button>

          <div className="px-4 pb-2 pt-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Módulo 2: Riscos</span>
          </div>
          <button 
            onClick={() => handleNavigate(ToolType.RISK_TOOLS)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.RISK_TOOLS ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <FileWarning size={18} />
            <span>Engenharia de Risco</span>
          </button>
          <button 
            onClick={() => handleNavigate(ToolType.ACTION_PLAN)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.ACTION_PLAN ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <ClipboardList size={18} />
            <span>Plano de Ação (PGR)</span>
          </button>

          <div className="px-4 pb-2 pt-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Módulo 3: Pessoas</span>
          </div>
          <button 
            onClick={() => handleNavigate(ToolType.TRAINING)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.TRAINING ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <GraduationCap size={18} />
            <span>Gestão de Treinamento</span>
          </button>

          <button 
            onClick={() => handleNavigate(ToolType.CULTURE_ERGO)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.CULTURE_ERGO ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <Users size={18} />
            <span>Cultura & Ergonomia</span>
          </button>

          <button 
            onClick={() => handleNavigate(ToolType.MENTAL_HEALTH)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.MENTAL_HEALTH ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <Brain size={18} />
            <span>Saúde Mental (Novo)</span>
          </button>

          <div className="px-4 pb-2 pt-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Finalização</span>
          </div>
          <button 
            onClick={() => handleNavigate(ToolType.GLOBAL_REPORT)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-bold border border-emerald-700 ${activeTab === ToolType.GLOBAL_REPORT ? 'bg-emerald-700 text-white' : 'bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50'}`}
          >
            <FileCheck size={18} />
            <span>Emitir PGR Completo</span>
          </button>

          <div className="px-4 pb-2 pt-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serviços de Nuvem</span>
          </div>
          <button 
            onClick={() => handleNavigate(ToolType.SUPABASE_SYNC)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-bold border border-emerald-500/30 ${activeTab === ToolType.SUPABASE_SYNC ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' : 'bg-slate-850 text-emerald-300 hover:bg-slate-800 hover:text-emerald-100'}`}
          >
            <Database size={18} />
            <span>Nuvem Supabase</span>
          </button>

          <div className="mt-8 border-t border-slate-800 pt-4">
             <button 
                onClick={() => handleNavigate(ToolType.FAQ)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeTab === ToolType.FAQ ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
             >
                <HelpCircle size={18} />
                <span>FAQ / Ajuda</span>
             </button>
          </div>
          
          <div className="mt-4 px-4 space-y-2">
            <button 
                onClick={loadLogisticsSimulation}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-black/20"
            >
                <Package size={16} /> Carregar Simulação
            </button>
            <button 
                onClick={handleResetData}
                className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-200 p-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all border border-red-900/30"
            >
                <Trash size={14} /> Limpar Dados (Reset)
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 border border-slate-700/50">
              <p className="font-semibold text-slate-300 mb-1 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${process.env.API_KEY ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                 {process.env.API_KEY ? 'AI Connected' : 'Demo Mode'}
              </p>
              <p className="opacity-70">Fase 1: MVP</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm/50 backdrop-blur-md bg-white/90">
           <div className="flex items-center gap-3">
               <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                 {activeTab === ToolType.DASHBOARD && 'Central de Consultoria'}
                 {activeTab === ToolType.CHECKLIST && 'Diagnóstico NR-1'}
                 {activeTab === ToolType.MATURITY && 'Maturidade de Cultura'}
                 {activeTab === ToolType.RISK_TOOLS && 'Ferramentas de Risco (PGR)'}
                 {activeTab === ToolType.ACTION_PLAN && 'Plano de Ação Integrado (GRO)'}
                 {activeTab === ToolType.TRAINING && 'Educação Corporativa'}
                 {activeTab === ToolType.CULTURE_ERGO && 'Fatores Humanos & Organizacionais'}
                 {activeTab === ToolType.MENTAL_HEALTH && 'Gestão de Riscos Psicossociais'}
                 {activeTab === ToolType.GLOBAL_REPORT && 'Relatório Master Integrado'}
                 {activeTab === ToolType.FAQ && 'Perguntas Frequentes (FAQ)'}
                  {activeTab === ToolType.SUPABASE_SYNC && 'Serviço de Sincronização Supabase' }
               </h2>
               
               {/* Contextual Tutorial Button */}
               {supportedTutorialTabs.includes(activeTab) && (
                   <button 
                       onClick={() => setIsTutorialOpen(true)}
                       className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors animate-in fade-in"
                   >
                       <PlayCircle size={14} /> Tutorial Guiado
                   </button>
               )}
           </div>

           <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
              <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-medium">
                  <>
                      {/* Supabase connection real-time indicator pill */}
                      {supabaseSyncStatus === 'SUCCESS' && (
                        <span
                          onClick={() => setActiveTab(ToolType.SUPABASE_SYNC)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-[10px] font-mono font-bold rounded-full border border-emerald-500/20 transition-all mr-2"
                          title={`Sincronizado na nuvem às ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : ''}`}
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          NUVEM ATIVA
                        </span>
                      )}
                      {supabaseSyncStatus === 'SYNCING' && (
                        <span
                          onClick={() => setActiveTab(ToolType.SUPABASE_SYNC)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 text-blue-700 text-[10px] font-mono font-bold rounded-full border border-blue-500/20 mr-2"
                        >
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                          SALVANDO...
                        </span>
                      )}
                      {supabaseSyncStatus === 'ERROR' && (
                        <span
                          onClick={() => setActiveTab(ToolType.SUPABASE_SYNC)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 text-[10px] font-mono font-bold rounded-full border border-rose-500/20 transition-all animate-bounce mr-2"
                          title="Erro de conexão ou tabelas ausentes no Supabase. Clique para corrigir!"
                        >
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          ERRO ATUALIZAÇÃO
                        </span>
                      )}
                      {supabaseSyncStatus === 'OFFLINE' && (
                        <span
                          onClick={() => setActiveTab(ToolType.SUPABASE_SYNC)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-mono font-medium rounded-full border border-slate-300 transition-all mr-2"
                          title="Armazenando de forma local e offline. Clique para conectar ao Banco Supabase."
                        >
                          <span className="w-1.2 h-1.2 bg-slate-400 rounded-full" />
                          MODO LOCAL
                        </span>
                      )}
                      {company.name ? company.name : 'Selecione uma Empresa'}
                   </>
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
                NF
              </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
          
          {activeTab === ToolType.DASHBOARD && (
             <ResultsDashboard checklist={checklistData} maturity={maturityData} company={company} onNavigate={handleNavigate} />
          )}

          {activeTab === ToolType.CHECKLIST && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <ChecklistTool 
                  data={checklistData} 
                  onChange={handleChecklistChange} 
                  company={company} 
                  onCompanyChange={handleCompanyChange} 
                  onBatchUpdate={handleBatchChecklistUpdate}
                  comments={checklistComments}
                  onCommentChange={handleChecklistCommentChange}
                  customItems={customChecklistItems}
                  onAddCustomItem={handleAddCustomChecklistItem}
                  onDeleteCustomItem={handleDeleteCustomChecklistItem}
               />
            </div>
          )}

          {activeTab === ToolType.MATURITY && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <MaturityTool data={maturityData} onChange={handleMaturityChange} />
            </div>
          )}

          {activeTab === ToolType.RISK_TOOLS && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <RiskAssessmentHub company={company} risks={risks} setRisks={setRisks} actions={actions} />
            </div>
          )}

          {activeTab === ToolType.ACTION_PLAN && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <ActionPlanHub checklistData={checklistData} maturityData={maturityData} cultureSectors={cultureSectors} actions={actions} setActions={setActions} />
            </div>
          )}

          {activeTab === ToolType.TRAINING && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <TrainingHub />
            </div>
          )}

          {activeTab === ToolType.CULTURE_ERGO && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <CultureErgoHub sectors={cultureSectors} setSectors={setCultureSectors} />
            </div>
          )}

          {activeTab === ToolType.MENTAL_HEALTH && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <MentalHealthHub onAddAction={addAction} initialTab={mentalHealthInitialTab} />
            </div>
          )}

          {activeTab === ToolType.GLOBAL_REPORT && (
            <div className="animate-in slide-in-from-right-4 duration-500">
                <GlobalReportHub 
                    company={company} 
                    checklist={checklistData} 
                    maturity={maturityData} 
                    risks={risks} 
                    actions={actions}
                    checklistComments={checklistComments}
                    customChecklistItems={customChecklistItems} 
                />
            </div>
          )}

          {activeTab === ToolType.FAQ && (
            <div className="animate-in slide-in-from-right-4 duration-500">
                <FaqHub />
            </div>
          )}

          {activeTab === ToolType.SUPABASE_SYNC && (
            <div className="animate-in slide-in-from-right-4 duration-500">
                <SupabaseSyncHub 
                    company={company} 
                    checklistData={checklistData} 
                    checklistComments={checklistComments} 
                    customChecklistItems={customChecklistItems} 
                    maturityData={maturityData} 
                    actions={actions} 
                    risks={risks} 
                    cultureSectors={cultureSectors} 
                    onImportData={handleSupabaseImport} 
                />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
