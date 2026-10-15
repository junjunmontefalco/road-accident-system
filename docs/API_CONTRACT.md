# API contract

Base URL (XAMPP): `http://localhost/road-accident-system/api`
From a phone on the same Wi-Fi: `http://<laptop IP>/road-accident-system/api`

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
| 501 | Endpoint not built yet (message names the owner) |

## Login token

`POST /auth/login.php` returns `data.token`. Send it on every later request:

```
Authorization: Bearer 3f9c...64 hex characters
```

Photo and export links can't send headers, so they take `?token=...` in the URL. The API already
adds it to every photo URL it returns.

## Endpoints

Status: **works** = done and tested · **starter** = partly done · **todo** = returns 501

| Method | Path | Who | Purpose | FR | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /auth/register.php | public | Create reporter account, returns token | 01 | works | Juliana |
| POST | /auth/login.php | public | Log in, returns token + user | 02 | works | Juliana |
| POST | /auth/logout.php | any | End this token | 02 | works | Juliana |
| GET | /auth/me.php | any | Current user (check saved token) | 02 | works | Juliana |
| GET | /accident-types/list.php | public | Form options: types, injury options, vehicle types, statuses | 03 | works | Juliana |
| POST | /accident-types/save.php | admin | Add or edit an accident category | | todo | Juliana |
| POST | /reports/create.php | reporter | Submit report + photos (multipart) | 03, 04, 05, 08 | works | Juliana |
| GET | /reports/mine.php | reporter | My reports (`?status=`) | 06 | works | Juliana |
| GET | /reports/view.php?id= | owner, staff | Full report: vehicles, photos, history, remarks | 06, 07 | works | Juliana |
| GET | /reports/list.php | admin, officer | Search and filter, paginated | 07, 11 | works | Juliana |
| POST | /reports/update-status.php | admin, officer | Move to the next allowed status | 07, 08 | works | Juliana |
| POST | /reports/assign.php | admin | Assign a verified report to an officer | 07 | todo | Juliana |
| POST | /reports/add-remark.php | admin, officer | Remark, finding or action taken | 07 | todo | Juliana |
| POST | /reports/edit.php | admin | Correct report details | 07 | todo | Juliana |
| POST | /reports/flag.php | admin | Flag or unflag incomplete or duplicate | 08 | todo | Juliana |
| GET | /photos/view.php?id=&token= | owner, staff | Photo file | 05 | works | Juliana |
| GET | /notifications/list.php | any | My notifications + unread count | 09 | works | Juliana |
| POST | /notifications/read.php | any | `{ id }` or `{ all: true }` | 09 | works | Juliana |
| GET | /dashboard/summary.php | admin | Cards (works) + charts and map data (todo) | 10 | starter | Vince |
| GET | /dashboard/report-summary.php | admin | Daily, weekly, monthly, annual | 12 | todo | Vince |
| GET | /users/list.php?role= | admin | Users, officer dropdown | 13 | starter | Juliana |
| POST | /users/save.php | admin | Create or edit user and role | 13 | todo | Juliana |
| GET | /audit/list.php | admin | Audit trail (latest 100 works) | 14 | starter | Juliana |
| GET | /export/reports.php?format=csv\|pdf | admin | Download reports | 15 | todo | John |
| GET | /emergency-contacts/list.php | public | Numbers for the mobile home screen | | works | Juliana |

## Report statuses

| Code | Label | Can move to | Who |
| --- | --- | --- | --- |
| submitted | Submitted | under_review, rejected | admin |
| under_review | Under Review | info_required, verified, rejected | admin |
| info_required | Additional Information Required | under_review, rejected | admin |
| verified | Verified | assigned (via assign.php), resolved | admin |
| assigned | Assigned | in_progress | admin, assigned officer |
| in_progress | In Progress | resolved | admin, assigned officer |
| resolved | Resolved / Closed | (end) | |
| rejected | Rejected (reason required) | (end) | |

A report counts as an **official accident record** once it is verified (`is_official_record: true`).
Statistics should count only those, using the database view `official_accident_records`.

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
| photos[] | up to 5 files, JPG/PNG/WEBP, 5 MB each | no |

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
