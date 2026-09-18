CREATE TABLE public.license_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  device_id text,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.license_codes TO service_role;

ALTER TABLE public.license_codes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.activate_device_license(p_code text, p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lic public.license_codes%ROWTYPE;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 OR p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_input');
  END IF;

  SELECT * INTO lic FROM public.license_codes WHERE code = upper(trim(p_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  IF NOT lic.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive_code');
  END IF;

  IF lic.device_id IS NOT NULL AND lic.device_id <> p_device_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'device_mismatch');
  END IF;

  IF lic.device_id IS NULL THEN
    UPDATE public.license_codes
    SET device_id = p_device_id, activated_at = now()
    WHERE id = lic.id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_device_license(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.activate_device_license(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_device_license(text, text) TO service_role;