
import React, { useState, useRef } from 'react';
import { MentalHealthQuestion, MentalHealthThermometerItem, ActionPlanItem, PsychosocialRisk } from '../types';
import { MENTAL_HEALTH_QUESTIONS, MENTAL_HEALTH_LEGAL } from '../constants';
import { generatePsychosocialRisks } from '../services/geminiService';
import { Brain, HeartPulse, Activity, AlertTriangle, ShieldCheck, CheckCircle2, Lock, FilePlus, ChevronRight, Info, BarChart4, RotateCcw, Mail, Upload, FileSpreadsheet, Send, X, Users, Loader2, UserPlus, Trash2, Link as LinkIcon, Copy, ExternalLink, Check, Zap, Armchair, PieChart, Radar, MessageCircle, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface Props {
  onAddAction: (action: Omit<ActionPlanItem, 'id' | 'status'>) => void;
  initialTab?: 'SURVEY' | 'DASHBOARD' | 'CAMPAIGN' | 'ANALYSIS';
}

export const MentalHealthHub: React.FC<Props> = ({ onAddAction, initialTab = 'ANALYSIS' }) => {
  const [activeTab, setActiveTab] = useState<'SURVEY' | 'DASHBOARD' | 'CAMPAIGN' | 'ANALYSIS'>(initialTab);
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2">
         <button
          onClick={() => setActiveTab('ANALYSIS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ANALYSIS' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap size={18} />
          AEP (Avaliação Preliminar)
        </button>
         <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'DASHBOARD' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity size={18} />
          Painel de Gestão (GRO)
        </button>
        <button
          onClick={() => setActiveTab('CAMPAIGN')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'CAMPAIGN' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail size={18} />
          Campanhas de Envio
        </button>
        <button
          onClick={() => setActiveTab('SURVEY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'SURVEY' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain size={18} />
          Teste Individual
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'ANALYSIS' && <PsychosocialRiskAnalyzer />}
        {activeTab === 'SURVEY' && <EmployeeSurvey />}
        {activeTab === 'DASHBOARD' && <ManagementDashboard onAddAction={onAddAction} />}
        {activeTab === 'CAMPAIGN' && <CampaignManager />}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const PsychosocialRiskAnalyzer: React.FC = () => {
  const [role, setRole] = useState('');
  const [risks, setRisks] = useState<PsychosocialRisk[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const result = await generatePsychosocialRisks(role);
      setRisks(result);
    } catch (e) {
      alert("Erro ao analisar riscos. Verifique a API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Brain className="text-violet-600" />
          AEP - Fatores de Riscos Psicossociais (IA)
        </h3>
        <p className="text-slate-600 text-sm mb-4 max-w-2xl">
          Utilize a IA para identificar fatores de risco psicossociais (perigos) na organização do trabalho, atendendo à <strong>Portaria MTE nº 1.419/2024</strong> e <strong>NR-17</strong>.
        </p>
        <div className="flex gap-2 max-w-xl">
          <input 
            type="text" 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Ex: Operador de Telemarketing, Motorista de Caminhão, Enfermeiro..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Analisar (AEP)'}
          </button>
        </div>
      </div>

      {risks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
           {risks.map((risk, idx) => (
             <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col">
                <div className="flex items-start justify-between mb-3">
                   <h4 className="font-bold text-slate-800 text-md">{risk.factor}</h4>
                   <div className="bg-violet-100 p-2 rounded-full text-violet-600 shrink-0">
                      <Brain size={16} />
                   </div>
                </div>
                <p className="text-slate-600 text-sm mb-4 min-h-[40px] flex-1">{risk.description}</p>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg mt-auto">
                   <p className="text-xs font-bold text-emerald-700 uppercase mb-1 flex items-center gap-1">
                      <Armchair size={12} /> Sugestão Organizacional
                   </p>
                   <p className="text-emerald-800 text-xs">{risk.mitigation}</p>
                </div>
             </div>
           ))}
        </div>
      ) : (
        !loading && (
          <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
             <HeartPulse size={48} className="mx-auto text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Nenhuma análise gerada.</p>
             <p className="text-xs text-slate-400 mt-1">Informe a função para identificar perigos como sobrecarga, assédio ou falta de autonomia.</p>
          </div>
        )
      )}
    </div>
  );
};

interface CampaignEmployee {
    id: string;
    name: string;
    email: string;
    status: 'WAITING' | 'GENERATED';
    link?: string;
}

const CampaignManager: React.FC = () => {
    const [employees, setEmployees] = useState<CampaignEmployee[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    
    // Manual Entry State
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string) => {
        const lines = text.split('\n');
        const newEmployees: CampaignEmployee[] = [];
        
        // Skip header
        let startIndex = 0;
        if (lines[0] && lines[0].toLowerCase().includes('email')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Detect delimiter
            const parts = line.split(/[;,]/);
            
            if (parts.length >= 2) {
                const p1 = parts[0].trim();
                const p2 = parts[1].trim();
                let name = p1;
                let email = p2;
                
                // Swap if email is first
                if (p1.includes('@')) { name = p2 || 'Colaborador'; email = p1; }
                
                if (email.includes('@')) {
                    newEmployees.push({ 
                        id: Math.random().toString(36).substr(2, 9),
                        name, email, status: 'WAITING'
                    });
                }
            }
        }
        return newEmployees;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        const isTextBased = file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt');

        if (isTextBased) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const parsed = parseCSV(text);
                setEmployees(prev => [...prev, ...parsed]);
                setIsProcessingFile(false);
            };
            reader.readAsText(file);
        } else {
            // PDF/Excel Simulation
            setTimeout(() => {
                const newEmployees: CampaignEmployee[] = [
                    { id: Math.random().toString(36).substr(2, 9), name: 'Carlos Mendes', email: 'carlos.m@empresa.com', status: 'WAITING' },
                    { id: Math.random().toString(36).substr(2, 9), name: 'Ana Souza', email: 'ana.s@empresa.com', status: 'WAITING' },
                    { id: Math.random().toString(36).substr(2, 9), name: 'Roberto Lima', email: 'roberto.l@empresa.com', status: 'WAITING' }
                ];
                setEmployees(prev => [...prev, ...newEmployees]);
                setIsProcessingFile(false);
            }, 1500);
        }
        
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    };

    const handleManualAdd = () => {
        if (!manualName || !manualEmail) return;
        if (!manualEmail.includes('@')) {
            alert("E-mail inválido.");
            return;
        }
        setEmployees(prev => [...prev, { 
            id: Math.random().toString(36).substr(2, 9),
            name: manualName, 
            email: manualEmail,
            status: 'WAITING'
        }]);
        setManualName('');
        setManualEmail('');
    };

    const handleRemove = (id: string) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
    };

    const handleGenerateLinks = () => {
        setIsGenerating(true);
        // Correctly capture the base URL and sanitize it for preview environments
        let baseUrl = window.location.href.split('?')[0].split('#')[0];
        
        // Remove 'blob:' prefix if present (common in cloud previews)
        if (baseUrl.startsWith('blob:')) {
            baseUrl = baseUrl.replace('blob:', '');
        }
        
        setTimeout(() => {
            setEmployees(prev => prev.map(emp => ({
                ...emp,
                status: 'GENERATED',
                // Using Hash (#) routing instead of Query (?) to avoid 404s in static/preview hosting
                link: `${baseUrl}#module=mental_health&survey_user=${encodeURIComponent(emp.email)}`
            })));
            setIsGenerating(false);
        }, 1500);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openMailClient = (emp: CampaignEmployee) => {
        if (!emp.link) return;
        const subject = encodeURIComponent("Convite: Pesquisa de Saúde Mental (Confidencial)");
        const body = encodeURIComponent(`Olá ${emp.name},\n\nSua participação é fundamental para melhorarmos nosso ambiente de trabalho.\n\nPor favor, responda a pesquisa de riscos psicossociais através do link abaixo (totalmente anônimo):\n\n${emp.link}\n\nAtenciosamente,\nEquipe de Segurança.`);
        window.open(`mailto:${emp.email}?subject=${subject}&body=${body}`, '_blank');
    };

    const openWhatsApp = (emp: CampaignEmployee) => {
        if (!emp.link) return;
        const message = encodeURIComponent(`Olá ${emp.name}! Gostaria de te convidar para nossa pesquisa de clima e saúde mental. É rápido e 100% anônimo. Acesse: ${emp.link}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Mail className="text-violet-600" /> Configurar Envio
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                        Adicione os colaboradores para gerar os links individuais da pesquisa.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                        <p className="text-xs text-amber-800 font-medium flex gap-2">
                            <Info className="shrink-0 mt-0.5" size={14} />
                            <span>
                                <strong>Modo Demonstração:</strong> O sistema gera links compatíveis com seu ambiente de preview.
                            </span>
                        </p>
                    </div>

                    <div 
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isProcessingFile ? 'bg-violet-50 border-violet-300' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                        onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                    >
                        {isProcessingFile ? (
                            <div className="flex flex-col items-center">
                                <Loader2 size={32} className="animate-spin text-violet-600 mb-2" />
                                <p className="text-sm font-bold text-violet-700">Processando arquivo...</p>
                                <p className="text-xs text-violet-500">Extraindo dados</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-center gap-2 mb-2">
                                    <FileText className="text-slate-400" size={20} />
                                    <FileSpreadsheet className="text-slate-400" size={20} />
                                </div>
                                <p className="text-sm font-bold text-slate-700">Importar Lista (PDF/Excel)</p>
                                <p className="text-[10px] text-slate-400 mt-1">Suporta: .pdf, .xlsx, .csv, .txt</p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".csv,.txt,.pdf,.xlsx,.xls" 
                                    onChange={handleFileUpload}
                                />
                            </>
                        )}
                    </div>

                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase">Ou Cadastro Manual</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nome</label>
                            <input 
                                type="text"
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                                placeholder="Nome do Colaborador"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">E-mail</label>
                            <input 
                                type="email"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                                placeholder="email@empresa.com"
                            />
                        </div>
                        <button 
                            onClick={handleManualAdd}
                            disabled={!manualName || !manualEmail}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <UserPlus size={16} /> Adicionar
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Users size={18} /> Lista de Destinatários
                        </h3>
                        <span className="bg-white text-slate-600 text-xs font-bold px-2 py-1 rounded border border-slate-200">
                            {employees.length} Pessoas
                        </span>
                    </div>

                    <div className="flex-1 p-0 overflow-y-auto max-h-[500px]">
                        {employees.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                                <p>Nenhum colaborador adicionado.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-slate-500 text-xs uppercase sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="px-4 py-3">Colaborador</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50 group">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-800">{emp.name}</p>
                                                <p className="text-xs text-slate-500">{emp.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.status === 'GENERATED' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <LinkIcon size={12} /> Link Gerado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                        Aguardando
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {emp.status === 'GENERATED' && emp.link ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => copyToClipboard(emp.link!, emp.id)}
                                                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-violet-500 hover:text-violet-600 transition-colors"
                                                            title="Copiar Link"
                                                        >
                                                            {copiedId === emp.id ? <Check size={16} className="text-emerald-500"/> : <Copy size={16} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => openMailClient(emp)}
                                                            className="p-2 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1"
                                                            title="Enviar por E-mail (Outlook/Gmail)"
                                                        >
                                                            <Mail size={16} /> 
                                                        </button>
                                                        <button 
                                                            onClick={() => openWhatsApp(emp)}
                                                            className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors flex items-center gap-1"
                                                            title="Enviar por WhatsApp"
                                                        >
                                                            <MessageCircle size={16} /> 
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRemove(emp.id)}
                                                        className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        <p className="text-xs text-slate-500 italic">
                            * Gera links seguros e únicos para cada participante.
                        </p>
                        <button 
                            onClick={handleGenerateLinks}
                            disabled={employees.length === 0 || isGenerating || employees.every(e => e.status === 'GENERATED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            {isGenerating ? (
                                <><Loader2 className="animate-spin" size={18} /> Gerando Links...</>
                            ) : (
                                <><LinkIcon size={18} /> Gerar Links de Acesso</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmployeeSurvey: React.FC = () => {
    const [step, setStep] = useState<'DISCLAIMER' | 'QUESTIONS' | 'DONE'>('DISCLAIMER');
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [consent, setConsent] = useState(false);
    const [personalResults, setPersonalResults] = useState<{dimension: string, riskScore: number}[]>([]);

    const calculateResults = () => {
        const scores: Record<string, { total: number; count: number }> = {};
        
        MENTAL_HEALTH_QUESTIONS.forEach(q => {
            const answer = answers[q.id];
            if (answer) {
                // Calculate Risk Score (1 = Low Risk, 5 = High Risk)
                // If reverseScore is true (Negative Question): 5 is High Risk.
                // If reverseScore is false (Positive Question): 1 is High Risk (so we invert: 6 - answer).
                let riskValue = answer;
                if (!q.reverseScore) {
                    riskValue = 6 - answer;
                }

                if (!scores[q.category]) scores[q.category] = { total: 0, count: 0 };
                scores[q.category].total += riskValue;
                scores[q.category].count += 1;
            }
        });

        return Object.entries(scores).map(([cat, data]) => ({
            dimension: cat,
            riskScore: data.total / data.count
        })).sort((a, b) => b.riskScore - a.riskScore); // Sort by highest risk
    };

    const handleSubmit = () => {
        const results = calculateResults();
        setPersonalResults(results);
        setStep('DONE');
    };

    const handleReset = () => {
        setAnswers({});
        setStep('DISCLAIMER');
        setConsent(false);
        setPersonalResults([]);
    };

    if (step === 'DONE') {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Respostas Enviadas!</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Obrigado por contribuir. Abaixo está um resumo confidencial da sua percepção de risco.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Activity size={18} /> Seu Termômetro de Risco (Autopercepção)
                    </h4>
                    <div className="space-y-4">
                        {personalResults.map((res, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">{res.dimension}</span>
                                    <span className={`font-bold ${
                                        res.riskScore >= 3.5 ? 'text-rose-600' : 
                                        res.riskScore >= 2.5 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                        {res.riskScore >= 3.5 ? 'Alto Risco' : 
                                         res.riskScore >= 2.5 ? 'Moderado' : 'Baixo Risco'}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                            res.riskScore >= 3.5 ? 'bg-rose-500' : 
                                            res.riskScore >= 2.5 ? 'bg-amber-400' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${(res.riskScore / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 text-center">
                        Este resultado é apenas para sua visualização e não substitui avaliação profissional. 
                        Se sentir necessidade, procure o setor de Saúde Ocupacional.
                    </p>
                </div>

                <div className="text-center">
                    <button 
                        onClick={handleReset}
                        className="text-slate-500 hover:text-violet-600 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <RotateCcw size={16} /> Iniciar Nova Avaliação
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'DISCLAIMER') {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="text-center mb-8">
                     <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={28} />
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800">Termo de Consentimento</h2>
                </div>
                
                <div className="space-y-6 text-sm text-slate-600 bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6 max-h-[400px] overflow-y-auto">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">{MENTAL_HEALTH_LEGAL.INTRO_TITLE}</h4>
                        <p className="whitespace-pre-line">{MENTAL_HEALTH_LEGAL.INTRO_TEXT}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">{MENTAL_HEALTH_LEGAL.PRIVACY_TITLE}</h4>
                        <p className="whitespace-pre-line">{MENTAL_HEALTH_LEGAL.PRIVACY_TEXT}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-8 p-4 border border-violet-100 bg-violet-50/50 rounded-lg cursor-pointer" onClick={() => setConsent(!consent)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${consent ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {consent && <CheckCircle2 size={14} />}
                    </div>
                    <span className="text-sm font-medium text-slate-700 select-none">Li e concordo em participar desta pesquisa.</span>
                </div>

                <button 
                    onClick={() => setStep('QUESTIONS')}
                    disabled={!consent}
                    className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex justify-center items-center gap-2"
                >
                    Iniciar Questionário <ChevronRight size={18} />
                </button>
            </div>
        )
    }

    // Group questions by dimension
    const groupedQuestions = MENTAL_HEALTH_QUESTIONS.reduce((acc, q) => {
        if (!acc[q.category]) acc[q.category] = [];
        acc[q.category].push(q);
        return acc;
    }, {} as Record<string, typeof MENTAL_HEALTH_QUESTIONS>);

    const progress = (Object.keys(answers).length / MENTAL_HEALTH_QUESTIONS.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            
            {/* Header / Progress */}
            <div className="sticky top-20 z-10 bg-white/95 backdrop-blur shadow-sm p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                     <h3 className="font-bold text-slate-800">Avaliação de Riscos Psicossociais</h3>
                     <p className="text-xs text-slate-500">Responda com sinceridade (Likert 1-5)</p>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[150px]">
                    <span className="text-xs font-bold text-violet-600">{Math.round(progress)}% Concluído</span>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Questions Form */}
            <div className="space-y-8">
                {Object.entries(groupedQuestions).map(([category, questions]) => (
                    <div key={category} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                        <h4 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <span className="w-1 h-6 bg-violet-500 rounded-full"></span>
                            {category}
                        </h4>
                        <div className="space-y-8">
                            {questions.map((q) => (
                                <div key={q.id} className="space-y-3">
                                    <p className="font-medium text-slate-800 leading-relaxed">{q.question}</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setAnswers(prev => ({...prev, [q.id]: val}))}
                                                className={`py-3 rounded-lg text-sm font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                                                    answers[q.id] === val 
                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md transform scale-105' 
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
                                                }`}
                                            >
                                                <span className="text-lg">{val}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 px-1 font-medium uppercase tracking-wide">
                                        <span>Discordo Totalmente</span>
                                        <span>Concordo Totalmente</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < MENTAL_HEALTH_QUESTIONS.length}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                Enviar Respostas e Ver Resultado
            </button>

            <p className="text-[10px] text-slate-400 text-center px-8">
                {MENTAL_HEALTH_LEGAL.FOOTER_SHORT}
            </p>
        </div>
    );
};

const ManagementDashboard: React.FC<Props> = ({ onAddAction }) => {
    const [chartType, setChartType] = useState<'BAR' | 'RADAR'>('BAR');

    // Consolidated Mock Data using the 4 dimensions
    const riskData = [
        { dimension: 'Carga de Trabalho', score: 3.8, fullMark: 5 }, // High Risk
        { dimension: 'Autonomia', score: 2.5, fullMark: 5 }, // Medium
        { dimension: 'Apoio Social', score: 1.8, fullMark: 5 }, // Low Risk
        { dimension: 'Bem-estar', score: 2.2, fullMark: 5 }, // Low
    ];

    const getRiskLevel = (score: number) => {
        if (score >= 3.5) return { label: 'Alto Risco', color: '#e11d48', bg: 'bg-rose-100 text-rose-800' };
        if (score >= 2.5) return { label: 'Risco Moderado', color: '#f59e0b', bg: 'bg-amber-100 text-amber-800' };
        return { label: 'Baixo Risco', color: '#10b981', bg: 'bg-emerald-100 text-emerald-800' };
    };

    const handleGenerateActions = () => {
        let count = 0;
        riskData.forEach(item => {
            if (item.score >= 3.5) {
                onAddAction({
                    origin: 'PSYCHOSOCIAL',
                    description: `Intervenção em ${item.dimension}: Score Crítico (${item.score}). Revisar processos e dimensionamento (Ref: Guia NR-1 2025).`,
                    responsible: 'RH / SESMT',
                    deadline: '30 dias',
                    priority: 'HIGH',
                });
                count++;
            } else if (item.score >= 2.5) {
                onAddAction({
                    origin: 'PSYCHOSOCIAL',
                    description: `Melhoria em ${item.dimension}: Score Moderado (${item.score}). Rodas de conversa e feedback.`,
                    responsible: 'Liderança',
                    deadline: '60 dias',
                    priority: 'MEDIUM',
                });
                count++;
            }
        });
        alert(`${count} ações foram geradas e inseridas no Plano de Ação PGR.`);
    };

    // Calculate overall average
    const averageScore = riskData.reduce((acc, curr) => acc + curr.score, 0) / riskData.length;

    return (
        <div className="space-y-6">
            
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                        <h4 className="text-slate-500 text-xs font-bold uppercase mb-2">Índice Global de Risco</h4>
                        <div className="flex items-end gap-2">
                            <span className={`text-4xl font-bold ${averageScore >= 3.5 ? 'text-rose-500' : averageScore >= 2.5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {averageScore.toFixed(1)}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mb-1">Média</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                        Baseado nas 4 categorias-chave
                    </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                     {riskData.map((item, idx) => {
                         const level = getRiskLevel(item.score);
                         return (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <AlertTriangle size={16} className={item.score >= 3.5 ? 'text-rose-500' : 'text-amber-500'} />
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${level.bg}`}>{level.label}</span>
                                </div>
                                <h5 className="font-bold text-slate-700 text-sm truncate" title={item.dimension}>{item.dimension}</h5>
                                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full" style={{ width: `${(item.score/5)*100}%`, backgroundColor: level.color }}></div>
                                </div>
                            </div>
                         )
                     })}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Detailed Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                             <BarChart4 size={18} className="text-slate-400"/> Diagnóstico por Fator de Risco
                        </h4>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button 
                                onClick={() => setChartType('BAR')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartType === 'BAR' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Barras
                            </button>
                            <button 
                                onClick={() => setChartType('RADAR')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartType === 'RADAR' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Radar
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'BAR' ? (
                                <BarChart data={riskData} layout="vertical" margin={{left: 40, right: 20}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 5]} hide />
                                    <YAxis dataKey="dimension" type="category" width={100} tick={{fontSize: 11, fontWeight: 500}} />
                                    <Tooltip 
                                        formatter={(value: number) => [value.toFixed(1), 'Risco']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                    />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                                        {riskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getRiskLevel(entry.score).color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                    <Radar
                                        name="Risco Psicossocial"
                                        dataKey="score"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="#a78bfa"
                                        fillOpacity={0.4}
                                    />
                                    <Tooltip formatter={(value: number) => [value.toFixed(1), 'Risco']} />
                                </RadarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded"></div> 1.0 - 2.4 (Baixo)</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded"></div> 2.5 - 3.4 (Moderado)</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-600 rounded"></div> 3.5 - 5.0 (Alto)</span>
                    </div>
                </div>

                {/* Info & Legal */}
                <div className="lg:col-span-1 space-y-6">
                     
                     {/* Critical Areas Highlight */}
                     <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
                        <h4 className="text-rose-800 font-bold text-sm mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} /> Áreas Críticas ({'>'} 3.5)
                        </h4>
                        <ul className="space-y-2">
                            {riskData.filter(r => r.score >= 3.5).map((r, i) => (
                                <li key={i} className="text-xs text-rose-700 bg-white p-2 rounded border border-rose-100 flex justify-between items-center">
                                    <span>{r.dimension}</span>
                                    <span className="font-bold">{r.score}</span>
                                </li>
                            ))}
                            {riskData.every(r => r.score < 3.5) && (
                                <li className="text-xs text-emerald-600 italic">Nenhuma área crítica identificada.</li>
                            )}
                        </ul>
                     </div>

                     {/* Action Box */}
                     <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                        <div className="mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-lg">
                                <ShieldCheck className="text-emerald-400" />
                                Plano de Ação PGR
                            </h3>
                            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                A NR-1 exige que riscos psicossociais sejam controlados (item 1.5.3.2.1). Com base no diagnóstico atual, o sistema pode sugerir intervenções organizacionais.
                            </p>
                        </div>
                        <button 
                            onClick={handleGenerateActions}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50 text-sm"
                        >
                            <FilePlus size={18} />
                            Gerar Ações Automaticamente
                        </button>
                    </div>

                    {/* Legal Notice */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold uppercase tracking-wider">
                            <Info size={14} /> Nota Legal
                        </div>
                        Este painel reflete dados agregados e anônimos. Os resultados indicam a percepção coletiva sobre fatores organizacionais e não devem ser usados para diagnóstico clínico individual de transtornos mentais.
                    </div>
                </div>
            </div>
        </div>
    );
};
