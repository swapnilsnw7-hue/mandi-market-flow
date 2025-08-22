import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string | null;
  error: any;
  path?: string;
}

export const fileUploadService = {
  // Upload listing image
  async uploadListingImage(file: File, listingId: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${listingId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('listings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null, path: fileName };
  },

  // Upload avatar
  async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null, path: fileName };
  },

  // Upload KYC document
  async uploadKYCDocument(file: File, userId: string, documentType: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null, path: fileName };
  },

  // Upload dispute evidence
  async uploadDisputeEvidence(file: File, disputeId: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${disputeId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('dispute-evidence')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { url: null, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dispute-evidence')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null, path: fileName };
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    return { data, error };
  },

  // Get file URL
  getFileUrl(bucket: string, path: string) {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }
};