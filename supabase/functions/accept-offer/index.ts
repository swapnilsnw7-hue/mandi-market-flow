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

    const { offerId, deliveryAddress } = await req.json();

    if (!offerId || !deliveryAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get offer details
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listings(*)
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ error: 'Offer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (offer.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Offer is not pending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fees
    const platformFeePercent = 0.03; // 3%
    const taxPercent = 0.18; // 18% GST
    
    const subtotal = offer.total_amount;
    const platformFee = subtotal * platformFeePercent;
    const taxAmount = subtotal * taxPercent;
    const totalAmount = subtotal + platformFee + taxAmount;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        listing_id: offer.listing_id,
        buyer_id: offer.buyer_id,
        seller_id: offer.listing.seller_id,
        offer_id: offerId,
        quantity: offer.quantity,
        unit_price: offer.price_per_unit,
        subtotal: subtotal,
        platform_fee: platformFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        status: 'pending',
        payment_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update offer status
    await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    // Create notifications
    await Promise.all([
      // Notify buyer
      supabase.from('notifications').insert({
        user_id: offer.buyer_id,
        type: 'order_created',
        title: 'Offer Accepted',
        message: `Your offer for ${offer.listing.title} has been accepted. Order #${order.id} created.`,
        entity_type: 'order',
        entity_id: order.id
      }),
      // Notify seller
      supabase.from('notifications').insert({
        user_id: offer.listing.seller_id,
        type: 'order_created',
        title: 'New Order',
        message: `New order #${order.id} created from accepted offer.`,
        entity_type: 'order',
        entity_id: order.id
      })
    ]);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'order',
      entity_id: order.id,
      action: 'created',
      actor_user_id: offer.listing.seller_id,
      metadata: { 
        offer_id: offerId,
        total_amount: totalAmount
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: order,
        message: 'Order created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in accept-offer function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});