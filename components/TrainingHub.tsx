
import React, { useState, useRef } from 'react';
import { TrainingSession, Student, QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { 
    Plus, Users, Calendar, ChevronRight, Award, Brain, 
    BrainCircuit, CheckCircle2, X, UserPlus, Upload, Trash2, 
    Loader2, BookOpen, User, FileText, FileSpreadsheet, AlertCircle,
    Clock, Repeat
} from 'lucide-react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
    Legend, CartesianGrid 
} from 'recharts';

export const TrainingHub: React.FC = () => {
    // State
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
    const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    // Quiz State
    const [sessionQuiz, setSessionQuiz] = useState<QuizQuestion[]>([]); // Pre/Post Quiz
    const [fixationQuiz, setFixationQuiz] = useState<QuizQuestion[]>([]); // New: Retention Quiz
    const [activeQuizType, setActiveQuizType] = useState<'PRE' | 'FIXATION'>('PRE'); // Track which quiz is open
    
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [isGeneratingFixation, setIsGeneratingFixation] = useState(false);
    
    const [showQuizApplication, setShowQuizApplication] = useState(false);
    const [quizStudent, setQuizStudent] = useState<Student | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizScore, setQuizScore] = useState<number | null>(null);

    // Import Modal State
    const [showImportModal, setShowImportModal] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualCpf, setManualCpf] = useState('');
    const [manualRole, setManualRole] = useState('');
    const [importedStudents, setImportedStudents] = useState<Partial<Student>[]>([]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handlers
    const handleCreateSession = () => {
        if (!newSessionName) return;
        const newSession: TrainingSession = {
            id: Date.now().toString(),
            name: newSessionName,
            date: new Date().toLocaleDateString(),
            instructor: 'Instrutor Interno',
            students: []
        };
        setSessions([...sessions, newSession]);
        setNewSessionName('');
        setIsCreating(false);
    };

    const handleSelectSession = (session: TrainingSession) => {
        setSelectedSession(session);
        setView('DETAIL');
        setSessionQuiz([]); 
        setFixationQuiz([]);
    };

    const handleGenerateSessionQuiz = async () => {
        if (!selectedSession) return;
        setIsGeneratingQuiz(true);
        try {
            const questions = await generateQuiz(selectedSession.name, 'PRE');
            setSessionQuiz(questions);
        } catch (e) {
            alert('Erro ao gerar quiz');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleGenerateFixationQuiz = async () => {
        if (!selectedSession) return;
        setIsGeneratingFixation(true);
        try {
            const questions = await generateQuiz(selectedSession.name, 'FIXATION');
            setFixationQuiz(questions);
        } catch (e) {
            alert('Erro ao gerar teste de fixação');
        } finally {
            setIsGeneratingFixation(false);
        }
    };

    const openQuizApplication = (student: Student, type: 'PRE' | 'FIXATION') => {
        setQuizStudent(student);
        setActiveQuizType(type);
        setQuizAnswers({});
        setQuizScore(null);
        setShowQuizApplication(true);
    };

    const closeQuiz = () => {
        setShowQuizApplication(false);
        setQuizStudent(null);
    };

    const submitQuiz = () => {
        const currentQuizQuestions = activeQuizType === 'PRE' ? sessionQuiz : fixationQuiz;

        if (!currentQuizQuestions.length || !quizStudent || !selectedSession) return;
        
        let score = 0;
        currentQuizQuestions.forEach(q => {
            if (quizAnswers[q.id] === q.correctIndex) score++;
        });
        setQuizScore(score);

        // Update student score based on quiz type
        const updatedStudents = selectedSession.students.map(s => {
            if (s.id === quizStudent.id) {
                if (activeQuizType === 'PRE') {
                    return { ...s, preScore: score, postScore: Math.min(10, score + 2), status: score >= 6 ? 'APPROVED' : 'PENDING' } as Student;
                } else {
                    return { ...s, retentionScore: score } as Student;
                }
            }
            return s;
        });
        
        // Update session
        const updatedSession = { ...selectedSession, students: updatedStudents };
        setSelectedSession(updatedSession);
        setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
    };

    // Import Handlers (No changes)
    const handleManualAdd = () => {
        if (!manualName) return;
        setImportedStudents([...importedStudents, { name: manualName, cpf: manualCpf, role: manualRole }]);
        setManualName(''); setManualCpf(''); setManualRole('');
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n');
        const newStudents: Partial<Student>[] = [];
        let startIndex = 0;
        if (lines[0] && (lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('name'))) {
            startIndex = 1;
        }
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const delimiter = line.includes(';') ? ';' : ',';
            const parts = line.split(delimiter);
            if (parts.length >= 1) {
                newStudents.push({
                    name: parts[0].trim(),
                    cpf: parts[1] ? parts[1].trim() : '',
                    role: parts[2] ? parts[2].trim() : 'Colaborador'
                });
            }
        }
        return newStudents;
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
                setImportedStudents(prev => [...prev, ...parsed]);
                setIsProcessingFile(false);
            };
            reader.readAsText(file);
        } else {
            setTimeout(() => {
                const mockExtracted = [
                    { name: 'Roberto Almeida', cpf: '111.222.333-44', role: 'Operador de Empilhadeira' },
                    { name: 'Fernanda Costa', cpf: '555.666.777-88', role: 'Auxiliar de Logística' },
                    { name: 'João da Silva', cpf: '999.888.777-66', role: 'Líder de Turno' },
                    { name: 'Mariana Oliveira', cpf: '333.222.111-00', role: 'Técnica de Qualidade' }
                ];
                setImportedStudents(prev => [...prev, ...mockExtracted]);
                setIsProcessingFile(false);
            }, 2000);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const confirmImport = () => {
        if (!selectedSession) return;
        const newStudents: Student[] = importedStudents.map(s => ({
            id: Date.now().toString() + Math.random(),
            name: s.name || 'Sem Nome',
            cpf: s.cpf || '',
            role: s.role,
            preScore: 0,
            postScore: 0,
            retentionScore: 0,
            attendance: 0,
            status: 'PENDING'
        }));
        
        const updatedSession = { ...selectedSession, students: [...selectedSession.students, ...newStudents] };
        setSelectedSession(updatedSession);
        setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
        setImportedStudents([]);
        setShowImportModal(false);
    };

    const handleGenerateCertificate = (student: Student) => {
        alert(`Certificado gerado para ${student.name}`);
    };

    // Chart Data
    const chartData = selectedSession ? selectedSession.students.map(s => ({
        name: s.name.split(' ')[0],
        Pre: s.preScore,
        Pos: s.postScore,
        Ret: s.retentionScore || 0
    })) : [];

    // Render List
    if (view === 'LIST') {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Award className="text-indigo-600" />
                                Gestão de Treinamentos
                            </h2>
                            <p className="text-sm text-slate-500">Controle de turmas, listas de presença e avaliação de eficácia.</p>
                        </div>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Nova Turma
                        </button>
                    </div>

                    {isCreating && (
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 flex gap-2 items-center">
                            <input 
                                type="text" 
                                placeholder="Nome do Treinamento (Ex: NR-35 Trabalho em Altura)"
                                className="flex-1 px-4 py-2 rounded border border-indigo-200 text-sm outline-none"
                                value={newSessionName}
                                onChange={e => setNewSessionName(e.target.value)}
                            />
                            <button onClick={() => setIsCreating(false)} className="text-slate-500 text-sm font-medium px-3">Cancelar</button>
                            <button onClick={handleCreateSession} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm">Salvar</button>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {sessions.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhuma turma de treinamento cadastrada.</p>
                            </div>
                        ) : sessions.map(session => (
                            <div 
                                key={session.id} 
                                onClick={() => handleSelectSession(session)}
                                className="bg-white border border-slate-200 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
                                        {session.students.length}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{session.name}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            <Calendar size={12} /> {session.date} • {session.instructor}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block text-xs text-slate-400 uppercase font-bold">Aprovados</span>
                                        <span className="font-bold text-emerald-600">{session.students.filter(s => s.status === 'APPROVED').length}</span>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-indigo-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Render Detail
    if (view === 'DETAIL' && selectedSession) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 relative">
                {/* QUIZ APPLICATION MODAL */}
                {showQuizApplication && quizStudent && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        {activeQuizType === 'PRE' ? 'Avaliação de Conhecimento (Pré/Pós)' : 'Teste de Fixação Periódico'}
                                    </h3>
                                    <p className="text-xs text-slate-500">Aluno: {quizStudent.name}</p>
                                </div>
                                <button onClick={closeQuiz}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                {quizScore !== null ? (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Award size={40} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Resultado Final</h2>
                                        <p className="text-lg text-slate-600 mb-6">
                                            Nota: <span className="font-bold text-indigo-600 text-3xl">{quizScore}</span> / {(activeQuizType === 'PRE' ? sessionQuiz : fixationQuiz).length}
                                        </p>
                                        <button onClick={closeQuiz} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold">
                                            Concluir
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {(activeQuizType === 'PRE' ? sessionQuiz : fixationQuiz).map((q, idx) => (
                                            <div key={q.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <p className="font-bold text-slate-800 mb-3">{idx + 1}. {q.question}</p>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, optIdx) => (
                                                        <label key={optIdx} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                                                            <input 
                                                                type="radio" 
                                                                name={`q-${q.id}`} 
                                                                className="w-4 h-4 text-indigo-600"
                                                                checked={quizAnswers[q.id] === optIdx}
                                                                onChange={() => setQuizAnswers({...quizAnswers, [q.id]: optIdx})}
                                                            />
                                                            <span className="text-sm text-slate-700">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {quizScore === null && (
                                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                                    <button onClick={closeQuiz} className="px-4 py-2 text-slate-600 font-medium text-sm">Cancelar</button>
                                    <button 
                                        onClick={submitQuiz} 
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
                                        disabled={Object.keys(quizAnswers).length < (activeQuizType === 'PRE' ? sessionQuiz : fixationQuiz).length}
                                    >
                                        Finalizar Avaliação
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* IMPORT MODAL (SAME AS BEFORE) */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800">Adicionar Alunos</h3>
                                <button onClick={() => setShowImportModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Manual Form */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><UserPlus size={14}/> Cadastro Individual</h4>
                                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                                        <input 
                                            type="text" 
                                            placeholder="Nome Completo" 
                                            value={manualName}
                                            onChange={e => setManualName(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="CPF (000.000.000-00)" 
                                            value={manualCpf}
                                            onChange={e => setManualCpf(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Cargo / Função" 
                                            value={manualRole}
                                            onChange={e => setManualRole(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleManualAdd}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded text-sm transition-colors"
                                    >
                                        Adicionar à Lista
                                    </button>
                                </div>

                                {/* Bulk Import */}
                                <div 
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative ${isProcessingFile ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-300 hover:bg-slate-50'}`}
                                    onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                                >
                                    {isProcessingFile ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                                            <p className="text-sm font-bold text-indigo-700">Processando arquivo...</p>
                                            <p className="text-xs text-indigo-500">Analisando estrutura de dados</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-center gap-2 mb-3">
                                                <div className="bg-red-100 p-2 rounded text-red-600"><FileText size={20} /></div>
                                                <div className="bg-emerald-100 p-2 rounded text-emerald-600"><FileSpreadsheet size={20} /></div>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">Importar Lista de Presença</p>
                                            <p className="text-xs text-slate-500 mt-1">Suporta CSV e TXT (Real) ou PDF/Excel (Simulado)</p>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                accept=".csv,.txt,.pdf,.xlsx,.xls"
                                                onChange={handleFileUpload} 
                                            />
                                        </>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-start gap-1">
                                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                    <p>Para CSV/TXT: Use formato "Nome,CPF,Cargo".</p>
                                </div>

                                {/* Preview List */}
                                {importedStudents.length > 0 && (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2">Nome</th>
                                                    <th className="px-3 py-2">CPF</th>
                                                    <th className="px-3 py-2">Cargo</th>
                                                    <th className="px-3 py-2 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {importedStudents.map((s, i) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2">{s.name}</td>
                                                        <td className="px-3 py-2">{s.cpf}</td>
                                                        <td className="px-3 py-2">{s.role || '-'}</td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button onClick={() => setImportedStudents(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-slate-800">Cancelar</button>
                                <button onClick={confirmImport} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded text-sm hover:bg-emerald-700 shadow-sm" disabled={importedStudents.length === 0}>
                                    Confirmar {importedStudents.length} Alunos
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <button onClick={() => setView('LIST')} className="text-sm text-slate-500 hover:text-indigo-600 font-medium mb-2">← Voltar para Turmas</button>
                    <button 
                        onClick={() => setShowImportModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <UserPlus size={16} /> Adicionar Alunos
                    </button>
                </div>
                
                {/* Header Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedSession.name}</h2>
                        <div className="flex gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {selectedSession.date}</span>
                            <span className="flex items-center gap-1"><Users size={14} /> {selectedSession.students.length} Alunos</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-lg text-center">
                            <span className="block text-xs uppercase opacity-70">Média (Nota)</span>
                            {(selectedSession.students.length > 0 ? (selectedSession.students.reduce((a,b)=>a+b.postScore,0)/selectedSession.students.length).toFixed(1) : '0.0')}
                        </div>
                    </div>
                </div>

                {/* --- Quiz Setup Sections --- */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Pre-Test Config */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <Brain size={16} className="text-indigo-600" /> Pré/Pós-Teste (Aprendizagem)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Gere questões para medir o aprendizado imediato.</p>
                            </div>
                            {sessionQuiz.length === 0 ? (
                                <button 
                                    onClick={handleGenerateSessionQuiz}
                                    disabled={isGeneratingQuiz}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    {isGeneratingQuiz ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                                    Gerar (IA)
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded text-xs border border-emerald-200">
                                    <CheckCircle2 size={12} /> {sessionQuiz.length} Questões
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Retention/Fixation Test Config */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                    <Repeat size={16} className="text-amber-600" /> Teste de Fixação (Retenção)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Avalie o conhecimento 3 meses após o curso.</p>
                            </div>
                            {fixationQuiz.length === 0 ? (
                                <button 
                                    onClick={handleGenerateFixationQuiz}
                                    disabled={isGeneratingFixation}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    {isGeneratingFixation ? <Loader2 className="animate-spin" size={14} /> : <Clock size={14} />}
                                    Gerar Fixação
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded text-xs border border-emerald-200">
                                    <CheckCircle2 size={12} /> {fixationQuiz.length} Questões
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table and Chart Layout */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Diário de Classe & Retenção</div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 text-xs uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3">Aluno</th>
                                    <th className="px-4 py-3 text-center">Pré-Teste</th>
                                    <th className="px-4 py-3 text-center" title="Validação do Treinamento">Pós-Teste</th>
                                    <th className="px-4 py-3 text-center text-amber-600">Fixação</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {selectedSession.students.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {s.name} 
                                            <span className="block text-xs text-slate-400">{s.role || 'Cargo n/d'} • {s.cpf}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {s.preScore > 0 ? (
                                                <span className="font-bold text-slate-600">{s.preScore}</span>
                                            ) : (
                                                <button 
                                                    onClick={() => openQuizApplication(s, 'PRE')}
                                                    className="text-xs bg-slate-100 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded border border-indigo-200 font-medium transition-colors"
                                                >
                                                    Aplicar
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-indigo-600">{s.postScore}</td>
                                        <td className="px-4 py-3 text-center">
                                            {s.retentionScore && s.retentionScore > 0 ? (
                                                <span className="font-bold text-amber-600">{s.retentionScore}</span>
                                            ) : (
                                                <button 
                                                    onClick={() => openQuizApplication(s, 'FIXATION')}
                                                    disabled={fixationQuiz.length === 0}
                                                    className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={fixationQuiz.length === 0 ? "Gere o teste de fixação primeiro" : "Aplicar teste de fixação"}
                                                >
                                                    Aplicar
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : s.status === 'REPROVED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {s.status === 'APPROVED' ? 'APROVADO' : s.status === 'REPROVED' ? 'REPROVADO' : 'PENDENTE'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => handleGenerateCertificate(s)}
                                                disabled={s.status !== 'APPROVED'}
                                                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Gerar Certificado"
                                            >
                                                <Award size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                         <h4 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                             <BrainCircuit size={16} /> Curva de Esquecimento
                         </h4>
                         <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{top:10, right:10, left:-20, bottom:0}} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                                    <YAxis hide domain={[0,10]}/>
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} />
                                    <Legend wrapperStyle={{fontSize: '10px'}} />
                                    <Bar dataKey="Pre" fill="#94a3b8" radius={[2,2,0,0]} name="Pré" />
                                    <Bar dataKey="Pos" fill="#4f46e5" radius={[2,2,0,0]} name="Pós" />
                                    <Bar dataKey="Ret" fill="#d97706" radius={[2,2,0,0]} name="Fixação (Ret)" />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return null;
};
