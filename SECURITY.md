# VITAL-X Security & Data Policy

Because VITAL-X processes clinical information, strict data policies apply during this hackathon:

## 1. Zero Real Patient Data

Never commit real medical records, real prescriptions, or real patient voice recordings to this repository. Use **synthetic demo data only**.

## 2. Zero Real Government IDs

Never use real ABHA, Aadhaar, PAN, or other real government identification numbers in the codebase, database seeds, or test files. Use fake demo formats (e.g., `ABHA-DEMO-1234`).

## 3. Zero Secrets in Git

Never commit actual API keys, database passwords, or JWT secrets. Use the `.env` file locally, which is ignored by Git.

If you accidentally commit a secret or real patient data, notify the System Architect immediately so the commit history can be scrubbed.
