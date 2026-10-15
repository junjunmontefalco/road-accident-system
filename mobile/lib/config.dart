/// Where the PHP API lives. CHANGE THIS before running on a phone.
///
/// - Android emulator + XAMPP on the same laptop:  http://10.0.2.2/road-accident-system/api
/// - Real phone on the same Wi-Fi as the laptop:   http://<laptop IP>/road-accident-system/api
///   (find the IP with `ipconfig` on Windows, e.g. 192.168.1.5)
///
/// You can also pass it when running:  flutter run --dart-define=API_URL=http://192.168.1.5/road-accident-system/api
const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2/road-accident-system/api',
);

const String appName = 'RoadReport';

/// Default map center: Malolos, Bulacan
const double defaultLat = 14.8433;
const double defaultLng = 120.8114;

const int maxPhotos = 5;
