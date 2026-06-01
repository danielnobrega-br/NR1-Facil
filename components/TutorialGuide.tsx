import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { ToolType } from '../types';

interface Step {
    target: string; // data-tour id
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: Record<string, Step[]> = {
    [ToolType.CHECKLIST]: [
        {
            target: 'tour-company-name',
            title: 'Identificação da Empresa',
            content: 'Comece preenchendo a Razão Social. Isso é fundamental para vincular o documento legal (PGR) à pessoa jurídica correta.',
            position: 'bottom'
        },
        {
            target: 'tour-company-employees',
            title: 'Dimensionamento',
            content: 'Informe o número total de funcionários. O sistema usa isso para definir se você se enquadra nas regras simplificadas para ME/EPP (Item 1.8 da NR-1).',
            position: 'bottom'
        },
        {
            target: 'tour-cnae-search',
            title: 'Grau de Risco (CNAE)',
            content: 'Digite o código ou nome da atividade (ex: "Padaria"). O sistema buscará automaticamente o Grau de Risco (1 a 4) conforme a NR-4, que define a complexidade do seu SESMT.',
            position: 'bottom'
        },
        {
            target: 'tour-business-type',
            title: 'Modelo Inteligente',
            content: 'Com base no CNAE, selecionamos um "Tipo de Negócio". Isso permite que nossa IA sugira riscos típicos do seu setor automaticamente mais à frente.',
            position: 'top'
        },
        {
            target: 'tour-start-audit',
            title: 'Iniciar Diagnóstico',
            content: 'Após preencher o perfil, clique aqui para liberar o Checklist de conformidade e as ferramentas de gestão.',
            position: 'top'
        }
    ],
    [ToolType.RISK_TOOLS]: [
        {
            target: 'tour-risk-inventory-tab',
            title: 'O Coração do PGR',
            content: 'Aqui fica o seu Inventário de Riscos. Pela NR-1, você deve listar todos os perigos (físicos, químicos, biológicos, ergonômicos e de acidentes).',
            position: 'bottom'
        },
        {
            target: 'tour-risk-generator-tab',
            title: 'Acelerador com IA',
            content: 'Não sabe por onde começar? Use o "Gerador Express". Ele lê seu CNAE e cria uma lista base de riscos comuns para você apenas validar.',
            position: 'bottom'
        },
        {
            target: 'tour-manual-risk-add',
            title: 'Cadastro Manual',
            content: 'Para riscos específicos, use este formulário. Defina a Probabilidade e Severidade para calcular o nível de risco automaticamente (Matriz de Risco).',
            position: 'right'
        }
    ],
    [ToolType.ACTION_PLAN]: [
        {
            target: 'tour-action-stats',
            title: 'Painel de Controle',
            content: 'Acompanhe quantas ações estão pendentes. O GRO exige gestão contínua, não apenas papel. Monitore os prazos aqui.',
            position: 'bottom'
        },
        {
            target: 'tour-auto-plan',
            title: 'Automação do Plano',
            content: 'Esta é a ferramenta mais poderosa. Ao clicar aqui, o sistema varre o Checklist (Gaps Legais) e a Avaliação de Cultura e cria ações corretivas sugeridas automaticamente.',
            position: 'bottom'
        },
        {
            target: 'tour-manual-action',
            title: 'Adicionar Ação',
            content: 'Você também pode criar ações avulsas, como "Comprar EPIs" ou "Realizar Exame Periódico", definindo responsável e prazo.',
            position: 'top'
        }
    ]
};

interface Props {
    activeTab: ToolType;
    isOpen: boolean;
    onClose: () => void;
}

export const TutorialGuide: React.FC<Props> = ({ activeTab, isOpen, onClose }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [position, setPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);

    const steps = TOUR_STEPS[activeTab] || [];

    useEffect(() => {
        if (isOpen) {
            setCurrentStepIndex(0);
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        if (!isOpen || steps.length === 0) return;

        const updatePosition = () => {
            const step = steps[currentStepIndex];
            const element = document.querySelector(`[data-tour="${step.target}"]`);
            
            if (element) {
                const rect = element.getBoundingClientRect();
                setPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
                
                // Smooth scroll to element
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Element not found (maybe inside a tab not rendered?), skip or close
                console.warn(`Tutorial target not found: ${step.target}`);
            }
        };

        // Delay slightly to allow UI to render/settle
        const timer = setTimeout(updatePosition, 300);
        window.addEventListener('resize', updatePosition);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
        };
    }, [currentStepIndex, isOpen, steps]);

    if (!isOpen || steps.length === 0 || !position) return null;

    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;

    // Calculate Popover Position relative to highlight box
    let popoverStyle: React.CSSProperties = {};
    if (currentStep.position === 'bottom') {
        popoverStyle = { top: position.height + 15, left: 0 };
    } else if (currentStep.position === 'top') {
        popoverStyle = { bottom: position.height + 15, left: 0 };
    } else if (currentStep.position === 'right') {
        popoverStyle = { top: 0, left: position.width + 15 };
    } else {
        popoverStyle = { top: 0, right: position.width + 15 };
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
            {/* Dark Overlay with "Hole" */}
            <div className="absolute inset-0 bg-slate-900/70 transition-colors duration-500" style={{
                clipPath: `polygon(
                    0% 0%, 0% 100%, 
                    ${position.left}px 100%, 
                    ${position.left}px ${position.top}px, 
                    ${position.left + position.width}px ${position.top}px, 
                    ${position.left + position.width}px ${position.top + position.height}px, 
                    ${position.left}px ${position.top + position.height}px, 
                    ${position.left}px 100%, 
                    100% 100%, 100% 0%
                )`
            }}></div>

            {/* Highlight Border */}
            <div 
                className="absolute border-2 border-white rounded transition-all duration-300 shadow-[0_0_0_4px_rgba(16,185,129,0.5)] animate-pulse"
                style={{
                    top: position.top,
                    left: position.left,
                    width: position.width,
                    height: position.height
                }}
            >
                {/* Popover Card */}
                <div 
                    className="absolute bg-white p-5 rounded-xl shadow-2xl w-[320px] pointer-events-auto flex flex-col gap-3 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                    style={popoverStyle}
                >
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {currentStepIndex + 1}
                            </span>
                            {currentStep.title}
                        </h4>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-500">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {currentStep.content}
                    </p>

                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-medium">
                            Passo {currentStepIndex + 1} de {steps.length}
                        </span>
                        <div className="flex gap-2">
                            {currentStepIndex > 0 && (
                                <button 
                                    onClick={() => setCurrentStepIndex(prev => prev - 1)}
                                    className="p-2 hover:bg-slate-100 rounded text-slate-500"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            )}
                            <button 
                                onClick={() => isLastStep ? onClose() : setCurrentStepIndex(prev => prev + 1)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors shadow-md"
                            >
                                {isLastStep ? 'Concluir' : 'Próximo'} {!isLastStep && <ChevronRight size={14} />}
                            </button>
                        </div>
                    </div>
                    
                    {/* Arrow Indicator (Simplistic) */}
                    <div className={`absolute w-3 h-3 bg-white transform rotate-45 ${
                        currentStep.position === 'bottom' ? '-top-1.5 left-8' :
                        currentStep.position === 'top' ? '-bottom-1.5 left-8' :
                        currentStep.position === 'right' ? 'top-8 -left-1.5' :
                        'top-8 -right-1.5'
                    }`}></div>
                </div>
            </div>
        </div>
    );
};