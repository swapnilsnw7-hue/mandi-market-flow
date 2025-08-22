import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  channels?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, type, title, message, entityType, entityId, channels = ['in_app'] }: NotificationRequest = await req.json();

    if (!userId || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        entity_type: entityType,
        entity_id: entityId,
        channels: channels
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different notification channels
    const promises = [];

    // Email notifications (if email channel is specified)
    if (channels.includes('email')) {
      // Get user email
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (user?.email) {
        // In a real implementation, you would send email here
        // For now, we'll just log it
        console.log(`Would send email to ${user.email}: ${title} - ${message}`);
      }
    }

    // SMS notifications (if sms channel is specified)
    if (channels.includes('sms')) {
      // Get user phone
      const { data: user } = await supabase
        .from('users')
        .select('phone')
        .eq('id', userId)
        .single();

      if (user?.phone) {
        // In a real implementation, you would send SMS here
        console.log(`Would send SMS to ${user.phone}: ${title} - ${message}`);
      }
    }

    // Push notifications (if push channel is specified)
    if (channels.includes('push')) {
      // In a real implementation, you would send push notification here
      console.log(`Would send push notification: ${title} - ${message}`);
    }

    await Promise.all(promises);

    return new Response(
      JSON.stringify({ 
        success: true,
        notification: notification,
        message: 'Notification sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});