// VITAL-X i18n types
export type Locale = 'en-IN' | 'hi-IN' | 'kn-IN';
export interface TranslationKeys {
  appName: string; tagline: string; demoLabel: string; patientKiosk: string; practitionerWorkstation: string; resetSession: string;
  step01Label: string; step02Label: string; step03Label: string; step04Label: string; step05Label: string;
  identifyTitle: string; identifySubtitle: string; selectLanguage: string; languageKannada: string; languageHindi: string; languageEnglish: string;
  hasAbhaCard: string; noAbhaCard: string; scanAbhaTitle: string; abhaPlaceholder: string; demoPatientId: string;
  consentTitle: string; consentBody: string; consentYes: string; consentNo: string; hearExplanation: string; playing: string; continueToConverse: string; initializingSession: string;
  converseTitle: string; converseSubtitle: string; speakMode: string; touchMode: string; typeMode: string;
  tapMicInstruction: string; listeningInstruction: string; recordedTranscript: string; submitSpoken: string; submitWritten: string;
  hearQuestion: string; speaking: string; speechFailed: string; tryAgain: string; touchInstead: string; typeDescription: string;
  symptomJointPain: string; symptomChestPain: string; symptomFever: string; symptomNoDiabetes: string; symptomMetformin: string; symptomSurgery: string;
  urgentTitle: string; urgentBody: string; urgentSafetySignal: string; urgentCallStaff: string;
  scanTitle: string; scanSubtitle: string; scanPrescription: string; scanLabReport: string; scanDischarge: string; skipScan: string;
  processingDocument: string; documentIngested: string; labAlertTitle: string; labAlertBody: string;
  summarizeTitle: string; summarizeSubtitle: string; summarizeConflict: string; summarizeConflictBody: string; summarizeReady: string; summarizeReadyBody: string;
  routeUrgent: string; routeConflict: string; routeReady: string; proceedConsult: string;
  loginTitle: string; loginSubtitle: string; loginEmail: string; loginPassword: string; loginButton: string; loginDemoHint: string; loginOrDivider: string; loginGoogleDemo: string;
  caseQueue: string; noCaseSelected: string; noCaseSelectedBody: string; filterAll: string; filterConflict: string; filterReview: string; filterVerified: string; refresh: string;
  patientSaid: string; documentShows: string; verifyAccept: string; verifyReject: string; fhirBlocked: string; fhirReady: string; exportFhir: string; auditTrail: string;
  loading: string; error: string; close: string; confirm: string; cancel: string; backToStep: string;
}
