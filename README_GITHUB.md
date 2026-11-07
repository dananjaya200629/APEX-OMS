# APEX HOLDINGS OMS V44 — GitHub + Secure Python Backend

This repository contains the V44 front end and the Python service required for shared live data, Excel imports, announcement media, authentication, and backups. **GitHub Pages alone is not a supported deployment** because it cannot run the Python API or persist the database/uploads.

## What is included

- Original V44 HTML, CSS, JavaScript, images, fonts and workflows.
- Python HTTP API for shared state, live polling, `.xlsx` / `.xls` import, and announcement image/video upload.
- Server-side login endpoint with PBKDF2-HMAC-SHA256 password hashes; passwords are removed from the shared database before it is persisted or returned to browsers.
- HttpOnly, SameSite session cookie; 12-hour sessions; login attempt throttling.
- Company-scoped state responses for Admin, Sales and Shipping accounts. Non-owner API updates are restricted by role and company scope; Owner retains global access.
- Persistent data directory for the database, authentication hashes, backups and announcement media.
- Owner-only downloadable backup and restore controls in Settings; automatic daily ZIP backup with 30-backup retention.
- Docker and Render deployment files, plus GitHub Actions validation on every push / pull request.

## Owner account

- Username: `owner@apexholdings.lk`
- Initial password: `ApexOwner@2026`

For Render, set `APEX_OWNER_USERNAME=owner@apexholdings.lk` and `APEX_OWNER_PASSWORD=ApexOwner@2026` when creating the service (or set a different unique password and use that at first login). The application stores only a PBKDF2 password hash. After the first login, open **Settings → Change Password** and set a unique password of at least 12 characters. The initial account is created only when the persistent authentication file does not already exist; changing an environment variable later does not overwrite an existing password hash.

Company Admin / Sales / Shipping accounts from the V44 seed data are registered securely when the Owner first logs in and the initial data is synchronized. **Log in as Owner once first** before trying the seeded company accounts. New company/staff accounts are registered by the server when their records are saved.

## Deploy using GitHub + Render

1. Create a **Private** GitHub repository named `APEX-OMS`.
2. Extract this ZIP and upload the *contents* of this folder to the repository root. `index.html`, `server.py`, `Dockerfile` and `render.yaml` must be at the root.
3. Commit to the `main` branch.
4. In Render, choose **New → Blueprint** and connect the GitHub repository. Render reads `render.yaml` and creates the Docker web service and a 10 GB persistent disk.
5. When Render asks for `APEX_OWNER_PASSWORD`, enter the initial password shown above (or a unique password you choose). Do not put passwords in GitHub files or commits.
6. Deploy. Wait for `/api/health` to report `{"ok": true}`. Open the Render URL and sign in as Owner.
7. Change the Owner password in Settings. Keep the Render disk attached; do not delete or recreate it during code updates.

The Render service uses Docker and a persistent disk mounted at `/var/data`. A paid Render service/disk may be required; a static-only or ephemeral filesystem host will not preserve the database/uploads. Keep the GitHub repository Private because it contains the application's source and the local-development fallback Owner credential.

## Updating after the first GitHub upload

1. Make code changes in the repository (or upload the changed files).
2. Commit and push to `main`.
3. GitHub Actions runs syntax and security-state tests.
4. Render automatically deploys the new commit because `autoDeploy: true` is enabled.

The database, authentication hashes, backups and announcement uploads live on `/var/data`, not in the Git repository or Docker image. Normal code deployments therefore do not overwrite them. **Never commit `data/`, `backups/`, `uploads/`, `.env`, database files or backup ZIPs.** The included `.gitignore` excludes these paths.

## Live data and supported features

- Keep the browser and Python API on the same Render origin. Do not host the front end on GitHub Pages separately.
- Live sync uses the authenticated `/api/state` endpoints and polls every two seconds.
- Excel Import calls `/api/parse-excel`; install dependencies with `pip install -r requirements.txt`.
- Announcement media is uploaded to the persistent `uploads/announcement` directory and is served only to authenticated sessions.
- Use **Settings → Database Backup → Download Backup** to download a ZIP containing the OMS state, authentication hashes and announcement media. Restore is Owner-only.
- The service creates a daily backup and retains the latest 30 ZIP backups on the persistent disk. Download backups periodically to a separate device/cloud location; a backup stored on the same disk is not protection against disk loss.

## Local Windows run

1. Install Python 3.10+.
2. Copy `.env.example` to `.env` and set a unique Owner password. The Windows and Linux launchers load simple `KEY=value` lines from `.env` automatically; never commit that file.
3. Run `start_server.bat`.
4. Open `http://127.0.0.1:8765`.

For local HTTP, `APEX_COOKIE_SECURE=false` is set by the launcher. For HTTPS hosting, keep `APEX_COOKIE_SECURE=true`.

## Important operational notes

- Do not use GitHub Pages for this app.
- Do not remove the Render persistent disk or change `APEX_DATA_DIR` after live data is created.
- Restore replaces the active database/authentication files and restores announcement media from the selected archive. Download a current backup before restoring an older one.
- The server-side company scoping and role checks are enforced on API reads/writes, not only by hiding UI buttons.
- Use HTTPS in production. Keep the repository private, protect the `main` branch, and restrict Render dashboard access.
