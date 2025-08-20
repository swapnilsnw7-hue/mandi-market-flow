import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRequest {
  pickupAddress: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    pincode: string;
  };
  deliveryAddress: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    pincode: string;
  };
  weight: number; // in kg
  quantity: number;
  unit: string;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pickupAddress, deliveryAddress, weight, quantity, unit }: ShippingRequest = await req.json();

    // Calculate distance
    const distance = calculateDistance(
      pickupAddress.latitude,
      pickupAddress.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude
    );

    // Base rates (mock data)
    const baseRate = 50; // Base cost in INR
    const perKmRate = 8; // Cost per kilometer in INR
    const perKgRate = 5; // Additional cost per kg
    const fuelSurcharge = 0.15; // 15% fuel surcharge

    // Calculate total weight (approximate)
    let totalWeight = weight;
    if (unit === 'quintal') {
      totalWeight = quantity * 100; // 1 quintal = 100 kg
    } else if (unit === 'tonne') {
      totalWeight = quantity * 1000; // 1 tonne = 1000 kg
    } else {
      totalWeight = quantity; // assuming kg
    }

    // Calculate cost
    const distanceCost = distance * perKmRate;
    const weightCost = totalWeight * perKgRate;
    const subtotal = baseRate + distanceCost + weightCost;
    const fuelSurchargeAmount = subtotal * fuelSurcharge;
    const totalCost = Math.round(subtotal + fuelSurchargeAmount);

    // Estimate delivery time (mock)
    let estimatedDays = 1;
    if (distance > 500) estimatedDays = 3;
    else if (distance > 200) estimatedDays = 2;

    // Check if inter-state
    const isInterState = pickupAddress.state !== deliveryAddress.state;

    const response = {
      success: true,
      data: {
        distance: Math.round(distance),
        estimatedCost: totalCost,
        breakdown: {
          baseRate,
          distanceCost: Math.round(distanceCost),
          weightCost: Math.round(weightCost),
          fuelSurcharge: Math.round(fuelSurchargeAmount),
          total: totalCost
        },
        estimatedDeliveryDays: estimatedDays,
        isInterState,
        carrierOptions: [
          {
            name: "AgriTrans Express",
            cost: totalCost,
            deliveryDays: estimatedDays,
            features: ["Real-time tracking", "Insurance covered", "Temperature controlled"]
          },
          {
            name: "FarmLink Logistics",
            cost: Math.round(totalCost * 0.9),
            deliveryDays: estimatedDays + 1,
            features: ["Budget friendly", "Bulk handling", "Basic tracking"]
          }
        ]
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to calculate shipping cost'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});