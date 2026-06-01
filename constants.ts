
import { ChecklistItem, MaturityItem, RiskLevel, QuizQuestion, MentalHealthQuestion, MentalHealthThermometerItem, BusinessType, PGRModelItem } from './types';
import { CNAE_DB } from './cnaeList';

// --- CNAE DATABASE (IMPORTED) ---
export const CNAE_LIST = CNAE_DB;

// --- BUSINESS TYPES DATABASE (TABLE: tipo_negocio) ---
export const BUSINESS_TYPES: BusinessType[] = [
    { id: '1', code: 'ESCRITORIO_ADMINISTRATIVO', publicName: 'Escritório Administrativo', description: 'Atividades de escritório, serviços administrativos, consultórios sem procedimentos invasivos.' },
    { id: '2', code: 'COMERCIO_VAREJISTA_LOJA', publicName: 'Comércio Varejista (Loja Física)', description: 'Lojas de rua, shoppings, varejo em geral.' },
    { id: '3', code: 'PADARIA', publicName: 'Padaria e Confeitaria', description: 'Produção e venda de pães, bolos, salgados com produção própria.' },
    { id: '4', code: 'RESTAURANTE_BAR', publicName: 'Restaurante e Bar', description: 'Preparo e venda de alimentos prontos para consumo imediato.' },
    { id: '5', code: 'LOGISTICA_ARMAZENAGEM', publicName: 'Logística e Armazenagem', description: 'Galpões, centros de distribuição, armazéns gerais.' },
    { id: '6', code: 'TRANSPORTE_CARGA', publicName: 'Transporte Rodoviário de Cargas', description: 'Empresas de transporte de carga em geral e frotas.' },
    { id: '7', code: 'INDUSTRIA_ALIMENTICIA_LEVE', publicName: 'Indústria Alimentícia Leve', description: 'Fabricação de alimentos, exceto padarias de bairro.' },
    { id: '8', code: 'INDUSTRIA_METAL_MECANICA', publicName: 'Indústria Metal-Mecânica / Oficina', description: 'Usinagem, caldeiraria, estruturas metálicas e oficinas mecânicas.' },
    { id: '9', code: 'CONSTRUCAO_CIVIL', publicName: 'Construção Civil e Obras', description: 'Obras de edifícios, reformas, infraestrutura e manutenção predial.' },
    { id: '10', code: 'SERVICO_SAUDE_AMBULATORIAL', publicName: 'Serviços de Saúde (Ambulatorial)', description: 'Consultórios, clínicas, laboratórios e exames.' },
    { id: '11', code: 'HOSPITAL', publicName: 'Hospital / Internação', description: 'Hospitais gerais e especializados com internação.' },
    { id: '12', code: 'EDUCACAO_ESCOLA', publicName: 'Educação e Escolas', description: 'Escolas, cursos livres, instituições de ensino superior.' },
];

// --- MAPPING CNAE -> BUSINESS TYPE ---
export const CNAE_TO_BUSINESS_TYPE: Record<string, string> = {
    // 1 - Escritório
    '62.01-5': '1', '62.02-3': '1', '62.04-0': '1', '69.20-6': '1', '82.11-3': '1', '66.22-3': '1',
    // 2 - Comércio Varejista
    '47.11-3': '2', // Supermercado (pode ser 2 ou 5 dependendo do porte, vamos por loja)
    '47.12-1': '2', '47.81-4': '2', '47.52-1': '2', '47.71-7': '2',
    // 3 - Padaria
    '10.91-1': '3', '47.21-1': '3',
    // 4 - Restaurante
    '56.11-2': '4', '56.12-1': '4', '56.20-1': '4',
    // 5 - Logística
    '52.11-7': '5', '52.50-8': '5', '52.12-5': '5',
    // 6 - Transporte
    '49.30-2': '6', '53.20-2': '6',
    // 7 - Ind. Alimentos
    '10.13-9': '7', '10.33-3': '7',
    // 8 - Metal Mecânica / Oficina
    '25.11-0': '8', '25.12-8': '8', '25.39-0': '8', '45.20-0': '8', '45.43-9': '8',
    // 9 - Construção
    '41.20-4': '9', '43.30-4': '9', '43.99-1': '9', '43.21-5': '9',
    // 10 - Saúde Ambulatorial
    '86.30-5': '10', '86.40-2': '10', '86.50-0': '10',
    // 11 - Hospital
    '86.10-1': '11',
    // 12 - Educação
    '85.13-9': '12', '85.99-6': '12', '85.32-5': '12'
};

export const GET_BUSINESS_TYPE_BY_CNAE = (cnaeCode: string): BusinessType | undefined => {
    let typeId = CNAE_TO_BUSINESS_TYPE[cnaeCode];
    if (typeId) {
        return BUSINESS_TYPES.find(t => t.id === typeId);
    }
    return undefined;
};

// --- PGR MODELS DATABASE (TABLE: modelo_pgr_tipo_negocio) ---
export const PGR_MODELS: PGRModelItem[] = [
    // PADARIA (ID: 3)
    {
        id: 'pgr_padaria_1',
        businessTypeId: '3',
        sector: 'Produção / Cozinha',
        activity: 'Produção de pães e salgados',
        hazard: 'Contato com fornos e assadeiras quentes',
        riskFactor: 'Físico - Calor',
        possibleDamage: 'Queimaduras, desconforto térmico',
        existingMeasures: 'Uso de pegadores, luvas térmicas em parte da equipe',
        recommendedMeasures: 'Padronizar uso de luvas térmicas, treinamento específico, sinalização de superfícies quentes',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_padaria_2',
        businessTypeId: '3',
        sector: 'Produção / Cozinha',
        activity: 'Manuseio de masseiras e cilindros',
        hazard: 'Partes móveis expostas, esmagamento',
        riskFactor: 'Acidente - Mecânico',
        possibleDamage: 'Esmagamentos, fraturas, lesões graves em mãos',
        existingMeasures: 'Proteções fixas parciais, botão emergência',
        recommendedMeasures: 'Revisar proteções, intertravamento, bloqueio de energia, treinamento de segurança em máquinas',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_padaria_3',
        businessTypeId: '3',
        sector: 'Limpeza / Higienização',
        activity: 'Limpeza de equipamentos',
        hazard: 'Contato com produtos químicos',
        riskFactor: 'Químico',
        possibleDamage: 'Irritação de pele, olhos, alergias',
        existingMeasures: 'Uso ocasional de luvas domésticas',
        recommendedMeasures: 'Definir EPIs (luvas, óculos), fichas de segurança, treinamento',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_padaria_4',
        businessTypeId: '3',
        sector: 'Estoque / Produção',
        activity: 'Manuseio de sacos de farinha',
        hazard: 'Esforço físico, levantamento de carga',
        riskFactor: 'Ergonômico',
        possibleDamage: 'Lombalgias, dores em coluna, ombros',
        existingMeasures: 'Levantamento manual sem critério',
        recommendedMeasures: 'Orientar técnicas de levantamento, fracionar cargas, usar carrinhos',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_padaria_5',
        businessTypeId: '3',
        sector: 'Produção',
        activity: 'Ambiente de produção',
        hazard: 'Poeira de farinha em suspensão',
        riskFactor: 'Químico / Respiratório',
        possibleDamage: 'Irritação respiratória, alergias',
        existingMeasures: 'Limpeza diária básica',
        recommendedMeasures: 'Melhorar ventilação, limpeza úmida, avaliação de alergias em casos críticos',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_padaria_6',
        businessTypeId: '3',
        sector: 'Atendimento / Salão',
        activity: 'Atendimento ao balcão',
        hazard: 'Piso molhado ou engordurado',
        riskFactor: 'Acidente - Queda',
        possibleDamage: 'Quedas, contusões, entorses',
        existingMeasures: 'Limpeza eventual',
        recommendedMeasures: 'Rotina de limpeza, tapetes antiderrapantes, sinalização',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_padaria_7',
        businessTypeId: '3',
        sector: 'Atendimento / Caixa',
        activity: 'Atendimento ao público',
        hazard: 'Estresse, conflitos com clientes',
        riskFactor: 'Ergonômico / Psicossocial',
        possibleDamage: 'Estresse, desgaste emocional',
        existingMeasures: 'Nenhuma estruturada',
        recommendedMeasures: 'Treinamento em atendimento, gestão de conflitos, canais de apoio',
        standardRiskLevel: 2
    },

    // RESTAURANTE E BAR (ID: 4)
    {
        id: 'pgr_rest_1',
        businessTypeId: '4',
        sector: 'Cozinha Quente',
        activity: 'Cocção de alimentos (fogão/chapa)',
        hazard: 'Superfícies quentes e chamas abertas',
        riskFactor: 'Físico - Calor',
        possibleDamage: 'Queimaduras de 1º e 2º graus',
        existingMeasures: 'Avental simples',
        recommendedMeasures: 'Luvas térmicas, avental retardante a chamas, sistema de exaustão, manutenção preventiva de gás',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_rest_2',
        businessTypeId: '4',
        sector: 'Cozinha / Preparo',
        activity: 'Corte de carnes e vegetais',
        hazard: 'Uso de facas e lâminas afiadas',
        riskFactor: 'Acidente - Cortes',
        possibleDamage: 'Cortes profundos, hemorragias',
        existingMeasures: 'Nenhuma',
        recommendedMeasures: 'Luva de malha de aço (para desossa/corte pesado), treinamento em manuseio seguro de facas',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_rest_3',
        businessTypeId: '4',
        sector: 'Cozinha / Copa',
        activity: 'Lavagem de louças e panelas',
        hazard: 'Contato com detergentes e desengordurantes',
        riskFactor: 'Químico',
        possibleDamage: 'Dermatites de contato, irritação nos olhos',
        existingMeasures: 'Luvas de látex domésticas',
        recommendedMeasures: 'Luvas nitrílicas ou de PVC cano longo, óculos de proteção para diluição, FISPQ dos produtos',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_rest_4',
        businessTypeId: '4',
        sector: 'Salão / Áreas de Circulação',
        activity: 'Serviço de garçom / Deslocamento',
        hazard: 'Piso escorregadio (água/gordura)',
        riskFactor: 'Acidente - Queda',
        possibleDamage: 'Contusões, fraturas, torções',
        existingMeasures: 'Limpeza frequente',
        recommendedMeasures: 'Uso obrigatório de calçado ocupacional antiderrapante (impermeável), sinalização de piso molhado',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_rest_5',
        businessTypeId: '4',
        sector: 'Cozinha',
        activity: 'Operação de equipamentos (processadores, liquidificadores)',
        hazard: 'Partes móveis e elétrica',
        riskFactor: 'Acidente - Mecânico/Elétrico',
        possibleDamage: 'Choque elétrico, amputação de dedos',
        existingMeasures: 'Equipamentos padrão',
        recommendedMeasures: 'Proteção de partes móveis, aterramento elétrico, treinamento de segurança, botão de parada de emergência',
        standardRiskLevel: 3
    },

    // LOGISTICA (ID: 5)
    { 
        id: 'pgr_log_1', 
        businessTypeId: '5', 
        sector: 'Operação / Armazém', 
        activity: 'Operação de empilhadeiras', 
        hazard: 'Atropelamento, tombamento, colisão', 
        riskFactor: 'Acidente - Veículos Internos',
        possibleDamage: 'Lesões graves, fraturas, óbito',
        existingMeasures: 'Faixas pintadas no chão',
        recommendedMeasures: 'Rotas segregadas, treinamento NR-11, checklist diário, limite de velocidade',
        standardRiskLevel: 3 
    },
    {
        id: 'pgr_log_2',
        businessTypeId: '5',
        sector: 'Expedição / Recebimento',
        activity: 'Movimentação manual de cargas',
        hazard: 'Esforço físico intenso',
        riskFactor: 'Ergonômico - Sobrecarga',
        possibleDamage: 'Lombalgias, lesões em membros superiores',
        existingMeasures: 'Uso de carrinhos em parte das atividades',
        recommendedMeasures: 'Treinar técnicas de levantamento, revisão de layout, uso ampliado de carrinhos',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_log_3',
        businessTypeId: '5',
        sector: 'Docas',
        activity: 'Trabalho em docas de carga/descarga',
        hazard: 'Quedas de nível, desníveis, borda',
        riskFactor: 'Acidente - Queda de nível',
        possibleDamage: 'Entorses, fraturas, contusões',
        existingMeasures: 'Alguns bloqueios físicos',
        recommendedMeasures: 'Sinalização das bordas, barreiras físicas, treinamento específico',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_log_4',
        businessTypeId: '5',
        sector: 'Armazenagem',
        activity: 'Empilhamento de pallets',
        hazard: 'Queda de materiais',
        riskFactor: 'Acidente - Queda de objetos',
        possibleDamage: 'Traumas por impacto, esmagamentos',
        existingMeasures: 'Regras informais',
        recommendedMeasures: 'Definir limites de altura, treinamento, inspeções visuais regulares',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_log_5',
        businessTypeId: '5',
        sector: 'Operação Geral',
        activity: 'Ruído em áreas de operação',
        hazard: 'Equipamentos ruidosos',
        riskFactor: 'Físico - Ruído',
        possibleDamage: 'Perda auditiva ao longo do tempo',
        existingMeasures: 'Pouco controle',
        recommendedMeasures: 'Medição de ruído, EPIs auditivos se necessário, manutenção preventiva',
        standardRiskLevel: 2
    },

    // METAL MECANICA / OFICINA (ID: 8)
    {
        id: 'pgr_metal_1',
        businessTypeId: '8',
        sector: 'Manutenção / Produção',
        activity: 'Soldagem de peças',
        hazard: 'Fumos metálicos de solda',
        riskFactor: 'Químico',
        agent: 'Manganês, Ferro',
        possibleDamage: 'Intoxicação respiratória, febre dos fumos',
        existingMeasures: 'Máscara PFF2',
        recommendedMeasures: 'Sistema de exaustão localizada, ventilação geral, máscara PFF2 carvao',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_metal_2',
        businessTypeId: '8',
        sector: 'Manutenção',
        activity: 'Uso de elevador automotivo',
        hazard: 'Queda do veículo ou falha hidráulica',
        riskFactor: 'Acidente',
        possibleDamage: 'Esmagamento, morte',
        existingMeasures: 'Trava de segurança',
        recommendedMeasures: 'Inspeção mensal do elevador, treinamento do operador',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_metal_3',
        businessTypeId: '8',
        sector: 'Usinagem',
        activity: 'Operação de torno/fresa',
        hazard: 'Ruído contínuo',
        riskFactor: 'Físico',
        possibleDamage: 'Perda auditiva (PAIR), estresse',
        existingMeasures: 'Protetor auricular tipo plug',
        recommendedMeasures: 'Protetor tipo concha, monitoramento audiométrico',
        standardRiskLevel: 2
    },

    // ESCRITORIO (ID: 1)
    {
        id: 'pgr_office_1',
        businessTypeId: '1',
        sector: 'Administrativo / Escritório',
        activity: 'Trabalho em computador',
        hazard: 'Posturas inadequadas, longas jornadas sentado',
        riskFactor: 'Ergonômico (postural)',
        possibleDamage: 'Dores em coluna, pescoço, ombros, LER/DORT',
        existingMeasures: 'Cadeiras padrão',
        recommendedMeasures: 'Ajuste de mobiliário, pausas, orientação ergonômica',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_office_2',
        businessTypeId: '1',
        sector: 'Todas as Equipes (Adm/Fiscal/Jurídico)',
        activity: 'Atendimento a demandas / Prazos',
        hazard: 'Excesso de demandas no trabalho (sobrecarga)',
        riskFactor: 'Psicossocial / Org. Trabalho',
        possibleDamage: 'Estresse, Esgotamento (Burnout), Doenças Cardiovasculares',
        existingMeasures: 'Nenhuma medida estruturada',
        recommendedMeasures: 'Priorização de tarefas, maior autonomia/flexibilidade, pausas regulares e revisão de dimensionamento de equipe (Ref: Guia NR-1 2025).',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_office_3',
        businessTypeId: '1',
        sector: 'Áreas Comuns',
        activity: 'Deslocamento interno (corredores)',
        hazard: 'Obstáculos, cabos soltos',
        riskFactor: 'Acidente - Queda em mesmo nível',
        possibleDamage: 'Quedas, contusões',
        existingMeasures: 'Organização parcial',
        recommendedMeasures: 'Inspeções periódicas, organização de cabos, tapetes fixados',
        standardRiskLevel: 1
    },

    // COMERCIO VAREJISTA (ID: 2)
    {
        id: 'pgr_retail_1',
        businessTypeId: '2',
        sector: 'Vendas / Salão',
        activity: 'Atendimento em balcão/prateleiras',
        hazard: 'Piso escorregadio, degraus',
        riskFactor: 'Acidente - Queda em mesmo nível',
        possibleDamage: 'Quedas, contusões, entorses',
        existingMeasures: 'Limpeza eventual',
        recommendedMeasures: 'Rotina de limpeza, tapetes, sinalização',
        standardRiskLevel: 1
    },
    {
        id: 'pgr_retail_2',
        businessTypeId: '2',
        sector: 'Estoque / Reposição',
        activity: 'Reposição de mercadorias em altura',
        hazard: 'Uso de escadas, plataformas',
        riskFactor: 'Acidente - Queda de altura',
        possibleDamage: 'Entorses, fraturas',
        existingMeasures: 'Uso de escadas simples',
        recommendedMeasures: 'Treinamento, escadas adequadas, inspeção de equipamentos',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_retail_3',
        businessTypeId: '2',
        sector: 'Frente de Caixa',
        activity: 'Manuseio de caixa registradora',
        hazard: 'Trabalho em pé prolongado',
        riskFactor: 'Ergonômico (postural)',
        possibleDamage: 'Dores em pernas, coluna, fadiga',
        existingMeasures: 'Sem orientação',
        recommendedMeasures: 'Rodízio de funções, tapetes anti-fadiga, pausas',
        standardRiskLevel: 2
    },
    {
        id: 'pgr_retail_4',
        businessTypeId: '2',
        sector: 'Atendimento',
        activity: 'Contato com público',
        hazard: 'Situações de conflito',
        riskFactor: 'Psicossocial',
        possibleDamage: 'Estresse, desgaste emocional',
        existingMeasures: 'Nenhum estruturado',
        recommendedMeasures: 'Treinamento, procedimentos para lidar com conflitos',
        standardRiskLevel: 2
    },

    // CONSTRUCAO (ID: 9)
    {
        id: 'pgr_const_1',
        businessTypeId: '9',
        sector: 'Obras / Estrutura',
        activity: 'Trabalho em altura (andaimes)',
        hazard: 'Queda de altura',
        riskFactor: 'Acidente - Queda',
        possibleDamage: 'Fraturas graves, óbito',
        existingMeasures: 'EPIs parcialmente',
        recommendedMeasures: 'NR-35 completa, linha de vida, guarda-corpos, treinamento específico',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_const_2',
        businessTypeId: '9',
        sector: 'Logística de Obra',
        activity: 'Movimentação de materiais',
        hazard: 'Queda de materiais, esmagamentos',
        riskFactor: 'Acidente - Mecânico',
        possibleDamage: 'Traumas em membros',
        existingMeasures: 'Alguns procedimentos',
        recommendedMeasures: 'Sinalização, rotas, treinamento, equipamentos auxiliares',
        standardRiskLevel: 3
    },
    {
        id: 'pgr_const_3',
        businessTypeId: '9',
        sector: 'Instalações / Montagem',
        activity: 'Uso de ferramentas elétricas',
        hazard: 'Choque elétrico, corte',
        riskFactor: 'Acidente - Elétrico/Mecânico',
        possibleDamage: 'Lesões graves, queimaduras',
        existingMeasures: 'Ferramentas diversas',
        recommendedMeasures: 'Manutenção, inspeção, EPIs, disjuntores diferenciais',
        standardRiskLevel: 3
    },

    // SAUDE (ID: 10 & 11)
    {
        id: 'pgr_saude_1',
        businessTypeId: '10',
        sector: 'Sala de Coleta/Procedimento',
        activity: 'Coleta de sangue / Injeção',
        hazard: 'Material perfurocortante contaminado',
        riskFactor: 'Biológico',
        possibleDamage: 'Contaminação por vírus (HIV, Hepatite)',
        existingMeasures: 'Descarte em caixa rígida',
        recommendedMeasures: 'Dispositivos de segurança em agulhas (NR-32), vacinação em dia',
        standardRiskLevel: 3
    }
];

export const GET_RISK_DEGREE = (cnaeCode: string): string => {
    const cleanInput = cnaeCode.replace(/\D/g, '');
    const found = CNAE_LIST.find(item => {
        const itemClean = item.code.replace(/\D/g, '');
        return cleanInput.startsWith(itemClean) || itemClean.startsWith(cleanInput);
    });
    return found ? found.risk : '1';
};

export const GET_CNAE_DETAILS = (code: string) => {
    const clean = code.replace(/\D/g, '');
    const division = clean.substring(0, 2);
    const divInt = parseInt(division);
    
    let section = '?';
    if (divInt >= 1 && divInt <= 3) section = 'A - Agricultura, Pecuária, Produção Florestal, Pesca e Aquicultura';
    else if (divInt >= 5 && divInt <= 9) section = 'B - Indústrias Extrativas';
    else if (divInt >= 10 && divInt <= 33) section = 'C - Indústrias de Transformação';
    else if (divInt === 35) section = 'D - Eletricidade e Gás';
    else if (divInt >= 36 && divInt <= 39) section = 'E - Água, Esgoto, Atividades de Gestão de Resíduos e Descontaminação';
    else if (divInt >= 41 && divInt <= 43) section = 'F - Construção';
    else if (divInt >= 45 && divInt <= 47) section = 'G - Comércio; Reparação de Veículos Automotores e Motocicletas';
    else if (divInt >= 49 && divInt <= 53) section = 'H - Transporte, Armazenagem e Correio';
    else if (divInt >= 55 && divInt <= 56) section = 'I - Alojamento e Alimentação';
    else if (divInt >= 58 && divInt <= 63) section = 'J - Informação e Comunicação';
    else if (divInt >= 64 && divInt <= 66) section = 'K - Atividades Financeiras, de Seguros e Serviços Relacionados';
    else if (divInt === 68) section = 'L - Atividades Imobiliárias';
    else if (divInt >= 69 && divInt <= 75) section = 'M - Atividades Profissionais, Científicas e Técnicas';
    else if (divInt >= 77 && divInt <= 82) section = 'N - Atividades Administrativas e Serviços Complementares';
    else if (divInt === 84) section = 'O - Administração Pública, Defesa e Seguridade Social';
    else if (divInt === 85) section = 'P - Educação';
    else if (divInt >= 86 && divInt <= 88) section = 'Q - Saúde Humana e Serviços Sociais';
    else if (divInt >= 90 && divInt <= 93) section = 'R - Artes, Cultura, Esporte e Recreação';
    else if (divInt >= 94 && divInt <= 96) section = 'S - Outras Atividades de Serviços';
    else if (divInt === 97) section = 'T - Serviços Domésticos';
    else if (divInt === 99) section = 'U - Organismos Internacionais e Outras Instituições Extraterritoriais';

    return {
        section,
        division: division,
        group: clean.substring(0, 3),
        class: clean.substring(0, 5), // NR-4 level
    };
};

// --- EXISTING CONSTANTS (Checklist, Maturity, etc) ---
// (Kept as provided in the original file to save space, assuming they follow below)
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Sessão A – Estrutura do PGR
  {
    id: 'a1',
    category: 'Sessão A – Estrutura do PGR',
    question: 'A empresa possui PGR formalizado e assinado?',
    description: 'Documento deve ter validade jurídica com responsável técnico.'
  },
  {
    id: 'a2',
    category: 'Sessão A – Estrutura do PGR',
    question: 'O PGR contempla Inventário de Riscos atualizado?',
    description: 'Deve incluir todos os perigos e riscos ocupacionais identificados.'
  },
  {
    id: 'a3',
    category: 'Sessão A – Estrutura do PGR',
    question: 'Possui Plano de Ação com prazos e status?',
    description: 'Cronograma claro para implementação das medidas de controle.'
  },
  {
    id: 'a4',
    category: 'Sessão A – Estrutura do PGR',
    question: 'O PGR é revisto periodicamente?',
    description: 'Revisão a cada 2 anos ou quando houver mudanças (Gestão de Mudanças).'
  },
  {
    id: 'a5',
    category: 'Sessão A – Estrutura do PGR',
    question: 'Responsabilidades estão designadas por escrito?',
    description: 'Ordens de serviço ou política interna definindo papéis.'
  },

  // Sessão B – Integração com a rotina
  {
    id: 'b1',
    category: 'Sessão B – Integração e Rotina',
    question: 'Avalia riscos antes de mudanças (tecnologia/layout)?',
    description: 'Gestão de mudanças preventiva.'
  },
  {
    id: 'b2',
    category: 'Sessão B – Integração e Rotina',
    question: 'Acidentes e quase-acidentes retroalimentam o PGR?',
    description: 'A análise de acidentes gera atualização no inventário de riscos.'
  },
  {
    id: 'b3',
    category: 'Sessão B – Integração e Rotina',
    question: 'Existem inspeções de segurança vinculadas ao PGR?',
    description: 'Rotinas de campo para verificar a eficácia dos controles.'
  },
  {
    id: 'b4',
    category: 'Sessão B – Integração e Rotina',
    question: 'O PGR é integrado com outras NRs aplicáveis?',
    description: 'Conexão com NR-10, NR-35, NR-17, etc.'
  },
  {
    id: 'b5',
    category: 'Sessão B – Integração e Rotina',
    question: 'Contratadas recebem informações dos riscos?',
    description: 'Gestão de terceiros conforme item 1.5 da NR-1.'
  },

  // Sessão C – Comunicação e Participação
  {
    id: 'c1',
    category: 'Sessão C – Comunicação e Participação',
    question: 'Trabalhadores são informados sobre os riscos?',
    description: 'Direito de recusa e ciência dos riscos ocupacionais.'
  },
  {
    id: 'c2',
    category: 'Sessão C – Comunicação e Participação',
    question: 'Existem evidências documentadas dessa comunicação?',
    description: 'Listas de presença, ordens de serviço assinadas, etc.'
  },
  {
    id: 'c3',
    category: 'Sessão C – Comunicação e Participação',
    question: 'Sabem a quem recorrer em caso de risco?',
    description: 'Fluxo claro de comunicação de emergência ou perigo.'
  },
  {
    id: 'c4',
    category: 'Sessão C – Comunicação e Participação',
    question: 'Existem canais para reportar condições inseguras?',
    description: 'Ferramenta para relato de quase-acidentes ou riscos.'
  },
  {
    id: 'c5',
    category: 'Sessão C – Comunicação e Participação',
    question: 'A empresa promove diálogos de segurança?',
    description: 'DDS ou campanhas ativas sobre o tema.'
  },

  // Sessão D – Treinamentos
  {
    id: 'd1',
    category: 'Sessão D – Treinamentos e Registros',
    question: 'Treinamentos são planejados com periodicidade?',
    description: 'Matriz de treinamento atualizada conforme NRs.'
  },
  {
    id: 'd2',
    category: 'Sessão D – Treinamentos e Registros',
    question: 'Há conteúdo programático definido?',
    description: 'Escopo do treinamento alinhado aos riscos da função.'
  },
  {
    id: 'd3',
    category: 'Sessão D – Treinamentos e Registros',
    question: 'Existem avaliações de aprendizagem arquivadas?',
    description: 'Provas ou checklists práticos que comprovem proficiência.'
  },
  {
    id: 'd4',
    category: 'Sessão D – Treinamentos e Registros',
    question: 'Registros de presença com identificação completa?',
    description: 'Instrutor habilitado e conteúdo ministrado.'
  },
  {
    id: 'd5',
    category: 'Sessão D – Treinamentos e Registros',
    question: 'Há controle de vencimento dos treinamentos?',
    description: 'Sistema para evitar gaps na capacitação obrigatória.'
  }
];

export const CALCULATE_CHECKLIST_LEVEL = (points: number): { label: string, color: string } => {
  if (points <= 15) return { label: 'Crítico', color: 'text-red-600 bg-red-100' };
  if (points <= 25) return { label: 'Básico', color: 'text-amber-600 bg-amber-100' };
  if (points <= 33) return { label: 'Intermediário', color: 'text-blue-600 bg-blue-100' };
  return { label: 'Avançado', color: 'text-emerald-600 bg-emerald-100' };
};

export const MATURITY_ITEMS: MaturityItem[] = [
  {
    id: 'm1',
    dimension: 'Liderança',
    question: 'Comprometimento da Alta Direção',
    description: 'A liderança participa ativamente das reuniões e decisões de segurança?'
  },
  {
    id: 'm2',
    dimension: 'Cultura',
    question: 'Participação dos Trabalhadores',
    description: 'Os trabalhadores reportam incidentes sem medo de punição?'
  },
  {
    id: 'm3',
    dimension: 'Processos',
    question: 'Gestão de Mudanças',
    description: 'Mudanças em layout ou processos passam por análise de risco prévia?'
  },
  {
    id: 'm4',
    dimension: 'Aprendizado',
    question: 'Investigação de Incidentes',
    description: 'Foca-se em encontrar a causa raiz sistêmica ao invés de culpar pessoas?'
  },
  {
    id: 'm5',
    dimension: 'Estratégia',
    question: 'Melhoria Contínua',
    description: 'Os indicadores de desempenho são usados para revisar o sistema periodicamente?'
  }
];

export const MATURITY_LEVEL_MAP = (score: number): string => {
  if (score < 2) return 'Inicial';
  if (score < 3) return 'Básico';
  if (score < 4) return 'Intermediário';
  return 'Avançado';
};

// Risk Matrix Logic
export const CALCULATE_RISK_LEVEL = (prob: number, sev: number): RiskLevel => {
  const score = prob * sev;
  if (score <= 5) return 'Baixo';
  if (score <= 12) return 'Médio';
  if (score <= 19) return 'Alto';
  return 'Crítico';
};

export const RISK_LEVEL_COLORS = {
  'Baixo': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Médio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Alto': 'bg-orange-100 text-orange-800 border-orange-200',
  'Crítico': 'bg-red-100 text-red-800 border-red-200'
};

export interface PerceptionItem {
    id: string;
    category: 'Consciência' | 'Liderança' | 'Comunicação';
    question: string;
}

export const RISK_PERCEPTION_ITEMS: PerceptionItem[] = [
    { id: 'pa1', category: 'Consciência', question: 'Eu sei quais são os principais riscos (acidentes, doenças) do meu trabalho.' },
    { id: 'pa2', category: 'Consciência', question: 'Eu já recebi explicações claras sobre esses riscos.' },
    { id: 'pa3', category: 'Consciência', question: 'Eu sei quais medidas de proteção devo usar (EPC, EPI, procedimentos).' },
    { id: 'pa4', category: 'Consciência', question: 'Eu sei onde encontrar o inventário de riscos ou documentos semelhantes.' },
    { id: 'pa5', category: 'Consciência', question: 'Eu entendo quais consequências podem ocorrer se eu não seguir as medidas.' },
    { id: 'pb1', category: 'Liderança', question: 'A liderança da minha área dá exemplo cumprindo as regras de segurança.' },
    { id: 'pb2', category: 'Liderança', question: 'Se eu reporto um risco, sou levado a sério.' },
    { id: 'pb3', category: 'Liderança', question: 'Eu me sinto à vontade para parar uma atividade que considero insegura.' },
    { id: 'pb4', category: 'Liderança', question: 'A produtividade não é colocada acima da segurança.' },
    { id: 'pb5', category: 'Liderança', question: 'Quando há mudanças, recebo orientação prévia sobre os riscos.' },
    { id: 'pc1', category: 'Comunicação', question: 'Os treinamentos de segurança que recebo são claros e fáceis de entender.' },
    { id: 'pc2', category: 'Comunicação', question: 'Tenho oportunidade de fazer perguntas durante os treinamentos.' },
    { id: 'pc3', category: 'Comunicação', question: 'Os avisos e sinalizações de segurança são visíveis e compreensíveis.' },
    { id: 'pc4', category: 'Comunicação', question: 'Sinto que contribuo com ideias para melhorar a segurança.' },
    { id: 'pc5', category: 'Comunicação', question: 'Eu sei a quem procurar se eu tiver dúvidas de segurança.' },
];

export const NR1_QUIZ_TEMPLATE: QuizQuestion[] = [
    {
        id: 1,
        question: "O que é o PGR (Programa de Gerenciamento de Riscos)?",
        options: [
            "Documento apenas para cumprir lei",
            "Conjunto de ações para identificar, avaliar e controlar riscos",
            "Registro de ponto dos trabalhadores",
            "Plano de benefícios da empresa"
        ],
        correctIndex: 1
    },
    {
        id: 2,
        question: "O Inventário de Riscos Ocupacionais deve conter, entre outros:",
        options: [
            "Salário dos trabalhadores",
            "Lista de férias e folgas",
            "Riscos identificados, avaliação e medidas de controle",
            "Apenas lista de EPIs"
        ],
        correctIndex: 2
    },
    {
        id: 3,
        question: "Assinale a alternativa correta sobre a atualização do PGR:",
        options: [
            "O PGR é feito uma vez e nunca mais precisa ser revisto",
            "O PGR só é necessário para empresas grandes",
            "O PGR deve ser atualizado quando houver mudanças no ambiente ou processos",
            "O PGR é opcional"
        ],
        correctIndex: 2
    },
    {
        id: 4,
        question: "Um exemplo de medida de controle de risco é:",
        options: [
            "Ignorar o risco",
            "Aumentar a jornada de trabalho",
            "Instalar proteção em máquinas e equipamentos",
            "Cortar treinamento para economizar"
        ],
        correctIndex: 2
    },
    {
        id: 5,
        question: "A comunicação dos riscos aos trabalhadores:",
        options: [
            "Não é exigida pela NR-1",
            "Pode ser só verbal, sem registro",
            "Deve ser feita de forma clara, com registro que comprove",
            "É responsabilidade exclusiva dos trabalhadores"
        ],
        correctIndex: 2
    },
    {
        id: 6,
        question: "Em caso de dúvida sobre segurança, o trabalhador deve:",
        options: [
            "Continuar o trabalho normalmente",
            "Tomar qualquer decisão por conta própria",
            "Buscar orientação de seu superior ou setor de SST",
            "Deixar o posto sem avisar"
        ],
        correctIndex: 2
    },
    {
        id: 7,
        question: "A análise de acidentes e quase-acidentes serve para:",
        options: [
            "Encontrar um culpado",
            "Cumprir burocracia",
            "Aprender com o fato e melhorar o PGR",
            "Registrar para fins de RH"
        ],
        correctIndex: 2
    },
    {
        id: 8,
        question: "Qual alternativa representa melhor o papel da liderança em segurança?",
        options: [
            "Cobrar produtividade acima de tudo",
            "Dar exemplo, apoiar o uso de medidas de segurança e ouvir os trabalhadores",
            "Delegar segurança apenas ao setor de SST",
            "Não se envolver"
        ],
        correctIndex: 1
    },
    {
        id: 9,
        question: "Sobre treinamentos obrigatórios:",
        options: [
            "Podem ser feitos sem registro",
            "Devem ter conteúdo definido, avaliação de aprendizagem e registro de participação",
            "Não precisam ser renovados",
            "São responsabilidade dos trabalhadores"
        ],
        correctIndex: 1
    },
    {
        id: 10,
        question: "A NR-1 trata principalmente de:",
        options: [
            "Equipamentos elétricos",
            "Gerenciamento de riscos ocupacionais e disposições gerais em SST",
            "Trabalho em altura",
            "Produtos inflamáveis"
        ],
        correctIndex: 1
    }
];

export const MENTAL_HEALTH_QUESTIONS: MentalHealthQuestion[] = [
    { id: '1', category: 'Carga de Trabalho', question: 'Tenho tempo suficiente para realizar todas as minhas tarefas.' },
    { id: '2', category: 'Carga de Trabalho', question: 'O ritmo de trabalho é confortável, sem necessidade de correr o tempo todo.' },
    { id: '3', category: 'Carga de Trabalho', question: 'Consigo fazer pausas regulares para descanso durante a jornada.' },
    { id: '4', category: 'Carga de Trabalho', question: 'Meu volume de trabalho é compatível com minha capacidade, sem sobrecarga.' },
    { id: '5', category: 'Autonomia', question: 'Tenho liberdade para decidir como organizar e executar minhas tarefas.' },
    { id: '6', category: 'Autonomia', question: 'Posso influenciar a quantidade de trabalho que me é atribuída.' },
    { id: '7', category: 'Autonomia', question: 'Minha opinião é considerada nas decisões que afetam meu trabalho.' },
    { id: '7b', category: 'Autonomia', question: 'Tenho clareza sobre o que é esperado do meu papel e função na empresa.' }, // New: Role Clarity (Guia 2025)
    { id: '8', category: 'Apoio Social', question: 'Recebo apoio claro e ajuda do meu supervisor imediato quando preciso.' },
    { id: '9', category: 'Apoio Social', question: 'Meus colegas estão dispostos a ajudar quando tenho dificuldades.' },
    { id: '10', category: 'Apoio Social', question: 'Sinto-me parte da equipe e não isolado no trabalho.' },
    { id: '11', category: 'Bem-estar', question: 'Sinto que meu trabalho é reconhecido e valorizado pela empresa.' },
    { id: '11b', category: 'Bem-estar', question: 'Sinto que há justiça nas decisões e tratamento dentro da organização.' }, // New: Organizational Justice (Guia 2025)
    { id: '12', category: 'Bem-estar', question: 'Consigo me desligar das preocupações do trabalho quando estou em casa.' },
    { id: '13', category: 'Bem-estar', question: 'No meu ambiente de trabalho, as pessoas são tratadas com respeito (sem violência ou assédio).' },
    // Negative questions (Reverse Score logic needed in component)
    { id: '14', category: 'Bem-estar', question: 'Sinto-me emocionalmente esgotado ao final do dia de trabalho.', reverseScore: true },
    { id: '15', category: 'Carga de Trabalho', question: 'Frequentemente tenho que trabalhar muito rápido para cumprir prazos apertados.', reverseScore: true }
];

export const MENTAL_HEALTH_LEGAL = {
    INTRO_TITLE: "Avaliação Ergonômica Preliminar (AEP) - Fatores Psicossociais",
    INTRO_TEXT: `Este questionário é uma ferramenta de Avaliação Ergonômica Preliminar (AEP) conforme a NR-17 e o novo Guia de Fatores de Riscos Psicossociais (2025).

O objetivo é identificar perigos na organização do trabalho (como sobrecarga, falta de autonomia, assédio, baixa clareza de papel, etc.) para que a empresa possa adotar medidas de prevenção. Não é um teste psicológico individual.`,
    PRIVACY_TITLE: "Confidencialidade e Portaria MTE nº 1.419/2024",
    PRIVACY_TEXT: `Suas respostas serão tratadas com sigilo e analisadas de forma coletiva (AEP) para subsidiar o Gerenciamento de Riscos Ocupacionais (GRO). Nenhuma resposta será usada para fins disciplinares. Ao prosseguir, você concorda em participar para a melhoria das condições de trabalho.`,
    FOOTER_SHORT: "Aviso: esta avaliação compõe a AEP (Avaliação Ergonômica Preliminar) exigida pela NR-1 e NR-17. Não constitui diagnóstico clínico."
};

export const MENTAL_THERMOMETER_QUESTIONS: MentalHealthThermometerItem[] = [
  { id: 'th1', question: 'Nos últimos 30 dias, com que frequência você se sentiu esgotado(a) emocionalmente pelo trabalho?' },
  { id: 'th2', question: 'Com que frequência você teve dificuldade para dormir pensando em questões do trabalho?' },
  { id: 'th3', question: 'Com que frequência você sentiu falta de energia ou motivação para vir trabalhar?' },
];
