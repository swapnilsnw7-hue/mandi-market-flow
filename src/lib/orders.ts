import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_id?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  delivery_address?: any;
  payment_due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  listing?: any;
  buyer?: any;
  seller?: any;
  escrow_payment?: any;
  shipment?: any;
}

export const ordersService = {
  // Get user's orders (as buyer or seller)
  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        listing:listings(id, title, images),
        buyer:profiles!orders_buyer_id_fkey(id, first_name, last_name),
        seller:profiles!orders_seller_id_fkey(id, first_name, last_name),
        escrow_payment:escrow_payments(id, status, amount),
        shipment:shipments(id, status, tracking_id)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get single order
  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!orders_buyer_id_fkey(*),
        seller:profiles!orders_seller_id_fkey(*),
        escrow_payment:escrow_payments(*),
        shipment:shipments(*)
      `)
      .eq('id', orderId)
      .single();

    return { data, error };
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed') {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  // Confirm delivery
  async confirmDelivery(orderId: string) {
    const { data, error } = await supabase.functions.invoke('confirm-delivery', {
      body: { orderId }
    });
    return { data, error };
  },

  // Cancel order
  async cancelOrder(orderId: string, reason: string) {
    const { data, error } = await supabase.functions.invoke('cancel-order', {
      body: { orderId, reason }
    });
    return { data, error };
  }
};