# Google Calendar Integration Research
**Date:** August 11, 2024
**Goal:** Two-way sync between Lockin tasks and Google Calendar

## OAuth2 Flow

```
1. User clicks "Connect Google Calendar"
2. Redirect to Google authorization URL
3. User grants permission
4. Google redirects back with authorization code
5. Exchange code for access token + refresh token
6. Store tokens (encrypted!)
7. Use access token for API calls
8. Refresh when expired (hopefully works!)
```

## Security Concerns

1. **Token Storage**
   - Access token (1 hour lifespan)
   - Refresh token (long-lived, VERY sensitive)
   - MUST encrypt before storing in database
   - Use AES-256 encryption
   - NEVER log tokens!

2. **Redirect URI**
   - Must match EXACTLY what's in Google Console
   - `http://localhost:8080` ≠ `http://127.0.0.1:8080`
   - Case sensitive
   - Trailing slash matters: `/callback` ≠ `/callback/`
   - Will spend hours debugging this

3. **Scopes**
   - calendar.events - read/write calendar events
   - Don't request more than needed
   - Users are scared of permissions!

## API Endpoints Needed

**Calendar API v3:**
- GET /calendars/primary/events - list events
- POST /calendars/primary/events - create event
- PUT /calendars/primary/events/{eventId} - update event
- DELETE /calendars/primary/events/{eventId} - delete event

## Two-Way Sync Strategy

**Tasks → Calendar:**
- When task created with due date → create calendar event
- When task updated → update calendar event
- When task deleted → delete calendar event
- Link task to calendar event ID

**Calendar → Tasks:**
- Periodically fetch new calendar events (every 15 min?)
- Create tasks from calendar events
- Handle conflicts (what if both change? Last write wins!)
- Prevent duplicates (this will be tricky!)

**Challenge:** Race conditions and duplicates!

## Duplicate Prevention (CRITICAL!)

**The Problem:**
- Multiple threads can create calendar events for the same task
- Application-level checks aren't enough (race conditions)
- Users were seeing 5-10 duplicate events per task!

**The Solution:**
- Partial unique index on google_event_id (PostgreSQL)
- `CREATE UNIQUE INDEX ON tasks (google_event_id) WHERE google_event_id IS NOT NULL`
- Database enforces uniqueness at the lowest level
- NULL values can repeat (for tasks without calendar events)
- Prevents race conditions completely

**Key Learning:** Application logic + database constraints = robust system

SQL migration: See `/docs/sql/add_google_event_id_unique_constraint.sql`

## Known Limitations (Being Realistic)

- OAuth token refresh is complex (WILL break)
- Sync is not instant (polling, not webhooks)
- Timezone conversions WILL cause issues
- All-day events are tricky
- Users can't choose which calendar (always "primary")
- No conflict resolution (last write wins)
- Performance issues with 100+ events
- Duplicate prevention might not be perfect

**Realism:** This will take MUCH longer than planned.

## Google Cloud Console Setup

Created project: "Lockin Production"
Enabled APIs:
- Google Calendar API ✓

OAuth consent screen configured:
- App name: Lockin Task Manager
- User support email: [configured]
- Developer contact: [configured]

Scopes:
- https://www.googleapis.com/auth/calendar.events

Authorized redirect URIs (multiple variations because
I don't know which one will work):
- http://localhost:8080/api/auth/google/callback
- http://localhost:8080/api/oauth/callback
- http://localhost:8080/api/calendar/oauth/callback
- http://127.0.0.1:8080/api/auth/google/callback

Client ID: [configured in environment]
Client Secret: [configured in environment]

Time spent on console setup: 1 hour!

## Implementation Summary (Week 19)

**What Works:**
✅ OAuth2 flow with encrypted token storage
✅ Calendar event creation when tasks are created
✅ Event syncing on task updates (new events only)
✅ Status and connection checking
✅ Manual disconnect/reconnect flow
✅ Duplicate prevention with database constraints
✅ Timezone handling
✅ CSRF protection with state tokens

**What Doesn't Work (Yet):**
❌ Automatic token refresh (gave up - too complex!)
❌ Updating existing calendar events (only creates new)
❌ Deleting calendar events when tasks deleted
❌ Two-way sync (Calendar → Tasks)
❌ Periodic background sync
❌ Choosing which calendar (always uses "primary")

**Key Learnings:**
1. Google OAuth is finicky about redirect URIs (trailing slashes!)
2. Token refresh is way harder than expected
3. Timezone handling requires TimeZone parameter in DateTime
4. Database constraints >> application logic for race conditions
5. Manual reconnect UX > buggy automatic refresh
6. OAuth takes 3x longer than estimated

**Time Spent:** ~15 hours over 6 days (estimated 5 hours originally 😅)

**Next Steps:**
- Frontend integration (Settings page UI)
- User testing
- Monitor for edge cases
- Consider implementing event updates/deletes later
