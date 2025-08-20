import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser extends User {
  role?: 'farmer' | 'trader' | 'admin';
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  firm_name?: string;
  gstin?: string;
  pan?: string;
  aadhar_last4?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  avatar_url?: string;
}

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: 'farmer' | 'trader' }) {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    return { data, error };
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user with role
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: any }> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!user || error) {
      return { user: null, error };
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const authUser: AuthUser = {
      ...user,
      role: userData?.role
    };

    return { user: authUser, error: userError };
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { profile: data, error };
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'farmer' | 'trader' | 'admin') {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Reset password
  async resetPassword(email: string) {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    return { data, error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    return { data, error };
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};