-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enums
CREATE TYPE public.user_role AS ENUM ('farmer', 'trader', 'admin');
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'sold', 'expired', 'removed');
CREATE TYPE public.pricing_type AS ENUM ('fixed', 'auction', 'negotiable');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'captured', 'released', 'refunded', 'failed');
CREATE TYPE public.dispute_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
CREATE TYPE public.shipment_status AS ENUM ('pending', 'picked_up', 'in_transit', 'delivered');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'farmer',
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  firm_name TEXT,
  gstin TEXT,
  pan TEXT,
  aadhar_last4 TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  district TEXT,
  pincode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create KYC documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status kyc_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  grade TEXT,
  moisture_percentage DECIMAL(5, 2),
  variety TEXT,
  harvest_date DATE,
  quantity_available DECIMAL(12, 3) NOT NULL,
  unit TEXT NOT NULL,
  min_order_quantity DECIMAL(12, 3) NOT NULL,
  price_per_unit DECIMAL(12, 2) NOT NULL,
  pricing_type pricing_type NOT NULL DEFAULT 'fixed',
  is_organic BOOLEAN DEFAULT false,
  state TEXT,
  district TEXT,
  pincode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT[] DEFAULT '{}',
  status listing_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create saved searches table
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_params JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create threads table for messaging
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  subject TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id),
  message_text TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  thread_id UUID REFERENCES public.threads(id),
  quantity DECIMAL(12, 3) NOT NULL,
  price_per_unit DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  delivery_terms TEXT,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  offer_id UUID REFERENCES public.offers(id),
  quantity DECIMAL(12, 3) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_due_date TIMESTAMPTZ,
  delivery_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create escrow payments table
CREATE TABLE public.escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  payment_provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  captured_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refund_amount DECIMAL(12, 2) DEFAULT 0,
  provider_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  carrier_name TEXT,
  tracking_id TEXT,
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  status shipment_status NOT NULL DEFAULT 'pending',
  pickup_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  tracking_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  from_user_id UUID NOT NULL REFERENCES public.users(id),
  to_user_id UUID NOT NULL REFERENCES public.users(id),
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_quality INTEGER CHECK (rating_quality >= 1 AND rating_quality <= 5),
  rating_timeliness INTEGER CHECK (rating_timeliness >= 1 AND rating_timeliness <= 5),
  rating_packaging INTEGER CHECK (rating_packaging >= 1 AND rating_packaging <= 5),
  review_text TEXT,
  images TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, from_user_id)
);

-- Create disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  raised_by_user_id UUID NOT NULL REFERENCES public.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status dispute_status NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolution_data JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  order_id UUID REFERENCES public.orders(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  provider_reference TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  channels TEXT[] DEFAULT '{"in_app"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feature flags table
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  audience_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_category_id ON public.listings(category_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_location ON public.listings(state, district, pincode);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_listings_search ON public.listings USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Insert default categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
('Cereals & Grains', 'cereals-grains', 'Rice, wheat, maize, barley, millet and other grains', 1),
('Pulses & Legumes', 'pulses-legumes', 'Lentils, chickpeas, kidney beans, black gram, green gram', 2),
('Oilseeds', 'oilseeds', 'Groundnut, mustard, sesame, sunflower, soybean', 3),
('Spices & Condiments', 'spices-condiments', 'Turmeric, chili, coriander, cumin, cardamom', 4),
('Fruits', 'fruits', 'Fresh and dried fruits', 5),
('Vegetables', 'vegetables', 'Fresh vegetables and leafy greens', 6),
('Dairy Products', 'dairy', 'Milk, cheese, butter, ghee', 7),
('Poultry & Meat', 'poultry-meat', 'Chicken, eggs, mutton, fish', 8),
('Fibers', 'fibers', 'Cotton, jute, silk, wool', 9),
('Fodder & Feed', 'fodder-feed', 'Animal feed and fodder crops', 10),
('Nuts & Dry Fruits', 'nuts-dry-fruits', 'Almonds, cashews, raisins, dates', 11),
('Others', 'others', 'Other agricultural products', 12);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();