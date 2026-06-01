import React, { useState } from 'react';
import { CompanyProfile, ChecklistState, MaturityState, RiskItem, ActionPlanItem, RiskLevel, ChecklistItem } from '../types';
import { CHECKLIST_ITEMS, MATURITY_ITEMS, MATURITY_LEVEL_MAP, RISK_LEVEL_COLORS } from '../constants';
import { FileCheck, AlertTriangle, CheckCircle2, XCircle, Printer, FolderCheck, Building2, BarChart3, AlertOctagon, ClipboardList } from 'lucide-react';

interface Props {
    company: CompanyProfile;
    checklist: ChecklistState;
    maturity: MaturityState;
    risks: RiskItem[];
    actions: ActionPlanItem[];
    // New Props
    checklistComments?: Record<string, string>;
    customChecklistItems?: ChecklistItem[];
}

export const GlobalReportHub: React.FC<Props> = ({ company, checklist, maturity, risks, actions, checklistComments = {}, customChecklistItems = [] }) => {
    const [viewMode, setViewMode] = useState<'VALIDATION' | 'REPORT'>('VALIDATION');

    // --- Validation Logic ---
    const validations = [
        {
            id: 'company',
            label: 'Dados da Empresa',
            isValid: !!(company.name && company.cnpj && company.cnae),
            message: 'Nome, CNPJ e CNAE são obrigatórios.',
            link: 'Perfil'
        },
        {
            id: 'checklist',
            label: 'Diagnóstico NR-1',
            isValid: Object.keys(checklist).length > 0,
            message: 'Pelo menos um item do checklist deve ser respondido.',
            link: 'Checklist'
        },
        {
            id: 'maturity',
            label: 'Maturidade de Cultura',
            isValid: Object.keys(maturity).length >= 3,
            message: 'Avaliação de cultura incompleta (mínimo 3 dimensões).',
            link: 'Maturidade'
        },
        {
            id: 'risks',
            label: 'Inventário de Riscos (GRO)',
            isValid: risks.length > 0,
            message: 'O Inventário de Riscos não pode estar vazio.',
            link: 'Riscos'
        },
        {
            id: 'actions',
            label: 'Plano de Ação',
            isValid: actions.length > 0,
            message: 'Defina ao menos uma ação de controle ou melhoria.',
            link: 'Plano de Ação'
        }
    ];

    const allValid = validations.every(v => v.isValid);
    const progress = Math.round((validations.filter(v => v.isValid).length / validations.length) * 100);

    // --- Calculations for Report ---
    const combinedChecklistItems = [...CHECKLIST_ITEMS, ...customChecklistItems];
    
    const checklistPoints = (Object.values(checklist) as number[]).reduce((a, b) => a + (b || 0), 0);
    // Use the count of items present in checklist state to calculate max, or default to all items if full audit
    const maxChecklistPoints = combinedChecklistItems.length * 2;
    const checklistScore = maxChecklistPoints > 0 ? Math.round((checklistPoints / maxChecklistPoints) * 100) : 0;

    const maturityValues = Object.values(maturity) as number[];
    const maturityAvg = maturityValues.length > 0 ? maturityValues.reduce((a,b)=>a+b,0)/maturityValues.length : 0;
    const maturityLevel = MATURITY_LEVEL_MAP(maturityAvg);

    const criticalRisks = risks.filter(r => r.level === 'Crítico' || r.level === 'Alto').length;

    if (viewMode === 'REPORT') {
        return (
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500 bg-slate-100 min-h-screen p-4 md:p-8">
                {/* Toolbar */}
                <div className="w-full max-w-[210mm] flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                    <div>
                        <h3 className="font-bold text-slate-800">Visualização do Relatório Master</h3>
                        <p className="text-xs text-slate-500">PGR + GRO + Diagnóstico Integrado</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setViewMode('VALIDATION')}
                            className="text-slate-500 px-4 py-2 font-bold text-sm hover:bg-slate-50 rounded-lg"
                        >
                            Voltar
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        >
                            <Printer size={18} /> Imprimir / PDF
                        </button>
                    </div>
                </div>

                {/* A4 Paper */}
                <div className="bg-white shadow-xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[15mm] text-slate-900 text-sm leading-relaxed print:w-full print:max-w-none print:p-0 print:absolute print:top-0 print:left-0 print:mx-0">
                    
                    {/* Header */}
                    <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 text-slate-800 mb-2">
                                <FolderCheck size={32} />
                                <span className="font-bold text-lg tracking-widest uppercase">SafetyDiag Pro</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight leading-none">Relatório Gerencial Integrado</h1>
                            <p className="text-slate-500 text-sm mt-1 font-bold">PGR • GRO • Conformidade NR-1</p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Data de Emissão</div>
                            <div className="font-bold text-slate-800 text-lg">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* 1. Identification */}
                    <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300">
                        <h2 className="font-bold uppercase text-xs text-slate-500 mb-4 flex items-center gap-2">
                            <Building2 size={14} /> 1. Identificação da Organização
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-[10px] uppercase text-slate-400">Razão Social</span>
                                <span className="font-bold text-base">{company.name}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase text-slate-400">CNPJ</span>
                                <span className="font-bold text-base">{company.cnpj}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-[10px] uppercase text-slate-400">CNAE & Atividade</span>
                                <span className="font-medium">{company.cnae} - {company.cnaeDescription}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase text-slate-400">Grau de Risco (NR-4)</span>
                                <span className="font-bold">{company.riskDegree}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase text-slate-400">Colaboradores</span>
                                <span className="font-bold">{company.employees}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Executive Summary (Checklist & Maturity) */}
                    <div className="mb-8">
                        <h2 className="bg-slate-800 text-white px-3 py-1 font-bold uppercase text-xs mb-4 inline-block rounded-sm">2. Resumo Executivo e Diagnóstico</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="border border-slate-200 rounded p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><FolderCheck size={16}/> Conformidade Legal NR-1</h3>
                                    <span className="text-xl font-bold text-slate-900">{checklistScore}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                    <div className="bg-slate-800 h-2 rounded-full" style={{width: `${checklistScore}%`}}></div>
                                </div>
                                <p className="text-xs text-slate-500 text-justify">
                                    A empresa apresenta {checklistScore}% de aderência aos requisitos documentais e de gestão da NR-1. Pontos de atenção devem ser tratados no Plano de Ação.
                                </p>
                            </div>
                            <div className="border border-slate-200 rounded p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><BarChart3 size={16}/> Maturidade de Cultura</h3>
                                    <span className="text-lg font-bold text-slate-900">{maturityLevel}</span>
                                </div>
                                <div className="flex gap-1 mb-2">
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className={`h-2 flex-1 rounded-sm ${i <= maturityAvg ? 'bg-blue-600' : 'bg-slate-100'}`}></div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 text-justify">
                                    Nível médio de {maturityAvg.toFixed(1)}/5. Indica o estágio de evolução da percepção de riscos e comportamento seguro da liderança e operacional.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Risk Inventory Summary */}
                    <div className="mb-8">
                        <h2 className="bg-slate-800 text-white px-3 py-1 font-bold uppercase text-xs mb-4 inline-block rounded-sm">3. Inventário de Riscos (GRO)</h2>
                        <div className="mb-4 flex gap-4 text-xs">
                            <div className="bg-red-50 text-red-800 px-3 py-1 rounded border border-red-100 font-bold">
                                {criticalRisks} Riscos Críticos/Altos
                            </div>
                            <div className="bg-slate-50 text-slate-600 px-3 py-1 rounded border border-slate-200">
                                Total Identificado: {risks.length}
                            </div>
                        </div>
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="border border-slate-300 p-2 text-left">Processo / Atividade</th>
                                    <th className="border border-slate-300 p-2 text-left">Perigo (Fator)</th>
                                    <th className="border border-slate-300 p-2 text-center w-12">Nível</th>
                                </tr>
                            </thead>
                            <tbody>
                                {risks.slice(0, 8).map(r => (
                                    <tr key={r.id}>
                                        <td className="border border-slate-300 p-2 font-medium">{r.process}</td>
                                        <td className="border border-slate-300 p-2">{r.hazard}</td>
                                        <td className={`border border-slate-300 p-2 text-center font-bold ${RISK_LEVEL_COLORS[r.level].split(' ')[1]}`}>
                                            {r.level.toUpperCase()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {risks.length > 8 && (
                            <p className="text-[10px] text-slate-400 mt-1 italic text-center">
                                ... e mais {risks.length - 8} riscos. Consulte o anexo "Inventário Completo".
                            </p>
                        )}
                    </div>

                    {/* 4. Action Plan */}
                    <div className="mb-8 break-inside-avoid">
                        <h2 className="bg-slate-800 text-white px-3 py-1 font-bold uppercase text-xs mb-4 inline-block rounded-sm">4. Plano de Ação Integrado</h2>
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="border border-slate-300 p-2 text-left w-16">Prio.</th>
                                    <th className="border border-slate-300 p-2 text-left">Ação Necessária</th>
                                    <th className="border border-slate-300 p-2 text-left w-24">Responsável</th>
                                    <th className="border border-slate-300 p-2 text-center w-20">Prazo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actions.filter(a => a.status !== 'DONE').slice(0, 10).map(a => (
                                    <tr key={a.id}>
                                        <td className={`border border-slate-300 p-2 text-center font-bold ${a.priority === 'HIGH' ? 'text-red-600' : 'text-slate-600'}`}>
                                            {a.priority === 'HIGH' ? 'ALTA' : 'NORMAL'}
                                        </td>
                                        <td className="border border-slate-300 p-2">{a.description}</td>
                                        <td className="border border-slate-300 p-2">{a.responsible}</td>
                                        <td className="border border-slate-300 p-2 text-center">{a.deadline}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {actions.length === 0 && <p className="text-xs text-slate-400 italic p-2 border border-slate-300 text-center">Nenhuma ação pendente.</p>}
                    </div>

                    {/* Footer / Signatures */}
                    <div className="mt-12 pt-8 border-t border-slate-200 break-inside-avoid">
                        <div className="grid grid-cols-2 gap-16">
                            <div className="text-center">
                                <div className="border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
                                <p className="font-bold text-xs uppercase">{company.name}</p>
                                <p className="text-[10px] text-slate-500">Responsável Legal</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
                                <p className="font-bold text-xs uppercase">Responsável Técnico</p>
                                <p className="text-[10px] text-slate-500">SESMT / Elaborador do PGR</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 text-center mt-8">
                            Documento gerado eletronicamente via SafetyDiag Pro. Este relatório sintetiza as informações inseridas nos módulos de gestão.
                        </p>
                    </div>

                </div>
            </div>
        );
    }

    // --- Validation View (Default) ---
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Validação Final e Emissão de PGR</h2>
                        <p className="text-sm text-slate-500">Verifique se todos os módulos obrigatórios foram preenchidos antes de gerar o relatório oficial.</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700">Progresso de Preenchimento</span>
                        <span className={`text-xl font-bold ${progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{width: `${progress}%`}}
                        ></div>
                    </div>
                </div>

                {/* Validation List */}
                <div className="grid gap-4 mb-8">
                    {validations.map((val) => (
                        <div key={val.id} className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${val.isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${val.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {val.isValid ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${val.isValid ? 'text-emerald-800' : 'text-slate-700'}`}>{val.label}</h4>
                                    {!val.isValid && <p className="text-xs text-red-500 mt-1">{val.message}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                {val.isValid ? (
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Ok
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Pendente</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                <button 
                    onClick={() => setViewMode('REPORT')}
                    disabled={!allValid}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {allValid ? (
                        <> <FileCheck size={20} /> Gerar Relatório Master (PGR + GRO) </>
                    ) : (
                        <> <AlertOctagon size={20} /> Preencha os itens pendentes para liberar </>
                    )}
                </button>
            </div>
        </div>
    );
};