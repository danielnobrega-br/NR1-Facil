import React, { useState } from 'react';
import { ClimateQuestion, PsychosocialRisk, SurveyQuestion, SectorAnalysis } from '../types';
import { generatePsychosocialRisks, generateRiskPerceptionSurvey } from '../services/geminiService';
import { RISK_PERCEPTION_ITEMS } from '../constants';
import { HeartPulse, Brain, Eye, Thermometer, Loader2, MessageSquare, Armchair, BarChart4, Radar, QrCode, Link as LinkIcon, Users, PieChart, ArrowUpRight, CheckCircle2, Download, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export const CultureErgoHub: React.FC<{sectors: SectorAnalysis[], setSectors: React.Dispatch<React.SetStateAction<SectorAnalysis[]>>}> = ({ sectors, setSectors }) => {
  const [activeTab, setActiveTab] = useState<'CLIMATE' | 'PERCEPTION' | 'PSYCHO'>('CLIMATE');

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('CLIMATE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'CLIMATE' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Thermometer size={18} />
          Escala de Clima (NOSACQ-50 Adaptada)
        </button>
        <button
          onClick={() => setActiveTab('PERCEPTION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'PERCEPTION' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye size={18} />
          Percepção & Cultura
        </button>
        <button
          onClick={() => setActiveTab('PSYCHO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'PSYCHO' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain size={18} />
          Psicossocial (NR-1/NR-17)
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'CLIMATE' && <SafetyClimateTool />}
        {activeTab === 'PERCEPTION' && <RiskPerceptionDashboard sectors={sectors} setSectors={setSectors} />}
        {activeTab === 'PSYCHO' && <PsychosocialErgoTool />}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const CLIMATE_QUESTIONS: ClimateQuestion[] = [
  { id: 'q1', statement: 'A liderança da empresa demonstra compromisso real com a segurança, não apenas em discurso.', category: 'Liderança' },
  { id: 'q2', statement: 'Meus supervisores elogiam comportamentos seguros e não apenas a rapidez na produção.', category: 'Liderança' },
  { id: 'q3', statement: 'Sinto que tenho voz ativa para sugerir melhorias de segurança sem medo de represálias.', category: 'Participação' },
  { id: 'q4', statement: 'Eu e meus colegas cuidamos da segurança uns dos outros durante as tarefas.', category: 'Participação' },
  { id: 'q5', statement: 'Os procedimentos de trabalho (PGR) refletem os riscos reais que enfrentamos no dia a dia.', category: 'Gestão de Riscos' },
  { id: 'q6', statement: 'As ferramentas e equipamentos de proteção fornecidos são adequados e estão em bom estado.', category: 'Gestão de Riscos' },
];

const SafetyClimateTool: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const calculateResults = () => {
      const cats: Record<string, {sum: number, count: number}> = {
          'Liderança': {sum: 0, count: 0},
          'Participação': {sum: 0, count: 0},
          'Gestão de Riscos': {sum: 0, count: 0}
      };
      
      let totalSum = 0;
      let totalCount = 0;

      CLIMATE_QUESTIONS.forEach(q => {
          const val = scores[q.id];
          if (val) {
              cats[q.category].sum += val;
              cats[q.category].count++;
              totalSum += val;
              totalCount++;
          }
      });

      const radarData = Object.keys(cats).map(key => ({
          subject: key,
          A: cats[key].count ? Number((cats[key].sum / cats[key].count).toFixed(1)) : 0,
          fullMark: 5
      }));

      const average = totalCount ? totalSum / totalCount : 0;

      return { radarData, average };
  };

  const { radarData, average } = calculateResults();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
              <Thermometer className="text-rose-600" size={20} />
              Avaliação de Clima de Segurança
          </h3>
          <p className="text-slate-600 text-sm mb-6">
            Meça a percepção dos trabalhadores sobre 3 pilares fundamentais da Cultura de Segurança.
            <br/><span className="text-xs text-slate-400">Escala: 1 (Discordo Totalmente) a 5 (Concordo Totalmente).</span>
          </p>

          <div className="space-y-6">
            {CLIMATE_QUESTIONS.map((q) => (
              <div key={q.id} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-slate-800 text-sm">{q.statement}</p>
                    <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{q.category}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleScoreChange(q.id, val)}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition-all flex items-center justify-center ${
                        scores[q.id] === val
                          ? 'bg-rose-600 text-white scale-110 shadow-md ring-2 ring-offset-1 ring-rose-200'
                          : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-400 border border-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setShowResult(true)}
            disabled={Object.keys(scores).length < CLIMATE_QUESTIONS.length}
            className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {Object.keys(scores).length < CLIMATE_QUESTIONS.length ? 'Responda todas para calcular' : 'Gerar Diagnóstico de Clima'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-1">
        {showResult ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full animate-in fade-in zoom-in duration-300 flex flex-col">
            <h3 className="font-bold text-center text-slate-700 mb-6">Resultado do Clima</h3>
            
            <div className="flex justify-center mb-6">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle 
                      cx="64" cy="64" r="56" 
                      stroke={average >= 4 ? '#10b981' : average >= 3 ? '#f59e0b' : '#ef4444'} 
                      strokeWidth="12" 
                      fill="none" 
                      strokeDasharray={351} 
                      strokeDashoffset={351 - (351 * average) / 5} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-800">{average.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">de 5.0</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full mb-4">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Clima"
                        dataKey="A"
                        stroke="#e11d48"
                        strokeWidth={2}
                        fill="#f43f5e"
                        fillOpacity={0.3}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#e11d48', fontWeight: 'bold' }}
                    />
                 </RadarChart>
               </ResponsiveContainer>
            </div>

            <div className="text-xs text-slate-500 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-700 mb-1">Interpretação:</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>{'>'} 4.0: Cultura Proativa (Forte)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>3.0 - 3.9: Cultura Calculativa (Burocrática)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>{'<'} 3.0: Cultura Reativa (Patológica)</span>
                </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <BarChart4 size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-sm">Responda o questionário ao lado para visualizar a análise gráfica.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Upgraded Dashboard Module ---

const RiskPerceptionDashboard: React.FC<{sectors: SectorAnalysis[], setSectors: React.Dispatch<React.SetStateAction<SectorAnalysis[]>>}> = ({ sectors, setSectors }) => {
    const [view, setView] = useState<'DASHBOARD' | 'CAMPAIGN'>('DASHBOARD');
    
    // Campaign Link Generation State
    const [sectorName, setSectorName] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const loadMockData = () => {
        setSectors([
            { id: '1', name: 'Expedição', respondents: 15, scores: { consciencia: 4.2, lideranca: 2.5, comunicacao: 3.0 } },
            { id: '2', name: 'Recebimento', respondents: 8, scores: { consciencia: 4.8, lideranca: 4.0, comunicacao: 3.5 } },
            { id: '3', name: 'Administrativo', respondents: 7, scores: { consciencia: 3.0, lideranca: 4.5, comunicacao: 4.2 } },
        ]);
    };

    const generateLink = () => {
        if(!sectorName) return;
        setIsGenerating(true);
        setTimeout(() => {
            const baseUrl = window.location.origin + window.location.pathname;
            // Generate a simulated link (in a real app this would store a campaign ID in backend)
            const cleanSector = sectorName.replace(/[^a-zA-Z0-9]/g, '_');
            const link = `${baseUrl}#survey=perception&sector=${cleanSector}&id=${Date.now()}`;
            setGeneratedLink(link);
            setIsGenerating(false);
        }, 1500);
    };

    const handleWhatsAppShare = () => {
        if (!generatedLink) return;
        const message = `Olá! Sua participação é essencial para nossa segurança.\n\nPor favor, responda à Pesquisa de Percepção de Riscos do setor *${sectorName}*.\n\nÉ rápido e anônimo: ${generatedLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const getRecommendation = (s: SectorAnalysis) => {
        if (s.scores.lideranca < 3) return "Capacitação urgente de lideranças em cultura de segurança.";
        if (s.scores.comunicacao < 3) return "Melhorar sinalização e DDS (Diálogos de Segurança).";
        if (s.scores.consciencia < 3.5) return "Reforçar treinamentos de riscos específicos da área.";
        return "Manter ações de reforço positivo.";
    };

    const handleExportCSV = () => {
        if (sectors.length === 0) return;

        const headers = ["Setor", "Respondentes", "Consciencia", "Lideranca", "Comunicacao", "Recomendacao"];
        const rows = sectors.map(s => [
            s.name,
            s.respondents,
            s.scores.consciencia.toFixed(1),
            s.scores.lideranca.toFixed(1),
            s.scores.comunicacao.toFixed(1),
            `"${getRecommendation(s)}"`
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "percepcao_cultura_seguranca.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Prepare chart data
    const chartData = sectors.map(s => ({
        name: s.name,
        Consciência: s.scores.consciencia,
        Liderança: s.scores.lideranca,
        Comunicação: s.scores.comunicacao
    }));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart4 className="text-sky-600" />
                        Gestão de Cultura & Percepção
                    </h3>
                    <p className="text-sm text-slate-500">Analise os gaps de segurança comportamental por setor.</p>
                </div>
                <div className="flex gap-2">
                    {view === 'DASHBOARD' && sectors.length > 0 && (
                        <button 
                            onClick={handleExportCSV}
                            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            title="Exportar CSV"
                        >
                            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
                        </button>
                    )}
                    <button 
                        onClick={() => setView('DASHBOARD')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'DASHBOARD' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Painel Gerencial
                    </button>
                    <button 
                        onClick={() => setView('CAMPAIGN')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'CAMPAIGN' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        + Nova Pesquisa
                    </button>
                </div>
            </div>

            {view === 'CAMPAIGN' ? (
                <div className="max-w-xl mx-auto py-8">
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                        <QrCode size={64} className="mx-auto text-slate-800 mb-4" />
                        <h4 className="font-bold text-lg text-slate-800 mb-2">Lançar Campanha de Percepção</h4>
                        <p className="text-slate-600 mb-6 text-sm">
                            Gere um link exclusivo ou QR Code para que os trabalhadores respondam ao questionário de 15 perguntas anonimamente.
                        </p>
                        
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Setor / Área</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Produção - Turno B" 
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300"
                                    value={sectorName}
                                    onChange={(e) => setSectorName(e.target.value)} 
                                />
                            </div>
                            
                            {generatedLink ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Link Gerado
                                        </span>
                                        <button onClick={() => {setGeneratedLink(''); setSectorName('');}} className="text-[10px] text-emerald-600 hover:underline">Novo Link</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={generatedLink} className="flex-1 text-xs bg-white border border-emerald-200 rounded px-3 py-2 text-emerald-800" />
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(generatedLink)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded"
                                            title="Copiar"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            onClick={handleWhatsAppShare}
                                            className="bg-[#25D366] hover:bg-[#128C7E] text-white p-2 rounded transition-colors"
                                            title="Enviar por WhatsApp"
                                        >
                                            <MessageCircle size={16} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex justify-center">
                                        <div className="bg-white p-2 rounded border border-slate-200 inline-block">
                                            <QrCode size={100} className="text-slate-800" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={generateLink}
                                    disabled={!sectorName || isGenerating}
                                    className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                                    {isGenerating ? 'Gerando...' : 'Gerar Link de Acesso'}
                                </button>
                            )}
                        </div>
                     </div>
                </div>
            ) : (
                <div>
                    {sectors.length === 0 ? (
                         <div className="text-center py-20">
                            <BarChart4 size={64} className="mx-auto text-slate-200 mb-4" />
                            <h4 className="text-slate-400 font-medium mb-4">Nenhum dado de pesquisa coletado ainda.</h4>
                            <button 
                                onClick={loadMockData}
                                className="bg-blue-50 text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Carregar Simulação (Logística)
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in">
                            {/* Charts */}
                            <div className="grid lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                                    <h5 className="font-bold text-slate-700 mb-4 text-sm">Comparativo por Dimensão</h5>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                                <YAxis domain={[0, 5]} hide />
                                                <Tooltip />
                                                <Bar dataKey="Consciência" fill="#0ea5e9" radius={[4,4,0,0]} />
                                                <Bar dataKey="Liderança" fill="#6366f1" radius={[4,4,0,0]} />
                                                <Bar dataKey="Comunicação" fill="#10b981" radius={[4,4,0,0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-sky-500 rounded-sm"></div> Consciência</div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Liderança</div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Comunicação</div>
                                    </div>
                                </div>

                                {/* Heatmap Table */}
                                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm overflow-hidden">
                                     <h5 className="font-bold text-slate-700 mb-4 text-sm">Mapa de Calor (Heatmap)</h5>
                                     <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-100">
                                                    <th className="pb-2 font-medium">Setor</th>
                                                    <th className="pb-2 font-medium text-center">Consciência</th>
                                                    <th className="pb-2 font-medium text-center">Liderança</th>
                                                    <th className="pb-2 font-medium text-center">Comun.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {sectors.map(s => (
                                                    <tr key={s.id}>
                                                        <td className="py-3 font-medium text-slate-700">{s.name}</td>
                                                        <td className="py-3 text-center">
                                                            <span className={`px-2 py-1 rounded font-bold text-xs ${s.scores.consciencia < 3 ? 'bg-red-100 text-red-700' : s.scores.consciencia < 4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {s.scores.consciencia.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`px-2 py-1 rounded font-bold text-xs ${s.scores.lideranca < 3 ? 'bg-red-100 text-red-700' : s.scores.lideranca < 4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {s.scores.lideranca.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`px-2 py-1 rounded font-bold text-xs ${s.scores.comunicacao < 3 ? 'bg-red-100 text-red-700' : s.scores.comunicacao < 4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {s.scores.comunicacao.toFixed(1)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Brain size={18} className="text-purple-600"/> Recomendações Automáticas
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {sectors.map(s => (
                                        <div key={s.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3">
                                            <div className="bg-slate-100 text-slate-600 font-bold text-xs px-2 py-1 rounded shrink-0">{s.name}</div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 mb-1">Ação Sugerida:</p>
                                                <p className="text-xs text-slate-500">{getRecommendation(s)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PsychosocialErgoTool: React.FC = () => {
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
      alert("Erro ao analisar riscos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Brain className="text-violet-600" />
          Análise de Fatores Psicossociais e Cognitivos
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          Atenda aos novos requisitos da NR-1 e NR-17 identificando riscos invisíveis ligados à organização do trabalho.
        </p>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Ex: Operador de Telemarketing ou Controlador de Tráfego Aéreo"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Analisar Função'}
          </button>
        </div>
      </div>

      {risks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {risks.map((risk, idx) => (
             <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between mb-3">
                   <h4 className="font-bold text-slate-800 text-md">{risk.factor}</h4>
                   <div className="bg-violet-100 p-2 rounded-full text-violet-600">
                      <Brain size={16} />
                   </div>
                </div>
                <p className="text-slate-600 text-sm mb-4 min-h-[40px]">{risk.description}</p>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                   <p className="text-xs font-bold text-emerald-700 uppercase mb-1 flex items-center gap-1">
                      <Armchair size={12} /> Sugestão de Melhoria
                   </p>
                   <p className="text-emerald-800 text-xs">{risk.mitigation}</p>
                </div>
             </div>
           ))}
        </div>
      ) : (
        !loading && (
          <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
             <HeartPulse size={48} className="mx-auto text-slate-300 mb-3" />
             <p className="text-slate-500">Informe uma função para que a IA identifique riscos de carga mental, stress e fatores ergonômicos.</p>
          </div>
        )
      )}
    </div>
  );
};