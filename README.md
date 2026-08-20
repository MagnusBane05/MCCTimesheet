# MCCTimesheet
A small time-sheet app built for MCC

## First-time setup

## Useful commands
- **Running locally**: `npm run dev`
- **Build for specific environment**: `npm run build:<environment>` (dev, prod, etc)
- **Running tests**: `npm test` or `npm run test`

## Deployment steps
**Backend deployment (do first)**: See `backend/README.md` for backend deployment steps
1. Run `npm run build:<environment>` (dev/prod)
2. in cPanel -> Domains find Document Root and upload contents of dist to that directory.
3. Verify `/`, `/timesheets`, `backend/api/health`, `/backend/api/auth/csrf/`