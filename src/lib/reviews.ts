import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  order_id: string;
  from_user_id: string;
  to_user_id: string;
  rating_overall: number;
  rating_quality?: number;
  rating_timeliness?: number;
  rating_packaging?: number;
  review_text?: string;
  images: string[];
  is_anonymous: boolean;
  created_at: string;
  // Joined data
  from_user?: any;
  to_user?: any;
  order?: any;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    [key: number]: number;
  };
}

export const reviewsService = {
  // Create review
  async createReview(reviewData: Omit<Review, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select(`
        *,
        from_user:profiles!reviews_from_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        to_user:profiles!reviews_to_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .single();

    return { data, error };
  },

  // Get user reviews (received)
  async getUserReviews(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        from_user:profiles!reviews_from_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        order:orders(id, listing_id)
      `)
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Get order review
  async getOrderReview(orderId: string, fromUserId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', orderId)
      .eq('from_user_id', fromUserId)
      .single();

    return { data, error };
  },

  // Get user review stats
  async getUserReviewStats(userId: string): Promise<{ data: ReviewStats | null; error: any }> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating_overall')
      .eq('to_user_id', userId);

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return {
        data: {
          average_rating: 0,
          total_reviews: 0,
          rating_breakdown: {}
        },
        error: null
      };
    }

    const total_reviews = data.length;
    const average_rating = data.reduce((sum, review) => sum + review.rating_overall, 0) / total_reviews;
    
    const rating_breakdown: { [key: number]: number } = {};
    data.forEach(review => {
      const rating = review.rating_overall;
      rating_breakdown[rating] = (rating_breakdown[rating] || 0) + 1;
    });

    return {
      data: {
        average_rating: Math.round(average_rating * 10) / 10,
        total_reviews,
        rating_breakdown
      },
      error: null
    };
  },

  // Check if user can review order
  async canReviewOrder(orderId: string, fromUserId: string) {
    // Check if order is completed and user hasn't reviewed yet
    const { data: order } = await supabase
      .from('orders')
      .select('status, buyer_id, seller_id')
      .eq('id', orderId)
      .single();

    if (!order || order.status !== 'completed') {
      return { canReview: false, reason: 'Order not completed' };
    }

    if (order.buyer_id !== fromUserId && order.seller_id !== fromUserId) {
      return { canReview: false, reason: 'Not authorized' };
    }

    const { data: existingReview } = await this.getOrderReview(orderId, fromUserId);
    
    if (existingReview) {
      return { canReview: false, reason: 'Already reviewed' };
    }

    return { canReview: true, reason: null };
  }
};