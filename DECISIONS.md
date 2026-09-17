# VITAL-X Architectural Decisions

## DATE: 2026-09-17
### DECISION: Preserve Immutable Claim History Upon Practitioner Rejection
- **Reason**: Clinical safety and auditability require that rejecting a claim does not delete original evidence or automatically verify counter-claims.
- **Alternatives Considered**: Auto-verifying the remaining claim.
- **Impact**: Full compliance with the VITAL-X Truth Engine invariant.

## DATE: 2026-09-17
### DECISION: Role Selection Landing Entry
- **Reason**: Patients onboarding at a hospital kiosk should never encounter a practitioner login form at Step 5.
- **Alternatives Considered**: Global header role switch only.
- **Impact**: Clear role entry where patients enter intake directly and doctors log in to the workstation.

## DATE: 2026-09-17
### DECISION: Horizontal Chronological Timeline Story
- **Reason**: Clinical history is a temporal story across time, not a grid of 4 static cards.
- **Alternatives Considered**: 4 equal dashboard cards.
- **Impact**: Clinical Truth Timeline acts as the hero visual centerpiece.
