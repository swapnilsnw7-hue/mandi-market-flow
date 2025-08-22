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

    const { orderId, trackingId, carrierName, status, trackingEvent } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details to verify user is seller
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

    if (order.seller_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create shipment
    let { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (shipmentError && shipmentError.code !== 'PGRST116') {
      console.error('Shipment query error:', shipmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to query shipment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (trackingId) updateData.tracking_id = trackingId;
    if (carrierName) updateData.carrier_name = carrierName;
    if (status) updateData.status = status;

    // Handle status-specific updates
    if (status === 'picked_up') {
      updateData.pickup_date = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivery_date = new Date().toISOString();
    }

    if (!shipment) {
      // Create new shipment
      const { data: newShipment, error: createError } = await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          pickup_address: order.delivery_address, // In real app, this would be seller's address
          delivery_address: order.delivery_address,
          ...updateData
        })
        .select()
        .single();

      if (createError) {
        console.error('Shipment creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create shipment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      shipment = newShipment;
    } else {
      // Update existing shipment
      const { data: updatedShipment, error: updateError } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Shipment update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update shipment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      shipment = updatedShipment;
    }

    // Add tracking event if provided
    if (trackingEvent) {
      const currentEvents = shipment.tracking_events || [];
      const newEvent = {
        timestamp: new Date().toISOString(),
        status: trackingEvent.status || status,
        description: trackingEvent.description,
        location: trackingEvent.location
      };

      await supabase
        .from('shipments')
        .update({
          tracking_events: [...currentEvents, newEvent]
        })
        .eq('id', shipment.id);
    }

    // Update order status if shipment status changed
    if (status) {
      let orderStatus = order.status;
      
      if (status === 'picked_up' && order.status === 'confirmed') {
        orderStatus = 'processing';
      } else if (status === 'in_transit' && ['confirmed', 'processing'].includes(order.status)) {
        orderStatus = 'shipped';
      }

      if (orderStatus !== order.status) {
        await supabase
          .from('orders')
          .update({ 
            status: orderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }
    }

    // Send notifications
    const notifications = [];

    if (status === 'picked_up') {
      notifications.push(
        supabase.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'shipment_picked_up',
          title: 'Order Picked Up',
          message: `Your order #${orderId} has been picked up and is on its way.`,
          entity_type: 'order',
          entity_id: orderId
        })
      );
    } else if (status === 'in_transit') {
      notifications.push(
        supabase.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'shipment_in_transit',
          title: 'Order In Transit',
          message: trackingId 
            ? `Your order #${orderId} is in transit. Tracking ID: ${trackingId}`
            : `Your order #${orderId} is in transit.`,
          entity_type: 'order',
          entity_id: orderId
        })
      );
    } else if (status === 'out_for_delivery') {
      notifications.push(
        supabase.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'shipment_out_for_delivery',
          title: 'Out for Delivery',
          message: `Your order #${orderId} is out for delivery and will arrive soon.`,
          entity_type: 'order',
          entity_id: orderId
        })
      );
    }

    await Promise.all(notifications);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      entity_type: 'shipment',
      entity_id: shipment.id,
      action: 'updated',
      actor_user_id: user.id,
      metadata: { 
        order_id: orderId,
        status: status,
        tracking_id: trackingId
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        shipment: shipment,
        message: 'Shipment updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-shipment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});