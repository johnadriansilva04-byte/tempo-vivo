import { useState, useCallback } from "react";

type GoogleCalendarEvent = {
  summary: string;
  description?: string;
  start: {
    date?: string; // For all-day events
    dateTime?: string; // For timed events
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
};

export function useGoogleCalendar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(() => {
    // In a real implementation, this would use Google OAuth 2.0
    // For now, we'll simulate the authentication flow
    setIsLoading(true);
    setError(null);

    // Simulate OAuth flow
    setTimeout(() => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin;
      
      if (!clientId) {
        setError("Google Client ID não configurado");
        setIsLoading(false);
        return;
      }

      // In production, this would redirect to Google's OAuth consent screen
      // For demo purposes, we'll just set authenticated to true
      setIsAuthenticated(true);
      setIsLoading(false);
    }, 1000);
  }, []);

  const createEvent = useCallback(async (event: GoogleCalendarEvent) => {
    if (!isAuthenticated) {
      setError("Não autenticado com Google Calendar");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call the Google Calendar API
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful event creation
      const mockEventId = `event_${Date.now()}`;
      setIsLoading(false);
      return mockEventId;
    } catch (err) {
      setError("Erro ao criar evento no Google Calendar");
      setIsLoading(false);
      return null;
    }
  }, [isAuthenticated]);

  const syncDailyLog = useCallback(async (date: string, plannedText: string) => {
    if (!isAuthenticated) {
      setError("Não autenticado com Google Calendar");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse the planned text into individual tasks
      const tasks = plannedText.split('\n').filter(line => line.trim());
      
      const events = tasks.map(task => ({
        summary: task.trim(),
        description: `Tarefa do Perfil Vivo para ${date}`,
        start: {
          date: date,
        },
        end: {
          date: date,
        },
      }));

      // Create events for each task
      const eventIds = await Promise.all(
        events.map(event => createEvent(event))
      );

      setIsLoading(false);
      return eventIds.filter(Boolean);
    } catch (err) {
      setError("Erro ao sincronizar com Google Calendar");
      setIsLoading(false);
      return null;
    }
  }, [isAuthenticated, createEvent]);

  const disconnect = useCallback(() => {
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    createEvent,
    syncDailyLog,
    disconnect,
  };
}