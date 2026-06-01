
import React, { useState, useEffect } from 'react';
import { RiskItem, AprItem, RootCauseAnalysis, CompanyProfile, ActionPlanItem } from '../types';
import { CALCULATE_RISK_LEVEL, RISK_LEVEL_COLORS, PGR_MODELS, BUSINESS_TYPES, GET_BUSINESS_TYPE_BY_CNAE } from '../constants';
import { generateApr, analyzeRootCause, generatePgrInventory } from '../services/geminiService';
import { AlertTriangle, Plus, Trash2, Zap, Search, Activity, FileText, ArrowRight, Loader2, Package, AlertCircle, BookOpen, Lightbulb, FileCheck, Printer, Wand2, RefreshCw, Database, Brain, CheckSquare, Square, ChevronDown } from 'lucide-react';

interface Props {
    company?: CompanyProfile;
    risks?: RiskItem[];
    setRisks?: React.Dispatch<React.SetStateAction<RiskItem[]>>;
    actions?: ActionPlanItem[];
}

export const RiskAssessmentHub: React.FC<Props> = ({ company, risks = [], setRisks, actions = [] }) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'APR' | 'ROOT_CAUSE' | 'DOCUMENT' | 'GENERATOR'>('INVENTORY');

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2 print:hidden">
        <button
          data-tour="tour-risk-inventory-tab"
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'INVENTORY' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity size={18} />
          Inventário de Riscos
        </button>
        <button
          data-tour="tour-risk-generator-tab"
          onClick={() => setActiveTab('GENERATOR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'GENERATOR' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wand2 size={18} />
          Gerador Automático (CNAE)
        </button>
        <button
          onClick={() => setActiveTab('DOCUMENT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'DOCUMENT' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck size={18} />
          Documento Base (PGR)
        </button>
        <button
          onClick={() => setActiveTab('APR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'APR' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={18} />
          Gerador de APR
        </button>
        <button
          onClick={() => setActiveTab('ROOT_CAUSE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ROOT_CAUSE' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search size={18} />
          Investigação
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'INVENTORY' && <RiskInventoryTool company={company} risks={risks} setRisks={setRisks} onGoToGenerator={() => setActiveTab('GENERATOR')} />}
        {activeTab === 'DOCUMENT' && <PgrDocumentView company={company} risks={risks} actions={actions} />}
        {activeTab === 'APR' && <AprGeneratorTool risks={risks} />}
        {activeTab === 'ROOT_CAUSE' && <RootCauseTool />}
        {activeTab === 'GENERATOR' && <PgrGeneratorWizard company={company} setRisks={setRisks} existingRisks={risks} onFinish={() => setActiveTab('INVENTORY')} />}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const PgrGeneratorWizard: React.FC<{ 
    company?: CompanyProfile, 
    setRisks?: React.Dispatch<React.SetStateAction<RiskItem[]>>, 
    existingRisks: RiskItem[],
    onFinish: () => void 
}> = ({ company, setRisks, existingRisks, onFinish }) => {
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [generatedRisks, setGeneratedRisks] = useState<RiskItem[]>([]);
    const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set());
    const [sourceType, setSourceType] = useState<'DATABASE' | 'AI' | null>(null);
    const [step, setStep] = useState<'START' | 'REVIEW'>('START');

    // Auto-select all when risks are generated
    useEffect(() => {
        if (generatedRisks.length > 0) {
            setSelectedRiskIds(new Set(generatedRisks.map(r => r.id)));
        }
    }, [generatedRisks]);

    const handleGenerate = async () => {
        if (!company?.name || !company.cnae) {
            alert("Por favor, preencha os dados da empresa (Nome e CNAE) no Painel Geral antes de gerar o PGR.");
            return;
        }
        
        setLoading(true);
        setGeneratedRisks([]);
        
        try {
            // 1. Try to find a Business Type match from CNAE (Internal Database Priority)
            setStatusMessage('Consultando Base de Dados de Riscos (Padrão NR-4)...');
            await new Promise(r => setTimeout(r, 1000)); // UX delay

            let detectedRisks: RiskItem[] = [];
            let businessTypeId = company.businessTypeId;
            
            // Try to resolve business type from CNAE if missing
            if (!businessTypeId && company.cnae) {
                const foundType = GET_BUSINESS_TYPE_BY_CNAE(company.cnae);
                if (foundType) businessTypeId = foundType.id;
            }

            if (businessTypeId) {
                const models = PGR_MODELS.filter(m => m.businessTypeId === businessTypeId);
                
                if (models.length > 0) {
                    detectedRisks = models.map(m => {
                        // Map standard level (1-3) to Prob/Sev for the Matrix
                        let prob = 2, sev = 2;
                        if (m.standardRiskLevel === 2) { prob = 3; sev = 3; } // Medium
                        if (m.standardRiskLevel === 3) { prob = 4; sev = 4; } // High
                        if (m.standardRiskLevel === 4) { prob = 5; sev = 5; } // Critical

                        return {
                            id: Date.now() + Math.random().toString(),
                            process: `${m.sector} - ${m.activity}`,
                            hazard: m.hazard,
                            probability: prob,
                            severity: sev,
                            level: CALCULATE_RISK_LEVEL(prob, sev),
                            score: prob * sev,
                            sourceModelId: m.id // Mark as DATABASE source
                        };
                    });
                    setSourceType('DATABASE');
                }
            }

            // 2. If no static models found, use AI (Gemini)
            if (detectedRisks.length === 0) {
                setStatusMessage('Modelo específico não encontrado na base. Acionando IA Generativa...');
                setSourceType('AI');
                const results = await generatePgrInventory(company.cnae, company.cnaeDescription || 'Atividade Geral', company.name);
                detectedRisks = results;
            }

            setGeneratedRisks(detectedRisks);
            setStep('REVIEW');

        } catch (error) {
            alert("Erro ao gerar PGR. Verifique sua conexão e tente novamente.");
        } finally {
            setLoading(false);
            setStatusMessage('');
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedRiskIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedRiskIds(newSet);
    };

    const confirmRisks = () => {
        if (setRisks) {
            const risksToImport = generatedRisks.filter(r => selectedRiskIds.has(r.id));
            setRisks(prev => [...prev, ...risksToImport]);
            onFinish();
        }
    };

    if (step === 'START') {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-4xl mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Wand2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Gerador Automático de PGR</h3>
                <p className="text-slate-500 mb-8 max-w-xl mx-auto">
                    O sistema analisará o <strong>CNAE ({company?.cnae || 'N/A'})</strong> da sua empresa para construir um Inventário de Riscos inicial.
                    Utilizamos modelos validados (Padrão NR-4) e Inteligência Artificial para preencher as lacunas.
                </p>

                {existingRisks.length > 0 && (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm mb-8 border border-amber-200 text-left flex items-start gap-3">
                        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <h5 className="font-bold">Atenção: Inventário em andamento</h5>
                            <p>Você já possui {existingRisks.length} riscos cadastrados. O gerador irá adicionar novos itens à lista existente. Recomendamos revisar para evitar duplicidade.</p>
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 text-left grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-slate-700 text-sm uppercase mb-3 flex items-center gap-2">
                            <Database size={16} className="text-blue-500" />
                            Base de Conhecimento
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> Modelos por Tipo de Negócio</li>
                            <li className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> Classificação NR-4</li>
                            <li className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> Riscos Físicos, Químicos e Biológicos</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 text-sm uppercase mb-3 flex items-center gap-2">
                            <Brain size={16} className="text-purple-500" />
                            Inteligência Artificial
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> Análise de Atividades Atípicas</li>
                            <li className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> Sugestão de Medidas de Controle</li>
                            <li className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> Ergonomia e Acidentes</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !company?.name}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed min-w-[300px]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} className="fill-current" />}
                        {loading ? 'Analisando Riscos...' : 'Gerar Inventário Agora'}
                    </button>
                    
                    {loading && (
                        <p className="text-sm text-indigo-600 font-medium animate-pulse">{statusMessage}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {sourceType === 'DATABASE' ? <Database size={20} className="text-blue-600"/> : <Brain size={20} className="text-purple-600"/>}
                        Revisão dos Riscos Sugeridos
                    </h3>
                    <p className="text-sm text-slate-500">
                        Fonte: {sourceType === 'DATABASE' ? 'Base de Modelos (Validado)' : 'IA Generativa (Sugestão)'}. 
                        Selecione os itens que deseja importar.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setStep('START')} className="text-slate-500 hover:text-slate-700 px-4 py-2 font-medium text-sm">Cancelar</button>
                    <button 
                        onClick={confirmRisks} 
                        disabled={selectedRiskIds.size === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                        <FileCheck size={18} /> Importar ({selectedRiskIds.size})
                    </button>
                </div>
            </div>

            <div className="mb-4 flex gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> Fonte Confiável (Base)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div> Sugestão IA</div>
            </div>

            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
                {generatedRisks.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhum risco identificado para os parâmetros informados.</p>
                        <button onClick={() => setStep('START')} className="text-purple-600 font-bold text-sm mt-2 hover:underline">Tentar novamente</button>
                    </div>
                ) : generatedRisks.map((risk) => {
                    const isSelected = selectedRiskIds.has(risk.id);
                    return (
                        <div 
                            key={risk.id} 
                            onClick={() => toggleSelection(risk.id)}
                            className={`p-4 border rounded-lg transition-all flex gap-4 items-start cursor-pointer group ${isSelected ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                            <div className={`mt-1 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>
                            
                            <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm shrink-0 ${RISK_LEVEL_COLORS[risk.level].split(' ')[0].replace('bg-', 'bg-')}`}>
                                {risk.score}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 text-sm">{risk.process}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${sourceType === 'DATABASE' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                                        {sourceType === 'DATABASE' ? 'Base' : 'IA'}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm mt-1">{risk.hazard}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                                    <span>Probabilidade: <strong>{risk.probability}</strong></span>
                                    <span>Severidade: <strong>{risk.severity}</strong></span>
                                    <span>Nível: <strong>{risk.level}</strong></span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RiskInventoryTool: React.FC<{ company?: CompanyProfile, risks: RiskItem[], setRisks?: React.Dispatch<React.SetStateAction<RiskItem[]>>, onGoToGenerator: () => void }> = ({ company, risks, setRisks, onGoToGenerator }) => {
  const [newItem, setNewItem] = useState({ process: '', hazard: '', prob: 3, sev: 3 });
  const [dismissedWarning, setDismissedWarning] = useState(false);

  const addRisk = () => {
    if (!newItem.process || !newItem.hazard || !setRisks) return;
    const level = CALCULATE_RISK_LEVEL(newItem.prob, newItem.sev);
    const risk: RiskItem = {
      id: Date.now().toString(),
      process: newItem.process,
      hazard: newItem.hazard,
      probability: newItem.prob,
      severity: newItem.sev,
      score: newItem.prob * newItem.sev,
      level
    };
    setRisks([...risks, risk]);
    setNewItem({ ...newItem, hazard: '' }); // Keep process, clear hazard
  };

  const deleteRisk = (id: string) => {
    if(setRisks) setRisks(risks.filter(r => r.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
      {/* Alert Banner */}
      {!dismissedWarning && (
        <div className="lg:col-span-3 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start relative animate-in slide-in-from-top-2">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                <AlertCircle size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-amber-900 text-sm mb-1">Nota Técnica</h4>
                <p className="text-amber-800 text-sm leading-relaxed mb-3">
                    A NR-1 exige que o Inventário de Riscos contemple a caracterização dos processos, a identificação dos perigos e a avaliação dos riscos ocupacionais. 
                    Certifique-se de que os dados refletem a realidade do ambiente de trabalho.
                </p>
                <button 
                    onClick={() => setDismissedWarning(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    Entendido
                </button>
            </div>
            <button onClick={() => setDismissedWarning(true)} className="absolute top-4 right-4 text-amber-400 hover:text-amber-600">
                <AlertCircle size={16} className="rotate-45" />
            </button>
        </div>
      )}

      {/* Input Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" data-tour="tour-manual-risk-add">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            Adicionar Risco Manualmente
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Processo / Atividade</label>
              <input 
                type="text" 
                value={newItem.process}
                onChange={e => setNewItem({...newItem, process: e.target.value})}
                placeholder="Ex: Soldagem Mig/Mag"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Perigo / Fator de Risco</label>
              <input 
                type="text" 
                value={newItem.hazard}
                onChange={e => setNewItem({...newItem, hazard: e.target.value})}
                placeholder="Ex: Fumos metálicos"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Probabilidade (1-5)</label>
                <select 
                  value={newItem.prob}
                  onChange={e => setNewItem({...newItem, prob: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Severidade (1-5)</label>
                <select 
                  value={newItem.sev}
                  onChange={e => setNewItem({...newItem, sev: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
               <span className="text-sm font-medium text-slate-600">Nível Estimado:</span>
               <span className={`px-3 py-1 rounded-full text-sm font-bold ${RISK_LEVEL_COLORS[CALCULATE_RISK_LEVEL(newItem.prob, newItem.sev)]}`}>
                 {CALCULATE_RISK_LEVEL(newItem.prob, newItem.sev)}
               </span>
            </div>

            <button 
              onClick={addRisk}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              Adicionar ao Inventário
            </button>
          </div>
        </div>

        {/* Matrix Visualization Legend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wide">Legenda da Matriz</h4>
           <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-100 text-emerald-800 p-2 rounded text-center font-semibold">1-5: Baixo (Aceitável)</div>
              <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-center font-semibold">6-12: Médio (Alerta)</div>
              <div className="bg-orange-100 text-orange-800 p-2 rounded text-center font-semibold">13-19: Alto (Crítico)</div>
              <div className="bg-red-100 text-red-800 p-2 rounded text-center font-semibold">20-25: Crítico (Intolerável)</div>
           </div>
        </div>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Inventário de Riscos (GRO)</h3>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{risks.length} Itens</span>
          </div>
          {risks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Package className="text-slate-300" size={40} />
              </div>
              <h4 className="text-lg font-bold text-slate-700 mb-2">Inventário Vazio</h4>
              <p className="text-slate-500 mb-8 max-w-md">
                  Para começar, você pode adicionar riscos manualmente ou usar nosso Assistente Inteligente para importar modelos prontos baseados no seu CNAE.
              </p>
              <button 
                onClick={onGoToGenerator}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center gap-2 transition-all hover:scale-105"
              >
                  <Wand2 size={20} /> Usar Gerador Automático
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {risks.map((risk) => (
                <div key={risk.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 group">
                  <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex flex-col items-center justify-center font-bold text-sm border ${RISK_LEVEL_COLORS[risk.level]}`}>
                    <span>{risk.score}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800">{risk.process}</h4>
                      <button onClick={() => deleteRisk(risk.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{risk.hazard}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-400 items-center">
                       <span>Prob: {risk.probability}</span>
                       <span>Sev: {risk.severity}</span>
                       <span className="uppercase font-semibold tracking-wider">{risk.level}</span>
                       {risk.sourceModelId && (
                           <span className={`ml-auto px-2 py-0.5 rounded flex items-center gap-1 border ${risk.sourceModelId === 'AI_GENERATED' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                               {risk.sourceModelId === 'AI_GENERATED' ? <Brain size={10} /> : <Database size={10} />}
                               {risk.sourceModelId === 'AI_GENERATED' ? 'IA' : 'Base'}
                           </span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PgrDocumentView: React.FC<{ company?: CompanyProfile, risks: RiskItem[], actions: ActionPlanItem[] }> = ({ company, risks, actions }) => {
    
    if (!company?.name || risks.length === 0) {
        return (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                <FileCheck size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Geração de Documento PGR</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Para gerar o documento completo, você precisa preencher os <strong>Dados da Empresa</strong> e adicionar itens ao <strong>Inventário de Riscos</strong>.
                </p>
                <div className="mt-6 flex justify-center gap-4 text-sm font-medium">
                    <div className={`px-3 py-1 rounded ${company?.name ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {company?.name ? 'Empresa OK' : 'Falta Empresa'}
                    </div>
                    <div className={`px-3 py-1 rounded ${risks.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {risks.length > 0 ? `${risks.length} Riscos` : 'Falta Inventário'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="w-full flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div>
                    <h3 className="font-bold text-slate-800">Visualização de Impressão</h3>
                    <p className="text-xs text-slate-500">Documento base conforme NR-1.5</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Printer size={18} /> Imprimir / Salvar PDF
                </button>
            </div>

            {/* A4 Paper Simulation */}
            <div className="bg-white shadow-xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[15mm] text-slate-900 text-sm leading-relaxed print:w-full print:max-w-none print:p-0 print:absolute print:top-0 print:left-0">
                
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">PGR</h1>
                        <p className="font-bold text-slate-500">Programa de Gerenciamento de Riscos</p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-bold">{company.name}</p>
                        <p>{company.cnpj}</p>
                        <p className="mt-1 text-slate-400">Gerado em: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Section 1: Identification */}
                <div className="mb-8">
                    <h2 className="bg-slate-100 p-2 font-bold uppercase text-xs border-l-4 border-slate-800 mb-4">1. Identificação da Empresa</h2>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                        <tbody>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/4">Razão Social</td>
                                <td className="border border-slate-300 p-2">{company.name}</td>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/4">CNPJ</td>
                                <td className="border border-slate-300 p-2">{company.cnpj}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">CNAE</td>
                                <td className="border border-slate-300 p-2" colSpan={3}>{company.cnae}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Grau de Risco</td>
                                <td className="border border-slate-300 p-2">{company.riskDegree}</td>
                                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Funcionários</td>
                                <td className="border border-slate-300 p-2">{company.employees}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section 2: Policy */}
                <div className="mb-8">
                    <h2 className="bg-slate-100 p-2 font-bold uppercase text-xs border-l-4 border-slate-800 mb-4">2. Política de SST e Objetivos</h2>
                    <p className="mb-2 text-justify text-xs">
                        Este Programa de Gerenciamento de Riscos (PGR) foi elaborado em conformidade com a Norma Regulamentadora nº 01 (NR-1) e tem como objetivo identificar perigos, avaliar riscos ocupacionais e estabelecer medidas de prevenção para garantir a integridade física e a saúde dos trabalhadores.
                    </p>
                    <p className="text-justify text-xs">
                        A organização compromete-se a:
                        <br/>a) Evitar riscos ocupacionais que possam ser originados no trabalho;
                        <br/>b) Avaliar os riscos ocupacionais que não possam ser evitados;
                        <br/>c) Implementar medidas de prevenção, ouvindo os trabalhadores.
                    </p>
                </div>

                {/* Section 3: Inventory */}
                <div className="mb-8 break-inside-avoid">
                    <h2 className="bg-slate-100 p-2 font-bold uppercase text-xs border-l-4 border-slate-800 mb-4">3. Inventário de Riscos Ocupacionais</h2>
                    <table className="w-full border-collapse border border-slate-300 text-[10px]">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="border border-slate-300 p-2 text-left">Processo / Atividade</th>
                                <th className="border border-slate-300 p-2 text-left">Perigo (Fator de Risco)</th>
                                <th className="border border-slate-300 p-2 text-center w-10">P</th>
                                <th className="border border-slate-300 p-2 text-center w-10">S</th>
                                <th className="border border-slate-300 p-2 text-center">Nível</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map((risk) => (
                                <tr key={risk.id} className="break-inside-avoid">
                                    <td className="border border-slate-300 p-2 font-medium">{risk.process}</td>
                                    <td className="border border-slate-300 p-2">{risk.hazard}</td>
                                    <td className="border border-slate-300 p-2 text-center">{risk.probability}</td>
                                    <td className="border border-slate-300 p-2 text-center">{risk.severity}</td>
                                    <td className="border border-slate-300 p-2 text-center font-bold uppercase">
                                        {risk.level}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-2 text-[9px] text-slate-500">
                        Legenda: P = Probabilidade, S = Severidade. Critério: Matriz AIHA/BS8800 Adaptada.
                    </div>
                </div>

                {/* Section 4: Action Plan */}
                <div className="mb-8 break-inside-avoid">
                    <h2 className="bg-slate-100 p-2 font-bold uppercase text-xs border-l-4 border-slate-800 mb-4">4. Plano de Ação</h2>
                    {actions.length > 0 ? (
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead className="bg-slate-200">
                                <tr>
                                    <th className="border border-slate-300 p-2 text-left">Ação Necessária</th>
                                    <th className="border border-slate-300 p-2 text-left w-24">Responsável</th>
                                    <th className="border border-slate-300 p-2 text-center w-20">Prazo</th>
                                    <th className="border border-slate-300 p-2 text-center w-20">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actions.map((action) => (
                                    <tr key={action.id} className="break-inside-avoid">
                                        <td className="border border-slate-300 p-2">{action.description}</td>
                                        <td className="border border-slate-300 p-2">{action.responsible}</td>
                                        <td className="border border-slate-300 p-2 text-center">{action.deadline}</td>
                                        <td className="border border-slate-300 p-2 text-center">
                                            {action.status === 'TODO' ? 'Pendente' : action.status === 'DOING' ? 'Em Andamento' : 'Concluído'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-xs italic text-slate-500 border border-slate-300 p-4 text-center">
                            Nenhuma ação registrada. Recomenda-se revisar o inventário e preencher o módulo de Plano de Ação.
                        </p>
                    )}
                </div>

                {/* Signatures */}
                <div className="mt-16 pt-8 break-inside-avoid">
                    <div className="grid grid-cols-2 gap-16">
                        <div className="border-t border-slate-800 pt-2 text-center">
                            <p className="font-bold text-xs uppercase">{company.name}</p>
                            <p className="text-[10px] text-slate-500">Empregador / Responsável Legal</p>
                        </div>
                        <div className="border-t border-slate-800 pt-2 text-center">
                            <p className="font-bold text-xs uppercase">Responsável Técnico</p>
                            <p className="text-[10px] text-slate-500">SST / Engenharia / Medicina</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const AprGeneratorTool: React.FC<{ risks?: RiskItem[] }> = ({ risks = [] }) => {
  const [activity, setActivity] = useState('');
  const [aprItems, setAprItems] = useState<AprItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!activity) return;
    setLoading(true);
    try {
      const items = await generateApr(activity);
      setAprItems(items);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar APR. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRisk = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      const risk = risks.find(r => r.id === selectedId);
      if (risk) {
          setActivity(`${risk.process} (Foco: ${risk.hazard})`);
      }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Zap className="text-amber-500" />
            Gerador de APR com IA
        </h3>
        <p className="text-slate-600 text-sm mb-4">
            Crie a Análise Preliminar de Risco detalhando as etapas, perigos específicos e medidas de controle.
        </p>
        
        {/* Inventory Integration */}
        {risks.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-4">
                <label className="block text-xs font-bold text-blue-700 uppercase mb-2">
                    Basear APR em um Risco do Inventário (GRO):
                </label>
                <div className="relative">
                    <select 
                        className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        onChange={handleSelectRisk}
                        defaultValue=""
                    >
                        <option value="" disabled>Selecione um item do inventário...</option>
                        {risks.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.process} — {r.hazard} (Nível: {r.level})
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3 text-blue-400 pointer-events-none" />
                </div>
            </div>
        )}

        <div className="flex gap-2 items-center">
            <input 
                type="text" 
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Ou descreva a atividade manualmente (Ex: Troca de lâmpada)"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
                onClick={handleGenerate}
                disabled={loading || !activity}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Gerar APR'}
            </button>
        </div>
      </div>

      {aprItems.length > 0 && (
        <div className="overflow-x-auto border rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                    <tr>
                        <th className="px-4 py-3">Etapa</th>
                        <th className="px-4 py-3">Perigo / Causa</th>
                        <th className="px-4 py-3">Consequência</th>
                        <th className="px-4 py-3">Controle</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {aprItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800 align-top">{item.step}</td>
                            <td className="px-4 py-3 align-top">
                                <span className="font-semibold text-slate-700 block">{item.hazard}</span>
                                <span className="text-xs text-slate-500">{item.cause}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 align-top">{item.consequence}</td>
                            <td className="px-4 py-3 text-emerald-700 font-medium align-top bg-emerald-50/30">
                                {item.control}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

const RootCauseTool: React.FC = () => {
  const [incident, setIncident] = useState('');
  const [analysis, setAnalysis] = useState<RootCauseAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
      if (!incident) return;
      setLoading(true);
      try {
          const result = await analyzeRootCause(incident);
          setAnalysis(result);
      } catch (error) {
          console.error(error);
          alert('Erro na análise. Tente novamente.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Search className="text-blue-600" />
                Investigação de Causa Raiz (5 Porquês)
            </h3>
            <p className="text-slate-600 text-sm mb-4">
                Descreva o acidente ou incidente ocorrido para realizar a análise sistêmica.
            </p>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={incident}
                    onChange={(e) => setIncident(e.target.value)}
                    placeholder="Ex: Queda de material da prateleira atingindo funcionário"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Investigar'}
                </button>
            </div>
        </div>

        {analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4">Metodologia 5 Porquês</h4>
                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-300"></div>
                        
                        {analysis.whys.map((why, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-400 text-xs font-bold flex items-center justify-center text-slate-500 z-10">
                                    {idx + 1}
                                </div>
                                <p className="text-slate-700 italic">"Por que isso aconteceu?"</p>
                                <p className="font-medium text-slate-900 bg-white p-3 rounded-lg shadow-sm border border-slate-200 mt-1">
                                    {why}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                            <AlertCircle size={18} /> Causa Raiz
                        </h4>
                        <p className="text-red-900 text-sm leading-relaxed">{analysis.rootCause}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                            <ArrowRight size={18} /> Ação Recomendada
                        </h4>
                        <p className="text-emerald-900 text-sm leading-relaxed">{analysis.recommendation}</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
