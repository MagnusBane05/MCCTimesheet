# MCCTimesheet
A small time-sheet app built for MCC

## First-time setup

## Useful commands
- **Running locally**: `npm run dev`
- **Build for specific environment**: `npm run build:<environment>` (dev, prod, etc)
- **Running tests**: `npm test` or `npm run test`

## Deployment steps
**Backend deployment (do first)**: See `backend/README.md` for backend deployment steps
1. Run `rm -rf dist`
1. Run `npm run build:<environment>` (dev or blank for prod) in a non-VSCode terminal (check `echo "$VITE_API_BASE_URL"` returns nothing. If not, run `unset VITE_API_BASE_URL` and `unset VITE_API_MODE` or try in a new terminal session)
2. In cPanel -> File Manager upload contents of dist to Document Root directory (you'll have to zip the assets folder or upload it's contents).
3. Verify `/`, `/timesheets`, `backend/api/health`, `/backend/api/auth/csrf/`