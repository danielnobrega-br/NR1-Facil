import React, { useState } from 'react';
import { ActionPlanItem, ChecklistState, MaturityState, SectorAnalysis } from '../types';
import { CHECKLIST_ITEMS, MATURITY_ITEMS } from '../constants';
import { ClipboardList, Plus, AlertCircle, CheckCircle2, Clock, Trash2, ArrowRight, Zap, PieChart, Printer, Filter, Calendar, User, Target } from 'lucide-react';

interface Props {
    checklistData: ChecklistState;
    maturityData: MaturityState;
    cultureSectors: SectorAnalysis[]; // New prop for Percepção Integration
    actions: ActionPlanItem[]; 
    setActions: React.Dispatch<React.SetStateAction<ActionPlanItem[]>>; 
}

export const ActionPlanHub: React.FC<Props> = ({ checklistData, maturityData, cultureSectors, actions, setActions }) => {
    const [newItem, setNewItem] = useState({ desc: '', resp: '', date: '', prio: 'MEDIUM' as 'HIGH'|'MEDIUM'|'LOW' });
    const [isAdding, setIsAdding] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'TODO' | 'DOING' | 'DONE'>('ALL');
    const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST' | 'PRINT'>('LIST');

    const handleAdd = () => {
        if(!newItem.desc) return;
        setActions([...actions, {
            id: Date.now().toString(),
            origin: 'RISK_ASSESSMENT',
            description: newItem.desc,
            responsible: newItem.resp || 'A Definir',
            deadline: newItem.date || '30 dias',
            priority: newItem.prio,
            status: 'TODO'
        }]);
        setNewItem({desc: '', resp: '', date: '', prio: 'MEDIUM'});
        setIsAdding(false);
    };

    // Advanced Logic to determine Responsibility and Deadline based on Context
    const getContextFromCategory = (category: string, isCritical: boolean) => {
        if (category.includes('Estrutura')) {
            return {
                resp: 'Alta Direção / Eng. Segurança',
                deadline: isCritical ? 'Imediato (Interdição)' : '30 dias',
                context: 'Adequação Legal Documental'
            };
        }
        if (category.includes('Integração') || category.includes('Rotina')) {
            return {
                resp: 'Gerente de Operações / Supervisão',
                deadline: isCritical ? '7 dias' : '45 dias',
                context: 'Controle Operacional'
            };
        }
        if (category.includes('Comunicação') || category.includes('Participação')) {
            return {
                resp: 'RH / CIPA / SESMT',
                deadline: '30 dias',
                context: 'Gestão de Pessoas'
            };
        }
        if (category.includes('Treinamentos')) {
            return {
                resp: 'RH / T&D',
                deadline: isCritical ? '15 dias' : '60 dias',
                context: 'Capacitação'
            };
        }
        return { resp: 'Gestor da Área', deadline: '30 dias', context: 'Geral' };
    };

    const handleAutoGenerate = () => {
        const newActions: ActionPlanItem[] = [];
        let countChecklist = 0;
        let countMaturity = 0;
        let countPerception = 0;

        // 1. Analyze Checklist Gaps (Compliance)
        CHECKLIST_ITEMS.forEach(item => {
            const val = checklistData[item.id]; // undefined, 0, 1, or 2
            
            if (val === 0 || val === 1) { 
                const isCritical = val === 0;
                const ctx = getContextFromCategory(item.category, isCritical);
                
                newActions.push({
                    id: Date.now().toString() + Math.random(),
                    origin: 'NR1_DIAG',
                    description: `${isCritical ? '[CRÍTICO]' : '[ADEQUAÇÃO]'} ${item.question.replace('?', '')}. Necessário implementar procedimento formal.`,
                    responsible: ctx.resp,
                    deadline: ctx.context === 'Adequação Legal Documental' && isCritical ? 'Imediato' : ctx.deadline,
                    priority: isCritical ? 'HIGH' : 'MEDIUM',
                    status: 'TODO'
                });
                countChecklist++;
            }
        });

        // 2. Analyze Maturity/Culture Gaps (Organizational)
        MATURITY_ITEMS.forEach(item => {
            const val = maturityData[item.id];
            if (val && val <= 2) { // Level 1 or 2 -> Perception/Culture Gap
                newActions.push({
                    id: Date.now().toString() + Math.random(),
                    origin: 'CULTURE',
                    description: `[CULTURA] Melhorar dimensão "${item.dimension}". A percepção atual é de nível ${val}/5. Realizar campanha de conscientização e workshop de liderança.`,
                    responsible: 'RH / Desenvolvimento Organizacional',
                    deadline: '90 dias',
                    priority: val === 1 ? 'HIGH' : 'MEDIUM',
                    status: 'TODO'
                });
                countMaturity++;
            }
        });

        // 3. Analyze Perception Survey Results (Sector Specific)
        if (cultureSectors && cultureSectors.length > 0) {
            cultureSectors.forEach(sector => {
                // Consciência
                if (sector.scores.consciencia < 3.0) {
                    newActions.push({
                        id: Date.now().toString() + Math.random(),
                        origin: 'CULTURE',
                        description: `[PERCEPÇÃO - ${sector.name}] Baixo índice de Consciência (${sector.scores.consciencia.toFixed(1)}). Reforçar treinamento admissional e DDS focados nos riscos da área.`,
                        responsible: 'SESMT / Supervisão',
                        deadline: '30 dias',
                        priority: 'HIGH',
                        status: 'TODO'
                    });
                    countPerception++;
                }
                // Liderança
                if (sector.scores.lideranca < 3.0) {
                    newActions.push({
                        id: Date.now().toString() + Math.random(),
                        origin: 'CULTURE',
                        description: `[LIDERANÇA - ${sector.name}] Avaliação da Liderança abaixo da média (${sector.scores.lideranca.toFixed(1)}). Realizar coaching com gestores sobre Segurança Comportamental.`,
                        responsible: 'RH / Diretoria',
                        deadline: '60 dias',
                        priority: 'HIGH',
                        status: 'TODO'
                    });
                    countPerception++;
                }
                // Comunicação
                if (sector.scores.comunicacao < 3.0) {
                    newActions.push({
                        id: Date.now().toString() + Math.random(),
                        origin: 'CULTURE',
                        description: `[COMUNICAÇÃO - ${sector.name}] Deficiência na comunicação de segurança (${sector.scores.comunicacao.toFixed(1)}). Instalar quadros de gestão à vista e revisar canal de denúncias.`,
                        responsible: 'SESMT / CIPA',
                        deadline: '45 dias',
                        priority: 'MEDIUM',
                        status: 'TODO'
                    });
                    countPerception++;
                }
            });
        }

        if (newActions.length === 0) {
            alert("Não foram encontradas não-conformidades críticas ou gaps significativos nos diagnósticos atuais.");
            return;
        }

        // Filter duplicates loosely
        const existingDescriptions = new Set(actions.map(a => a.description.substring(0, 20)));
        const uniqueNewActions = newActions.filter(a => !existingDescriptions.has(a.description.substring(0, 20)));

        if (uniqueNewActions.length === 0) {
            alert("As ações sugeridas já constam no seu plano.");
            return;
        }

        setActions(prev => [...prev, ...uniqueNewActions]);
        alert(`Plano Gerado com Sucesso!\n\n• ${countChecklist} ações de Conformidade NR-1\n• ${countMaturity} ações de Maturidade\n• ${countPerception} ações de Percepção por Setor`);
    };

    const updateStatus = (id: string, status: ActionPlanItem['status']) => {
        setActions(actions.map(a => a.id === id ? { ...a, status } : a));
    };

    const deleteAction = (id: string) => {
        if(window.confirm('Tem certeza que deseja remover esta ação?')) {
            setActions(actions.filter(a => a.id !== id));
        }
    };

    const filteredActions = actions.filter(a => filterStatus === 'ALL' || a.status === filterStatus);

    const stats = {
        total: actions.length,
        todo: actions.filter(a => a.status === 'TODO').length,
        doing: actions.filter(a => a.status === 'DOING').length,
        done: actions.filter(a => a.status === 'DONE').length,
        high: actions.filter(a => a.priority === 'HIGH' && a.status !== 'DONE').length
    };

    // --- PRINT VIEW ---
    if (viewMode === 'PRINT') {
        return (
            <div className="bg-white min-h-screen p-8 animate-in fade-in">
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <button onClick={() => setViewMode('LIST')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
                        ← Voltar ao Painel
                    </button>
                    <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Printer size={18} /> Imprimir PDF
                    </button>
                </div>

                <div className="max-w-[297mm] mx-auto bg-white print:p-0">
                    <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">Plano de Ação Integrado</h1>
                            <p className="text-slate-500 font-medium">GRO - Gerenciamento de Riscos Ocupacionais & NR-1</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">Data de Emissão: {new Date().toLocaleDateString()}</p>
                            <p className="text-xs text-slate-400">Total de Ações: {actions.length}</p>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse border border-slate-300 text-sm">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 uppercase text-xs">
                                <th className="border border-slate-300 p-3 w-16 text-center">Prio.</th>
                                <th className="border border-slate-300 p-3">Descrição da Ação / Não Conformidade</th>
                                <th className="border border-slate-300 p-3 w-40">Origem</th>
                                <th className="border border-slate-300 p-3 w-48">Responsável</th>
                                <th className="border border-slate-300 p-3 w-24 text-center">Prazo</th>
                                <th className="border border-slate-300 p-3 w-24 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actions.sort((a,b) => (a.priority === 'HIGH' ? -1 : 1)).map((action, idx) => (
                                <tr key={action.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className={`border border-slate-300 p-3 text-center font-bold text-xs ${action.priority === 'HIGH' ? 'text-red-600 bg-red-50' : action.priority === 'MEDIUM' ? 'text-amber-600' : 'text-slate-600'}`}>
                                        {action.priority === 'HIGH' ? 'ALTA' : action.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                                    </td>
                                    <td className="border border-slate-300 p-3 font-medium text-slate-800">
                                        {action.description}
                                    </td>
                                    <td className="border border-slate-300 p-3 text-xs text-slate-500">
                                        {action.origin === 'NR1_DIAG' ? 'Conformidade NR-1' : action.origin === 'CULTURE' ? 'Percepção/Cultura' : 'Inventário de Riscos'}
                                    </td>
                                    <td className="border border-slate-300 p-3 text-slate-700">
                                        {action.responsible}
                                    </td>
                                    <td className="border border-slate-300 p-3 text-center text-slate-600">
                                        {action.deadline}
                                    </td>
                                    <td className="border border-slate-300 p-3 text-center text-xs font-bold">
                                        {action.status === 'DONE' ? 'CONCLUÍDO' : action.status === 'DOING' ? 'EM ANDAMENTO' : 'PENDENTE'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 grid grid-cols-3 gap-8">
                        <div className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
                            Responsável Técnico
                        </div>
                        <div className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
                            Responsável Legal (Empresa)
                        </div>
                        <div className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
                            CIPA / Representante
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="space-y-6">
             {/* Header Section */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardList className="text-emerald-600" /> Gestão de Plano de Ação (GRO)
                        </h2>
                        <p className="text-sm text-slate-500">Centralize as ações corretivas do Checklist NR-1 e melhorias de Cultura.</p>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                         <button 
                             data-tour="tour-auto-plan"
                             onClick={handleAutoGenerate}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center shadow-md shadow-emerald-200"
                             title="Preencher com base nos diagnósticos realizados"
                         >
                             <Zap size={16} /> Gerar Plano Automático
                         </button>
                         <button 
                             onClick={() => setViewMode('PRINT')}
                             className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                         >
                             <Printer size={16} /> Relatório
                         </button>
                    </div>
                </div>

                {/* Stats & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-tour="tour-action-stats">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-400 uppercase font-bold">Total de Ações</span>
                        <span className="text-2xl font-bold text-slate-700">{stats.total}</span>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col items-center justify-center">
                        <span className="text-xs text-red-400 uppercase font-bold">Pendências Críticas</span>
                        <span className="text-2xl font-bold text-red-600">{stats.high}</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex flex-col items-center justify-center">
                        <span className="text-xs text-emerald-600 uppercase font-bold">Concluídas</span>
                        <span className="text-2xl font-bold text-emerald-600">{stats.done}</span>
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setViewMode('LIST')} className={`flex-1 py-1 text-xs font-bold rounded ${viewMode === 'LIST' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Lista</button>
                            <button onClick={() => setViewMode('KANBAN')} className={`flex-1 py-1 text-xs font-bold rounded ${viewMode === 'KANBAN' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Kanban</button>
                        </div>
                        <button 
                            data-tour="tour-manual-action"
                            onClick={() => setIsAdding(!isAdding)} 
                            className="bg-slate-800 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-1"
                        >
                            <Plus size={14} /> Adicionar Manualmente
                        </button>
                    </div>
                </div>

                {/* Manual Add Form */}
                {isAdding && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 animate-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Nova Ação Manual</h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                            <div className="md:col-span-6">
                                <input 
                                    type="text" 
                                    value={newItem.desc}
                                    onChange={e => setNewItem({...newItem, desc: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                                    placeholder="Descrição da ação..."
                                />
                            </div>
                            <div className="md:col-span-3">
                                <input 
                                    type="text" 
                                    value={newItem.resp}
                                    onChange={e => setNewItem({...newItem, resp: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                                    placeholder="Responsável (Ex: RH)"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <input 
                                    type="text" 
                                    value={newItem.date}
                                    onChange={e => setNewItem({...newItem, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                                    placeholder="Prazo (Ex: 30 dias)"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <select 
                                    value={newItem.prio}
                                    onChange={e => setNewItem({...newItem, prio: e.target.value as any})}
                                    className="w-full px-1 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                                >
                                    <option value="LOW">Baixa</option>
                                    <option value="MEDIUM">Média</option>
                                    <option value="HIGH">Alta</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-800">Cancelar</button>
                            <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </div>
                )}

                {/* LIST VIEW */}
                {viewMode === 'LIST' && (
                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <div className="bg-slate-50 border-b border-slate-200 p-3 flex gap-2">
                            {['ALL', 'TODO', 'DOING', 'DONE'].map(st => (
                                <button 
                                    key={st}
                                    onClick={() => setFilterStatus(st as any)}
                                    className={`px-3 py-1 rounded text-xs font-bold ${filterStatus === st ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {st === 'ALL' ? 'Todos' : st === 'TODO' ? 'Pendentes' : st === 'DOING' ? 'Em Andamento' : 'Concluídos'}
                                </button>
                            ))}
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3 w-16 text-center">Prio</th>
                                    <th className="px-4 py-3">Ação</th>
                                    <th className="px-4 py-3 w-40">Responsável</th>
                                    <th className="px-4 py-3 w-24">Prazo</th>
                                    <th className="px-4 py-3 w-32 text-center">Status</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredActions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma ação encontrada neste filtro.</td>
                                    </tr>
                                ) : filteredActions.map(action => (
                                    <tr key={action.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-3 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ${action.priority === 'HIGH' ? 'bg-red-500' : action.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} title={`Prioridade ${action.priority}`}></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-800">{action.description}</p>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{action.origin === 'NR1_DIAG' ? 'NR-1' : action.origin === 'CULTURE' ? 'Cultura' : 'Geral'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                                            <User size={14} className="text-slate-400"/> {action.responsible}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400"/> {action.deadline}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <select 
                                                value={action.status}
                                                onChange={(e) => updateStatus(action.id, e.target.value as any)}
                                                className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                                                    action.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                                    action.status === 'DOING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                <option value="TODO">Pendente</option>
                                                <option value="DOING">Andamento</option>
                                                <option value="DONE">Concluído</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => deleteAction(action.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* KANBAN VIEW */}
                {viewMode === 'KANBAN' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KanbanColumn title="A Fazer" status="TODO" icon={<AlertCircle size={16} className="text-red-500"/>} actions={actions} onMove={updateStatus} onDelete={deleteAction} />
                        <KanbanColumn title="Em Andamento" status="DOING" icon={<Clock size={16} className="text-amber-500"/>} actions={actions} onMove={updateStatus} onDelete={deleteAction} />
                        <KanbanColumn title="Concluído" status="DONE" icon={<CheckCircle2 size={16} className="text-emerald-500"/>} actions={actions} onMove={updateStatus} onDelete={deleteAction} />
                    </div>
                )}
             </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ 
    title: string, 
    status: 'TODO' | 'DOING' | 'DONE', 
    icon: React.ReactNode, 
    actions: ActionPlanItem[], 
    onMove: (id: string, status: any) => void,
    onDelete: (id: string) => void
}> = ({ title, status, icon, actions, onMove, onDelete }) => {
    const items = actions.filter(a => a.status === status);
    
    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
                    {icon} {title}
                </h3>
                <span className="bg-white text-slate-600 text-xs font-bold px-2 py-0.5 rounded border border-slate-200">{items.length}</span>
            </div>
            <div className="space-y-3 flex-1">
                {items.map(action => (
                    <div key={action.id} className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all group relative ${action.priority === 'HIGH' ? 'border-l-4 border-l-red-500' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                action.origin === 'NR1_DIAG' ? 'bg-blue-100 text-blue-700' : 
                                action.origin === 'CULTURE' ? 'bg-purple-100 text-purple-700' : 
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {action.origin === 'NR1_DIAG' ? 'NR-1' : action.origin === 'CULTURE' ? 'Cultura' : 'Geral'}
                            </span>
                            <button onClick={() => onDelete(action.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 absolute top-2 right-2">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mb-3 leading-snug">{action.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col text-xs text-slate-500">
                                <span className="font-bold text-slate-700 flex items-center gap-1"><User size={10}/> {action.responsible}</span>
                                <span className="flex items-center gap-1"><Calendar size={10}/> {action.deadline}</span>
                            </div>
                            {status !== 'DONE' && (
                                <button onClick={() => onMove(action.id, status === 'TODO' ? 'DOING' : 'DONE')} className="bg-slate-50 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 p-2 rounded-full transition-colors border border-slate-100 hover:border-emerald-200" title="Avançar">
                                    <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center h-24 flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium">Vazio</p>
                    </div>
                )}
            </div>
        </div>
    );
};