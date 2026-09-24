// Sistema de Análise de Sentimento 100% Local - JS Puro
type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

type SentimentResult = {
  type: SentimentType;
  score: number;
  confidence: number;
  keywords: string[];
  emotion: string;
};

const POSITIVE_KEYWORDS = [
  'feliz', 'ótimo', 'excelente', 'bom', 'maravilhoso', 'incrível', 'fantástico',
  'sucesso', 'conquista', 'realização', 'progresso', 'avanço', 'melhoria',
  'alegria', 'entusiasmo', 'motivado', 'inspirado', 'energético', 'produtivo',
  'eficiente', 'criativo', 'inovador', 'ousado', 'corajoso', 'determinado',
  'grato', 'agradecido', 'satisfeito', 'contente', 'felicitado', 'celebrar',
  'triunfo', 'vitória', 'conquista', 'realizado', 'alcançado', 'completo',
  'próspero', 'abundante', 'rico', 'valioso', 'importante', 'significativo',
  'paixão', 'amor', 'carinho', 'afeto', 'cuidado', 'atenção', 'dedicação',
  'esforço', 'trabalho', 'meta', 'objetivo', 'plano', 'estratégia', 'execução',
  'resultado', 'desenvolvimento', 'crescimento', 'aprendizado', 'experiência',
  'conhecimento', 'sabedoria', 'habilidade', 'talento', 'capacidade', 'potencial',
  'oportunidade', 'desafio', 'superar', 'vencer', 'dominar', 'liderar',
  'influenciar', 'impactar', 'transformar', 'revolucionar', 'inovar', 'criar',
  'produzir', 'construir', 'edificar', 'evoluir', 'crescer', 'expandir', 'ampliar',
  'aumentar', 'melhorar', 'otimizar', 'maximizar', 'potencializar', 'realizar',
  'concretizar', 'efetivar', 'executar', 'implementar', 'aplicar', 'praticar',
  'usar', 'utilizar', 'aproveitar', 'gozar', 'desfrutar', 'viver', 'experimentar',
  'descobrir', 'explorar', 'aprender', 'entender', 'compreender', 'dominar',
  'perceber', 'reconhecer', 'identificar', 'enxergar', 'focar', 'concentrar',
  'disciplinar', 'organizar', 'planejar', 'preparar', 'executar', 'concluir',
  'terminar', 'finalizar', 'completar', 'acabar', 'encerar',
];

const NEGATIVE_KEYWORDS = [
  'triste', 'deprimido', 'frustrado', 'chateado', 'irritado', 'zangado', 'preocupado',
  'ansioso', 'nervoso', 'estressado', 'cansado', 'exausto', 'esgotado', 'fatigado',
  'fracasso', 'fracassado', 'falha', 'erro', 'problema', 'dificuldade',
  'obstáculo', 'barreira', 'desafio', 'luta', 'batalha', 'conflito', 'crise',
  'drama', 'tensão', 'pressão', 'estresse', 'ansiedade', 'medo', 'receio',
  'insegurança', 'dúvida', 'incerteza', 'hesitação', 'perda', 'derrota',
  'insucesso', 'negativo', 'ruim', 'mal', 'péssimo', 'horrível', 'terrível',
  'catastrófico', 'desastre', 'calamidade', 'tragédia', 'sofrimento', 'dor',
  'angústia', 'tristeza', 'depressão', 'pânico', 'terror', 'horror', 'ódio',
  'raiva', 'hostilidade', 'agressividade', 'violência', 'briga', 'discussão',
  'argumento', 'desacordo', 'divergência', 'oposição', 'resistência', 'obstrução',
  'impedimento', 'suspensão', 'cancelamento', 'desistência', 'abandono', 'renúncia',
  'adiamento', 'atraso', 'demora', 'espera', 'resignação', 'aceitação',
  'preguiça', 'falta de motivação', 'desinteresse', 'apatia', 'indiferença',
  'tédio', 'monotonia', 'rotina', 'mesmice', 'repetição', 'enjoo', 'decepção',
  'desapontamento', 'frustração', 'irritação', 'revolta', 'rebelião', 'insubordinação',
];

const EMOTICON_SENTIMENTS: Record<string, { type: SentimentType; score: number }> = {
  '😊': { type: 'positive', score: 0.8 },
  '😄': { type: 'positive', score: 0.9 },
  '🥳': { type: 'positive', score: 0.85 },
  '🎉': { type: 'positive', score: 0.9 },
  '🚀': { type: 'positive', score: 0.8 },
  '💪': { type: 'positive', score: 0.7 },
  '👍': { type: 'positive', score: 0.6 },
  '⭐': { type: 'positive', score: 0.75 },
  '❤️': { type: 'positive', score: 0.85 },
  '🔥': { type: 'positive', score: 0.8 },
  '😢': { type: 'negative', score: -0.8 },
  '😭': { type: 'negative', score: -0.9 },
  '😤': { type: 'negative', score: -0.7 },
  '😠': { type: 'negative', score: -0.9 },
  '😡': { type: 'negative', score: -0.85 },
  '💔': { type: 'negative', score: -0.8 },
  '😞': { type: 'negative', score: -0.6 },
  '😪': { type: 'negative', score: -0.7 },
  '😔': { type: 'negative', score: -0.75 },
  '😩': { type: 'negative', score: -0.8 },
  '😐': { type: 'neutral', score: 0 },
  '😶': { type: 'neutral', score: 0.1 },
  '🙂': { type: 'neutral', score: 0.2 },
  '🤔': { type: 'neutral', score: -0.1 },
  '🤨': { type: 'negative', score: -0.3 },
  '😕': { type: 'negative', score: -0.5 },
  '🙁': { type: 'neutral', score: 0 },
  '😬': { type: 'neutral', score: 0.1 },
  '🫥': { type: 'neutral', score: 0 },
  '🙃': { type: 'neutral', score: 0 },
  '😌': { type: 'positive', score: 0.7 },
  '😍': { type: 'positive', score: 0.9 },
  '🥰': { type: 'positive', score: 0.85 },
  '😘': { type: 'positive', score: 0.8 },
  '😗': { type: 'positive', score: 0.75 },
  '🙏': { type: 'neutral', score: 0.1 },
  '🤝': { type: 'neutral', score: 0.2 },
  '✅': { type: 'positive', score: 0.7 },
  '❌': { type: 'negative', score: -0.7 },
  '⚠️': { type: 'negative', score: -0.5 },
  '🚨': { type: 'negative', score: -0.8 },
  '✨': { type: 'positive', score: 0.6 },
  '💫': { type: 'positive', score: 0.7 },
  '🌟': { type: 'positive', score: 0.65 },
  '🎯': { type: 'positive', score: 0.8 },
  '🏆': { type: 'positive', score: 0.9 },
  '🥇': { type: 'positive', score: 0.95 },
  '🥈': { type: 'positive', score: 0.9 },
  '🥉': { type: 'positive', score: 0.85 },
  '⚡': { type: 'positive', score: 0.6 },
  '🌈': { type: 'positive', score: 0.5 },
  '🌞': { type: 'positive', score: 0.7 },
  '🌙': { type: 'neutral', score: 0 },
  '🌝': { type: 'positive', score: 0.65 },
  '🌚': { type: 'neutral', score: 0 },
  '☀️': { type: 'positive', score: 0.7 },
  '🌤': { type: 'positive', score: 0.6 },
  '🌦': { type: 'positive', score: 0.55 },
  '🌩': { type: 'positive', score: 0.6 },
  '🍀': { type: 'positive', score: 0.6 },
  '🍁': { type: 'positive', score: 0.7 },
  '🍃': { type: 'positive', score: 0.5 },
  '🍎': { type: 'positive', score: 0.6 },
  '🎀': { type: 'positive', score: 0.6 },
  '🎁': { type: 'positive', score: 0.8 },
  '🎂': { type: 'positive', score: 0.7 },
  '🎉': { type: 'positive', score: 0.9 },
  '🎊': { type: 'positive', score: 0.85 },
  '🎭': { type: 'negative', score: -0.6 },
  '💀': { type: 'negative', score: -0.9 },
  '☠️': { type: 'negative', score: -0.95 },
  '💣': { type: 'negative', score: -0.85 },
};

export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: string[] = [];

  // Check positive keywords
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveCount++;
      foundKeywords.push(keyword);
    }
  });

  // Check negative keywords
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeCount++;
      foundKeywords.push(keyword);
    }
  });

  // Check emoticons
  let emoticonScore = 0;
  Object.entries(EMOTICON_SENTIMENTS).forEach(([emoji, sentiment]) => {
    if (text.includes(emoji)) {
      emoticonScore += sentiment.score;
      foundKeywords.push(emoji);
    }
  });

  // Calculate base score
  const keywordScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
  const totalScore = (keywordScore + emoticonScore) / 2;

  // Determine type
  let type: SentimentType;
  if (totalScore > 0.3) {
    type = 'positive';
  } else if (totalScore < -0.3) {
    type = 'negative';
  } else if (positiveCount > 0 && negativeCount > 0) {
    type = 'mixed';
  } else {
    type = 'neutral';
  }

  // Calculate confidence
  const confidence = Math.min(1, (positiveCount + negativeCount + Math.abs(emoticonScore)) / 5);

  // Determine emotion
  const emotion = getEmotion(type, totalScore);

  return {
    type,
    score: Math.max(-1, Math.min(1, totalScore)),
    confidence,
    keywords: [...new Set(foundKeywords)].slice(0, 5),
    emotion,
  };
}

function getEmotion(type: SentimentType, score: number): string {
  if (type === 'positive') {
    if (score > 0.7) return 'Eufórico';
    if (score > 0.5) return 'Muito feliz';
    if (score > 0.3) return 'Contente';
    return 'Levemente positivo';
  }
  if (type === 'negative') {
    if (score < -0.7) return 'Devastado';
    if (score < -0.5) return 'Muito triste';
    if (score < -0.3) return 'Desapontado';
    return 'Levemente negativo';
  }
  if (type === 'mixed') return 'Misto';
  return 'Neutro';
}

export function getSentimentTrend(sentiments: SentimentResult[]): 'improving' | 'declining' | 'stable' {
  if (sentiments.length < 2) return 'stable';
  
  const recent = sentiments.slice(-7);
  const avgScore = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
  const prevAvg = sentiments.slice(-14, -7).reduce((sum, s) => sum + s.score, 0) / 7;
  
  if (avgScore > prevAvg + 0.1) return 'improving';
  if (avgScore < prevAvg - 0.1) return 'declining';
  return 'stable';
}