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

    const { orderId, paymentMethod, paymentData } = await req.json();

    if (!orderId || !paymentMethod) {
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

    // Check if user is buyer
    if (order.buyer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Order is not pending payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate payment processing
    // In a real implementation, this would integrate with Razorpay, Stripe, etc.
    let paymentStatus = 'captured';
    let providerPaymentId = `pay_${Date.now()}`;
    
    // Simulate payment failure for testing (5% chance)
    if (Math.random() < 0.05) {
      paymentStatus = 'failed';
    }

    // Create escrow payment record
    const { data: payment, error: paymentError } = await supabase
      .from('escrow_payments')
      .insert({
        order_id: orderId,
        amount: order.total_amount,
        currency: 'INR',
        payment_provider: paymentMethod,
        provider_payment_id: providerPaymentId,
        provider_data: paymentData,
        status: paymentStatus,
        captured_at: paymentStatus === 'captured' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to process payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (paymentStatus === 'captured') {
      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Create notifications
      await Promise.all([
        // Notify seller
        supabase.from('notifications').insert({
          user_id: order.seller_id,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment received for order #${orderId}. Please prepare for shipment.`,
          entity_type: 'order',
          entity_id: orderId
        }),
        // Notify buyer
        supabase.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'payment_confirmed',
          title: 'Payment Confirmed',
          message: `Your payment for order #${orderId} has been confirmed.`,
          entity_type: 'order',
          entity_id: orderId
        })
      ]);

      // Log audit trail
      await supabase.from('audit_logs').insert({
        entity_type: 'payment',
        entity_id: payment.id,
        action: 'captured',
        actor_user_id: user.id,
        metadata: { 
          order_id: orderId,
          amount: order.total_amount,
          payment_method: paymentMethod
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          payment: payment,
          message: 'Payment processed successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Payment failed
      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Payment for order #${orderId} failed. Please try again.`,
        entity_type: 'order',
        entity_id: orderId
      });

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Payment processing failed',
          payment: payment
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in process-payment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});