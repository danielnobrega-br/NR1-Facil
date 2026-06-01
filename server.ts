import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { CHECKLIST_ITEMS, MATURITY_ITEMS, MATURITY_LEVEL_MAP, CALCULATE_RISK_LEVEL } from "./constants";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let ai: GoogleGenAI | null = null;
  const getAiClient = (): GoogleGenAI => {
    if (!ai) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // 1. Safety Analysis Proxy
  app.post("/api/gemini/safety-analysis", async (req, res) => {
    try {
      const { checklist, maturity } = req.body;
      const aiClient = getAiClient();

      const checklistPoints = Object.values(checklist || {}).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number;
      const maxPoints = CHECKLIST_ITEMS.length * 2;
      const checklistScore = (checklistPoints / maxPoints) * 100;

      const maturityValues = Object.values(maturity || {});
      const maturityAvg = maturityValues.length > 0 
        ? maturityValues.reduce((a: number, b: any) => a + (Number(b) || 0), 0) / maturityValues.length 
        : 0;
      
      const criticalItems = CHECKLIST_ITEMS.filter(i => ((checklist && checklist[i.id]) || 0) < 2).map(i => i.question);

      const contextData = {
        checklistScore: `${checklistScore.toFixed(1)}%`,
        totalPoints: checklistPoints,
        maxPoints: maxPoints,
        maturityScore: maturityAvg.toFixed(1),
        maturityLevel: MATURITY_LEVEL_MAP(maturityAvg),
        criticalGaps: criticalItems.slice(0, 5),
        weakMaturityAreas: MATURITY_ITEMS.filter(i => ((maturity && maturity[i.id]) || 0) <= 2).map(i => i.dimension)
      };

      const prompt = `
        Atue como um Consultor Sênior em Segurança do Trabalho (NR-1, GRO, PGR).
        Analise os seguintes dados de diagnóstico de uma empresa:
        
        ${JSON.stringify(contextData, null, 2)}
        
        Forneça uma resposta em formato JSON estrito com a seguinte estrutura:
        {
          "summary": "Um parágrafo executivo resumindo a situação atual da empresa (tom profissional e direto), mencionando se o nível é Crítico, Básico, Intermediário ou Avançado com base nos pontos.",
          "recommendations": ["Ação prioritária 1", "Ação prioritária 2", "Ação prioritária 3"]
        }
        
        Seja conciso. Foque em ações de alto impacto para adequação à NR-1.
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) throw new Error("Sem resposta da IA");
      
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Gemini Safety Analysis Error:", error);
      res.status(500).json({
        summary: "Não foi possível gerar a análise automática no momento.",
        recommendations: ["Revise os itens críticos do checklist.", "Foque nas dimensões de maturidade com nota abaixo de 3."]
      });
    }
  });

  // 2. Generate APR Proxy
  app.post("/api/gemini/generate-apr", async (req, res) => {
    try {
      const { activity } = req.body;
      const aiClient = getAiClient();

      const prompt = `
        Atue como Engenheiro de Segurança do Trabalho.
        Gere uma Análise Preliminar de Risco (APR) para a atividade: "${activity}".
        
        IMPORTANTE:
        - Se a atividade contiver um "Foco: Perigo X", certifique-se de que a análise detalhe especificamente esse perigo, além das etapas gerais.
        - Liste de 3 a 5 principais riscos.
        
        Retorne APENAS um JSON array com a estrutura:
        [
          {
            "step": "Etapa da atividade",
            "hazard": "Perigo/Fator de Risco",
            "cause": "Fonte ou Causa",
            "consequence": "Possível Consequência/Dano",
            "category": "Físico, Químico, Biológico, Ergonômico ou Acidente",
            "control": "Medida de Controle Preventiva"
          }
        ]
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      res.json(JSON.parse(text || '[]'));
    } catch (error) {
      console.error("Gemini APR Error:", error);
      res.json([]);
    }
  });

  // 3. Incident Root Cause Analysis Proxy
  app.post("/api/gemini/root-cause", async (req, res) => {
    try {
      const { incident } = req.body;
      const aiClient = getAiClient();

      const prompt = `
        Atue como especialista em investigação de acidentes.
        Realize uma análise de causa raiz usando a metodologia "5 Porquês" para o incidente: "${incident}".
        
        Retorne um JSON:
        {
          "incident": "${incident}",
          "whys": ["Por que 1...", "Por que 2...", "Por que 3...", "Por que 4...", "Por que 5..."],
          "rootCause": "A causa raiz sistêmica identificada",
          "recommendation": "Ação corretiva para evitar recorrência"
        }
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      res.json(JSON.parse(text || '{}'));
    } catch (error) {
      console.error("Gemini Rootcause Error:", error);
      res.status(500).json({ error: "Erro ao analisar causa raiz" });
    }
  });

  // 4. Generate Quiz Proxy
  app.post("/api/gemini/generate-quiz", async (req, res) => {
    try {
      const { topic, type } = req.body;
      const aiClient = getAiClient();

      const difficulty = type === 'PRE' ? 'fácil e conceitual' : type === 'POST' ? 'moderada e abrangente' : 'focada em memorização e prática';
      const count = 10;
      
      const prompt = `
        Crie um teste de aprendizado para treinamento de NR-1 / Segurança do Trabalho.
        Tópico: "${topic}".
        Tipo do teste: ${type} (Nível: ${difficulty}).
        Gere exatamente ${count} questões de múltipla escolha.
        
        Retorne APENAS um JSON array:
        [
          {
            "id": 1,
            "question": "Texto da pergunta",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctIndex": 0
          }
        ]
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text;
      res.json(JSON.parse(text || '[]'));
    } catch (error) {
      console.error("Gemini Quiz Error:", error);
      res.json([]);
    }
  });

  // 5. Generate Practical Checklist Proxy
  app.post("/api/gemini/practical-checklist", async (req, res) => {
    try {
      const { task } = req.body;
      const aiClient = getAiClient();

      const prompt = `
        Atue como Instrutor Sênior de Segurança do Trabalho.
        Crie um checklist rigoroso para avaliação prática de um trabalhador executando a tarefa: "${task}".
        Liste de 6 a 8 critérios observáveis e comportamentais.

        CRITÉRIOS DE CRITICIDADE:
        - Identifique itens "CRÍTICOS" (Regras de Ouro/Fatais): Falha nestes itens gera risco grave e iminente ou reprovação automática.
        - Identifique itens de "BOAS PRÁTICAS": Importantes para organização e qualidade, mas não fatais.

        Retorne APENAS um JSON array:
        [
          {
            "criteria": "Descrição da ação esperada (ex: Testou ausência de tensão antes de tocar?)",
            "critical": true
          }
        ]
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text;
      res.json(JSON.parse(text || '[]'));
    } catch (error) {
      console.error("Gemini Practical Checklist Error:", error);
      res.json([]);
    }
  });

  // 6. Psychosocial Risks Proxy
  app.post("/api/gemini/psychosocial-risks", async (req, res) => {
    try {
      const { role } = req.body;
      const aiClient = getAiClient();

      const prompt = `
        Atue como especialista em Fatores de Riscos Psicossociais (Guia NR-1 2025).
        Identifique riscos psicossociais para a função: "${role}".
        
        Diretriz Importante (Portaria MTE 1.419/2024):
        As medidas de mitigação (sugestões) DEVEM priorizar mudanças na organização do trabalho (ex: revisar metas, aumentar equipe, flexibilizar horário, pausas) ao invés de focar apenas no indivíduo (ex: ginástica laboral, resiliência).
        
        Identifique fatores como: Sobrecarga, Falta de Autonomia, Assédio, Baixo Apoio Social, Baixa Clareza de Papel.

        Retorne APENAS um JSON array com 4 itens:
        [
          {
            "factor": "Nome do fator (ex: Sobrecarga de Trabalho)",
            "description": "Explicação breve focada na organização do trabalho",
            "mitigation": "Sugestão de medida organizacional (NÃO comportamental)"
          }
        ]
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text;
      res.json(JSON.parse(text || '[]'));
    } catch (error) {
      console.error("Gemini Psychosocial Error:", error);
      res.json([]);
    }
  });

  // 7. Risk Perception Survey Proxy
  app.post("/api/gemini/risk-perception", async (req, res) => {
    try {
      const { sector } = req.body;
      const aiClient = getAiClient();

      const prompt = `
        Crie um questionário breve para avaliar a PERCEPÇÃO DE RISCOS dos trabalhadores do setor: "${sector}".
        O objetivo é saber se eles conhecem os riscos reais da área.
        
        Retorne APENAS um JSON array com 5 perguntas:
        [
          {
            "question": "A pergunta a ser feita ao trabalhador",
            "objective": "O que esta pergunta visa descobrir (ex: se ele conhece o procedimento de emergência)"
          }
        ]
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const text = response.text;
      res.json(JSON.parse(text || '[]'));
    } catch (error) {
      console.error("Gemini Perception Error:", error);
      res.json([]);
    }
  });

  // 8. PGR Inventory Generation Proxy
  app.post("/api/gemini/pgr-inventory", async (req, res) => {
    try {
      const { cnae, activityDescription, name } = req.body;
      const aiClient = getAiClient();

      const prompt = `
          Atue como Engenheiro de Segurança do Trabalho especialista em NR-1 e GRO.
          Gere um Inventário de Riscos Ocupacionais (PGR) COMPLETO para a empresa:
          Nome: ${name}
          CNAE/Atividade: ${cnae} - ${activityDescription}

          Identifique riscos Físicos, Químicos, Biológicos, Ergonômicos e de Acidentes típicos deste setor.
          Para cada risco, estime uma Probabilidade (1-5) e Severidade (1-5) realista para uma empresa padrão deste ramo.

          Retorne APENAS um JSON array com pelo menos 6 a 10 itens:
          [
              {
                  "process": "Setor ou Atividade (ex: Cozinha - Corte)",
                  "hazard": "Fator de Risco (ex: Superfície quente)",
                  "probability": 3,
                  "severity": 4
              }
          ]
      `;

      const response = await aiClient.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
      });
      
      const text = response.text;
      if (!text) throw new Error("Sem resposta");
      const rawItems = JSON.parse(text);

      const mapped = rawItems.map((item: any) => ({
          id: "ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
          process: item.process,
          hazard: item.hazard,
          probability: item.probability,
          severity: item.severity,
          level: CALCULATE_RISK_LEVEL(item.probability, item.severity),
          score: item.probability * item.severity,
          sourceModelId: 'AI_GENERATED'
      }));
      res.json(mapped);
    } catch (error) {
      console.error("Gemini PGR Inventory Error:", error);
      res.json([]);
    }
  });

  // Vite Integration Middleware / Static Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
