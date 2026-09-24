// Sistema de Analytics 100% Local - Sem dependências externas
type AnalyticsEvent = {
  id: string;
  event: string;
  timestamp: number;
  properties: Record<string, any>;
  userId: string;
  sessionId: string;
};

type AnalyticsData = {
  events: AnalyticsEvent[];
  sessions: SessionData[];
  users: UserData[];
};

type SessionData = {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  pageViews: number;
  events: string[];
};

type UserData = {
  id: string;
  createdAt: number;
  lastActive: number;
  totalSessions: number;
  totalTime: number;
  properties: Record<string, any>;
};

const STORAGE_KEY = 'perfil-vivo:analytics:v1';

class LocalAnalytics {
  private data: AnalyticsData;
  private currentSession: SessionData | null = null;
  private userId: string;

  constructor() {
    this.data = this.load();
    this.userId = this.getOrCreateUserId();
    this.startSession();
  }

  private load(): AnalyticsData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading analytics:', e);
    }
    return { events: [], sessions: [], users: [] };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving analytics:', e);
    }
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('perfil-vivo:user_id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('perfil-vivo:user_id', userId);
      this.data.users.push({
        id: userId,
        createdAt: Date.now(),
        lastActive: Date.now(),
        totalSessions: 0,
        totalTime: 0,
        properties: {},
      });
      this.save();
    }
    return userId;
  }

  private startSession() {
    const sessionId = crypto.randomUUID();
    this.currentSession = {
      id: sessionId,
      userId: this.userId,
      startTime: Date.now(),
      duration: 0,
      pageViews: 0,
      events: [],
    };
  }

  private endSession() {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = Date.now() - this.currentSession.startTime;
    
    this.data.sessions.push(this.currentSession);
    
    // Update user stats
    const user = this.data.users.find(u => u.id === this.userId);
    if (user) {
      user.lastActive = Date.now();
      user.totalSessions++;
      user.totalTime += this.currentSession.duration;
    }
    
    this.currentSession = null;
    this.save();
  }

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      id: crypto.randomUUID(),
      event,
      timestamp: Date.now(),
      properties,
      userId: this.userId,
      sessionId: this.currentSession?.id || '',
    };

    this.data.events.push(analyticsEvent);
    
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }
    
    this.save();
  }

  trackPageView(page: string) {
    this.track('page_view', { page });
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }
  }

  trackEvent(event: string, properties: Record<string, any> = {}) {
    this.track(event, properties);
  }

  getAnalytics() {
    this.endSession();
    this.startSession();
    
    return {
      totalEvents: this.data.events.length,
      totalSessions: this.data.sessions.length,
      totalUsers: this.data.users.length,
      averageSessionDuration: this.data.sessions.length > 0 
        ? this.data.sessions.reduce((sum, s) => sum + s.duration, 0) / this.data.sessions.length 
        : 0,
      eventsByType: this.groupEventsByType(),
      pageViews: this.data.sessions.reduce((sum, s) => sum + s.pageViews, 0),
      activeUsers: this.getActiveUsers(7), // Últimos 7 dias
      userRetention: this.calculateRetention(),
    };
  }

  private groupEventsByType() {
    const grouped: Record<string, number> = {};
    this.data.events.forEach(event => {
      grouped[event.event] = (grouped[event.event] || 0) + 1;
    });
    return grouped;
  }

  private getActiveUsers(days: number): number {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return this.data.users.filter(user => user.lastActive > cutoff).length;
  }

  private calculateRetention(): number {
    if (this.data.users.length === 0) return 0;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const users7Days = this.data.users.filter(u => u.lastActive > sevenDaysAgo).length;
    const users30Days = this.data.users.filter(u => u.lastActive > thirtyDaysAgo).length;
    
    return users30Days > 0 ? (users7Days / users30Days) * 100 : 0;
  }

  getUserData(userId: string) {
    return this.data.users.find(u => u.id === userId);
  }

  getEventsByUser(userId: string) {
    return this.data.events.filter(e => e.userId === userId);
  }

  exportData(): AnalyticsData {
    return this.data;
  }

  clearData() {
    if (confirm('Tem certeza que deseja limpar todos os dados de analytics?')) {
      this.data = { events: [], sessions: [], users: [] };
      this.save();
      localStorage.removeItem('perfil-vivo:user_id');
    }
  }
}

// Singleton instance
export const localAnalytics = new LocalAnalytics();