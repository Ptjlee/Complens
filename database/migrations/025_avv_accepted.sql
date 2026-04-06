-- Migration 025: Add AVV acceptance tracking to organisations
-- Required for GDPR Art. 28 compliance — organisations must accept the
-- Auftragsverarbeitungsvertrag (AVV) before uploading employee salary data.

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS avv_accepted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN organisations.avv_accepted_at IS 'Timestamp when the organisation accepted the AVV (Art. 28 DSGVO). NULL = not yet accepted.';
