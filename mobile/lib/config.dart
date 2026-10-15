/// Where the PHP API lives. The database is Firebase (Firestore), but the app never talks to
/// Firebase directly: it calls the PHP API, and only the API holds the Firebase key.
///
/// - Android emulator + XAMPP on the same laptop:  http://10.0.2.2/road-accident-system/api   (default)
/// - Real phone on the same Wi-Fi as the laptop:   http://<laptop IP>/road-accident-system/api
/// - Online (Hostinger):                           https://<your-domain>/api
///   Do NOT use the InfinityFree address here: InfinityFree blocks apps (it only lets browsers in).
///
/// Pass it when running or building, no code change needed:
///   flutter run --dart-define=API_URL=http://192.168.1.5/road-accident-system/api
///   flutter build apk --release --dart-define=API_URL=https://your-domain.com/api
const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2/road-accident-system/api',
);

const String appName = 'RoadReport';

/// Default map center: Malolos, Bulacan
const double defaultLat = 14.8433;
const double defaultLng = 120.8114;

/// Used until the server sends the admin's setting
const int maxPhotos = 5;

/// Photos are shrunk on the phone before upload (the server stores them inside Firestore,
/// about 1 MB each at most). 1280 px and quality 75 is plenty for evidence photos.
const double photoMaxSide = 1280;
const int photoQuality = 75;
