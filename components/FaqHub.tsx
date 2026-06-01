
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, BookOpen, Scale, AlertTriangle, FileText } from 'lucide-react';

interface FaqItem {
    id: string;
    question: string;
    answer: React.ReactNode;
    category: 'CONCEITOS' | 'LEGAL' | 'SISTEMA';
}

const FAQ_DATA: FaqItem[] = [
    // CONCEITOS BÁSICOS
    {
        id: '1',
        category: 'CONCEITOS',
        question: 'Qual a diferença entre PPRA e PGR?',
        answer: 'O PPRA (antiga NR-9) focava apenas em riscos ambientais (físicos, químicos e biológicos). O PGR (Programa de Gerenciamento de Riscos), introduzido pela nova NR-1, é mais abrangente: inclui riscos ergonômicos e de acidentes, além de exigir um plano de ação contínuo e gestão de processos, não sendo apenas um documento de gaveta.'
    },
    {
        id: '2',
        category: 'CONCEITOS',
        question: 'O que é o GRO?',
        answer: 'GRO (Gerenciamento de Riscos Ocupacionais) não é um documento, mas sim a estratégia geral da empresa para gerir riscos. O PGR é o braço material do GRO, contendo o Inventário de Riscos e o Plano de Ação.'
    },
    {
        id: '3',
        category: 'CONCEITOS',
        question: 'O que deve conter no Inventário de Riscos?',
        answer: 'Deve conter a caracterização dos processos e ambientes de trabalho, a identificação dos perigos, a avaliação dos riscos (nível de risco considerando probabilidade e severidade) e a classificação para determinar a necessidade de medidas de controle.'
    },
    
    // ASPECTOS LEGAIS
    {
        id: '4',
        category: 'LEGAL',
        question: 'Quem pode assinar o PGR?',
        answer: 'O PGR pode ser elaborado por profissionais qualificados em segurança do trabalho. Embora a NR-1 não exija ART (Anotação de Responsabilidade Técnica) para todos os casos, recomenda-se que seja feito por Engenheiros de Segurança ou Técnicos de Segurança, dependendo da complexidade. O empregador também assina como responsável pela implementação.'
    },
    {
        id: '5',
        category: 'LEGAL',
        question: 'Empresas MEI precisam de PGR?',
        answer: 'MEI está dispensado de elaborar PGR se não tiver exposição a agentes físicos, químicos, biológicos ou riscos relacionados a fatores ergonômicos e de acidentes que exijam controle. Entretanto, a Ficha MEI (disponibilizada pelo governo) deve ser preenchida. Se contratar funcionário e houver riscos, deve seguir as regras para ME/EPP.'
    },
    {
        id: '6',
        category: 'LEGAL',
        question: 'Qual a validade do PGR?',
        answer: 'O PGR deve ser revisto a cada 2 anos. Se a empresa possuir certificação em sistema de gestão de SST (como ISO 45001), o prazo pode ser de 3 anos. Além disso, deve ser revisto sempre que houver mudanças nos processos, novos riscos ou acidentes.'
    },

    // SOBRE O SISTEMA
    {
        id: '7',
        category: 'SISTEMA',
        question: 'Este sistema substitui um Engenheiro de Segurança?',
        answer: <span className="text-red-600 font-bold">Não. Este sistema é uma ferramenta de apoio à gestão e diagnóstico. Ele auxilia na organização de dados e sugere ações baseadas em IA, mas a validação técnica, a medição quantitativa de riscos (dosimetria, poeira, etc.) e a responsabilidade legal exigem um profissional habilitado.</span>
    },
    {
        id: '8',
        category: 'SISTEMA',
        question: 'Como funciona a geração automática de Planos de Ação?',
        answer: 'O sistema cruza os dados do Checklist NR-1 (conformidade legal) e da pesquisa de Percepção de Cultura. Se identificar itens "Não Conformes" ou setores com baixa "Consciência de Risco", ele cria automaticamente uma sugestão de ação corretiva no módulo de Plano de Ação.'
    },
    {
        id: '9',
        category: 'SISTEMA',
        question: 'Meus dados estão seguros?',
        answer: 'Sim. Os dados são processados localmente no seu navegador e utilizamos APIs seguras para as funcionalidades de Inteligência Artificial. Não compartilhamos seus dados com terceiros para fins comerciais.'
    }
];

export const FaqHub: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredFaq = FAQ_DATA.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedFaq = {
        'CONCEITOS': filteredFaq.filter(i => i.category === 'CONCEITOS'),
        'LEGAL': filteredFaq.filter(i => i.category === 'LEGAL'),
        'SISTEMA': filteredFaq.filter(i => i.category === 'SISTEMA'),
    };

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'CONCEITOS': return <BookOpen size={18} className="text-blue-500"/>;
            case 'LEGAL': return <Scale size={18} className="text-amber-500"/>;
            case 'SISTEMA': return <AlertTriangle size={18} className="text-emerald-500"/>;
            default: return <HelpCircle size={18}/>;
        }
    };

    const getLabel = (cat: string) => {
        switch(cat) {
            case 'CONCEITOS': return 'Conceitos Fundamentais (NR-1 & GRO)';
            case 'LEGAL': return 'Aspectos Legais e Obrigatoriedade';
            case 'SISTEMA': return 'Sobre o NR1 Fácil e Limitações';
            default: return cat;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Central de Ajuda</h2>
                <p className="text-slate-500 max-w-lg mx-auto mb-6">
                    Tire suas dúvidas sobre a Norma Regulamentadora nº 01, Gerenciamento de Riscos Ocupacionais e como utilizar nossa plataforma.
                </p>
                
                <div className="max-w-xl mx-auto relative">
                    <input 
                        type="text" 
                        placeholder="Buscar dúvida..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
            </div>

            {/* FAQ List */}
            <div className="max-w-3xl mx-auto space-y-8">
                {Object.entries(groupedFaq).map(([category, items]) => (
                    items.length > 0 && (
                        <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
                                {getIcon(category)}
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                                    {getLabel(category)}
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <div key={item.id} className="group">
                                        <button 
                                            onClick={() => toggleItem(item.id)}
                                            className="w-full text-left p-5 flex justify-between items-center hover:bg-slate-50 transition-colors focus:outline-none"
                                        >
                                            <span className={`font-medium ${openItems.includes(item.id) ? 'text-blue-700' : 'text-slate-700'}`}>
                                                {item.question}
                                            </span>
                                            {openItems.includes(item.id) ? 
                                                <ChevronUp size={20} className="text-blue-500" /> : 
                                                <ChevronDown size={20} className="text-slate-400 group-hover:text-slate-600" />
                                            }
                                        </button>
                                        {openItems.includes(item.id) && (
                                            <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed animate-in slide-in-from-top-1">
                                                <div className="pt-2 border-t border-slate-100 mt-2">
                                                    {item.answer}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {filteredFaq.length === 0 && (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-slate-500 font-medium">Nenhum resultado encontrado para "{searchTerm}"</p>
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="text-blue-600 font-bold text-sm mt-2 hover:underline"
                        >
                            Limpar busca
                        </button>
                    </div>
                )}
            </div>
            
            {/* Footer Support */}
            <div className="text-center pt-8 pb-4">
                <p className="text-xs text-slate-400">
                    Ainda com dúvidas? Consulte a <a href="https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/ctpp/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-1-nr-1" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">documentação oficial da NR-1</a>.
                </p>
            </div>
        </div>
    );
};
