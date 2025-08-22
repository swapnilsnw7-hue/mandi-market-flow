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

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
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

    // Check if user is buyer
    if (order.buyer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'shipped') {
      return new Response(
        JSON.stringify({ error: 'Order must be shipped to confirm delivery' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update shipment status
    await supabase
      .from('shipments')
      .update({ 
        status: 'delivered',
        delivery_date: new Date().toISOString()
      })
      .eq('order_id', orderId);

    // Release escrow payment
    const { data: payment } = await supabase
      .from('escrow_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (payment && payment.status === 'captured') {
      // Create payout record
      await supabase.from('payouts').insert({
        seller_id: order.seller_id,
        order_id: orderId,
        amount: order.total_amount - order.platform_fee - order.tax_amount,
        status: 'pending'
      });

      // Update payment status
      await supabase
        .from('escrow_payments')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', payment.id);
    }

    // Create notifications
    await Promise.all([
      // Notify seller
      supabase.from('notifications').insert({
        user_id: order.seller_id,
        type: 'delivery_confirmed',
        title: 'Delivery Confirmed',
        message: `Order #${orderId} has been delivered and confirmed by buyer.`,
        entity_type: 'order',
        entity_id: orderId
      }),
      // Notify buyer
      supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'order_completed',
        title: 'Order Completed',
        message: `Order #${orderId} has been completed. You can now leave a review.`,
        entity_type: 'order',
        entity_id: orderId
      })
    ]);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'order',
      entity_id: orderId,
      action: 'delivery_confirmed',
      actor_user_id: user.id,
      metadata: { 
        confirmed_at: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Delivery confirmed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in confirm-delivery function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});