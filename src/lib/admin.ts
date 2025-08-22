import { supabase } from "@/integrations/supabase/client";

export const adminService = {
  // Dashboard statistics
  async getDashboardStats() {
    const [users, listings, orders, disputes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('listings').select('id', { count: 'exact' }),
      supabase.from('orders').select('id', { count: 'exact' }),
      supabase.from('disputes').select('id', { count: 'exact' })
    ]);

    // Active listings
    const { count: activeListings } = await supabase
      .from('listings')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // Pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    // Open disputes
    const { count: openDisputes } = await supabase
      .from('disputes')
      .select('id', { count: 'exact' })
      .eq('status', 'open');

    // Revenue calculation (platform fees)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('platform_fee')
      .eq('status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.platform_fee || 0), 0) || 0;

    return {
      data: {
        totalUsers: users.count || 0,
        totalListings: listings.count || 0,
        activeListings: activeListings || 0,
        totalOrders: orders.count || 0,
        pendingOrders: pendingOrders || 0,
        totalDisputes: disputes.count || 0,
        openDisputes: openDisputes || 0,
        totalRevenue
      },
      error: null
    };
  },

  // Get all users
  async getUsers(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('users')
      .select(`
        *,
        profile:profiles(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error, count };
  },

  // Update user status
  async updateUserStatus(userId: string, status: 'pending' | 'active' | 'suspended' | 'banned') {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Update user role
  async updateUserRole(userId: string, role: 'farmer' | 'trader' | 'admin') {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Get all listings for admin
  async getListings(page = 1, limit = 50, status?: 'draft' | 'active' | 'sold' | 'expired' | 'removed') {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name),
        seller:profiles!listings_seller_id_fkey(
          id,
          first_name,
          last_name,
          firm_name
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error, count };
  },

  // Update listing status
  async updateListingStatus(listingId: string, status: 'draft' | 'active' | 'sold' | 'expired' | 'removed') {
    const { data, error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', listingId)
      .select()
      .single();

    return { data, error };
  },

  // Feature/unfeature listing
  async toggleListingFeatured(listingId: string, featured: boolean) {
    const { data, error } = await supabase
      .from('listings')
      .update({ featured })
      .eq('id', listingId)
      .select()
      .single();

    return { data, error };
  },

  // Get orders for admin
  async getOrders(page = 1, limit = 50, status?: 'pending' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed') {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        listing:listings(id, title),
        buyer:profiles!orders_buyer_id_fkey(id, first_name, last_name),
        seller:profiles!orders_seller_id_fkey(id, first_name, last_name)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error, count };
  },

  // Get audit logs
  async getAuditLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error, count };
  },

  // System settings
  async getFeatureFlags() {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name');

    return { data, error };
  },

  async updateFeatureFlag(flagId: string, isEnabled: boolean) {
    const { data, error } = await supabase
      .from('feature_flags')
      .update({ 
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', flagId)
      .select()
      .single();

    return { data, error };
  }
};