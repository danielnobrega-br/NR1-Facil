import React, { useEffect, useState } from 'react';
import { ChecklistState, MaturityState, AiAnalysis, MaturityLevel, ToolType, CompanyProfile, InternalProfile } from '../types';
import { MATURITY_ITEMS, MATURITY_LEVEL_MAP, CHECKLIST_ITEMS } from '../constants';
import { generateSafetyAnalysis } from '../services/geminiService';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip
} from 'recharts';
import { FileText, Target, BrainCircuit, AlertTriangle, Download, RefreshCw, Layers, Shield, Zap, GraduationCap, Users, ArrowRight, Briefcase } from 'lucide-react';

interface Props {
  checklist: ChecklistState;
  maturity: MaturityState;
  company: CompanyProfile;
  onNavigate: (tab: ToolType) => void;
}

export const ResultsDashboard: React.FC<Props> = ({ checklist, maturity, company, onNavigate }) => {
  const [analysis, setAnalysis] = useState<AiAnalysis>({
    summary: '',
    recommendations: [],
    loading: false,
    error: null
  });

  // Calculate Metrics based on 0-2 scale
  const checklistPoints = (Object.values(checklist) as number[]).reduce((a, b) => a + (b || 0), 0);
  const maxChecklistPoints = CHECKLIST_ITEMS.length * 2;
  const checklistScore = Math.round((checklistPoints / maxChecklistPoints) * 100);

  const maturityValues = Object.values(maturity) as number[];
  const maturityScore = maturityValues.length > 0
    ? maturityValues.reduce((a: number, b: number) => a + b, 0) / maturityValues.length
    : 0;
  
  const maturityLevel: MaturityLevel = MATURITY_LEVEL_MAP(maturityScore) as MaturityLevel;

  // Chart Data Preparation
  const radarData = MATURITY_ITEMS.map(item => ({
    subject: item.dimension,
    A: maturity[item.id] || 0,
    fullMark: 5,
  }));

  const pieData = [
    { name: 'Pontos Obtidos', value: checklistScore },
    { name: 'Gap', value: 100 - checklistScore },
  ];
  const pieColors = ['#10b981', '#f1f5f9'];

  const handleGenerateAnalysis = async () => {
    setAnalysis(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await generateSafetyAnalysis(checklist, maturity);
      setAnalysis({ ...result, loading: false, error: null });
    } catch (err) {
      setAnalysis(prev => ({ ...prev, loading: false, error: 'Falha ao gerar análise.' }));
    }
  };

  const isMicroOrSmall = company.perfil_interno === InternalProfile.MICRO_LITE || company.perfil_interno === InternalProfile.PEQUENA_STANDARD;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Consultant Header */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl overflow-hidden relative">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-3xl font-bold">Painel Geral</h1>
                   <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/50">
                       {company.porte_ibge || 'Nova'} Empresa
                   </span>
               </div>
               
               <p className="text-slate-300 max-w-xl">
                 Sua empresa foi classificada como <strong>{company.perfil_interno?.replace('_', ' ')}</strong>.
                 {isMicroOrSmall 
                    ? ' O sistema liberou o pacote de ferramentas simplificadas (MVP) para conformidade rápida.'
                    : ' O sistema liberou as ferramentas de gestão avançada.'}
               </p>
            </div>
            <div className="flex gap-4">
               <div className="text-center">
                  <span className="block text-4xl font-bold text-emerald-400">{checklistScore}%</span>
                  <span className="text-xs uppercase tracking-wider text-slate-400">Aderência NR-1</span>
               </div>
               <div className="w-px bg-slate-700 h-12"></div>
               <div className="text-center">
                  <span className="block text-4xl font-bold text-blue-400">{maturityScore.toFixed(1)}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-400">Maturidade</span>
               </div>
            </div>
         </div>
         {/* Background Decoration */}
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Company Summary Card with CNAE Disclaimer */}
      {company.cnae && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
             <div className="flex-1">
                 <h4 className="font-bold text-amber-900 text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
                     <AlertTriangle size={16} /> Resumo da Organização
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-amber-900">
                     <div>
                         <span className="block text-xs text-amber-700 opacity-70">CNAE Principal</span>
                         <span className="font-semibold">{company.cnae}</span>
                     </div>
                     <div>
                         <span className="block text-xs text-amber-700 opacity-70">Grau de Risco (NR-4)</span>
                         <span className="font-semibold">{company.riskDegree}</span>
                     </div>
                     <div>
                         <span className="block text-xs text-amber-700 opacity-70">Funcionários</span>
                         <span className="font-semibold">{company.employees}</span>
                     </div>
                     <div>
                         <span className="block text-xs text-amber-700 opacity-70">Perfil</span>
                         <span className="font-semibold">{company.perfil_interno}</span>
                     </div>
                 </div>
             </div>
             <div className="md:w-1/3 bg-white/50 p-3 rounded-lg text-xs text-amber-800 leading-relaxed border border-amber-100">
                 <strong>Nota Técnica:</strong> Este grau de risco é uma referência macro da atividade. 
                 O Inventário de Riscos (PGR) considera as condições reais de trabalho e deve ser elaborado especificamente para cada ambiente.
             </div>
          </div>
      )}

      {/* PRODUCT MODULES GRID */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="text-indigo-600" />
            Portfólio de Serviços (Módulos)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Module 1 */}
            <div className="bg-white p-5 rounded-xl border-2 border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => onNavigate(ToolType.CHECKLIST)}>
                <div className="flex justify-between items-start mb-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Shield size={20} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Principal</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Diagnóstico NR-1</h4>
                <p className="text-xs text-slate-500 mb-4 h-10">Checklist de conformidade legal adaptado ao seu porte (Micro/Pequena).</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600">
                        {checklistScore > 80 ? 'Concluído' : 'Acessar'}
                    </span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
            </div>

            {/* Module 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => onNavigate(ToolType.RISK_TOOLS)}>
                <div className="flex justify-between items-start mb-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Zap size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Módulo 02</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">PGR / Riscos</h4>
                <p className="text-xs text-slate-500 mb-4 h-10">Inventário de riscos por setor e geração de APR.</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Acessar Ferramentas</span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                </div>
            </div>

            {/* Module 3 */}
            <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm group ${!isMicroOrSmall ? 'cursor-pointer hover:shadow-md' : 'opacity-70 grayscale'}`} onClick={() => !isMicroOrSmall && onNavigate(ToolType.TRAINING)}>
                <div className="flex justify-between items-start mb-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <GraduationCap size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Módulo 03</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Treinamentos</h4>
                <p className="text-xs text-slate-500 mb-4 h-10">
                    {isMicroOrSmall ? 'Versão simplificada disponível em breve.' : 'Gestão de turmas e LMS completo.'}
                </p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Em Desenvolvimento (Fase 2)</span>
                    <ArrowRight size={14} className="text-slate-300" />
                </div>
            </div>

            {/* Module 4 */}
            <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm group ${!isMicroOrSmall ? 'cursor-pointer hover:shadow-md' : 'opacity-70 grayscale'}`} onClick={() => !isMicroOrSmall && onNavigate(ToolType.CULTURE_ERGO)}>
                <div className="flex justify-between items-start mb-3">
                    <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                        <Users size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Módulo 04</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Cultura & Percepção</h4>
                <p className="text-xs text-slate-500 mb-4 h-10">Fatores humanos, clima de segurança e riscos psicossociais.</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Em Desenvolvimento (Fase 2)</span>
                    <ArrowRight size={14} className="text-slate-300" />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* AI Analysis */}
         <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-6 rounded-xl shadow-lg flex-1">
                <div className="flex items-center gap-2 mb-4">
                   <BrainCircuit className="text-indigo-300" />
                   <h3 className="font-bold text-lg">Consultor IA</h3>
                </div>
                <p className="text-indigo-200 text-sm mb-6">
                    Utilize a inteligência artificial para correlacionar os dados do checklist e maturidade, gerando um plano de ação executivo.
                </p>
                
                {analysis.summary ? (
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-sm border border-white/10 animate-in fade-in">
                        <p className="italic mb-3">"{analysis.summary}"</p>
                        <ul className="list-disc pl-4 space-y-1 text-indigo-100 text-xs">
                            {analysis.recommendations.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                ) : (
                    <button 
                        onClick={handleGenerateAnalysis}
                        disabled={analysis.loading}
                        className="w-full bg-white text-indigo-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                    >
                        {analysis.loading ? <RefreshCw className="animate-spin" size={18} /> : 'Gerar Parecer Técnico'}
                    </button>
                )}
            </div>
         </div>

         {/* Mini Charts */}
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h4 className="text-sm font-bold text-slate-600 mb-4 text-center">Aderência Documental</h4>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">Baseado na pontuação total (0 a 40 pts)</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h4 className="text-sm font-bold text-slate-600 mb-4 text-center">Perfil de Maturidade</h4>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar
                        name="Maturidade"
                        dataKey="A"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        />
                        <RechartsTooltip />
                    </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
         </div>
      </div>
      
      <div className="flex justify-end">
          <button className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium">
             <Download size={16} /> Exportar Relatório Integrado (PDF)
          </button>
      </div>

    </div>
  );
};
