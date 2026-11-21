BEGIN;
CREATE TABLE nis_alert_definitions (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  symbol text NOT NULL CHECK (symbol ~ '^\^?[A-Z0-9][A-Z0-9.=-]{0,19}$'),
  kind text NOT NULL CHECK (kind IN ('price_above','price_below','rsi_above','rsi_below','golden_cross','death_cross')),
  threshold double precision,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  armed_at timestamptz,
  next_check_at timestamptz NOT NULL DEFAULT now(),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (owner_id, id),
  CHECK (
    (kind IN ('golden_cross','death_cross') AND threshold IS NULL)
    OR (kind IN ('price_above','price_below') AND threshold IS NOT NULL AND threshold > 0 AND threshold < 'Infinity'::double precision)
    OR (kind IN ('rsi_above','rsi_below') AND threshold IS NOT NULL AND threshold BETWEEN 0 AND 100)
  )
);
CREATE INDEX nis_alert_definitions_due ON nis_alert_definitions (next_check_at, id) WHERE enabled;

CREATE TABLE nis_alert_checks (
  owner_id uuid NOT NULL,
  alert_id uuid NOT NULL,
  checked_at timestamptz NOT NULL,
  observation text,
  condition_met boolean,
  error_code text,
  PRIMARY KEY (alert_id, checked_at),
  FOREIGN KEY (owner_id, alert_id) REFERENCES nis_alert_definitions (owner_id, id) ON DELETE CASCADE
);

CREATE TABLE nis_alert_events (
  owner_id uuid NOT NULL,
  alert_id uuid NOT NULL,
  event_key text NOT NULL,
  payload jsonb NOT NULL,
  delivery text NOT NULL DEFAULT 'pending' CHECK (delivery IN ('pending','processing','delivered','failed','disabled')),
  attempts smallint NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  PRIMARY KEY (alert_id, event_key),
  UNIQUE (owner_id, alert_id, event_key),
  FOREIGN KEY (owner_id, alert_id) REFERENCES nis_alert_definitions (owner_id, id) ON DELETE CASCADE
);
CREATE INDEX nis_alert_events_due ON nis_alert_events (next_attempt_at, lease_until) WHERE delivery IN ('pending','processing');

CREATE TABLE nis_alert_inbox (
  owner_id uuid NOT NULL,
  alert_id uuid NOT NULL,
  event_key text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, alert_id, event_key),
  FOREIGN KEY (owner_id, alert_id, event_key) REFERENCES nis_alert_events (owner_id, alert_id, event_key) ON DELETE CASCADE
);

REVOKE ALL ON nis_alert_definitions, nis_alert_checks, nis_alert_events, nis_alert_inbox FROM PUBLIC;
ALTER TABLE nis_alert_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis_alert_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis_alert_inbox ENABLE ROW LEVEL SECURITY;
COMMIT;
