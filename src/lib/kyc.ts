import { supabase } from "@/integrations/supabase/client";

export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export const kycService = {
  // Submit KYC document
  async submitKYCDocument(userId: string, documentType: string, documentUrl: string) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        document_url: documentUrl,
        status: 'pending'
      })
      .select()
      .single();

    return { data, error };
  },

  // Get user's KYC documents
  async getUserKYCDocuments(userId: string) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get KYC document by ID
  async getKYCDocument(documentId: string) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select(`
        *,
        user:profiles!kyc_documents_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', documentId)
      .single();

    return { data, error };
  },

  // Get pending KYC documents (admin)
  async getPendingKYCDocuments() {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select(`
        *,
        user:profiles!kyc_documents_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    return { data, error };
  },

  // Review KYC document (admin)
  async reviewKYCDocument(documentId: string, status: 'approved' | 'rejected', adminNotes?: string, reviewedBy?: string) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    return { data, error };
  },

  // Check user KYC status
  async getUserKYCStatus(userId: string) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('status, document_type')
      .eq('user_id', userId);

    if (error) {
      return { status: 'not_submitted', error };
    }

    const requiredDocs = ['aadhar', 'pan'];
    const approvedDocs = data?.filter(doc => doc.status === 'approved').map(doc => doc.document_type) || [];
    const pendingDocs = data?.filter(doc => doc.status === 'pending').map(doc => doc.document_type) || [];
    const rejectedDocs = data?.filter(doc => doc.status === 'rejected').map(doc => doc.document_type) || [];

    const hasAllRequired = requiredDocs.every(docType => approvedDocs.includes(docType));
    
    let status = 'not_submitted';
    if (hasAllRequired) {
      status = 'approved';
    } else if (pendingDocs.length > 0) {
      status = 'pending';
    } else if (rejectedDocs.length > 0) {
      status = 'rejected';
    }

    return {
      status,
      approved_documents: approvedDocs,
      pending_documents: pendingDocs,
      rejected_documents: rejectedDocs,
      error: null
    };
  }
};