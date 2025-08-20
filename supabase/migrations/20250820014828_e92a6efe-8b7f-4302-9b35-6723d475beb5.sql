-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('listings', 'listings', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('dispute-evidence', 'dispute-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies for listings bucket (public read, authenticated upload)
CREATE POLICY "Listings images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listings' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own listing images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own listing images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for KYC documents bucket (private)
CREATE POLICY "Users can view their own KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own KYC documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND 
    public.is_admin()
  );

-- Storage policies for dispute evidence bucket (private)
CREATE POLICY "Users can view dispute evidence for their disputes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'dispute-evidence' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Users can upload dispute evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dispute-evidence' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for avatars bucket (public read)
CREATE POLICY "Avatar images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;

-- Add trigger to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'farmer');
  
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();