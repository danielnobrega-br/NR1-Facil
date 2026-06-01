import React, { useEffect, useState } from 'react';
import { ChecklistState, MaturityState, AiAnalysis, MaturityLevel, ToolType, CompanyProfile, InternalProfile } from '../types';
import { MATURITY_ITEMS, MATURITY_LEVEL_MAP, CHECKLIST_ITEMS, GET_CNAE_DETAILS } from '../constants';
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
                   <h1 className="text-3xl font-bold">{company.name || 'Painel Geral'}</h1>
                    {company.cnpj && (
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700 select-all">
                        {company.cnpj}
                      </span>
                    )}
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

      {/* Category Analysis Panel based on CNAE */}
      {company.cnae && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                 <div>
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                         <Shield className="text-emerald-600" size={20} />
                         Enquadramento Legal & Diretrizes por Categoria (CNAE: {company.cnae})
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">
                         Análise jurídica de obrigações de SST com base na NR-1 e NR-4.
                     </p>
                 </div>
                 <div className="flex gap-2">
                     <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                         company.riskDegree === '4' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                         company.riskDegree === '3' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                         'bg-emerald-50 border-emerald-200 text-emerald-700'
                     }`}>
                         Grau de Risco {company.riskDegree} (NR-4)
                     </span>
                     <span className="text-xs font-bold px-3 py-1 rounded-full border bg-indigo-50 border-indigo-200 text-indigo-700">
                         {isMicroOrSmall ? 'Porte: ME / EPP' : 'Porte: Geral'}
                     </span>
                 </div>
             </div>

             {/* Dynamic Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                 
                 {/* Card 1: PGR Exemption Check */}
                 <div className="bg-white p-4 rounded-lg border border-slate-205 shadow-xs flex flex-col justify-between">
                     <div>
                         <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-xs uppercase text-slate-500">PGR (NR-1.8.4)</h4>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                 isMicroOrSmall && (company.riskDegree === '1' || company.riskDegree === '2')
                                     ? 'bg-emerald-100 text-emerald-800'
                                     : 'bg-rose-100 text-rose-800'
                             }`}>
                                 {isMicroOrSmall && (company.riskDegree === '1' || company.riskDegree === '2') ? 'Dispensável' : 'Obrigatório'}
                             </span>
                         </div>
                         <p className="text-xs text-slate-600 leading-relaxed">
                             {isMicroOrSmall && (company.riskDegree === '1' || company.riskDegree === '2') ? (
                                 "Isenção permitida! Por ser ME/EPP de Grau de Risco 1 ou 2, está dispensada de emitir o PGR se a análise de riscos inicial comprovar a inexistência de agentes nocivos físicos, químicos e biológicos."
                             ) : (
                                 "Elaboração 100% Obrigatória. Por possuir Grau de Risco elevado (3 ou 4) ou ser enquadrada como Grande Empresa, é indispensável estruturar e manter ativo o Programa de Gerenciamento de Riscos."
                             )}
                         </p>
                     </div>
                     <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                         <span>Ref: NR-1 Item 1.8.4</span>
                         <span className="text-emerald-600">Categoria Regulada</span>
                     </div>
                 </div>

                 {/* Card 2: PCMSO Exemption Check */}
                 <div className="bg-white p-4 rounded-lg border border-slate-205 shadow-xs flex flex-col justify-between">
                     <div>
                         <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-xs uppercase text-slate-500">PCMSO (NR-1.8.6)</h4>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                 isMicroOrSmall && (company.riskDegree === '1' || company.riskDegree === '2')
                                     ? 'bg-emerald-100 text-emerald-800'
                                     : 'bg-slate-100 text-slate-800'
                             }`}>
                                 {isMicroOrSmall && (company.riskDegree === '1' || company.riskDegree === '2') ? 'Simplificado' : 'Obrigatório'}
                             </span>
                         </div>
                         <p className="text-xs text-slate-600 leading-relaxed">
                             {isMicroOrSmall && (company.riskDegree === '1' || company.riskDegree === '2') ? (
                                 "Isenção permitida sob condições! Dispensada de emitir PCMSO se declarar a inexistência de riscos químicos, físicos, biológicos e ergonômicos. Os exames médicos ocupacionais e ASO continuam mandatórios."
                             ) : (
                                 "Emissão Obrigatória. Exige acompanhamento de médico coordenador e exames médicos admissionais, demissionais e periódicos completos vinculados ao risco mapeado no PGR."
                             )}
                         </p>
                     </div>
                     <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                         <span>Ref: NR-1 Item 1.8.6</span>
                         <span className="text-indigo-600">eSocial Link</span>
                     </div>
                 </div>

                 {/* Card 3: Categoria / Seção de Atividade */}
                 <div className="bg-white p-4 rounded-lg border border-slate-250 shadow-xs flex flex-col justify-between">
                     <div>
                         <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-xs uppercase text-slate-500">Seção Industrial / Comercial</h4>
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                 {company.sector === 'INDUSTRIA' ? 'C - Indústria' : 'G - Comércio/Serviços'}
                             </span>
                         </div>
                         <p className="text-xs text-slate-600 leading-relaxed">
                             Sua atividade econômica se enquadra na seção: <strong className="text-slate-700">{GET_CNAE_DETAILS(company.cnae)?.section || 'Geral'}</strong>.
                             Esta categoria é foco do envio periódico do evento <strong className="text-slate-700">S-2240 (eSocial)</strong>, que registra os agentes nocivos aos quais os colaboradores estão expostos.
                         </p>
                     </div>
                     <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                         <span>Ref: Decreto 3.048/99</span>
                         <span className="text-slate-600 font-bold uppercase">eSocial Ativo</span>
                     </div>
                 </div>

             </div>

             <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                 <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                 <div>
                     <span className="font-bold text-slate-800 font-semibold">Orientação Técnica de Categoria: </span>
                     Como o diagnóstico legal e a matriz PGR dependem intrinsecamente do CNAE selecionado, certifique-se de que o código localizado via consulta CNPJ na Receita Federal condiz com a atividade principal praticada no local de trabalho analisado. Divergências no enquadramento NR-4 podem acarretar em autuações severas pelo Ministério do Trabalho e Emprego.
                 </div>
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
