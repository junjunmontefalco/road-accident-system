# Database design: Cloud Firestore (Firebase)

Owner: Leonardo, Vince (Database Designer)

The database is **Cloud Firestore**, a NoSQL document database from Firebase.
Instead of tables and rows it has **collections** and **documents**. Only the PHP API
talks to it (with the service account key), so the security rules in
[`firestore.rules`](firestore.rules) block everyone else.

Files in this folder:

| File | What it is |
| --- | --- |
| `FIRESTORE_SCHEMA.md` | This document: every collection and field |
| `firestore.rules` | Security rules to paste in the Firebase console |
| `seed-data.json` | Sample data: 5 test accounts, 8 categories, 40 reports around Bulacan. Load it with `php api/tools/seed.php` |

## How it compares with a SQL design

| SQL idea | How it is done here |
| --- | --- |
| Table | Collection (`reports`, `users`, ...) |
| Row, primary key | Document; its ID is the number (`reports/43`) |
| AUTO_INCREMENT | `counters/{collection}`, increased atomically by `fs_next_id()` in `api/core/firestore.php` |
| UNIQUE email | `user_emails/{email}` document, created in the same commit as the user (fails if it exists) |
| Child tables (vehicles, status history, remarks) | Lists stored **inside** the report document, so one read gets the whole report |
| JOIN for names | The name is copied into the document (`assigned_officer_name`, `changed_by_name`) |
| Transaction | `fs_commit([...])`: all writes succeed or none do |
| View `official_accident_records` | `is_official_record()` in `api/core/reports.php` |
| BLOB / file folder | Photos are stored as **bytes** in `report_photos` (shrunk to under 900 KB, because a document can hold at most 1 MB and Firebase Storage needs the paid plan) |

Dates are saved as text in Philippine time, `YYYY-MM-DD HH:MM:SS`, so they sort correctly
and look the same as before.

## Public report vs official record

Every report starts as a **public-submitted report** (`status: "submitted"`). It becomes an
**officially verified accident record** only when an administrator verifies it (`verified_at`
is filled in and the status is `verified`, `assigned`, `in_progress` or `resolved`).
Dashboard statistics, summaries and accident-prone areas count only official records.

## Collections

### `users/{id}`
| Field | Type | Notes |
| --- | --- | --- |
| id | number | same as the document ID |
| full_name | string | |
| email | string | lowercase, unique (see `user_emails`) |
| phone | string or null | `09XXXXXXXXX` or `+639XXXXXXXXX` |
| password_hash | string | bcrypt (`password_hash()` in PHP); never sent to the apps |
| role | string | `reporter`, `officer` or `admin` |
| badge_no | string or null | officers only |
| status | string | `active` or `inactive` (inactive users cannot log in) |
| created_at, updated_at | string | |

### `user_emails/{email}`
`{ user_id }`. Keeps emails unique and makes login one direct read.

### `sessions/{sha256 of token}`
`{ user_id, device ("web" or "mobile"), created_at, expires_at, last_used_at }`.
Only the hash of the login token is stored. Logging out deletes the document.

### `reports/{id}`
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | number | yes | |
| report_code | string | yes | `RA-2026-000043`, shown to the reporter |
| reporter_id, reporter_name, contact_info | number / string | yes | contact = phone, or email if no phone |
| accident_date | string | yes | `YYYY-MM-DD`, not in the future |
| accident_time | string | yes | `HH:MM` |
| location_text | string | yes | road, street or landmark |
| barangay, municipality | string or null | | |
| latitude, longitude | number or null | | GPS or map pin |
| accident_type_id, accident_type | number, string | yes | the name is a copy for exports |
| injury_status | string | yes | `none`, `injuries`, `fatalities`, `unknown` |
| description | string | yes | 10+ characters |
| vehicles | list of `{ type, quantity }` | | |
| status | string | yes | see the workflow below |
| rejection_reason | string or null | | required when rejected |
| verified_by, verified_by_name, verified_at | | | set when verified |
| assigned_officer_id, assigned_officer_name | | | set by assign |
| is_flagged, flag_reason, duplicate_of | bool, string, number | | FR-08 |
| source | string | yes | `web` or `mobile` |
| photos | list of `{ id, name }` | | the files are in `report_photos` |
| history | list of `{ from_status, to_status, changed_by, changed_by_name, note, created_at }` | yes | tracking timeline |
| remarks | list of `{ id, type, content, is_internal, author_id, author_name, author_role, created_at }` | | `type`: remark, finding, action, reporter_info |
| created_at | string | yes | date submitted |
| updated_at | string | yes | |

### `report_photos/{id}`
`{ id, report_id, name, mime_type, size_bytes, width, height, uploaded_by, uploaded_at, data (bytes) }`.
Served only by `api/photos/view.php` to people allowed to see the report.

### `notifications/{id}`
`{ id, user_id, report_id, report_code, title, message, is_read, created_at }`

### `audit_logs/{random id}`
`{ user_id, user_name, user_role, action, entity_type, entity_id, details (map), ip_address, created_at }`.
Actions: `user.login`, `user.register`, `user.create`, `user.update`, `user.profile`, `report.create`,
`report.status`, `report.assign`, `report.remark`, `report.edit`, `report.flag`, `report.add_info`,
`report.export`, `type.save`, `contact.save`, `settings.save`.

### `accident_types/{id}`
`{ id, name, description, is_active, created_at, updated_at }`. Never deleted; hidden with `is_active: false`.

### `emergency_contacts/{id}`
`{ id, name, phone, category, sort_order, is_active }`

### `settings/system`
`{ system_name, max_photos_per_report, duplicate_window_minutes, duplicate_radius_km }`

### `counters/{collection}`
`{ value }`: the last number used for `users`, `reports`, `report_photos`, `notifications`,
`accident_types`, `emergency_contacts`.

## Report workflow

| Status | Can move to | Who |
| --- | --- | --- |
| submitted | under_review, rejected | admin |
| under_review | info_required, verified, rejected | admin |
| info_required | under_review (also automatic when the reporter answers), rejected | admin, reporter |
| verified | assigned (assign an officer), resolved | admin |
| assigned | in_progress | admin, assigned officer |
| in_progress | resolved | admin, assigned officer |
| resolved, rejected | (end) | |

## Indexes

None to create. The API only asks Firestore for exact matches (for example `status == "submitted"`
or `reporter_id == 4`) or a range on one field (audit trail dates), which Firestore supports
out of the box. Sorting and text search are done in PHP. This is fine for a school-sized
database; with tens of thousands of reports you would add composite indexes and paging in Firestore.

## Free plan limits (Spark)

50,000 document reads and 20,000 writes per day, 1 GB stored. Opening the admin report list
reads every report once, so 100 reports x 200 page views = 20,000 reads: plenty for the demo.
