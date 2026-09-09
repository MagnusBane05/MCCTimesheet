# MCC Timesheet - Backend
Local dev backend for the MCC Timesheet app. Runs in Docker because Python
3.11 (to match BlackSun/cPanel production, exactly 3.11.15) has no
official Windows binary installer

## First-time setup
**Powershell**
```powershell
Copy-Item backend\.env.example backend\.env
# edit backend\.env: set a real DJANGO_SECRET_KEY and DB passwords
docker compose up -d db
docker compose up -d backend # runs migrate, then starts the dev server
```
**Bash**
``` bash
cp backend/.env.example backend/.env
# edit backend\.env: set a real DJANGO_SECRET_KEY and DB passwords
docker compose up -d db
docker compose up -d backend # runs migrate, then starts the dev server
```

API is then available at `http://localhost:8000/api/` (try `/api/health/`).
Django admin is at `http://localhost:8000/admin/` (create a superuser first:
`docker compose exec backend python manage.py createsuperuser`).
Sample user: `admin`, password: `admin`

**Running backend locally**
``` bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python manage.py migrate
python manage.py seed_dev_data
python manage.py runserver
```

## Common commands
```powershell
# manage.py, e.g. makemigrations/migrate/shell
docker compose exec backend python manage.py <command>
# backend logs
docker compose logs backend --tail 50
# stop (add -v to also wipe the MySQL volume)
docker compose down                                       
```

## Running Tests

Test coverage includes permission enforcement, business rules validation, and API functionality.

**With Docker:**
```bash
# Run all tests
docker compose exec backend python manage.py test

# Run specific app tests
docker compose exec backend python manage.py test projects
docker compose exec backend python manage.py test accounts

# Run specific test class
docker compose exec backend python manage.py test projects.tests.ProjectAPITestCase

# Run specific test method
docker compose exec backend python manage.py test projects.tests.ProjectAPITestCase.test_list_projects_authenticated

# Run with verbose output
docker compose exec backend python manage.py test --verbosity=2
```

**Locally** (after setup):
```bash
# Activate venv first
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows

# Run all tests
python manage.py test

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report  # or: coverage html for HTML report
```

## Updating dependencies
Edit `requirements.in` (loose ranges), install into a scratch environment, then freeze into `requirements.txt` so production installs the exact set that was tested:
```powershell
docker compose run --rm backend pip install -r requirements.in
docker compose run --rm backend pip freeze > backend/requirements.txt
```

## Production / BlackSun deployment
**cPanel -> Setup Pyton App**: Application root: any name, Application URL: `backend`, Application startup file: `app.py`, Applicaiton entry point: `application`

**models.py migration**: Only when models.py changes, `python manage.py makemigrations` locally, commit migration file then continue.

**Package backend**: 
1. Zip contents of `backend/` except for .env and any static files
2. Upload to temporary folder on cPanel File Manager like backend-release
3. Stop Python app
4. Delete old files/folders, except .env and statiffiles from `<application-root>`
5. Move files from backend-release to `<application-root>`

**Install requirements**: In cPanel -> Setup Python App -> Configuration Files add `requirements.txt`, then Run Pip Install.

**Release steps** Under cPanel -> Setup Python App -> Execute python script, run deployment script (deploy_dev.py):
  `manage.py check`
  `manage.py migrate`
  `manage.py collectstatic`

**Static files**: copy `backend/staticfiles` to `static` folder in domain document root (not Application root)

**Start application**: Start the python app.

**Verify**: Check
- `/backend/api/health/`
- migration applied
- affected workflow
- logs for errors
