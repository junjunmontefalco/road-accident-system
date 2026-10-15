# API contract

Base URL (XAMPP): `http://localhost/road-accident-system/api`
From a phone on the same Wi-Fi: `http://<laptop IP>/road-accident-system/api`
Online: `https://<your-site>/api` (the mobile app must use the Hostinger address; see DEPLOYMENT.md)

Everyone uses exactly these paths, field names and status codes. If you need to change one,
tell the group first and update this file in the same pull request.

## Response format

Every endpoint answers JSON in the same shape.

```json
{ "success": true, "message": "OK", "data": { } }
```

```json
{ "success": false, "message": "Please fix the highlighted fields",
  "errors": { "description": "Describe what happened (at least 10 characters)" } }
```

| HTTP code | Meaning |
| --- | --- |
| 200 / 201 | OK / created |
| 401 | Not logged in, or the token expired (log in again) |
| 403 | Logged in, but this role may not do it |
| 404 | Not found, or not yours to see |
| 422 | Validation errors in `errors` |
| 500 | Server or Firebase problem (the message says what; open /health.php) |

## Login token

`POST /auth/login.php` returns `data.token`. Send it on every later request:

```
Authorization: Bearer 3f9c...64 hex characters
```

Photo and export links can't send headers, so they take `?token=...` in the URL. The API already
adds it to every photo URL it returns.

## Endpoints

All endpoints are built and tested. Data is stored in Firebase (Cloud Firestore); see
[database/FIRESTORE_SCHEMA.md](../database/FIRESTORE_SCHEMA.md).

| Method | Path | Who | Purpose | FR | Owner |
| --- | --- | --- | --- | --- | --- |
| GET | /health.php | public | Setup check (PHP extensions, Firebase key, Firestore connection) | | John |
| POST | /auth/register.php | public | Create reporter account, returns token | 01 | Juliana |
| POST | /auth/login.php | public | Log in, returns token + user | 02 | Juliana |
| POST | /auth/logout.php | any | End this token | 02 | Juliana |
| GET | /auth/me.php | any | Current user (check saved token) | 02 | Juliana |
| POST | /auth/update-profile.php | any | `{ full_name?, email?, phone?, current_password?, password?, password_confirmation? }` | 01 | Juliana |
| GET | /accident-types/list.php | public | Form options: types, injury options, vehicle types, statuses, max_photos (`?all=1` admin) | 03 | Juliana |
| POST | /accident-types/save.php | admin | `{ id?, name, description?, is_active? }` add, rename, hide | | Juliana |
| GET | /emergency-contacts/list.php | public | Numbers for the home screens (`?all=1` admin) | | Juliana |
| POST | /emergency-contacts/save.php | admin | `{ id?, name, phone, category?, sort_order?, is_active?, delete? }` | | Juliana |
| GET | /settings/get.php | public | System settings | | Juliana |
| POST | /settings/save.php | admin | `{ system_name?, max_photos_per_report?, duplicate_window_minutes?, duplicate_radius_km? }` | | Juliana |
| POST | /reports/create.php | reporter | Submit report + photos (multipart) | 03, 04, 05, 08 | Juliana |
| GET | /reports/mine.php | reporter | My reports (`?status=`) | 06 | Juliana |
| GET | /reports/view.php?id= | owner, staff | Full report: vehicles, photos, history, remarks (`?code=` also works) | 06, 07 | Juliana |
| GET | /reports/list.php | admin, officer | Search and filter, paginated (officers: assigned only) | 07, 11 | Juliana |
| POST | /reports/update-status.php | admin, officer | `{ id, status, note?, reason? }` next allowed status | 07, 08 | Juliana |
| POST | /reports/assign.php | admin | `{ id, officer_id, note? }` assign a verified report, or change the officer | 07 | Juliana |
| POST | /reports/add-remark.php | admin, officer | `{ id, type: remark/finding/action, content, is_internal }` | 07 | Juliana |
| POST | /reports/edit.php | admin | `{ id, ...fields to correct }` (old/new values go to the audit trail) | 07 | Juliana |
| POST | /reports/flag.php | admin | `{ id, flagged, reason?, duplicate_of? (id or RA- code) }` | 08 | Juliana |
| POST | /reports/add-info.php | reporter | Answer "Additional Information Required": `id`, `message`, `photos[]` (multipart) | 06 | Juliana |
| GET | /photos/view.php?id=&token= | owner, staff | Photo file (stored in Firestore) | 05 | Juliana |
| GET | /notifications/list.php | any | My notifications + unread count (`?unread=1`) | 09 | Juliana |
| POST | /notifications/read.php | any | `{ id }` or `{ all: true }` | 09 | Juliana |
| GET | /dashboard/summary.php | admin | Cards, charts, hotspots, map points, recent (`?date_from=&date_to=`) | 10 | Vince |
| GET | /dashboard/report-summary.php | admin | `?period=daily/weekly/monthly/annual&scope=official/all&date_from=&date_to=` | 12 | Vince |
| GET | /users/list.php | admin | `?role=&status=&q=&page=&per_page=` returns `{ items, page, total, total_pages }`; officers have `open_cases` | 13 | Juliana |
| POST | /users/save.php | admin | `{ id?, full_name, email, phone?, role, badge_no?, password?, status? }` | 13 | Juliana |
| GET | /audit/list.php | admin | `?action=&user_id=&q=&date_from=&date_to=&page=` (default last 30 days) | 14 | Juliana |
| GET | /export/reports.php | admin, officer | `?format=csv/pdf&token=` + the list filters; `&type=summary&period=` for FR-12 tables (admin) | 15 | John |

## Report statuses

| Code | Label | Can move to | Who |
| --- | --- | --- | --- |
| submitted | Submitted | under_review, rejected | admin |
| under_review | Under Review | info_required, verified, rejected | admin |
| info_required | Additional Information Required | under_review (admin, or automatically when the reporter answers with add-info.php), rejected | admin, reporter |
| verified | Verified | assigned (via assign.php), resolved | admin |
| assigned | Assigned | in_progress | admin, assigned officer |
| in_progress | In Progress | resolved | admin, assigned officer |
| resolved | Resolved / Closed | (end) | |
| rejected | Rejected (reason required) | (end) | |

A report counts as an **official accident record** once it is verified (`is_official_record: true`).
Statistics count only those (`is_official_record()` in `api/core/reports.php`).

## Examples

### Log in

```http
POST /auth/login.php
Content-Type: application/json

{ "email": "reporter@roadreport.test", "password": "Reporter@123", "device": "web" }
```

```json
{ "success": true, "message": "Logged in",
  "data": { "token": "3f9c…",
            "user": { "id": 4, "full_name": "Juan Reyes", "email": "reporter@roadreport.test",
                      "phone": "09170000004", "role": "reporter", "badge_no": null } } }
```

### Submit a report (multipart/form-data)

| Field | Example | Required |
| --- | --- | --- |
| accident_date | 2026-10-14 | yes, not in the future |
| accident_time | 14:35 | yes |
| accident_type_id | 1 | yes |
| location_text | MacArthur Highway near Mojon | yes |
| barangay | Mojon | no |
| municipality | Malolos | no |
| latitude, longitude | 14.8501, 120.8152 | no (both or neither) |
| injury_status | none, injuries, fatalities, unknown | yes |
| description | at least 10 characters | yes |
| vehicles | `[{"type":"Car","quantity":2}]` (JSON text) | no |
| source | web or mobile | no |
| photos[] | up to 5 files (admin setting), JPG/PNG/WEBP, 10 MB each; shrunk to 1280 px JPEG and saved in Firestore | no |

Returns the report (same shape as below) with status `submitted` and `report_code` like `RA-2026-000043`.

### A report (as returned by view.php)

```json
{
  "id": 43, "report_code": "RA-2026-000043",
  "accident_date": "2026-10-14", "accident_time": "14:35",
  "location_text": "MacArthur Highway near Mojon", "barangay": "Mojon", "municipality": "Malolos",
  "latitude": 14.8501, "longitude": 120.8152,
  "accident_type_id": 1, "accident_type": "Collision",
  "injury_status": "injuries", "injury_label": "Injuries reported",
  "description": "Two cars collided at the intersection near the market.",
  "status": "verified", "status_label": "Verified", "is_official_record": true,
  "rejection_reason": null, "assigned_officer": null, "photo_count": 2,
  "source": "mobile", "date_submitted": "2026-10-14 15:02:11", "updated_at": "2026-10-14 16:10:00",
  "vehicles": [ { "type": "Car", "quantity": 2 } ],
  "photos": [ { "id": 7, "url": "http://…/photos/view.php?id=7&token=…", "name": "scene.jpg" } ],
  "history": [ { "from_status": null, "status": "submitted", "status_label": "Submitted",
                 "note": "Report submitted", "changed_by": null, "date": "2026-10-14 15:02:11" } ],
  "remarks": [],

  "reporter": { "id": 4, "name": "Juan Reyes", "contact": "09170000004" },
  "verified_by": "System Administrator", "verified_at": "2026-10-14 16:10:00",
  "is_flagged": false, "flag_reason": null, "duplicate_of": null,
  "allowed_next_statuses": ["assigned", "resolved"]
}
```

The last block (reporter, verified_by, flags, allowed_next_statuses) is sent to admins and officers only.
