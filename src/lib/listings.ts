import { supabase } from "@/integrations/supabase/client";

export interface Listing {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description?: string;
  grade?: string;
  moisture_percentage?: number;
  variety?: string;
  harvest_date?: string;
  quantity_available: number;
  unit: string;
  min_order_quantity: number;
  price_per_unit: number;
  pricing_type: 'fixed' | 'auction' | 'negotiable';
  is_organic: boolean;
  state?: string;
  district?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  status: 'draft' | 'active' | 'sold' | 'expired' | 'removed';
  featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    first_name?: string;
    last_name?: string;
    firm_name?: string;
  };
}

export interface ListingFilters {
  category?: string;
  search?: string;
  state?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  grade?: string;
  minQuantity?: number;
  maxQuantity?: number;
  pricingType?: 'fixed' | 'auction' | 'negotiable';
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'nearest' | 'relevance';
  page?: number;
  limit?: number;
}

export const listingsService = {
  // Get listings with filters
  async getListings(filters: ListingFilters = {}) {
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles!listings_seller_id_fkey(
          id,
          first_name,
          last_name,
          firm_name
        )
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters.category) {
      query = query.eq('category.slug', filters.category);
    }

    if (filters.search) {
      query = query.textSearch('title', filters.search);
    }

    if (filters.state) {
      query = query.eq('state', filters.state);
    }

    if (filters.district) {
      query = query.eq('district', filters.district);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price_per_unit', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price_per_unit', filters.maxPrice);
    }

    if (filters.isOrganic !== undefined) {
      query = query.eq('is_organic', filters.isOrganic);
    }

    if (filters.grade) {
      query = query.eq('grade', filters.grade);
    }

    if (filters.minQuantity !== undefined) {
      query = query.gte('quantity_available', filters.minQuantity);
    }

    if (filters.maxQuantity !== undefined) {
      query = query.lte('quantity_available', filters.maxQuantity);
    }

    if (filters.pricingType) {
      query = query.eq('pricing_type', filters.pricingType);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price_per_unit', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price_per_unit', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    return { data, error, count };
  },

  // Get single listing by ID
  async getListing(id: string) {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name, slug),
        seller:profiles!listings_seller_id_fkey(
          id,
          first_name,
          last_name,
          firm_name,
          city,
          state
        )
      `)
      .eq('id', id)
      .single();

    // Increment view count
    if (data && !error) {
      await supabase
        .from('listings')
        .update({ views_count: data.views_count + 1 })
        .eq('id', id);
    }

    return { data, error };
  },

  // Create new listing
  async createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'featured'>) {
    const { data, error } = await supabase
      .from('listings')
      .insert(listing)
      .select()
      .single();

    return { data, error };
  },

  // Update listing
  async updateListing(id: string, updates: Partial<Listing>) {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Delete listing
  async deleteListing(id: string) {
    const { data, error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    return { data, error };
  },

  // Get user's listings
  async getUserListings(userId: string) {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    return { data, error };
  },

  // Upload listing image
  async uploadImage(file: File, listingId: string): Promise<{ url: string | null; error: any }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${listingId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('listings')
      .upload(fileName, file);

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  },

  // Delete image
  async deleteImage(imagePath: string) {
    const { data, error } = await supabase.storage
      .from('listings')
      .remove([imagePath]);

    return { data, error };
  }
};