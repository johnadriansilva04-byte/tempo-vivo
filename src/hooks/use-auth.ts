import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { setUserIdCache } from "@/services/profile-service";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

export type AuthSession = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) return null;
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session) {
        setUserIdCache(null);
        return null;
      }
      
      setUserIdCache(session.user.id);
      
      return {
        user: {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
        },
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      } as AuthSession;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });

  return {
    session: query.data,
    user: query.data?.user,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    error: query.error,
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      } as AuthSession;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["auth"], session);
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name 
    }: { 
      email: string; 
      password: string; 
      name?: string;
    }) => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });
      
      if (error) throw error;
      
      if (!data.session) {
        // Email confirmation required
        return null;
      }
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      } as AuthSession;
    },
    onSuccess: (session) => {
      if (session) {
        queryClient.setQueryData(["auth"], session);
      }
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth"], null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, avatar_url }: { name?: string; avatar_url?: string }) => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { data, error } = await supabase.auth.updateUser({
        data: { name, avatar_url },
      });
      
      if (error) throw error;
      
      return {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
      } as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth"], (old: AuthSession | null) => {
        if (!old) return null;
        return { ...old, user };
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
    },
  });
}