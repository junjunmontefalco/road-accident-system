# Road Accident Reporting System (RoadReport)

IT 305 Advance Web Development final project, BSIT 3I-G2, Group 1.
Submission: November 2, 2026.

One system, three parts that share one database:

```
road-accident-system/
├── database/   MySQL schema + sample data           (Vince)
├── api/        Plain PHP JSON API, one file per endpoint (Juliana)
├── web/        React website: reporters, admins, officers (Jan Russel + Vince)
├── mobile/     Flutter app for reporters             (Alyana)
└── docs/       API contract and project notes        (John + Jan Russel)
```

Only the API talks to the database. The website and the app only call API endpoints
(listed in [docs/API_CONTRACT.md](docs/API_CONTRACT.md)).

## What works already

The starter covers the main flow end to end, so everyone can build on something real:

- Register, log in, log out (token login works for web and mobile)
- Submit a report with date, time, type, vehicles, injuries, description, GPS or map pin, and up to 5 photos
- Automatic duplicate flag for reports with the same type, time and place
- My reports, report details with status timeline, private photo viewing
- Notifications on submission and on every status change
- Admin: report list with search and filters, status changes with the allowed workflow, dashboard counts
- Officer: assigned reports only, In Progress and Resolved updates
- Audit trail recorded for every important action

Everything still to build is marked in the code with `TODO` and the owner's name. Endpoints not built
yet answer `501 Not built yet: ... (owner: ...)`.

## Setup on your laptop (everyone)

You need **XAMPP** (Apache + MySQL, PHP 8.1 or newer) and **Node.js 20+**.

### 1. Put the project in htdocs

Clone or copy this folder to `C:\xampp\htdocs\road-accident-system`.
Start **Apache** and **MySQL** in the XAMPP Control Panel.

### 2. Create the database

1. Open http://localhost/phpmyadmin
2. Create a database named `road_accident_db` (collation `utf8mb4_general_ci`)
3. Select it, open **Import**, import `database/schema.sql`
4. Import `database/seed.sql` (test accounts + 40 sample reports around Bulacan)

Check the API: open http://localhost/road-accident-system/api/accident-types/list.php
You should see JSON starting with `{"success":true`.

If your MySQL root user has a password, set it in `api/config/config.php`.

### 3. Run the website

```bash
cd web
npm install
copy .env.example .env      # Mac/Linux: cp .env.example .env
npm run dev
```

Open http://localhost:5173

### 4. Run the mobile app

See [mobile/README.md](mobile/README.md).

### Test accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@roadreport.test | Admin@123 |
| Traffic officer | officer@roadreport.test | Officer@123 |
| Traffic officer | officer2@roadreport.test | Officer@123 |
| Public user | reporter@roadreport.test | Reporter@123 |
| Public user | reporter2@roadreport.test | Reporter@123 |

To reset the data any time, import `database/seed.sql` again.

## Who builds what

| Member | Folders and files |
| --- | --- |
| **John** (leader, QA) | `api/export/reports.php` (FR-15), test cases, GitHub, demo setup, video |
| **Juliana** (backend) | everything in `api/`; first: `reports/assign.php`, `reports/add-remark.php`, `users/save.php`, `accident-types/save.php`, `reports/edit.php`, `reports/flag.php`, email in `core/notify.php` |
| **Vince** (database + admin) | `database/`, `api/dashboard/*`, `web/src/pages/admin/*`, `web/src/components/ReportsTable.jsx` |
| **Alyana** (mobile) | `mobile/` |
| **Jan Russel** (web UI + docs) | `web/src/pages/reporter/*`, `web/src/pages/officer/*`, `Landing`, `Login`, `Register`, `Notifications`, `web/src/styles/app.css`, `docs/` user guide |

Search the code for `TODO` and your name to find your tasks.

## Working together on GitHub

1. John creates the repo and pushes this starter to `main`, then creates a `dev` branch.
2. Everyone clones it into `C:\xampp\htdocs\road-accident-system`.
3. Work on your own branch: `git checkout -b feature/juliana-assign` from `dev`.
4. Push and open a pull request into `dev`. John checks and merges.
5. `main` only gets a version that fully works (for the demo).

Never commit: `web/node_modules`, `web/.env`, `api/uploads/reports/`, real passwords.

## Hosting warning

Do not host the API on InfinityFree. Its free plan blocks mobile apps from calling the API,
so the Flutter app would not work. For the video demo, run XAMPP on one laptop and connect
the phone to the same Wi-Fi (see mobile/README.md).

## Tech stack

| Part | Technology |
| --- | --- |
| Web | React 19 (Vite), Bootstrap 5, React Router, Leaflet + OpenStreetMap |
| Mobile | Flutter: http, geolocator, flutter_map, image_picker, shared_preferences |
| API | PHP 8 (no framework), PDO prepared statements, Bearer token login |
| Database | MySQL / MariaDB |
| Maps | OpenStreetMap (free, no API key) |
