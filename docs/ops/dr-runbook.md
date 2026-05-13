# Disaster Recovery Runbook (OPS-005 / NFR-013)

## Overview
This runbook defines RPO/RTO targets, backup configuration, and DR drill procedures for the Estate Planning Platform.

## Recovery Objectives
| Metric | Target | Rationale |
|---|---|---|
| RPO (Recovery Point Objective) | 1 hour | Maximum acceptable data loss |
| RTO (Recovery Time Objective) | 4 hours | Maximum acceptable downtime |
| MTTR (Mean Time to Recover) | 2 hours | Target for practiced recovery |

## Backup Configuration
- **Database**: Automated daily snapshots + continuous WAL archiving (for point-in-time recovery)
- **Document vault**: Versioned object storage with cross-region replication
- **Configuration**: Infrastructure-as-code stored in version control
- **Retention**: 30 days for daily snapshots, 1 year for monthly snapshots

## DR Scenarios

### Scenario 1: Database Failure
1. Detect via readiness probe failure (`/api/health/ready` returns 503)
2. Failover to standby replica (automated if using managed DB)
3. Verify data integrity via `prisma.tenant.count()` health check
4. Update DNS or connection string if needed
5. Notify operations team via alerting channel

### Scenario 2: Complete Region Failure
1. Activate secondary region deployment
2. Restore database from latest cross-region backup
3. Update DNS routing to secondary region
4. Verify all health probes pass
5. Communicate status to affected tenants
6. Plan failback once primary region recovers

### Scenario 3: Data Corruption
1. Identify scope of corruption via audit event analysis
2. Restore affected tables from point-in-time backup
3. Replay audit events to verify integrity
4. Document incident in `Incident` table

## DR Drill Procedure
- **Frequency**: Quarterly
- **Scope**: Full recovery from backup in a staging environment
- **Steps**:
  1. Create isolated staging environment
  2. Restore latest backup
  3. Run full test suite (`npm test`)
  4. Verify health probes and API functionality
  5. Measure actual RTO and compare against target
  6. Document results and remediation items
- **Sign-off**: CTO and Security Officer

## Monitoring & Alerting
- Health probe polling: Every 30 seconds
- Backup completion: Alert on failure within 15 minutes
- Disk/storage usage: Alert at 80% capacity
- Replication lag: Alert if > 5 minutes

## Penetration Testing Schedule (SEC-015)
- Annual third-party penetration test (pre-production and annually thereafter)
- Quarterly automated vulnerability scanning via CI/CD
- Pre-release security review for each jurisdiction pack publication
- Results tracked in `Incident` table with `incidentClass: "pentest_finding"`

## Backup Status API
The `/api/admin/backup-status` endpoint provides real-time backup status reporting (NFR-013).
