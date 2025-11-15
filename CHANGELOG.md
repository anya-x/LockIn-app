# Changelog

## Week 19 (August 11-17, 2024) - Google Calendar Integration

### Features Added
- ✨ Google OAuth2 authentication flow
- ✨ Calendar event creation from tasks
- ✨ Automatic task-to-calendar sync
- ✨ Settings page with calendar controls
- ✨ Token encryption (AES-256)
- ✨ Manual reconnect flow

### Bug Fixes
- 🐛 Fixed redirect URI trailing slash bug
- 🐛 Fixed timezone handling in event creation
- 🐛 Prevented duplicate calendar events with database constraints
- 🐛 Fixed null description handling

### Technical Improvements
- 🔒 Enhanced CSRF protection with state tokens
- 📝 Improved error logging and messages
- ✅ Added input validation
- 📝 Comprehensive documentation

### Known Limitations
- Automatic token refresh not implemented (manual reconnect required)
- Event updates not supported (only creation)
- Event deletion not supported
- One-way sync only (Tasks → Calendar)

### API Endpoints Added
- `GET /api/calendar/status` - Check connection status
- `GET /api/calendar/connect` - Initiate OAuth flow
- `GET /api/calendar/oauth/callback` - OAuth callback handler
- `DELETE /api/calendar/disconnect` - Disconnect calendar

### Frontend Routes Added
- `/settings` - Settings page with calendar integration

### Database Changes
- Added `google_calendar_tokens` table
- Added `google_event_id` column to tasks table
- Added partial unique index for duplicate prevention

### Commits: 236-268 (33 commits)
### Time Spent: ~15 hours

See `/docs/GOOGLE_CALENDAR_INTEGRATION.md` for detailed documentation.
