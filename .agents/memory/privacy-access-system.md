---
name: Privacy & Admin Access System
description: How the tenant-level privacy and admin access control system works — tables, modes, middleware integration points
---

## Tables (raw SQL, created via initializePrivacyTables() at startup)
- `adminPrivacySettings` — per-company, keyed by `userId`; stores mode, allowedModules (JSON string), tempAccessExpiry, notifyOnAccess
- `adminAccessRequests` — access requests from super admin to company; status: pending/approved/rejected
- `adminAccessLogs` — audit trail of all admin access events

## Privacy Modes (stored in adminPrivacySettings.mode)
full_access | partial_access | temporary_access | approval_required | full_privacy | emergency_access

## Middleware: assertPrivacyAccess(adminUserId, targetUserId, module, ipAddress?)
- Defined in server/db.ts
- Throws `Error("Privacy access denied: ...")` if denied
- Logs access asynchronously on allow
- Called in: fleet.list (vehicles), contracts.list (reservations), clients.list (customers), invoices.list (invoices)
- Only triggers when filterUserId is set AND ctx.user.role === 'super_admin'

## Router: trpc.privacy.*
getSettings, updateSettings, getPendingRequests, respondToRequest, getAccessLogs, requestAccess (super admin), emergencyAccess (super admin), checkAccess (super admin)

## Frontend pages
- /privacy-settings → client/src/pages/PrivacySettings.tsx
- /access-history → client/src/pages/AccessHistory.tsx
- Both accessible from sidebar dropdown → "Privacy & Access"

## allowedModules JSON format
Stored as JSON string (not PostgreSQL array), parsed on read. Module IDs: vehicles, reservations, customers, invoices, maintenance, financial, analytics

**Why:** PostgreSQL array syntax in raw SQL required careful escaping; JSON string avoids this and is portable.
