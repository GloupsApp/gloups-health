-- Application-owned integrity rules; the generated SDK schema is left untouched.
CREATE UNIQUE INDEX account_provider_subject_unique ON account (provider_id, account_id);
--> statement-breakpoint
CREATE FUNCTION gloups_check_fingerprint(value text) RETURNS void
LANGUAGE plpgsql VOLATILE AS $$
BEGIN
  IF value IS NULL OR length(value) <> 64 THEN
    RAISE EXCEPTION 'Identity write proof missing' USING ERRCODE = '23514';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(value, 0));
  IF EXISTS (SELECT 1 FROM identity_tombstone WHERE fingerprint = value AND (expires_at IS NULL OR expires_at > clock_timestamp())) THEN
    RAISE EXCEPTION 'Identity is reserved for deletion' USING ERRCODE = '23514';
  END IF;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION gloups_guard_auth_write() RETURNS trigger
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  setup_phase text;
  setup_created timestamp with time zone;
BEGIN
  IF TG_TABLE_NAME = 'user' THEN
    PERFORM gloups_check_fingerprint(NEW.email_fingerprint);
    IF NEW.provider_fingerprint IS NOT NULL THEN
      PERFORM gloups_check_fingerprint(NEW.provider_fingerprint);
    END IF;
  ELSE
    PERFORM gloups_check_fingerprint(NEW.identity_fingerprint);
    IF TG_TABLE_NAME = 'account' THEN
      PERFORM gloups_check_fingerprint(NEW.subject_fingerprint);
    END IF;
  END IF;
  IF NEW.native_setup_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.native_setup_id IS DISTINCT FROM OLD.native_setup_id) THEN
    SELECT phase, created_at INTO setup_phase, setup_created FROM provider_credential WHERE id = NEW.native_setup_id FOR SHARE;
    IF setup_phase IS DISTINCT FROM 'prepared' OR setup_created < clock_timestamp() - interval '300 seconds' THEN
      RAISE EXCEPTION 'Apple setup proof expired' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER gloups_guard_user BEFORE INSERT OR UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION gloups_guard_auth_write();
--> statement-breakpoint
CREATE TRIGGER gloups_guard_account BEFORE INSERT OR UPDATE ON account FOR EACH ROW EXECUTE FUNCTION gloups_guard_auth_write();
--> statement-breakpoint
CREATE TRIGGER gloups_guard_session BEFORE INSERT OR UPDATE ON session FOR EACH ROW EXECUTE FUNCTION gloups_guard_auth_write();
