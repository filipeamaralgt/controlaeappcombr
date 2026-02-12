CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    SUBSTRING(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' '))
      ),
      1, 100
    )
  );
  RETURN NEW;
END;
$function$;