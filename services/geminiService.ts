import { ChecklistState, MaturityState, AprItem, RootCauseAnalysis, QuizQuestion, PracticalChecklistItem, PsychosocialRisk, SurveyQuestion, RiskItem } from '../types';

export const generateSafetyAnalysis = async (
  checklist: ChecklistState,
  maturity: MaturityState
): Promise<{ summary: string; recommendations: string[] }> => {
  try {
    const response = await fetch('/api/gemini/safety-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checklist, maturity }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating safety analysis:", error);
    return {
      summary: "Não foi possível gerar a análise automática no momento.",
      recommendations: ["Revise os itens críticos do checklist.", "Foque nas dimensões de maturidade com nota abaixo de 3."]
    };
  }
};

export const generateApr = async (activity: string): Promise<AprItem[]> => {
  try {
    const response = await fetch('/api/gemini/generate-apr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activity }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating APR:", error);
    return [];
  }
};

export const analyzeRootCause = async (incident: string): Promise<RootCauseAnalysis> => {
  try {
    const response = await fetch('/api/gemini/root-cause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ incident }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error analyzing root cause:", error);
    throw error;
  }
};

export const generateQuiz = async (topic: string, type: 'PRE' | 'POST' | 'FIXATION'): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch('/api/gemini/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, type }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

export const generatePracticalChecklist = async (task: string): Promise<PracticalChecklistItem[]> => {
  try {
    const response = await fetch('/api/gemini/practical-checklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating practical checklist:", error);
    return [];
  }
};

export const generatePsychosocialRisks = async (role: string): Promise<PsychosocialRisk[]> => {
  try {
    const response = await fetch('/api/gemini/psychosocial-risks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating psychosocial risks:", error);
    return [];
  }
};

export const generateRiskPerceptionSurvey = async (sector: string): Promise<SurveyQuestion[]> => {
  try {
    const response = await fetch('/api/gemini/risk-perception', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sector }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating risk perception survey:", error);
    return [];
  }
};

export const generatePgrInventory = async (cnae: string, activityDescription: string, name: string): Promise<RiskItem[]> => {
  try {
    const response = await fetch('/api/gemini/pgr-inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cnae, activityDescription, name }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating PGR inventory:", error);
    return [];
  }
};
