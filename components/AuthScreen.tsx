import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Workflow, 
  CheckCircle2, 
  Users, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { getSupabaseClient } from '../services/supabaseClient';
import { CompanyProfile, InternalProfile } from '../types';

interface AuthScreenProps {
  onSuccess: (user: { id: string; email: string; name: string; isLocal: boolean }, company?: CompanyProfile) => void;
}

const PRESET_CNAES = [
  { code: '4711-3/02', desc: 'Comércio Varejista - Geral', risk: '1' },
  { code: '5611-2/01', desc: 'Restaurantes e Similares', risk: '2' },
  { code: '4120-4/00', desc: 'Construção Cívil - Edifícios', risk: '4' },
  { code: '4930-2/02', desc: 'Transporte Rodoviário de Cargas', risk: '3' },
  { code: '8610-1/01', desc: 'Atividades Hospitalares', risk: '3' },
  { code: '2511-0/00', desc: 'Fabricação de Estruturas Metálicas', risk: '4' }
];

const STANDARD_DEPARTMENTS = [
  { id: 'admin', name: 'Administrativo' },
  { id: 'prod', name: 'Produção / Fábrica' },
  { id: 'log', name: 'Logística & Almoxarifado' },
  { id: 'manut', name: 'Manutenção Preventiva' },
  { id: 'comercial', name: 'Vendas & Comercial' },
  { id: 'rh', name: 'Recursos Humanos / DHO' },
  { id: 'oper', name: 'Operações de Campo' },
  { id: 'ti', name: 'Suporte & TI' }
];

const STANDARD_PROCESSES = [
  { id: 'nr1_diag', name: 'Auditoria de Conformidade (NR-1)', desc: 'Checklist legal completo' },
  { id: 'pgr_occupational', name: 'Inventário de Risco (PGR)', desc: 'Mapeamento de perigos e severidade' },
  { id: 'culture_ergo', name: 'Maturidade & Cultura de Segurança', desc: 'Análise de liderança e comunicação' },
  { id: 'mental_psychosocial', name: 'Saúde Mental & Riscos Psicossociais', desc: 'Pesquisa de clima organizacional COPSOQ' },
  { id: 'third_party', name: 'Gestão de Terceiros e Fornecedores', desc: 'Controle de conformidade de contratadas' }
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // Steps for Sign Up: 1 User Info, 2 Company Info, 3 Departments/Processes
  
  // User states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Company state
  const [compName, setCompName] = useState('');
  const [compCnpj, setCompCnpj] = useState('');
  const [compEmployees, setCompEmployees] = useState('');
  const [compSector, setCompSector] = useState<'COMERCIO_SERVICOS' | 'INDUSTRIA'>('COMERCIO_SERVICOS');
  const [compCnae, setCompCnae] = useState(PRESET_CNAES[0].code);
  const [compRisk, setCompRisk] = useState(PRESET_CNAES[0].risk);

  // Departments & Processes Selection
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['admin', 'prod', 'log']);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>(['nr1_diag', 'pgr_occupational', 'culture_ergo']);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [useLocalAuth, setUseLocalAuth] = useState(false);

  // Helper CNPJ formatted
  const formatCNPJ = (val: string) => {
    const rawInput = val.replace(/\D/g, '');
    if (rawInput.length <= 2) return rawInput;
    if (rawInput.length <= 5) return `${rawInput.slice(0, 2)}.${rawInput.slice(2)}`;
    if (rawInput.length <= 8) return `${rawInput.slice(0, 2)}.${rawInput.slice(2, 5)}.${rawInput.slice(5)}`;
    if (rawInput.length <= 12) return `${rawInput.slice(0, 2)}.${rawInput.slice(2, 5)}.${rawInput.slice(5, 8)}/${rawInput.slice(8)}`;
    return `${rawInput.slice(0, 2)}.${rawInput.slice(2, 5)}.${rawInput.slice(5, 8)}/${rawInput.slice(8, 12)}-${rawInput.slice(12, 14)}`;
  };

  const handleCnaeChange = (code: string) => {
    setCompCnae(code);
    const preset = PRESET_CNAES.find(c => c.code === code);
    if (preset) {
      setCompRisk(preset.risk);
    }
  };

  const toggleDept = (id: string) => {
    if (selectedDepts.includes(id)) {
      setSelectedDepts(selectedDepts.filter(d => d !== id));
    } else {
      setSelectedDepts([...selectedDepts, id]);
    }
  };

  const toggleProcess = (id: string) => {
    if (selectedProcesses.includes(id)) {
      setSelectedProcesses(selectedProcesses.filter(p => p !== id));
    } else {
      setSelectedProcesses([...selectedProcesses, id]);
    }
  };

  const handleLocalSubmit = (isSignUpFlow: boolean) => {
    setLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const localUsersSaved = localStorage.getItem('nr1_local_users');
        const localUsers = localUsersSaved ? JSON.parse(localUsersSaved) : [];

        if (isSignUpFlow) {
          // Check if user already exists
          const existing = localUsers.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
          if (existing) {
            setErrorMessage('Este e-mail já está cadastrado no banco local offline.');
            setLoading(false);
            return;
          }

          // Create localized user
          const userId = `usr_local_${Date.now()}`;
          const newUser = {
            id: userId,
            email: email.trim().toLowerCase(),
            password, // Stored safely for mock testing
            name: fullName.trim() || 'Usuário Local',
            isLocal: true
          };

          localUsers.push(newUser);
          localStorage.setItem('nr1_local_users', JSON.stringify(localUsers));

          // Generate custom company profile based on department/process wizard selection
          const presetCnae = PRESET_CNAES.find(c => c.code === compCnae);
          
          // Build branches corresponding chosen departments
          const generatedBranches = selectedDepts.map(deptId => {
            const dept = STANDARD_DEPARTMENTS.find(d => d.id === deptId);
            return {
              id: `br_${deptId}_${Date.now()}`,
              name: dept ? dept.name : 'Departamento',
              cnpj: compCnpj || '00.000.000/0001-00',
              employees: Math.max(1, Math.round(parseInt(compEmployees) / (selectedDepts.length || 1))) || 5,
              contracts: []
            };
          });

          const defaultCompany: CompanyProfile = {
            name: compName.trim() || 'Minha Empresa GRO',
            cnpj: compCnpj || '00.000.000/0001-00',
            employees: compEmployees || '10',
            sector: compSector,
            cnae: compCnae,
            cnaeDescription: presetCnae ? presetCnae.desc : 'Atividade Comercial',
            riskDegree: compRisk,
            porte_ibge: parseInt(compEmployees) < 10 ? 'Micro' : parseInt(compEmployees) < 50 ? 'Pequena' : 'Média',
            perfil_interno: parseInt(compEmployees) < 10 ? InternalProfile.MICRO_LITE : InternalProfile.PEQUENA_STANDARD,
            branches: generatedBranches
          };

          setSuccessMessage('Conta cadastrada offline com sucesso!');
          setTimeout(() => {
            onSuccess(newUser, defaultCompany);
          }, 800);
        } else {
          // Login Flow
          const matched = localUsers.find(
            (u: any) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
          );

          if (!matched) {
            setErrorMessage('E-mail ou senha incorretos (Armazenamento Local/MOCK).');
            setLoading(false);
            return;
          }

          onSuccess(matched);
        }
      } catch (err: any) {
        setErrorMessage(`Falha na autenticação local: ${err.message}`);
      }
      setLoading(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isLogin) {
      if (!email || !password) {
        setErrorMessage('Preencha e-mail e senha.');
        return;
      }
    } else {
      if (step === 1 && (!email || !password || !fullName)) {
        setErrorMessage('Preencha todas as credenciais do usuário.');
        return;
      }
      if (step === 2 && (!compName || !compCnpj || !compEmployees)) {
        setErrorMessage('Preencha os campos obrigatórios da empresa.');
        return;
      }
      if (step === 3 && selectedDepts.length === 0) {
        setErrorMessage('Selecione pelo menos 1 setor/departamento principal para a empresa.');
        return;
      }
    }

    const supabase = getSupabaseClient();
    
    // Check if we should fall back to Local Auth because Supabase is missing or user requested it
    if (!supabase || useLocalAuth) {
      handleLocalSubmit(!isLogin);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Supabase Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Find Profile metadata
          const { data: profileData } = await supabase
            .from('nr1_profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          onSuccess({
            id: data.user.id,
            email: data.user.email || email,
            name: profileData?.full_name || data.user.user_metadata?.full_name || 'Profissional SST',
            isLocal: false
          });
        }
      } else {
        // Supabase Registration Flow
        // Check SignUp steps first
        if (step < 3) {
          setStep(step + 1);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Construct default company profile and branches based on wizard setup
          const presetCnae = PRESET_CNAES.find(c => c.code === compCnae);
          const generatedBranches = selectedDepts.map(deptId => {
            const dept = STANDARD_DEPARTMENTS.find(d => d.id === deptId);
            return {
              id: `br_${deptId}_${Date.now()}`,
              name: dept ? dept.name : 'Departamento',
              cnpj: compCnpj,
              employees: Math.max(1, Math.round(parseInt(compEmployees) / (selectedDepts.length || 1))) || 5,
              contracts: []
            };
          });

          const defaultCompany: CompanyProfile = {
            name: compName.trim(),
            cnpj: compCnpj,
            employees: compEmployees,
            sector: compSector,
            cnae: compCnae,
            cnaeDescription: presetCnae ? presetCnae.desc : 'Atividade Cadastrada',
            riskDegree: compRisk,
            porte_ibge: parseInt(compEmployees) < 10 ? 'Micro' : parseInt(compEmployees) < 50 ? 'Pequena' : 'Média',
            perfil_interno: parseInt(compEmployees) < 10 ? InternalProfile.MICRO_LITE : InternalProfile.PEQUENA_STANDARD,
            branches: generatedBranches
          };

          // Save the profile row immediately to guarantee PostgreSQL references match
          await supabase.from('nr1_profiles').upsert({
            id: data.user.id,
            email: email.trim().toLowerCase(),
            full_name: fullName.trim(),
            updated_at: new Date().toISOString()
          });

          setSuccessMessage('Conta cadastrada com sucesso! Sincronizando dados...');
          setTimeout(() => {
            if (data.user) {
              onSuccess({
                id: data.user.id,
                email: data.user.email || email,
                name: fullName.trim(),
                isLocal: false
              }, defaultCompany);
            }
          }, 1200);
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      setErrorMessage(err.message || 'Houve um erro técnico. Você pode tentar utilizar o Modo Local persistente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToLocal = () => {
    setUseLocalAuth(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!isLogin && step > 1) {
      setStep(1);
    }
  };

  const handleBackToSupabase = () => {
    setUseLocalAuth(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[480px] h-[480px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-3xl overflow-hidden relative z-10 transition-all duration-300">
        
        {/* Banner/Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-8 text-center border-b border-slate-800/80 relative">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 animate-pulse">
            <ShieldCheck className="text-slate-950" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SafetyDiagnostic NR-1</h1>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Plataforma Corporativa de Diagnósticos de Conformidade NR-1 e Gestão Integrada de Riscos (GRO/PGR)
          </p>

          <div className="absolute top-4 right-4">
            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
              useLocalAuth 
                ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' 
                : 'bg-emerald-950/45 text-emerald-400 border-emerald-900/50'
            }`}>
              {useLocalAuth ? 'Modo Local' : 'Supabase Link'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5 text-rose-400" size={18} />
              <div className="space-y-1">
                <p className="font-bold">Aviso / Erro de Login</p>
                <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
                {!useLocalAuth && (
                  <button 
                    type="button" 
                    onClick={handleSkipToLocal}
                    className="mt-1.5 text-xs text-amber-400 font-bold hover:underline block"
                  >
                    👉 Forçar Modo Local (Offline/LocalStorage)
                  </button>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm flex items-start gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-400" size={18} />
              <p className="leading-relaxed font-bold">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* LOGIN FLOW */}
            {isLogin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail Profissional</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu.nome@empresa.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
                    />
                    <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha de Acesso</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
                    />
                    <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER FLOW (SIGN UP) */}
            {!isLogin && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Progresso do Cadastro</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-black">
                    <span className={step >= 1 ? 'text-emerald-400' : 'text-slate-600'}>1</span>
                    <span className="text-slate-700">/</span>
                    <span className={step >= 2 ? 'text-emerald-400' : 'text-slate-600'}>2</span>
                    <span className="text-slate-700">/</span>
                    <span className={step >= 3 ? 'text-emerald-400' : 'text-slate-600'}>3</span>
                  </div>
                </div>

                {/* STEP 1: LOGIN CREDENTIALS */}
                {step === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                    <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">Informações de Credenciais</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Ex: Dr. Leandro Santos"
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
                        />
                        <User className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail Corporativo</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="exemplo@email.com"
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
                        />
                        <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configure uma Senha</label>
                      <div className="relative">
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
                        />
                        <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: COMPANY INFO */}
                {step === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                    <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">Informações da Empresa Responsável</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Razão Social / Nome Fantasia</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          required
                          value={compName}
                          onChange={e => setCompName(e.target.value)}
                          placeholder="Ex: Metalúrgica Alfa S/A"
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
                        />
                        <Building2 className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CNPJ Matriz</label>
                        <input 
                          type="text" 
                          required
                          value={compCnpj}
                          maxLength={18}
                          onChange={e => setCompCnpj(formatCNPJ(e.target.value))}
                          placeholder="00.000.000/0001-00"
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs font-mono transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nº Funcionários</label>
                        <input 
                          type="number" 
                          required
                          value={compEmployees}
                          onChange={e => setCompEmployees(e.target.value)}
                          placeholder="Quantidade"
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Setor Principal</label>
                        <select 
                          value={compSector}
                          onChange={e => setCompSector(e.target.value as any)}
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs transition-all"
                        >
                          <option value="COMERCIO_SERVICOS">Comércio & Serviços</option>
                          <option value="INDUSTRIA">Indústria Geral</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CNAE Sugerido</label>
                        <select 
                          value={compCnae}
                          onChange={e => handleCnaeChange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs transition-all"
                        >
                          {PRESET_CNAES.map(c => (
                            <option key={c.code} value={c.code}>{c.code} ({c.desc.slice(0, 15)}...)</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>CNAE: <strong className="text-emerald-400">{compCnae}</strong></span>
                      <span>Grau de Risco (SST): <strong className={parseInt(compRisk) >= 3 ? 'text-rose-400' : 'text-emerald-400'}>NR-{compRisk}</strong></span>
                      <span>Enquadramento: <strong>{parseInt(compEmployees) < 20 ? 'ME / EPP' : 'Empresa Geral'}</strong></span>
                    </div>
                  </div>
                )}

                {/* STEP 3: DEPARTMENTS & SPECIAL PROCESSES FOR THE CLIENT */}
                {step === 3 && (
                  <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-1.5">Estrutura de Departamentos / Setores</h3>
                      <p className="text-[10px] text-slate-400 mt-1 mb-3">
                        Selecione as divisões internas e departamentos da empresa responsável para mapeamento de frentes de trabalho.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 p-0.5">
                        {STANDARD_DEPARTMENTS.map(dept => {
                          const isSelected = selectedDepts.includes(dept.id);
                          return (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => toggleDept(dept.id)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                                isSelected 
                                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300' 
                                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                              {dept.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-1.5">Processos SST Diferenciados exigidos</h3>
                      <p className="text-[10px] text-slate-400 mt-1 mb-3">
                        Selecione quais metodologias e processos de auditoria serão delegados a este cliente individualmente.
                      </p>
                      
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1 p-0.5 text-xs">
                        {STANDARD_PROCESSES.map(proc => {
                          const isSelected = selectedProcesses.includes(proc.id);
                          return (
                            <button
                              key={proc.id}
                              type="button"
                              onClick={() => toggleProcess(proc.id)}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left font-medium transition-all ${
                                isSelected 
                                  ? 'bg-slate-950 border-emerald-500/60 text-slate-200' 
                                  : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:border-slate-800'
                              }`}
                            >
                              <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                                  : 'border-slate-600'
                              }`}>
                                {isSelected && <span className="text-[10px] font-bold">✓</span>}
                              </div>
                              <div>
                                <p className="font-bold text-xs">{proc.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-normal">{proc.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-3">
              {isLogin ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-sm py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Autenticando...' : 'Acessar Central SST'}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <div className="flex gap-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-3.5 rounded-xl"
                    >
                      Voltar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-xs py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 text-center"
                  >
                    {loading ? (
                      'Gravando...'
                    ) : step < 3 ? (
                      <>Seguinte <ArrowRight size={14} /></>
                    ) : (
                      'Concluir & Criar Matriz'
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* TOGGLE FLOW LINK */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              {isLogin ? 'Profissional autônomo ou nova empresa?' : 'Já possui uma conta de acesso corporativa?'}
              {' '}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setStep(1);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                {isLogin ? 'Cadastre-se aqui' : 'Faça login'}
              </button>
            </p>

            {useLocalAuth ? (
              <button
                type="button"
                onClick={handleBackToSupabase}
                className="text-[10px] text-slate-500 hover:text-slate-300 block w-full text-center hover:underline"
              >
                🔄 Voltar para a Sincronização Supabase Cloud
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkipToLocal}
                className="text-[10px] text-slate-500 hover:text-slate-300 block w-full text-center hover:underline"
              >
                ⚠️ Testar com Banco Local (Offline/LocalStorage)
              </button>
            )}
          </div>

        </div>

        {/* Footer info about company isolation and safety processes */}
        <div className="bg-slate-950 p-4 border-t border-slate-850 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <Workflow size={12} className="text-emerald-500/60" />
          <span>Isolamento e controle de dados ativado com o campo <strong>id_cliente</strong>.</span>
        </div>

      </div>
    </div>
  );
};
