import { supabase } from "@/integrations/supabase/client";

export interface Dispute {
  id: string;
  order_id: string;
  raised_by_user_id: string;
  reason: string;
  description?: string;
  evidence_urls: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_data?: any;
  resolved_by?: string;
  resolved_at?: string;
  admin_notes?: string;
  created_at: string;
  // Joined data
  order?: any;
  raised_by?: any;
}

export const disputesService = {
  // Create dispute
  async createDispute(disputeData: Omit<Dispute, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('disputes')
      .insert({
        ...disputeData,
        status: 'open'
      })
      .select(`
        *,
        order:orders(
          id,
          listing_id,
          buyer_id,
          seller_id,
          total_amount
        ),
        raised_by:profiles!disputes_raised_by_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .single();

    return { data, error };
  },

  // Get user's disputes
  async getUserDisputes(userId: string) {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(
          id,
          listing_id,
          total_amount,
          buyer_id,
          seller_id
        )
      `)
      .or(`raised_by_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get all disputes (admin)
  async getAllDisputes() {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(
          id,
          listing_id,
          total_amount,
          buyer_id,
          seller_id
        ),
        raised_by:profiles!disputes_raised_by_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get single dispute
  async getDispute(disputeId: string) {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(
          *,
          listing:listings(id, title),
          buyer:profiles!orders_buyer_id_fkey(id, first_name, last_name),
          seller:profiles!orders_seller_id_fkey(id, first_name, last_name)
        ),
        raised_by:profiles!disputes_raised_by_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', disputeId)
      .single();

    return { data, error };
  },

  // Update dispute status (admin)
  async updateDisputeStatus(disputeId: string, status: string, adminNotes?: string, resolutionData?: any, resolvedBy?: string) {
    const updateData: any = {
      status,
      admin_notes: adminNotes
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = resolvedBy;
      updateData.resolution_data = resolutionData;
    }

    const { data, error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', disputeId)
      .select()
      .single();

    return { data, error };
  },

  // Add evidence to dispute
  async addEvidence(disputeId: string, evidenceUrls: string[]) {
    // Get current evidence
    const { data: dispute } = await supabase
      .from('disputes')
      .select('evidence_urls')
      .eq('id', disputeId)
      .single();

    if (!dispute) {
      return { data: null, error: 'Dispute not found' };
    }

    const updatedEvidence = [...dispute.evidence_urls, ...evidenceUrls];

    const { data, error } = await supabase
      .from('disputes')
      .update({ evidence_urls: updatedEvidence })
      .eq('id', disputeId)
      .select()
      .single();

    return { data, error };
  }
};