import { supabase } from "@/integrations/supabase/client";

export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  thread_id?: string;
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  expires_at?: string;
  delivery_terms?: string;
  notes?: string;
  status: string;
  created_at: string;
  // Joined data
  listing?: {
    id: string;
    title: string;
    seller_id: string;
  };
  buyer?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
}

export const offersService = {
  // Create new offer
  async createOffer(offerData: Omit<Offer, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase.functions.invoke('create-offer', {
      body: offerData
    });
    return { data, error };
  },

  // Get offers for a listing
  async getListingOffers(listingId: string) {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        buyer:profiles!offers_buyer_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get user's offers
  async getUserOffers(userId: string) {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listings(
          id,
          title,
          seller_id
        )
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Update offer status
  async updateOfferStatus(offerId: string, status: string) {
    const { data, error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', offerId)
      .select()
      .single();

    return { data, error };
  },

  // Accept offer and create order
  async acceptOffer(offerId: string, deliveryAddress: any) {
    const { data, error } = await supabase.functions.invoke('accept-offer', {
      body: { offerId, deliveryAddress }
    });
    return { data, error };
  }
};