# Setup and deployment: Firebase, XAMPP, Hostinger, InfinityFree

Owner: John (leader) — do Part 1 once for the whole group, then everyone does Part 2.

```
 Website (HTML/JS)  ─┐
                     ├──>  PHP API  ──>  Firebase (Cloud Firestore)
 Flutter app ────────┘     (api/)        one database for everyone
```

The website and the app never talk to Firebase directly. Only the PHP API does, using the
Firebase **service account key**. That is why the same database works from XAMPP, Hostinger
and InfinityFree at the same time.

---

## Part 1. Create the Firebase database (once, by John)

1. Go to <https://console.firebase.google.com>, click **Create a project**, name it
   (for example `roadreport-bulsu`). Google Analytics is not needed.
2. Left menu: **Build > Firestore Database > Create database**.
   - Location: **asia-southeast1 (Singapore)**, the closest to the Philippines. It cannot be changed later.
   - Start in **production mode**.
3. Open the **Rules** tab, replace everything with the contents of
   [`database/firestore.rules`](../database/firestore.rules), click **Publish**.
   (This blocks direct access; the PHP API still works because service accounts skip the rules.)
4. Gear icon > **Project settings > Service accounts > Generate new private key**.
   A `.json` file downloads. Rename it to **`firebase-service-account.json`**.
5. Share that file with the group **privately** (Messenger, Google Drive shared only with members).
   **Never commit it to GitHub** (it is already in `.gitignore`). Anyone with this file can change the database.
   If it ever leaks: Google Cloud console > IAM & Admin > Service accounts > your account > Keys > delete it, then make a new one.
6. Load the sample data (Part 2, step 5). Do it only once: everyone shares the same database.

The free **Spark** plan is enough (no credit card). Photos are stored inside Firestore, so
Firebase Storage (which now needs the paid Blaze plan) is not used.

---

## Part 2. Run it on your laptop (everyone)

You need **XAMPP** with PHP 8.1 or newer. Node.js is no longer needed (no React, no build step).

1. Copy or clone the project to `C:\xampp\htdocs\road-accident-system`.
2. Put `firebase-service-account.json` in `road-accident-system\api\config\`.
3. Check PHP extensions: XAMPP Control Panel > Apache **Config** > `PHP (php.ini)`. Make sure these lines
   have **no `;`** in front, then save and restart Apache:
   ```
   extension=curl
   extension=gd
   extension=openssl
   extension=fileinfo
   ```
   While there, set `upload_max_filesize = 20M` and `post_max_size = 60M`.
4. Start **Apache** (MySQL is not needed any more). Open
   <http://localhost/road-accident-system/api/health.php>. Every line should say `ok`
   (`firestore` will say "no data yet" until step 5).
5. **Only John, once:** load the sample data. XAMPP Control Panel > **Shell**:
   ```
   cd C:\xampp\htdocs\road-accident-system
   php api\tools\seed.php
   ```
   To wipe everything and start over: `php api\tools\seed.php --reset`
6. Open the website: <http://localhost/road-accident-system/web/>

### Using VS Code

- Open the `road-accident-system` folder in VS Code and edit the files there; Apache serves them directly,
  so just refresh the browser. There is no `npm run dev` any more.
- **Live Server** extension: right-click `web/index.html` > *Open with Live Server*. It opens on port 5500,
  and `web/js/config.js` then sends API calls to XAMPP (`http://localhost/road-accident-system/api`),
  so keep Apache running.
- Recommended extensions: *PHP Intelephense* (PHP), *Dart* + *Flutter* (mobile).

### Test accounts (after seeding)

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@roadreport.test | Admin@123 |
| Traffic officer | officer@roadreport.test | Officer@123 |
| Traffic officer | officer2@roadreport.test | Officer@123 |
| Public user | reporter@roadreport.test | Reporter@123 |
| Public user | reporter2@roadreport.test | Reporter@123 |

---

## Part 3. Put it online

Both hosts get **the same files** and use **the same Firebase database**, so a report sent from
the app shows up on both websites.

| | Hostinger | InfinityFree |
| --- | --- | --- |
| Website for browsers | yes | yes |
| API for the **Flutter app** | **yes, use this one** | **no**: its free plan blocks apps (only browsers that run its JavaScript check get through) |
| Email notifications (SMTP) | yes | may be blocked; leave email off |

### Before uploading (both hosts)

Edit `api/config/config.php`:
- `'debug' => false`
- `'setup_key' => 'some-long-secret'` (only needed if you seed from the browser)

### Folder layout on the server

Upload so that it looks like this (the website's `js/config.js` finds the API at `/api` by itself):

```
public_html/  (Hostinger)   or   htdocs/  (InfinityFree)
├── index.html, login.html, ... all files from web/
├── css/  js/  favicon.svg
└── api/                      the whole api/ folder
    └── config/firebase-service-account.json    upload the key here
```

Do not upload `mobile/` or `docs/`. Upload `database/seed-data.json` (into `database/`) only if you
want to seed from the browser; the folder's `.htaccess` keeps it private.

### Hostinger

1. hPanel > **Websites > Manage > File Manager**, open `public_html`.
2. Upload the files as shown above (zip them, upload the zip, then **Extract** is fastest).
3. hPanel > **Advanced > PHP Configuration**: PHP **8.1 or newer**; in *PHP options* set
   `upload_max_filesize` 20M and `post_max_size` 60M. Extensions curl, gd, fileinfo, openssl are on by default.
4. Turn on **SSL** (hPanel > Security > SSL) so the site uses `https://`. Browsers only allow GPS on https.
5. Open `https://your-domain/api/health.php`: all `ok`.
6. Build the app against it:
   `flutter build apk --release --dart-define=API_URL=https://your-domain/api`

### InfinityFree

1. Create a hosting account and a free subdomain (for example `roadreport.infinityfreeapp.com`).
2. Control panel > **Online File Manager** (or FileZilla with the FTP details), open `htdocs`, delete the
   default `index2.html`, and upload the files as shown above.
3. Client area > **Free SSL certificates**: request one for your domain and install it, then use `https://`.
4. Open `https://your-subdomain/api/health.php` in the browser: all `ok`. (Opening it from a
   tool like Postman will fail; that is InfinityFree's browser check, not a bug.)
5. Use this address for the website only. The app must use the Hostinger API.

### Seeding without a command line

If nobody seeded from XAMPP, open once:
`https://your-domain/api/tools/seed.php?key=YOUR_SETUP_KEY` (needs `database/seed-data.json` uploaded).
For a real deployment without test accounts:
`.../seed.php?key=YOUR_SETUP_KEY&clean=1&admin_email=you@example.com&admin_password=YourPass123`

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| health.php: `Missing api/config/firebase-service-account.json` | Put the key file in `api/config/` with exactly that name |
| `Cannot reach Firebase: SSL certificate problem` | Keep `api/config/cacert.pem` (it ships with the project) |
| `Google login failed (HTTP 400) invalid_grant` | The computer's clock is wrong, or the key was deleted in Google Cloud. Fix the time / make a new key |
| `Firestore error 403 ... has not been used / is disabled` | Step 2 of Part 1 was skipped: create the Firestore database |
| `Firestore error 404 ... database (default) does not exist` | Same as above |
| Website says "Cannot reach the server" | Apache is off, or with Live Server the API address in `web/js/config.js` is wrong |
| Phone app: "Cannot reach the server" | On XAMPP use the laptop IP and the same Wi-Fi; online use the **Hostinger** address, not InfinityFree |
| Photos fail to upload on hosting | Raise `upload_max_filesize` / `post_max_size`; the website and app already shrink photos first |
| "Use my current location" does nothing online | The site must be on `https://` |
