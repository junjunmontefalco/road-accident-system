import 'package:flutter/material.dart';

import '../theme.dart';

/// Same status codes and colors as the website.
class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status, required this.label});
  final String status;
  final String label;

  static const _colors = <String, List<Color>>{
    'submitted': [Color(0xFFEEF0F2), Color(0xFF3B4248)],
    'under_review': [Color(0xFFE7F0FB), Color(0xFF1F4F8A)],
    'info_required': [Color(0xFFFFF3CD), Color(0xFF6B4F00)],
    'verified': [Color(0xFFDEF2E7), Color(0xFF0B5039)],
    'assigned': [Color(0xFFE9E6F8), Color(0xFF43378C)],
    'in_progress': [Color(0xFFFDE9D7), Color(0xFF8A4310)],
    'resolved': [AppColors.guide, Colors.white],
    'rejected': [Color(0xFFF9E0DE), Color(0xFF8F201A)],
  };

  @override
  Widget build(BuildContext context) {
    final c = _colors[status] ?? _colors['submitted']!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: c[0], borderRadius: BorderRadius.circular(4)),
      child: Text(label, style: TextStyle(color: c[1], fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
