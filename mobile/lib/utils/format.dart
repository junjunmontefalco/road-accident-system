const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/// "2026-10-14" -> "Oct 14, 2026"
String formatDate(String? iso) {
  if (iso == null || iso.length < 10) return '';
  final y = iso.substring(0, 4);
  final m = int.tryParse(iso.substring(5, 7)) ?? 1;
  final d = int.tryParse(iso.substring(8, 10)) ?? 1;
  return '${_months[m - 1]} $d, $y';
}

/// "14:35" -> "2:35 PM"
String formatTime(String? hhmm) {
  if (hhmm == null || hhmm.length < 5) return '';
  final h = int.tryParse(hhmm.substring(0, 2)) ?? 0;
  final m = hhmm.substring(3, 5);
  final h12 = ((h + 11) % 12) + 1;
  return '$h12:$m ${h < 12 ? 'AM' : 'PM'}';
}

/// "2026-10-14 14:35:00" -> "Oct 14, 2026, 2:35 PM"
String formatDateTime(String? s) {
  if (s == null || s.length < 16) return formatDate(s);
  return '${formatDate(s)}, ${formatTime(s.substring(11, 16))}';
}

String isoDate(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

String hhmm(int hour, int minute) => '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
