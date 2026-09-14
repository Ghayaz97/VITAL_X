# VITAL-X build order

1. Foundation — repo, Docker, API, database
2. Core vertical slice — session → patient → answer → claim → doctor
3. Adaptive interview engine
4. Document OCR + extraction
5. Evidence + reconciliation + timeline
6. Safety rules
7. AYUSH assessment
8. Voice + multilingual interaction
9. FHIR/ABDM integration boundary
10. Security + failure testing + judge simulation

No feature is done until it has input, output, API, DB behavior, failure handling and tests.
