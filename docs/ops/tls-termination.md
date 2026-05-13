# TLS Termination & Encryption (OPS-001 / SEC-001)

## Overview
All production traffic must be encrypted in transit and at rest. TLS termination occurs at the load balancer or application gateway; the Express API must never be exposed over plain HTTP.

## TLS Configuration
- **Minimum version**: TLS 1.2 (prefer TLS 1.3)
- **Cipher suites**: Only AEAD ciphers (AES-256-GCM, ChaCha20-Poly1305)
- **Certificate authority**: Use a trusted public CA (e.g., Let's Encrypt, AWS ACM, Azure Key Vault)
- **HSTS**: Enforced via helmet middleware (`max-age=63072000; includeSubDomains; preload`)
- **OCSP stapling**: Enable on the reverse proxy

## Certificate Management
- Automate certificate renewal (ACM auto-renewal, certbot cron, or Vault PKI)
- Set monitoring alerts for certificates expiring within 30 days
- Store private keys in a secrets manager (never in source control)

## Database Encryption
- **At rest**: Use managed encrypted storage (e.g., AWS RDS encryption, Azure SQL TDE)
- **In transit**: Enable SSL/TLS for database connections (`sslmode=require` in connection string)
- **Backup encryption**: All backups must be encrypted with the same or stronger cipher

## Document Vault
- Use server-side encryption (SSE-S3 or SSE-KMS) for document storage
- Enable versioning and access logging on the storage bucket
- Restrict access via IAM policies scoped to the application service account

## Verification
- Run `nmap --script ssl-enum-ciphers -p 443 <host>` to verify cipher suites
- Check HSTS header in production responses
- Confirm database connection uses TLS via connection metadata
