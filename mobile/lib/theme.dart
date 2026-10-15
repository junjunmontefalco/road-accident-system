import 'package:flutter/material.dart';

/// Same palette as the website (web/src/styles/app.css).
class AppColors {
  static const asphalt = Color(0xFF23272B);
  static const guide = Color(0xFF0F6B4C); // normal actions
  static const lane = Color(0xFFF2B705); // only the "Report an accident" action
  static const siren = Color(0xFFC8322B);
  static const kerb = Color(0xFFF4F5F3);
  static const line = Color(0xFFDFE2DE);
  static const muted = Color(0xFF5F676D);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.guide,
    primary: AppColors.guide,
    secondary: AppColors.lane,
    error: AppColors.siren,
    surface: Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.kerb,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.asphalt,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.line),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.guide,
        minimumSize: const Size.fromHeight(48),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
      ),
    ),
  );
}

/// White box with a thin border (used instead of Card so it looks the same on every Flutter version).
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.accent});
  final Widget child;
  final EdgeInsets padding;
  final Color? accent; // optional colored left edge

  @override
  Widget build(BuildContext context) {
    final box = BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppColors.line),
    );
    if (accent == null) {
      return Container(decoration: box, padding: padding, child: child);
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: Container(
        decoration: box,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: accent),
              Expanded(child: Padding(padding: padding, child: child)),
            ],
          ),
        ),
      ),
    );
  }
}
