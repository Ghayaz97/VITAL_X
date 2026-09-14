CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  age INTEGER,
  sex TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en-IN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  language_code TEXT NOT NULL DEFAULT 'en-IN',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  input_mode TEXT NOT NULL DEFAULT 'touch',
  language_code TEXT NOT NULL DEFAULT 'en-IN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  concept_code TEXT,
  value JSONB NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  confidence NUMERIC(5,4),
  temporal_start TIMESTAMPTZ,
  temporal_end TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES clinical_claims(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  evidence_text TEXT NOT NULL,
  page_number INTEGER,
  location_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS safety_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  trigger_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'DETECTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  claim_a_id UUID NOT NULL REFERENCES clinical_claims(id),
  claim_b_id UUID NOT NULL REFERENCES clinical_claims(id),
  conflict_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES clinical_claims(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_session ON clinical_claims(session_id);
CREATE INDEX IF NOT EXISTS idx_claims_category ON clinical_claims(category);
CREATE INDEX IF NOT EXISTS idx_safety_session ON safety_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_session ON conflicts(session_id);
