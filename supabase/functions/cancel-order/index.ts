import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, reason } = await req.json();

    if (!orderId || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user can cancel (buyer or seller)
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: 'Order cannot be cancelled at this stage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        notes: `Cancelled by ${user.id === order.buyer_id ? 'buyer' : 'seller'}: ${reason}`
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle refund if payment was captured
    const { data: payment } = await supabase
      .from('escrow_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (payment && payment.status === 'captured') {
      // Update payment to refunded
      await supabase
        .from('escrow_payments')
        .update({ 
          status: 'refunded',
          refund_amount: payment.amount
        })
        .eq('id', payment.id);
    }

    // Cancel any pending shipments
    await supabase
      .from('shipments')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId)
      .eq('status', 'pending');

    // Create notifications
    const otherUserId = user.id === order.buyer_id ? order.seller_id : order.buyer_id;
    const cancelledByRole = user.id === order.buyer_id ? 'buyer' : 'seller';

    await Promise.all([
      // Notify other party
      supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Order #${orderId} has been cancelled by ${cancelledByRole}. Reason: ${reason}`,
        entity_type: 'order',
        entity_id: orderId
      }),
      // Notify cancelling user
      supabase.from('notifications').insert({
        user_id: user.id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `You have successfully cancelled order #${orderId}.`,
        entity_type: 'order',
        entity_id: orderId
      })
    ]);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'order',
      entity_id: orderId,
      action: 'cancelled',
      actor_user_id: user.id,
      metadata: { 
        reason: reason,
        cancelled_by: cancelledByRole,
        original_status: order.status
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Order cancelled successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cancel-order function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});