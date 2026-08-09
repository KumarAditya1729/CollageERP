-- Fix: Stop auto-assigning new users to the demo tenant so the SaaS onboarding wizard triggers.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Removed the auto-assignment to demo_tenant and admin role
  -- so that the SaaS Onboarding Wizard can take over on first login.
  
  RETURN NEW;
END;
$$;
