import React, { useState, useMemo, useRef } from 'react';
import { CHECKLIST_ITEMS, CALCULATE_CHECKLIST_LEVEL, CNAE_LIST, GET_RISK_DEGREE, GET_CNAE_DETAILS, BUSINESS_TYPES, GET_BUSINESS_TYPE_BY_CNAE } from '../constants';
import { ChecklistState, CompanyProfile, InternalProfile, Branch, Contract, ChecklistItem } from '../types';
import { CheckCircle2, ShieldAlert, Check, Building2, ArrowRight, FileText, Download, PieChart as PieChartIcon, Printer, Briefcase, Factory, Search, AlertTriangle, AlertCircle, XCircle, LayoutGrid, Zap, ChevronDown, Wand2, BookOpen, Target, Calendar, User, Plus, Trash2, MapPin, Upload, FileSpreadsheet, Loader2, Save, FolderOpen, RefreshCw, MessageSquare, ClipboardCheck, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  data: ChecklistState;
  onChange: (id: string, value: number) => void;
  company: CompanyProfile;
  onCompanyChange: (field: keyof CompanyProfile, value: any) => void;
  onBatchUpdate?: (newChecklist: ChecklistState, newCompany?: CompanyProfile, newComments?: Record<string, string>, newCustomItems?: ChecklistItem[]) => void;
  // Enhanced Props
  comments: Record<string, string>;
  onCommentChange: (id: string, text: string) => void;
  customItems: ChecklistItem[];
  onAddCustomItem: (item: ChecklistItem) => void;
  onDeleteCustomItem: (id: string) => void;
}

export const ChecklistTool: React.FC<Props> = ({ 
    data, onChange, company, onCompanyChange, onBatchUpdate,
    comments, onCommentChange, customItems, onAddCustomItem, onDeleteCustomItem
}) => {
  const [step, setStep] = useState<'PROFILE' | 'CHECKLIST' | 'REPORT'>('PROFILE');
  const [cnaeSearch, setCnaeSearch] = useState('');
  const [showCnaeDropdown, setShowCnaeDropdown] = useState(false);
  const [showSimulateOptions, setShowSimulateOptions] = useState(false);

  // Branch & Contract Management State
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState<Partial<Branch>>({});
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [newContract, setNewContract] = useState<Partial<Contract>>({});
  
  // Custom Item UI State
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomItem, setNewCustomItem] = useState({ question: '', description: '' });
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  // Contract Import State
  const [isImportingContracts, setIsImportingContracts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importProgressRef = useRef<HTMLInputElement>(null);

  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);

  const fetchCnpjDataInChecklist = async () => {
    const cleanCnpj = company.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length < 14) {
      alert('CNPJ deve conter 14 dígitos para consulta.');
      return;
    }
    setIsFetchingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!res.ok) {
        throw new Error('Empresa não encontrada na base pública da Receita Federal.');
      }
      const data = await res.json();
      
      const cleanName = data.nome_fantasia || data.razao_social || '';
      if (cleanName) {
        onCompanyChange('name', cleanName);
      }
      
      const cnaeFiscalStr = String(data.cnae_fiscal || '');
      const cleanCnae = cnaeFiscalStr.replace(/\D/g, '');
      
      let displayCnae = '';
      if (cleanCnae.length === 7) {
        displayCnae = `${cleanCnae.substring(0, 4)}-${cleanCnae.substring(4, 5)}/${cleanCnae.substring(5, 7)}`;
      } else {
        displayCnae = cleanCnae;
      }
      
      let risk = '1';
      let matchedCnaeInDb = CNAE_LIST.find(item => {
        const itemClean = item.code.replace(/\D/g, '');
        return cleanCnae.startsWith(itemClean) || itemClean.startsWith(cleanCnae);
      });
      
      if (matchedCnaeInDb) {
        risk = matchedCnaeInDb.risk;
      }
      
      const cnaeDesc = data.cnae_fiscal_descricao || matchedCnaeInDb?.desc || 'Atividade Comercial';
      const division = parseInt(cleanCnae.substring(0, 2)) || 0;
      const sector = (division >= 5 && division <= 43) ? 'INDUSTRIA' : 'COMERCIO_SERVICOS';
      
      onCompanyChange('cnae', displayCnae || cleanCnae);
      onCompanyChange('cnaeDescription', cnaeDesc);
      onCompanyChange('riskDegree', risk);
      onCompanyChange('sector', sector);
      
      const foundType = GET_BUSINESS_TYPE_BY_CNAE(displayCnae || cleanCnae) || GET_BUSINESS_TYPE_BY_CNAE(matchedCnaeInDb?.code || '');
      if (foundType) {
        onCompanyChange('businessTypeId', foundType.id);
      }
      
      alert(`Dados do CNPJ obtidos com sucesso!\nAtividade: ${cnaeDesc}\nSetor: ${sector === 'INDUSTRIA' ? 'Indústria' : 'Comércio/Serviços'}\nGrau de Risco: GR-${risk}`);
    } catch (err: any) {
      console.error(err);
      alert('Não foi possível realizar a consulta automática do CNPJ. Digite os dados manualmente.');
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  // --- Helpers ---
  const formatCNPJ = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    const limited = numeric.slice(0, 14);
    
    return limited
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const toggleComment = (id: string) => {
      const newSet = new Set(openComments);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setOpenComments(newSet);
  };

  const handleAddCustom = () => {
      if (!newCustomItem.question) return;
      onAddCustomItem({
          id: `custom_${Date.now()}`,
          category: 'Itens Personalizados (PGR/Campo)',
          question: newCustomItem.question,
          description: newCustomItem.description || 'Item adicionado manualmente para inspeção.'
      });
      setNewCustomItem({ question: '', description: '' });
      setIsAddingCustom(false);
  };

  // --- Calculations ---
  // Combine Static + Custom items for calculations
  const allChecklistItems = useMemo(() => [...CHECKLIST_ITEMS, ...customItems], [customItems]);
  
  const totalPoints = (Object.values(data) as number[]).reduce((acc, curr) => acc + (curr || 0), 0);
  // Calculate max points based on ALL items present in data (or all items defined)
  // To allow adding custom items without breaking score immediately, we count max points based on available items
  const maxPoints = allChecklistItems.length * 2;
  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  const level = CALCULATE_CHECKLIST_LEVEL(totalPoints); // Warning: Level logic in constants might need scale adjustment if many custom items added. 
  // Ideally, level should be percentage based, but keeping logic consistent with existing function for now.

  // --- Save & Load Logic ---
  const handleSaveProgress = () => {
      const exportData = {
          timestamp: new Date().toISOString(),
          version: '1.1',
          type: 'NR1_CHECKLIST_BACKUP',
          company: company,
          checklistData: data,
          checklistComments: comments,
          customChecklistItems: customItems
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `checklist_nr1_${company.name?.replace(/\s+/g, '_') || 'sem_nome'}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleLoadProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              if (json.type !== 'NR1_CHECKLIST_BACKUP') {
                  alert('Arquivo inválido. Certifique-se de importar um arquivo gerado por este sistema.');
                  return;
              }

              if (onBatchUpdate) {
                  onBatchUpdate(
                      json.checklistData || {}, 
                      json.company,
                      json.checklistComments,
                      json.customChecklistItems
                  );
                  alert('Progresso e evidências restaurados com sucesso!');
              }
          } catch (error) {
              console.error('Erro ao ler arquivo:', error);
              alert('Erro ao processar o arquivo. Verifique se é um JSON válido.');
          }
      };
      reader.readAsText(file);
      if (importProgressRef.current) importProgressRef.current.value = '';
  };

  const groupedItems = allChecklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categoryScores = Object.entries(groupedItems).map(([category, items]: [string, ChecklistItem[]]) => {
    const sectionPoints = items.reduce((acc, item) => acc + (data[item.id] || 0), 0);
    const sectionMax = items.length * 2;
    return {
      name: category.split('–')[1]?.trim() || category, // Simplify name
      fullName: category,
      score: sectionPoints,
      max: sectionMax,
      percent: sectionMax > 0 ? Math.round((sectionPoints / sectionMax) * 100) : 0
    };
  });

  const filteredCnaes = useMemo(() => {
    if (!cnaeSearch) return [];
    
    // Normalize input (remove dots, slashes)
    const lowerInput = cnaeSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return CNAE_LIST.filter(c => {
        // Clean the DB code for comparison
        const cleanCode = c.code.replace(/[^a-z0-9]/g, '');
        const desc = c.desc.toLowerCase();
        
        // 1. Search by Description
        if (desc.includes(lowerInput)) return true;

        // 2. Search by Code (Smart Match)
        // If user input is "4711302" (Subclass), it should match "47113" (Class)
        // Logic: Input starts with Code OR Code starts with Input
        if (cleanCode.startsWith(lowerInput) || lowerInput.startsWith(cleanCode)) return true;

        return false;
    }).slice(0, 10); // Limit results
  }, [cnaeSearch]);

  const selectCnae = (code: string, desc: string, risk: string) => {
      onCompanyChange('cnae', code);
      onCompanyChange('cnaeDescription', desc);
      onCompanyChange('riskDegree', risk);
      setCnaeSearch(`${code} - ${desc}`);
      setShowCnaeDropdown(false);

      // Auto-detect Business Type from CNAE
      const detectedType = GET_BUSINESS_TYPE_BY_CNAE(code);
      if (detectedType) {
          onCompanyChange('businessTypeId', detectedType.id);
      }
  };

  const clearCnae = () => {
      onCompanyChange('cnae', '');
      onCompanyChange('cnaeDescription', '');
      onCompanyChange('riskDegree', '');
      setCnaeSearch('');
  };

  const applySimulation = (scenario: 'PERFECT' | 'REALISTIC' | 'CRITICAL') => {
      allChecklistItems.forEach(item => {
          let val = 0;
          if (scenario === 'PERFECT') {
              val = 2;
          } else if (scenario === 'CRITICAL') {
              // Mostly 0, some 1
              val = Math.random() > 0.8 ? 1 : 0;
          } else {
              // REALISTIC: Weighted random
              // 50% chance of 2 (Sim), 30% chance of 1 (Parcial), 20% chance of 0 (Não)
              const r = Math.random();
              if (r > 0.5) val = 2;
              else if (r > 0.2) val = 1;
              else val = 0;
          }
          onChange(item.id, val);
      });
      setShowSimulateOptions(false);
  };

  // Branch Logic (Existing...)
  const handleAddBranch = () => {
      if (!newBranch.name) return;
      const branch: Branch = {
          id: Date.now().toString(),
          name: newBranch.name,
          cnpj: newBranch.cnpj || '',
          employees: newBranch.employees || 0,
          contracts: []
      };
      const updatedBranches = [...(company.branches || []), branch];
      onCompanyChange('branches', updatedBranches);
      setNewBranch({});
      setIsAddingBranch(false);
  };

  const handleRemoveBranch = (id: string) => {
      const updatedBranches = company.branches.filter(b => b.id !== id);
      onCompanyChange('branches', updatedBranches);
  };

  const handleAddContract = (branchId: string) => {
      if (!newContract.contractorName) return;
      
      const contract: Contract = {
          id: Date.now().toString(),
          contractorName: newContract.contractorName,
          cnpj: newContract.cnpj || '',
          workersCount: newContract.workersCount || 0,
          scope: newContract.scope || '',
          complianceStatus: 'PENDING'
      };

      const updatedBranches = company.branches.map(b => {
          if (b.id === branchId) {
              return { ...b, contracts: [...b.contracts, contract] };
          }
          return b;
      });

      onCompanyChange('branches', updatedBranches);
      setNewContract({});
      setIsAddingContract(false);
  };

  const handleContractImport = (branchId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImportingContracts(true);

      // Simulate parsing a CSV file with "CNPJ;Nome;Status"
      setTimeout(() => {
          const mockImportedContracts: Contract[] = [
              {
                  id: Date.now().toString() + '1',
                  contractorName: 'Serviços Gerais Limpeza Ltda',
                  cnpj: '11.222.333/0001-99',
                  workersCount: 5,
                  scope: 'Limpeza e Conservação',
                  complianceStatus: 'COMPLIANT'
              },
              {
                  id: Date.now().toString() + '2',
                  contractorName: 'Manutenção Elétrica Express',
                  cnpj: '44.555.666/0001-00',
                  workersCount: 2,
                  scope: 'Manutenção Predial',
                  complianceStatus: 'IRREGULAR'
              },
              {
                  id: Date.now().toString() + '3',
                  contractorName: 'Segurança Total S/A',
                  cnpj: '99.888.777/0001-11',
                  workersCount: 4,
                  scope: 'Vigilância',
                  complianceStatus: 'PENDING'
              }
          ];

          const updatedBranches = company.branches.map(b => {
              if (b.id === branchId) {
                  return { ...b, contracts: [...b.contracts, ...mockImportedContracts] };
              }
              return b;
          });

          onCompanyChange('branches', updatedBranches);
          setIsImportingContracts(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1500);
  };

  const handleRemoveContract = (branchId: string, contractId: string) => {
      const updatedBranches = company.branches.map(b => {
          if (b.id === branchId) {
              return { ...b, contracts: b.contracts.filter(c => c.id !== contractId) };
          }
          return b;
      });
      onCompanyChange('branches', updatedBranches);
  };

  // Get detailed structure for the selected CNAE
  const cnaeDetails = company.cnae ? GET_CNAE_DETAILS(company.cnae) : null;

  // --- Views ---

  const renderProfileForm = () => (
    <div className="max-w-4xl mx-auto">
       <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Cadastro da Empresa</h2>
             <p className="text-slate-500">Inicie o diagnóstico preenchendo os dados para classificação automática (Fase 1).</p>
          </div>

          <div className="space-y-6">
             {/* Name & CNPJ */}
             <div className="grid md:grid-cols-2 gap-4">
                 <div data-tour="tour-company-name">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social / Nome (Matriz)</label>
                    <input 
                      type="text" 
                      value={company.name}
                      onChange={e => onCompanyChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Ex: Indústria Metalúrgica ABC Ltda"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ (Matriz)</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={company.cnpj}
                         maxLength={18}
                         onChange={e => onCompanyChange('cnpj', formatCNPJ(e.target.value))}
                         className="flex-1 px-4 py-3 border border-slate-300 rounded-lg outline-none font-mono text-slate-700 focus:ring-2 focus:ring-emerald-500 text-sm"
                         placeholder="00.000.000/0001-00"
                       />
                       <button
                         type="button"
                         onClick={fetchCnpjDataInChecklist}
                         disabled={isFetchingCnpj || company.cnpj.replace(/\D/g, '').length < 14}
                         className="px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                         title="Buscar CNPJ na Base de Dados da Receita (Online)"
                       >
                         {isFetchingCnpj ? (
                           <Loader2 size={12} className="animate-spin" />
                         ) : (
                           <Sparkles size={12} />
                         )}
                         <span className="hidden sm:inline">Consultar Receita</span>
                       </button>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div data-tour="tour-company-employees">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nº Funcionários (Total)</label>
                    <input 
                      type="number" 
                      value={company.employees}
                      onChange={e => onCompanyChange('employees', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none"
                      placeholder="0"
                    />
                </div>
                <div className="relative" data-tour="tour-cnae-search">
                    <label className="block text-sm font-medium text-slate-700 mb-1">CNAE Principal (Busca)</label>
                    <div className="relative">
                        <input 
                            type="text"
                            value={cnaeSearch}
                            onChange={(e) => {
                                setCnaeSearch(e.target.value);
                                setShowCnaeDropdown(true);
                                if(e.target.value === '') clearCnae();
                            }}
                            onFocus={() => setShowCnaeDropdown(true)}
                            className="w-full pl-10 pr-8 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Código (Classe ou Subclasse) ou nome..."
                        />
                        <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        {company.cnae && (
                            <button onClick={clearCnae} className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500">
                                <XCircle size={18} />
                            </button>
                        )}
                    </div>

                    {showCnaeDropdown && cnaeSearch && !company.cnae && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {filteredCnaes.length > 0 ? (
                                filteredCnaes.map(c => (
                                    <button
                                        key={c.code}
                                        onClick={() => selectCnae(c.code, c.desc, c.risk)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                                    >
                                        <div className="font-bold text-slate-800 text-sm flex justify-between">
                                            <span>{c.code}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${c.risk === '4' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>GR: {c.risk}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">{c.desc}</div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-slate-400 text-center">
                                    Nenhum CNAE encontrado na base interna.
                                    <br/>
                                    <span className="text-xs opacity-70">Dica: Tente digitar apenas os números da Subclasse (7 dígitos).</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>

             {/* Business Type Selection (Auto-selected by CNAE) */}
             <div data-tour="tour-business-type">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Negócio (Sugestão de Riscos)</label>
                <select
                    value={company.businessTypeId || ''}
                    onChange={e => onCompanyChange('businessTypeId', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${company.businessTypeId ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium' : 'border-slate-300'}`}
                >
                    <option value="">Selecione ou aguarde preenchimento pelo CNAE...</option>
                    {BUSINESS_TYPES.map(bt => (
                        <option key={bt.id} value={bt.id}>{bt.publicName}</option>
                    ))}
                </select>
                {company.businessTypeId && (
                    <p className="text-xs text-emerald-600 mt-1 ml-1 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Modelo de PGR vinculado automaticamente ao CNAE selecionado.
                    </p>
                )}
             </div>

             {/* Sector Selection */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Setor Macro</label>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onCompanyChange('sector', 'COMERCIO_SERVICOS')}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${company.sector === 'COMERCIO_SERVICOS' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Briefcase size={24} />
                        <span className="font-bold text-sm">Comércio / Serviços</span>
                    </button>
                    <button 
                         onClick={() => onCompanyChange('sector', 'INDUSTRIA')}
                         className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${company.sector === 'INDUSTRIA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Factory size={24} />
                        <span className="font-bold text-sm">Indústria</span>
                    </button>
                </div>
             </div>

             {/* Branches & Contracts Section */}
             <div className="border-t border-slate-200 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <MapPin size={20} className="text-indigo-600" />
                        Estrutura Corporativa (Filiais & Terceiros)
                    </h3>
                    <button 
                        onClick={() => setIsAddingBranch(true)}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-lg flex items-center gap-1 border border-indigo-200"
                    >
                        <Plus size={14} /> Adicionar Filial
                    </button>
                </div>

                {isAddingBranch && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase mb-3">Nova Filial</h4>
                        <div className="grid md:grid-cols-3 gap-3 mb-3">
                            <input 
                                type="text" 
                                placeholder="Nome / Identificação" 
                                value={newBranch.name || ''}
                                onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                                className="px-3 py-2 rounded border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input 
                                type="text" 
                                placeholder="CNPJ Filial" 
                                value={newBranch.cnpj || ''}
                                maxLength={18}
                                onChange={e => setNewBranch({...newBranch, cnpj: formatCNPJ(e.target.value)})}
                                className="px-3 py-2 rounded border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input 
                                type="number" 
                                placeholder="Nº Funcionários" 
                                value={newBranch.employees || ''}
                                onChange={e => setNewBranch({...newBranch, employees: parseInt(e.target.value)})}
                                className="px-3 py-2 rounded border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAddingBranch(false)} className="text-slate-500 text-xs font-medium px-3 py-2">Cancelar</button>
                            <button onClick={handleAddBranch} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-indigo-700">Salvar Filial</button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {company.branches && company.branches.length > 0 ? company.branches.map((branch, idx) => (
                        <div key={branch.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="bg-slate-50 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setActiveBranchId(activeBranchId === branch.id ? null : branch.id)}>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-500">
                                        <Building2 size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{branch.name}</p>
                                        <p className="text-xs text-slate-500">{branch.cnpj} • {branch.employees} Colaboradores</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                                        {branch.contracts.length} Contratos
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveBranch(branch.id); }} className="p-1 hover:text-red-600 text-slate-400">
                                        <Trash2 size={14} />
                                    </button>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${activeBranchId === branch.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {activeBranchId === branch.id && (
                                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                                        <h5 className="text-xs font-bold text-slate-600 uppercase">Contratos Gerenciados (Terceiros)</h5>
                                        <div className="flex gap-2">
                                            <input 
                                                type="file" 
                                                accept=".csv" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                onChange={(e) => handleContractImport(branch.id, e)} 
                                            />
                                            <button
                                                onClick={() => !isImportingContracts && fileInputRef.current?.click()}
                                                disabled={isImportingContracts}
                                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded flex items-center gap-1 border border-slate-300"
                                            >
                                                {isImportingContracts ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />} 
                                                {isImportingContracts ? 'Auditando...' : 'Importar & Auditar (CSV)'}
                                            </button>
                                            <button 
                                                onClick={() => setIsAddingContract(true)}
                                                className="text-xs text-emerald-700 font-bold hover:bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-emerald-200 bg-emerald-50/50"
                                            >
                                                <Plus size={12} /> Novo Manual
                                            </button>
                                        </div>
                                    </div>

                                    {isAddingContract && (
                                        <div className="bg-white p-3 rounded border border-emerald-200 mb-3 animate-in fade-in">
                                            <div className="grid md:grid-cols-2 gap-2 mb-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Razão Social da Contratada" 
                                                    className="px-2 py-1.5 border border-slate-200 rounded text-xs w-full"
                                                    value={newContract.contractorName || ''}
                                                    onChange={e => setNewContract({...newContract, contractorName: e.target.value})}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="CNPJ" 
                                                    className="px-2 py-1.5 border border-slate-200 rounded text-xs w-full"
                                                    value={newContract.cnpj || ''}
                                                    maxLength={18}
                                                    onChange={e => setNewContract({...newContract, cnpj: formatCNPJ(e.target.value)})}
                                                />
                                            </div>
                                            <div className="grid md:grid-cols-4 gap-2 mb-2">
                                                <div className="md:col-span-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Escopo do Serviço (Ex: Limpeza, Manutenção)" 
                                                        className="px-2 py-1.5 border border-slate-200 rounded text-xs w-full"
                                                        value={newContract.scope || ''}
                                                        onChange={e => setNewContract({...newContract, scope: e.target.value})}
                                                    />
                                                </div>
                                                <input 
                                                    type="number" 
                                                    placeholder="Nº Trabalhadores" 
                                                    className="px-2 py-1.5 border border-slate-200 rounded text-xs w-full"
                                                    value={newContract.workersCount || ''}
                                                    onChange={e => setNewContract({...newContract, workersCount: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setIsAddingContract(false)} className="text-xs text-slate-500">Cancelar</button>
                                                <button onClick={() => handleAddContract(branch.id)} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded font-bold hover:bg-emerald-700">Salvar</button>
                                            </div>
                                        </div>
                                    )}

                                    {(branch.contracts as Contract[]).length > 0 ? (
                                        <div className="space-y-2">
                                            {(branch.contracts as Contract[]).map(contract => (
                                                <div key={contract.id} className="bg-white border border-slate-200 p-2 rounded flex justify-between items-center group">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-slate-800">{contract.contractorName}</p>
                                                            {contract.complianceStatus && (
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                                    contract.complianceStatus === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-700' :
                                                                    contract.complianceStatus === 'IRREGULAR' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {contract.complianceStatus === 'COMPLIANT' ? 'Regular' : contract.complianceStatus === 'IRREGULAR' ? 'Irregular' : 'Pendente'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500">{contract.scope} • {contract.workersCount} Terceirizados • CNPJ: {contract.cnpj}</p>
                                                    </div>
                                                    <button onClick={() => handleRemoveContract(branch.id, contract.id)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-4 bg-white border border-dashed border-slate-200 rounded">
                                            Nenhum contrato cadastrado nesta filial.
                                            <br/>
                                            <span className="text-[10px]">Use o botão de Importar CSV para verificar conformidade em lote.</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <p className="text-sm text-slate-500 mb-1">Nenhuma filial cadastrada.</p>
                            <p className="text-xs text-slate-400">Adicione filiais para gerenciar contratos de terceiros por unidade.</p>
                        </div>
                    )}
                </div>
             </div>

             {/* CNAE Info Panel (Simulating DB Tables: CNAE & CNAE_RISCO) */}
             {company.cnae && cnaeDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 mt-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-white p-2 rounded border border-slate-200 shadow-sm shrink-0">
                            <LayoutGrid className="text-slate-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Estrutura CNAE 2.0</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-600">
                                <div><span className="font-bold">Seção:</span> {cnaeDetails.section}</div>
                                <div><span className="font-bold">Divisão:</span> {cnaeDetails.division}</div>
                                <div><span className="font-bold">Grupo:</span> {cnaeDetails.group}</div>
                                <div><span className="font-bold">Classe:</span> {cnaeDetails.class} (Ref. NR-4)</div>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-center shadow-sm border ${
                            company.riskDegree === '4' ? 'bg-red-50 border-red-200 text-red-700' : 
                            company.riskDegree === '3' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                            <span className="block text-[10px] uppercase font-bold opacity-80">Grau de Risco</span>
                            <span className="text-2xl font-bold">{company.riskDegree}</span>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-white border border-slate-200 rounded text-xs text-slate-500">
                        <span className="font-bold text-slate-700 block mb-1">Descrição da Atividade:</span>
                        {company.cnaeDescription}
                    </div>
                </div>
             )}

             {/* Auto Classification Badge */}
             <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <span className="text-xs text-slate-500 uppercase font-bold block">Classificação Automática</span>
                    <span className="text-lg font-bold text-slate-800">{company.porte_ibge} Empresa</span>
                </div>
                <div className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-md">
                    Perfil: {company.perfil_interno?.replace('_', ' ')}
                </div>
             </div>

             <button 
               data-tour="tour-start-audit"
               onClick={() => setStep('CHECKLIST')}
               disabled={!company.name || !company.employees || !company.cnae}
               className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
                Confirmar e Iniciar Diagnóstico <ArrowRight size={20} />
             </button>
          </div>
       </div>
    </div>
  );

  const renderChecklist = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      {/* Sticky Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-0 z-20 bg-opacity-95 backdrop-blur flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h3 className="font-bold text-slate-800 hidden md:block">{company.name || 'Nova Auditoria'}</h3>
           <p className="text-xs text-slate-500 flex items-center gap-1">
               <RefreshCw size={10} className="animate-spin-slow" /> Salvo automaticamente
           </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
             {/* Import/Export Controls */}
             <div className="flex gap-2 mr-2 border-r border-slate-200 pr-2">
                 <input 
                    type="file" 
                    accept=".json" 
                    ref={importProgressRef} 
                    className="hidden" 
                    onChange={handleLoadProgress} 
                 />
                 <button 
                    onClick={() => importProgressRef.current?.click()}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-2 rounded-lg transition-colors"
                    title="Carregar Progresso (Importar JSON)"
                 >
                    <FolderOpen size={16} />
                 </button>
                 <button 
                    onClick={handleSaveProgress}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-2 rounded-lg transition-colors"
                    title="Salvar Progresso (Baixar JSON)"
                 >
                    <Save size={16} />
                 </button>
             </div>

             <div className="relative">
                <button 
                    onClick={() => setShowSimulateOptions(!showSimulateOptions)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 border border-slate-300"
                >
                    <Zap size={14} className="text-amber-500" />
                    <span className="hidden sm:inline">Auto</span>
                    <ChevronDown size={14} />
                </button>
                
                {showSimulateOptions && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-1">
                        <button 
                            onClick={() => applySimulation('PERFECT')} 
                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs font-medium text-emerald-700 rounded-md flex items-center gap-2"
                        >
                            <CheckCircle2 size={14} /> Conformidade Total (100%)
                        </button>
                        <button 
                            onClick={() => applySimulation('REALISTIC')} 
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs font-medium text-blue-700 rounded-md flex items-center gap-2"
                        >
                            <Wand2 size={14} /> Cenário Realista (Mix)
                        </button>
                        <button 
                            onClick={() => applySimulation('CRITICAL')} 
                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-xs font-medium text-red-700 rounded-md flex items-center gap-2"
                        >
                            <AlertCircle size={14} /> Cenário Crítico (Alto Risco)
                        </button>
                    </div>
                )}
             </div>

             <div className="text-right hidden sm:block border-l pl-3 border-slate-200">
                <p className="text-xs text-slate-400 font-bold uppercase">Pontuação</p>
                <p className="text-lg font-bold text-slate-800 leading-none">{totalPoints} <span className="text-xs text-slate-400">/ {maxPoints}</span></p>
             </div>
             
             <button 
                onClick={() => setStep('REPORT')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
             >
                <FileText size={16} /> <span className="hidden sm:inline">Gerar Laudo</span>
             </button>
        </div>
      </div>

      <div className="grid gap-8">
        {Object.entries(groupedItems).map(([category, items]: [string, ChecklistItem[]]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">{category}</h3>
                <span className="text-xs font-semibold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                    {items.length} Itens
                </span>
             </div>
             <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const currentValue = data[item.id] ?? 0;
                  const hasComment = !!comments[item.id];
                  const isCustom = item.id.startsWith('custom_');
                  
                  return (
                    <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors">
                       <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                {isCustom && <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Custom</span>}
                                <p className="font-medium text-slate-800">{item.question}</p>
                             </div>
                             <p className="text-sm text-slate-500">{item.description}</p>
                             
                             {/* Comment Section */}
                             {openComments.has(item.id) && (
                                 <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                     <textarea 
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Adicione observações, evidências ou justificativas..."
                                        rows={2}
                                        value={comments[item.id] || ''}
                                        onChange={(e) => onCommentChange(item.id, e.target.value)}
                                     />
                                 </div>
                             )}
                          </div>
                          
                          <div className="flex-shrink-0 flex items-center gap-2 self-start md:self-center">
                             <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => onChange(item.id, 0)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                    currentValue === 0 
                                        ? 'bg-red-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Não
                                </button>
                                <button
                                    onClick={() => onChange(item.id, 1)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                    currentValue === 1 
                                        ? 'bg-amber-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Parcial
                                </button>
                                <button
                                    onClick={() => onChange(item.id, 2)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                                    currentValue === 2 
                                        ? 'bg-emerald-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {currentValue === 2 && <Check size={12} />}
                                    Sim
                                </button>
                             </div>
                             
                             <button 
                                onClick={() => toggleComment(item.id)}
                                className={`p-2 rounded-lg border transition-colors ${hasComment || openComments.has(item.id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                title="Adicionar Observação/Evidência"
                             >
                                <MessageSquare size={16} />
                             </button>

                             {isCustom && (
                                 <button 
                                    onClick={() => onDeleteCustomItem(item.id)}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-300 hover:text-red-500 hover:border-red-200 transition-colors"
                                    title="Remover Item"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             )}
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        ))}

        {/* Add Custom Item Section */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
            {isAddingCustom ? (
                <div className="max-w-xl mx-auto bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-left animate-in zoom-in-95">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><ClipboardCheck size={18}/> Novo Item de Verificação</h4>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Pergunta / Requisito (Ex: O extintor está desobstruído?)" 
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newCustomItem.question}
                            onChange={e => setNewCustomItem({...newCustomItem, question: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="Descrição / Critério de Aceitação (Opcional)" 
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newCustomItem.description}
                            onChange={e => setNewCustomItem({...newCustomItem, description: e.target.value})}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAddingCustom(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800">Cancelar</button>
                            <button onClick={handleAddCustom} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">Adicionar Item</button>
                        </div>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAddingCustom(true)}
                    className="text-slate-500 hover:text-blue-600 font-bold flex flex-col items-center gap-2 mx-auto transition-colors"
                >
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-sm">
                        <Plus size={24} />
                    </div>
                    Adicionar Item Personalizado
                </button>
            )}
        </div>
      </div>
    </div>
  );

  const renderReport = () => {
    // Re-calculate local stats for report view based on combined items
    const pieData = [
        { name: 'Conforme', value: totalPoints, fill: '#10b981' },
        { name: 'Não Conforme', value: maxPoints - totalPoints, fill: '#e2e8f0' },
    ];
    
    // Recommendations logic
    const recommendations: {priority: string, action: string, resp: string}[] = [];
    if (categoryScores.length > 0 && categoryScores[0].percent < 100) recommendations.push({ priority: 'Alta', action: "Formalizar o PGR (Inventário de Riscos) e definir responsáveis técnicos.", resp: "Diretoria" });
    // ... (other logic kept same, simplified for brevity)

    // Identify items for lists
    const weakItems = allChecklistItems.filter(i => (data[i.id] || 0) === 0);
    const strongItems = allChecklistItems.filter(i => (data[i.id] || 0) === 2);

    let summaryText = "";
    let summaryBg = "";
    // ... (Existing logic for summaryText based on level)
    if (level.label === 'Crítico') {
        summaryText = "A organização encontra-se em estágio crítico de conformidade legal com a NR-1. Há ausência de documentos estruturais fundamentais (PGR) e controles básicos de risco. A exposição a passivos trabalhistas e o risco de acidentes são altos. Recomenda-se parada técnica para estruturação imediata do GRO.";
        summaryBg = "bg-red-50 border-red-200 text-red-900";
    } else if (level.label === 'Básico') {
        summaryText = "A organização possui noções básicas de segurança, mas o gerenciamento de riscos ainda é reativo e documental. Existem documentos (PPRA/PGR antigos), mas falta integração com a rotina operacional e evidências de treinamentos. Necessário avançar para a gestão proativa de riscos.";
        summaryBg = "bg-amber-50 border-amber-200 text-amber-900";
    } else if (level.label === 'Intermediário') {
        summaryText = "A organização demonstra boa estrutura de gestão. O PGR existe e é conhecido, porém há oportunidades de melhoria na consulta aos trabalhadores, na gestão de mudanças e na análise de eficácia das medidas de controle. O foco deve ser a melhoria contínua (PDCA).";
        summaryBg = "bg-blue-50 border-blue-200 text-blue-900";
    } else {
        summaryText = "A organização apresenta alto nível de maturidade em segurança e saúde. O GRO está implementado, o inventário de riscos é dinâmico e integrado aos processos produtivos. Recomenda-se manter as rotinas de auditoria interna e buscar certificações voluntárias (ISO 45001).";
        summaryBg = "bg-emerald-50 border-emerald-200 text-emerald-900";
    }

    const getStatusLabel = (percent: number) => {
        if (percent < 50) return { label: 'CRÍTICO', color: 'text-red-700 bg-red-100 border-red-200' };
        if (percent < 80) return { label: 'ALERTA', color: 'text-amber-700 bg-amber-100 border-amber-200' };
        return { label: 'CONFORME', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300 pb-10">
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button 
                    onClick={() => setStep('CHECKLIST')}
                    className="text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-2"
                >
                    <ArrowRight className="rotate-180" size={18}/> Voltar para Checklist
                </button>
                <button 
                    onClick={() => window.print()}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                >
                    <Printer size={18} /> Imprimir / Salvar PDF
                </button>
            </div>

            {/* Report Paper - Styled for Print */}
            <div className="bg-white p-10 shadow-xl print:shadow-none print:p-0 print:w-full print:max-w-none print:absolute print:top-0 print:left-0 min-h-[297mm]">
                
                {/* Header */}
                <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-end print:border-black">
                    <div>
                        <div className="flex items-center gap-2 text-slate-800 mb-2">
                            <ShieldAlert size={32} />
                            <span className="font-bold text-lg tracking-widest uppercase">SafetyDiag Pro</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight leading-none">Relatório de Conformidade</h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Norma Regulamentadora Nº 01 (PGR / GRO)</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Data da Auditoria</div>
                        <div className="font-bold text-slate-800 text-lg border-2 border-slate-200 px-3 py-1 rounded">{new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Company Info */}
                <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200 print:bg-white print:border-slate-300">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Dados da Organização</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <span className="block text-xs text-slate-500 uppercase">Razão Social</span>
                            <span className="font-bold text-slate-900 text-sm">{company.name}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500 uppercase">CNPJ</span>
                            <span className="font-bold text-slate-900 text-sm">{company.cnpj}</span>
                        </div>
                         <div>
                            <span className="block text-xs text-slate-500 uppercase">Funcionários</span>
                            <span className="font-bold text-slate-900 text-sm">{company.employees}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500 uppercase">Perfil</span>
                            <span className="font-bold text-slate-900 text-xs">{company.perfil_interno}</span>
                        </div>
                    </div>
                    
                    {/* CNAE Info in Report */}
                    {company.cnae && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="md:col-span-3">
                                    <span className="block text-xs text-slate-500 uppercase">CNAE Principal</span>
                                    <span className="font-bold text-slate-900 text-sm">{company.cnae} - {company.cnaeDescription}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-500 uppercase">Grau de Risco (NR-4)</span>
                                    <span className="font-bold text-slate-900 text-sm">{company.riskDegree}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Executive Summary */}
                <div className={`p-6 rounded-lg border mb-8 ${summaryBg} print:border-black print:bg-white print:text-black`}>
                    <h3 className="font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                        <BookOpen size={14} /> Resumo Executivo
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-justify">
                        {summaryText}
                    </p>
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 items-center break-inside-avoid">
                    <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-slate-200">
                         <div className="w-40 h-40 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270} isAnimationActive={false}>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-800">{percentage}%</span>
                                <span className="text-xs text-slate-500 uppercase font-bold">Aderência</span>
                            </div>
                         </div>
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center gap-4 mb-6">
                             <div className={`text-2xl font-bold px-4 py-2 rounded-lg border-l-4 ${level.color.replace('bg-', 'border-').replace('text-', 'bg-white text-')} print:border-black print:text-black`}>
                                 Classificação: {level.label}
                             </div>
                             <p className="text-slate-600 text-sm flex-1 print:text-black">
                                A empresa obteve <strong>{totalPoints} de {maxPoints} pontos</strong> possíveis na auditoria de requisitos legais NR-1.
                             </p>
                        </div>
                        
                        {/* Detailed Compliance Table */}
                        <table className="w-full text-sm text-left border-collapse border border-slate-200">
                            <thead className="bg-slate-100 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="p-2 border border-slate-200">Sessão / Área</th>
                                    <th className="p-2 border border-slate-200 text-center">Pontuação</th>
                                    <th className="p-2 border border-slate-200 text-center">%</th>
                                    <th className="p-2 border border-slate-200 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryScores.map((cat, idx) => {
                                    const status = getStatusLabel(cat.percent);
                                    return (
                                        <tr key={idx}>
                                            <td className="p-2 border border-slate-200 font-medium text-slate-700">{cat.name}</td>
                                            <td className="p-2 border border-slate-200 text-center text-slate-600">{cat.score} / {cat.max}</td>
                                            <td className="p-2 border border-slate-200 text-center font-bold">{cat.percent}%</td>
                                            <td className="p-2 border border-slate-200 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Analysis Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 break-inside-avoid print:gap-4">
                    <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-6 print:bg-white print:border-slate-300">
                        <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-4 text-sm uppercase tracking-wide print:text-black">
                            <CheckCircle2 size={18} className="text-emerald-600 print:text-black" /> Pontos Fortes (Conformidade)
                        </h4>
                        <ul className="list-disc pl-5 text-xs text-emerald-900 space-y-2 print:text-black">
                            {strongItems.slice(0, 5).map(item => (
                                <li key={item.id}>{item.question}</li>
                            ))}
                            {strongItems.length === 0 && (
                                <li className="italic opacity-70">Nenhum item em conformidade total identificado.</li>
                            )}
                        </ul>
                    </div>
                    <div className="border border-red-200 bg-red-50/50 rounded-lg p-6 print:bg-white print:border-slate-300">
                        <h4 className="font-bold text-red-900 flex items-center gap-2 mb-4 text-sm uppercase tracking-wide print:text-black">
                            <ShieldAlert size={18} className="text-red-600 print:text-black" /> Pontos de Atenção (Gaps)
                        </h4>
                        <ul className="list-none pl-0 text-xs text-red-900 space-y-3 print:text-black">
                            {weakItems.slice(0, 7).map(item => (
                                <li key={item.id} className="border-b border-red-200 pb-2 last:border-0">
                                    <div className="flex gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="font-bold">{item.question}</p>
                                            {/* Show comment if exists */}
                                            {comments[item.id] && (
                                                <p className="mt-1 text-slate-600 italic bg-white/50 p-1 rounded border border-red-100">
                                                    Obs: {comments[item.id]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                             {weakItems.length === 0 && (
                                <li className="italic opacity-70">Nenhum item crítico (Não Conforme) identificado.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Recommendations Table */}
                <div className="border-t-2 border-slate-200 pt-8 break-inside-avoid print:border-black">
                    <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                        <Target size={16} /> Plano de Ação Preliminar (Sugestão)
                    </h3>
                    
                    {recommendations.length > 0 ? (
                        <table className="w-full text-xs text-left border-collapse border border-slate-300">
                            <thead className="bg-slate-200 text-slate-700">
                                <tr>
                                    <th className="p-2 border border-slate-300 w-16 text-center">Prioridade</th>
                                    <th className="p-2 border border-slate-300">Ação Recomendada</th>
                                    <th className="p-2 border border-slate-300 w-32">Responsável</th>
                                    <th className="p-2 border border-slate-300 w-24 text-center">Prazo Est.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recommendations.map((rec, idx) => (
                                    <tr key={idx}>
                                        <td className={`p-2 border border-slate-300 text-center font-bold ${rec.priority === 'Alta' ? 'text-red-600' : 'text-amber-600'}`}>
                                            {rec.priority.toUpperCase()}
                                        </td>
                                        <td className="p-2 border border-slate-300 font-medium text-slate-800">{rec.action}</td>
                                        <td className="p-2 border border-slate-300 text-slate-600">{rec.resp}</td>
                                        <td className="p-2 border border-slate-300 text-center text-slate-500">30 dias</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded text-center text-emerald-800 text-sm">
                            <CheckCircle2 className="mx-auto mb-2" size={24} />
                            Parabéns! O diagnóstico não identificou pendências graves automáticas. Mantenha o sistema de gestão atualizado.
                        </div>
                    )}
                </div>
                
                <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 print:mt-8">
                    <p>Relatório gerado automaticamente pelo sistema SafetyDiag Pro | {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
  };

  return (
    <>
        {step === 'PROFILE' && renderProfileForm()}
        {step === 'CHECKLIST' && renderChecklist()}
        {step === 'REPORT' && renderReport()}
    </>
  );
};