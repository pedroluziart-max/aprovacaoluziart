-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unique_link TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create images table
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  reference TEXT,
  observation TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('batch-images', 'batch-images', true);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients (admin only)
CREATE POLICY "Admins can manage clients"
  ON public.clients
  FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for batches (admin can manage, public can read via unique link)
CREATE POLICY "Admins can manage batches"
  ON public.batches
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view batches via unique link"
  ON public.batches
  FOR SELECT
  USING (true);

-- RLS Policies for images (admin can manage, public can view and update via batch)
CREATE POLICY "Admins can manage images"
  ON public.images
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view images"
  ON public.images
  FOR SELECT
  USING (true);

CREATE POLICY "Public can update images"
  ON public.images
  FOR UPDATE
  USING (true);

-- Storage policies for batch-images bucket
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'batch-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'batch-images');

-- Create function to generate unique links
CREATE OR REPLACE FUNCTION generate_unique_link()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;