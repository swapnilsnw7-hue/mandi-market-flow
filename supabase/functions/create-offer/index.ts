import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OfferRequest {
  listingId: string;
  quantity: number;
  pricePerUnit: number;
  deliveryTerms?: string;
  notes?: string;
  expiresInDays?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('Authentication required');
    }

    // Get user role to ensure they're a trader
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'trader') {
      throw new Error('Only traders can create offers');
    }

    const { 
      listingId, 
      quantity, 
      pricePerUnit, 
      deliveryTerms, 
      notes, 
      expiresInDays = 7 
    }: OfferRequest = await req.json();

    // Validate the listing exists and is active
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found or not active');
    }

    // Check if quantity is available and meets minimum order
    if (quantity > listing.quantity_available) {
      throw new Error('Requested quantity exceeds available stock');
    }

    if (quantity < listing.min_order_quantity) {
      throw new Error(`Minimum order quantity is ${listing.min_order_quantity} ${listing.unit}`);
    }

    // Check if user is trying to make offer on their own listing
    if (listing.seller_id === user.id) {
      throw new Error('Cannot make offer on your own listing');
    }

    // Create or get existing thread between buyer and seller
    let { data: thread, error: threadError } = await supabaseClient
      .from('threads')
      .select('*')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.seller_id)
      .single();

    if (threadError && threadError.code === 'PGRST116') {
      // Thread doesn't exist, create one
      const { data: newThread, error: createThreadError } = await supabaseClient
        .from('threads')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          subject: `Offer for ${listing.title}`
        })
        .select()
        .single();

      if (createThreadError) {
        throw new Error('Failed to create conversation thread');
      }
      thread = newThread;
    } else if (threadError) {
      throw new Error('Failed to get conversation thread');
    }

    // Calculate total amount
    const totalAmount = quantity * pricePerUnit;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create the offer
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        thread_id: thread.id,
        quantity,
        price_per_unit: pricePerUnit,
        total_amount: totalAmount,
        delivery_terms: deliveryTerms,
        notes,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (offerError) {
      console.error('Offer creation error:', offerError);
      throw new Error('Failed to create offer');
    }

    // Create a message in the thread about the offer
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        thread_id: thread.id,
        from_user_id: user.id,
        message_text: `New offer: ${quantity} ${listing.unit} at ₹${pricePerUnit}/${listing.unit}. Total: ₹${totalAmount}${notes ? `\n\nNotes: ${notes}` : ''}`,
      });

    if (messageError) {
      console.warn('Failed to create message:', messageError);
    }

    // Create notification for seller
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: listing.seller_id,
        title: 'New Offer Received',
        message: `You received an offer of ₹${pricePerUnit}/${listing.unit} for ${quantity} ${listing.unit} of ${listing.title}`,
        type: 'offer_received',
        entity_type: 'offer',
        entity_id: offer.id
      });

    if (notificationError) {
      console.warn('Failed to create notification:', notificationError);
    }

    // Log audit trail
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        actor_user_id: user.id,
        action: 'offer_created',
        entity_type: 'offer',
        entity_id: offer.id,
        new_values: offer
      });

    if (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        offer,
        thread: thread
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating offer:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create offer'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});