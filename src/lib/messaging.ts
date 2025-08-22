import { supabase } from "@/integrations/supabase/client";

export interface Thread {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id?: string;
  subject?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  buyer?: any;
  seller?: any;
  listing?: any;
  latest_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  thread_id: string;
  from_user_id: string;
  message_text: string;
  attachments: string[];
  is_read: boolean;
  created_at: string;
  // Joined data
  from_user?: any;
}

export const messagingService = {
  // Get user's threads
  async getUserThreads(userId: string) {
    const { data, error } = await supabase
      .from('threads')
      .select(`
        *,
        buyer:profiles!threads_buyer_id_fkey(id, first_name, last_name),
        seller:profiles!threads_seller_id_fkey(id, first_name, last_name),
        listing:listings(id, title)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    return { data, error };
  },

  // Create or get thread
  async createThread(buyerId: string, sellerId: string, listingId?: string, subject?: string) {
    // First check if thread already exists
    let query = supabase
      .from('threads')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId);
    
    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data: existingThread } = await query.single();
    
    if (existingThread) {
      return { data: existingThread, error: null };
    }

    // Create new thread
    const { data, error } = await supabase
      .from('threads')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_id: listingId,
        subject: subject
      })
      .select()
      .single();

    return { data, error };
  },

  // Get thread messages
  async getThreadMessages(threadId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        from_user:profiles!messages_from_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  // Send message
  async sendMessage(threadId: string, fromUserId: string, messageText: string, attachments: string[] = []) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        from_user_id: fromUserId,
        message_text: messageText,
        attachments: attachments
      })
      .select()
      .single();

    // Update thread timestamp
    if (!error) {
      await supabase
        .from('threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);
    }

    return { data, error };
  },

  // Mark messages as read
  async markMessagesRead(threadId: string, userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('thread_id', threadId)
      .neq('from_user_id', userId);

    return { data, error };
  }
};