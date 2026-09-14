# VITAL-X API v0.1

## Session
- POST `/api/v1/sessions`
- GET `/api/v1/sessions/{session_id}`
- POST `/api/v1/sessions/{session_id}/consents`

## Patient
- POST `/api/v1/sessions/{session_id}/patient`

## Interview
- POST `/api/v1/sessions/{session_id}/answers`
- GET `/api/v1/sessions/{session_id}/state`

## Doctor
- GET `/api/v1/doctor/queue`
- GET `/api/v1/doctor/cases/{session_id}`

## Later modules
- documents
- conflicts
- verification
- summary
- FHIR
