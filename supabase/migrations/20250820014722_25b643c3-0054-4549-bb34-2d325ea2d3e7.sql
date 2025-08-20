-- Fix the search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper functions for RLS policies with proper search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_farmer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'farmer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_trader()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'trader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- RLS Policies for categories table (public read)
CREATE POLICY "Categories are publicly viewable" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- RLS Policies for KYC documents table
CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC documents" ON public.kyc_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all KYC documents" ON public.kyc_documents
  FOR ALL USING (public.is_admin());

-- RLS Policies for listings table
CREATE POLICY "Active listings are publicly viewable" ON public.listings
  FOR SELECT USING (status = 'active' OR auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Farmers can manage their own listings" ON public.listings
  FOR ALL USING (auth.uid() = seller_id AND public.is_farmer());

CREATE POLICY "Farmers can insert listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id AND public.is_farmer());

CREATE POLICY "Admins can manage all listings" ON public.listings
  FOR ALL USING (public.is_admin());

-- RLS Policies for saved searches table
CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for threads table
CREATE POLICY "Users can view threads they participate in" ON public.threads
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Traders can create threads" ON public.threads
  FOR INSERT WITH CHECK (auth.uid() = buyer_id AND public.is_trader());

CREATE POLICY "Participants can update threads" ON public.threads
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their threads" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.threads t 
      WHERE t.id = thread_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    ) OR public.is_admin()
  );

CREATE POLICY "Users can send messages in their threads" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND 
    EXISTS (
      SELECT 1 FROM public.threads t 
      WHERE t.id = thread_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

-- RLS Policies for offers table
CREATE POLICY "Users can view offers for their listings or their own offers" ON public.offers
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Traders can create offers" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id AND public.is_trader());

CREATE POLICY "Buyers can update their own offers" ON public.offers
  FOR UPDATE USING (auth.uid() = buyer_id);

-- RLS Policies for orders table
CREATE POLICY "Users can view orders they are involved in" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Traders can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id AND public.is_trader());

CREATE POLICY "Order participants can update orders" ON public.orders
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin());

-- RLS Policies for escrow payments table
CREATE POLICY "Users can view payments for their orders" ON public.escrow_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ) OR public.is_admin()
  );

CREATE POLICY "System can manage payments" ON public.escrow_payments
  FOR ALL USING (public.is_admin());

-- RLS Policies for shipments table
CREATE POLICY "Users can view shipments for their orders" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ) OR public.is_admin()
  );

CREATE POLICY "Order participants can update shipments" ON public.shipments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ) OR public.is_admin()
  );

CREATE POLICY "System can create shipments" ON public.shipments
  FOR INSERT WITH CHECK (public.is_admin());

-- RLS Policies for reviews table
CREATE POLICY "Reviews are publicly viewable" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their completed orders" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND 
      (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()) AND
      o.status = 'completed'
    )
  );

-- RLS Policies for disputes table
CREATE POLICY "Users can view disputes for their orders" ON public.disputes
  FOR SELECT USING (
    auth.uid() = raised_by_user_id OR
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ) OR public.is_admin()
  );

CREATE POLICY "Users can create disputes for their orders" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = raised_by_user_id AND
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage disputes" ON public.disputes
  FOR ALL USING (public.is_admin());

-- RLS Policies for payouts table
CREATE POLICY "Sellers can view their own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "System can manage payouts" ON public.payouts
  FOR ALL USING (public.is_admin());

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for audit logs table
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for feature flags table
CREATE POLICY "Feature flags are publicly viewable" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (public.is_admin());