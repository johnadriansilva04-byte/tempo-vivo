// Sistema de Predição de Produtividade 100% Local - Estatística Pura
// Sem dependências externas, totalmente self-hosted

type ProductivityData = {
  date: string;
  productivity: number;
  tasksCompleted: number;
  sentiment: number;
  energy: number;
};

type PredictionResult = {
  date: string;
  predictedProductivity: number;
  confidence: number;
  factors: string[];
  recommendation: string;
  trend: 'increasing' | 'decreasing' | 'stable';
};

class ProductivityPredictor {
  private data: ProductivityData[];

  constructor(data: ProductivityData[]) {
    this.data = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Moving Average Prediction
  private calculateMovingAverage(days: number): number {
    if (this.data.length < days) return 0;
    const recent = this.data.slice(-days);
    return recent.reduce((sum, d) => sum + d.productivity, 0) / days;
  }

  // Weighted Moving Average (more weight to recent data)
  private calculateWeightedMovingAverage(days: number): number {
    if (this.data.length < days) return 0;
    const recent = this.data.slice(-days);
    let weightedSum = 0;
    let weightSum = 0;

    recent.forEach((d, i) => {
      const weight = i + 1; // More weight to recent data
      weightedSum += d.productivity * weight;
      weightSum += weight;
    });

    return weightedSum / weightSum;
  }

  // Linear Regression for trend prediction
  private calculateLinearRegression(days: number): { slope: number; intercept: number } {
    if (this.data.length < days) return { slope: 0, intercept: 0 };
    
    const recent = this.data.slice(-days);
    const n = recent.length;
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    recent.forEach((d, i) => {
      sumX += i;
      sumY += d.productivity;
      sumXY += i * d.productivity;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  // Seasonality Detection (day of week patterns)
  private detectSeasonality(): Map<number, number> {
    const dayMap = new Map<number, ProductivityData[]>();
    
    this.data.forEach(d => {
      const day = new Date(d.date).getDay();
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day)!.push(d);
    });

    const dayAverages = new Map<number, number>();
    dayMap.forEach((data, day) => {
      const avg = data.reduce((sum, d) => sum + d.productivity, 0) / data.length;
      dayAverages.set(day, avg);
    });

    return dayAverages;
  }

  // Correlation with sentiment
  private calculateSentimentCorrelation(): number {
    if (this.data.length < 2) return 0;
    
    const n = this.data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    this.data.forEach(d => {
      sumX += d.sentiment;
      sumY += d.productivity;
      sumXY += d.sentiment * d.productivity;
      sumX2 += d.sentiment * d.sentiment;
      sumY2 += d.productivity * d.productivity;
    });

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Predict productivity for a specific date
  predictProductivity(targetDate: string): PredictionResult {
    const target = new Date(targetDate);
    const targetDay = target.getDay();
    
    // Calculate various prediction models
    const ma7 = this.calculateMovingAverage(7);
    const wma7 = this.calculateWeightedMovingAverage(7);
    const ma30 = this.calculateMovingAverage(30);
    const regression = this.calculateLinearRegression(14);
    const seasonality = this.detectSeasonality();
    const sentimentCorrelation = this.calculateSentimentCorrelation();

    // Combine predictions with weights
    const weights = {
      recent: 0.4,
      trend: 0.3,
      seasonality: 0.2,
      sentiment: 0.1,
    };

    let basePrediction = 0;
    let factors: string[] = [];

    // Recent performance
    basePrediction += wma7 * weights.recent;
    factors.push(`Média recente (7 dias): ${wma7.toFixed(1)}`);

    // Trend
    const trendPrediction = ma7 + regression.slope * 7;
    basePrediction += trendPrediction * weights.trend;
    factors.push(`Tendência: ${regression.slope > 0 ? 'Crescente' : 'Decrescente'}`);

    // Seasonality
    const seasonalAvg = seasonality.get(targetDay) || ma7;
    basePrediction += seasonalAvg * weights.seasonality;
    factors.push(`Padrão do dia: ${seasonalAvg.toFixed(1)}`);

    // Sentiment correlation
    if (Math.abs(sentimentCorrelation) > 0.3) {
      const recentSentiment = this.data.slice(-7).reduce((sum, d) => sum + d.sentiment, 0) / 7;
      const sentimentAdjustment = recentSentiment * sentimentCorrelation * 50;
      basePrediction += sentimentAdjustment * weights.sentiment;
      factors.push(`Correlação sentimento: ${(sentimentCorrelation * 100).toFixed(0)}%`);
    }

    // Confidence calculation
    const dataPoints = this.data.length;
    const confidence = Math.min(1, dataPoints / 30);

    // Trend determination
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (regression.slope > 1) {
      trend = 'increasing';
    } else if (regression.slope < -1) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(basePrediction, trend, confidence);

    return {
      date: targetDate,
      predictedProductivity: Math.max(0, basePrediction),
      confidence,
      factors,
      recommendation,
      trend,
    };
  }

  // Predict next 7 days
  predictNextWeek(): PredictionResult[] {
    const predictions: PredictionResult[] = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateString = targetDate.toISOString().split('T')[0];
      predictions.push(this.predictProductivity(dateString));
    }

    return predictions;
  }

  private generateRecommendation(
    predictedProductivity: number,
    trend: 'increasing' | 'decreasing' | 'stable',
    confidence: number
  ): string {
    if (confidence < 0.3) {
      return 'Dados insuficientes para predição confiável. Continue registrando.';
    }

    if (predictedProductivity > 200) {
      return 'Dia de alta produtividade esperado. Planeje tarefas importantes.';
    }

    if (predictedProductivity > 100) {
      return 'Produtividade moderada esperada. Bom dia para tarefas regulares.';
    }

    if (predictedProductivity < 50) {
      return 'Produtividade baixa esperada. Considere tarefas leves ou descanso.';
    }

    if (trend === 'increasing') {
      return 'Tendência de melhoria. Aproveite o momento!';
    }

    if (trend === 'decreasing') {
      return 'Tendência de queda. Considere ajustar rotina.';
    }

    return 'Produtividade estável esperada. Mantenha rotina atual.';
  }

  // Get overall productivity insights
  getInsights(): {
    averageProductivity: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    bestDay: string;
    worstDay: string;
    totalEntries: number;
  } {
    if (this.data.length === 0) {
      return {
        averageProductivity: 0,
        trend: 'stable',
        bestDay: 'N/A',
        worstDay: 'N/A',
        totalEntries: 0,
      };
    }

    const averageProductivity = this.data.reduce((sum, d) => sum + d.productivity, 0) / this.data.length;
    const regression = this.calculateLinearRegression(14);
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (regression.slope > 1) {
      trend = 'increasing';
    } else if (regression.slope < -1) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    const best = this.data.reduce((max, d) => d.productivity > max.productivity ? d : max);
    const worst = this.data.reduce((min, d) => d.productivity < min.productivity ? d : min);

    return {
      averageProductivity,
      trend,
      bestDay: best.date,
      worstDay: worst.date,
      totalEntries: this.data.length,
    };
  }
}

export function predictProductivity(data: ProductivityData[], targetDate: string): PredictionResult {
  const predictor = new ProductivityPredictor(data);
  return predictor.predictProductivity(targetDate);
}

export function predictNextWeek(data: ProductivityData[]): PredictionResult[] {
  const predictor = new ProductivityPredictor(data);
  return predictor.predictNextWeek();
}

export function getProductivityInsights(data: ProductivityData[]) {
  const predictor = new ProductivityPredictor(data);
  return predictor.getInsights();
}

export type { ProductivityData, PredictionResult };