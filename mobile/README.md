# RoadReport mobile app (Flutter)

Owner: **Castaneda, Alyana**

This folder holds the app code (`lib/`) and its packages (`pubspec.yaml`). The Android and iOS project
folders are generated on your computer by Flutter, then you add the permissions below.

> This code was written without a Flutter SDK available, so it has **not been compiled yet**.
> Your first job is steps 1 to 4 below. If `flutter analyze` shows errors, fix them first
> (usually a package version difference), then tell John.

## 1. Generate the platform folders

```bash
cd mobile
flutter create --org ph.edu.bulsu --project-name roadreport_mobile --platforms android,ios .
```

`flutter create .` only adds missing files. It keeps our `lib/` and `pubspec.yaml`.
If it replaced `lib/main.dart` with the counter demo, restore ours from Git: `git checkout lib/main.dart`.

## 2. Android permissions

Open `android/app/src/main/AndroidManifest.xml`.

Add these lines above `<application`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

Add this attribute inside the `<application ...>` tag, because XAMPP serves plain `http://`:

```xml
android:usesCleartextTraffic="true"
```

## 3. iOS permissions (only if someone tests on an iPhone)

Add to `ios/Runner/Info.plist` inside `<dict>`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Used to pin where the accident happened.</string>
<key>NSCameraUsageDescription</key>
<string>Used to take photos of the accident scene.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Used to attach photos of the accident.</string>
```

## 4. Install packages and check

```bash
flutter pub get
flutter analyze
```

## 5. Point the app at the API

Edit `lib/config.dart`, or pass the address when running:

| Where the app runs | API address |
| --- | --- |
| Android emulator, XAMPP on the same laptop | `http://10.0.2.2/road-accident-system/api` (default) |
| Real phone on the same Wi-Fi as the laptop | `http://<laptop IP>/road-accident-system/api` |

```bash
flutter run --dart-define=API_URL=http://192.168.1.5/road-accident-system/api
```

Find the laptop IP with `ipconfig` (Windows). If the phone cannot connect, allow Apache through
Windows Firewall for private networks.

Test account: `reporter@roadreport.test` / `Reporter@123`

## 6. Build the APK for the demo

```bash
flutter build apk --release --dart-define=API_URL=http://<laptop IP>/road-accident-system/api
```

The file is `build/app/outputs/flutter-apk/app-release.apk`.

## What already works

| Screen | File | Requirement |
| --- | --- | --- |
| Login, register | `screens/login_screen.dart`, `register_screen.dart` | FR-01, FR-02 |
| Home with Report an Accident button and emergency contacts | `screens/home_screen.dart` | Interface A |
| Report form: details, GPS + map pin, camera/gallery photos | `screens/report_form_screen.dart` | FR-03, FR-04, FR-05 |
| Confirmation with Report ID | `screens/confirmation_screen.dart` | Interface A |
| My reports and status timeline | `screens/my_reports_screen.dart`, `report_detail_screen.dart` | FR-06 |
| Notifications | `screens/notifications_screen.dart` | FR-09 |

## Still to do (Alyana)

- [ ] Run steps 1 to 4 and fix any analyzer errors
- [ ] Test the full flow on a real phone over Wi-Fi
- [ ] Tap an emergency number to call it (`url_launcher` package)
- [ ] Unread notification count on the bottom bar
- [ ] Optional: edit profile, push notifications (Firebase Cloud Messaging)
