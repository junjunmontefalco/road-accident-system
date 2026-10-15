# Road Accident Reporting System (RoadReport)

IT 305 Advance Web Development final project, BSIT 3I-G2, Group 1.
Submission: November 2, 2026.

One system, three parts that share one **Firebase** database:

```
road-accident-system/
├── web/        Website in plain HTML, CSS, JavaScript + Bootstrap 5 (no React, no build step)
├── api/        PHP API, one file per endpoint; the only part that talks to Firebase
├── mobile/     Flutter + Dart app for reporters
├── database/   Firestore design, security rules, sample data
└── docs/       API contract, setup and deployment guide
```

| Part | Technology |
| --- | --- |
| Website | HTML, CSS, JavaScript (ES modules), Bootstrap 5.3, Leaflet + OpenStreetMap, Chart.js |
| Mobile | Flutter: http, geolocator, flutter_map, image_picker, shared_preferences, url_launcher |
| API | PHP 8.1+ (no framework, no Composer), Bearer token login, FPDF for PDF export, optional PHPMailer |
| Database | **Firebase Cloud Firestore**, reached through its REST API with a service account key |
| Photos | Shrunk to 1280 px JPEG and stored inside Firestore (no paid Firebase Storage needed) |
| Hosting | **Hostinger** (website + API for the app) and **InfinityFree** (website) |
| Maps | OpenStreetMap (free, no API key) |

**Start here:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (Firebase setup, XAMPP, VS Code, Hostinger, InfinityFree).
Endpoints: [docs/API_CONTRACT.md](docs/API_CONTRACT.md). Database: [database/FIRESTORE_SCHEMA.md](database/FIRESTORE_SCHEMA.md).
Mobile: [mobile/README.md](mobile/README.md).

## What the system does

| ID | Requirement | Where |
| --- | --- | --- |
| FR-01 | Registration | `register.html`, app Register; `api/auth/register.php` |
| FR-02 | Login / logout | `login.html`, app Login; token login for web and mobile |
| FR-03 | Accident report form | `report-new.html`, app Report screen (3 steps) |
| FR-04 | GPS or map pin | "Use my current location" or tap the map |
| FR-05 | Photo evidence | Up to 5 photos, camera or gallery, private photo viewer |
| FR-06 | Report tracking | My reports, status timeline, answer "Additional information required" |
| FR-07 | Report management | Admin: review, edit details, assign/reassign officer; officer: update status, remarks |
| FR-08 | Verification, flags | Workflow statuses, automatic duplicate flag, manual flag/unflag |
| FR-09 | Notifications | In-app on web and app (unread badge); optional email |
| FR-10 | Dashboard | Cards, monthly trend, types, municipalities, time of day, hotspots, map |
| FR-11 | Search and filters | Report ID/text, status, type, municipality, dates, flagged, verified only |
| FR-12 | Summaries | Daily, weekly, monthly, annual tables + chart |
| FR-13 | User management | Add users, roles, badge numbers, activate/deactivate |
| FR-14 | Audit trail | Every login, report change, export and admin action, with filters |
| FR-15 | Export | CSV and PDF of the filtered list and of the summaries |

A **public-submitted report** becomes an **officially verified accident record** only when an admin
verifies it; statistics count only verified records.

## Website pages (`web/`)

| Page | Who | Owner |
| --- | --- | --- |
| `index.html`, `login.html`, `register.html` | everyone | Jan Russel |
| `home.html`, `report-new.html`, `report-submitted.html`, `my-reports.html` | reporter | Jan Russel |
| `report.html` (details + staff actions), `notifications.html`, `account.html` | all roles | Jan Russel, Vince |
| `admin.html` (dashboard), `admin-reports.html`, `admin-summaries.html` | admin | Vince, John (export) |
| `admin-users.html`, `admin-settings.html`, `admin-audit.html` | admin | Vince |
| `officer.html` | officer | Jan Russel |

Each page is an `.html` file with its script in `web/js/pages/<same name>.js`. Shared code:
`js/api.js` (API calls), `js/app.js` (login check + menu), `js/ui.js` (helpers), `js/map.js`,
`js/photo-picker.js`, `js/reports-table.js`, styles in `css/app.css`.

## Who owns what

| Member | Folders and files |
| --- | --- |
| **John** (leader, QA) | `api/export/reports.php` (FR-15), `docs/DEPLOYMENT.md`, Firebase project, hosting, test cases, video |
| **Juliana** (backend) | `api/` (endpoints and `api/core/`) |
| **Vince** (database + admin) | `database/`, `api/core/firestore.php`, `api/dashboard/*`, admin pages and their scripts |
| **Alyana** (mobile) | `mobile/` |
| **Jan Russel** (web UI + docs) | reporter and officer pages, `web/css/app.css`, user guide |

## Working together on GitHub

1. Work on your own branch from `dev`: `git checkout -b feature/your-name-task`.
2. Push and open a pull request into `dev`. John checks and merges.
3. `main` only gets a version that fully works (for the demo).

Never commit: `api/config/firebase-service-account.json`, `api/cache/`, real passwords.

## Credits (libraries used)

Bootstrap, Leaflet, OpenStreetMap data, Chart.js, Overpass font (Google Fonts), FPDF (`api/lib/fpdf`),
PHPMailer (`api/lib/PHPMailer`), Mozilla CA bundle (`api/config/cacert.pem`), and the Flutter packages
listed in `mobile/pubspec.yaml`.
