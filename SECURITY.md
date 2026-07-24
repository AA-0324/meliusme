MeliusMe is built with a secure-by-design philosophy. All user data is stored only on the user's device and encrypted locally using browser-native cryptography (AES-GCM 256-bit via the Web Crypto API). No personal data is transmitted to external servers.

## Encryption Architecture

- Algorithm: AES-GCM with 256-bit keys
- Key Management: A per-user encryption key is generated on first launch via `crypto.subtle.generateKey()` and stored securely in IndexedDB (never in localStorage).
- Data at Rest: All localStorage entries and IndexedDB meal records are encrypted before storage. Raw JSON is never persisted.
- Data in Memory: Decrypted data exists only in application memory during active use.
- Migration: On upgrade, existing plaintext data is automatically encrypted in place.

## Content Security Policy

MeliusMe enforces a strict Content Security Policy:
- `default-src 'self'`
- `script-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`

No external scripts are loaded dynamically. Inline script execution is prevented.

## Reporting Vulnerabilities

As an aspiring Cybersecurity Analyst, I take security reports seriously. If you discover a potential security flaw, please help me protect our users by following these steps:

1. Do Not Open a Public Issue: To prevent exploitation, please do not disclose vulnerabilities in the public GitHub Issues tab.
2. Private Disclosure: Please report any findings directly to me via email at akshararvind5@gmail.com.
3. What to Include: Please provide a brief description of the vulnerability and, if possible, steps to reproduce it.

## Response Process

I am committed to the responsible disclosure model. Upon receiving a report, I will:
- Acknowledge the report within 48 hours.
- Perform a manual audit to confirm the vulnerability.
- Provide a timeline for a patch or mitigation strategy.

## Ongoing Security Audits

MeliusMe is currently undergoing a continuous security audit as part of my Google Cybersecurity Professional Certificate coursework. This includes:
- Dependency Scanning: Ensuring third-party libraries are up to date.
- Encryption Logic: Verifying the integrity of local data storage using AES-GCM 256-bit encryption.
- Logic Audits: Manually reviewing AI-generated code for security flaws.
