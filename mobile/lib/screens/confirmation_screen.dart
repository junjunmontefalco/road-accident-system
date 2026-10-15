import 'package:flutter/material.dart';

import '../theme.dart';
import 'report_detail_screen.dart';

/// Submission confirmation with the report ID. Owner: Alyana
class ConfirmationScreen extends StatelessWidget {
  const ConfirmationScreen({super.key, required this.report});
  final Map<String, dynamic> report;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report sent'), automaticallyImplyLeading: false),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 24),
            const Icon(Icons.check_circle, color: AppColors.guide, size: 72),
            const SizedBox(height: 12),
            const Text('Report sent',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
            const Text('Keep this ID. You can use it to follow your report.',
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
            const SizedBox(height: 20),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.lane,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.asphalt, width: 3),
                ),
                child: Text('${report['report_code']}',
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.asphalt)),
              ),
            ),
            const Spacer(),
            FilledButton(
              onPressed: () => Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => ReportDetailScreen(reportId: report['id'] as int)),
              ),
              child: const Text('View report status'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Back to home'),
            ),
          ],
        ),
      ),
    );
  }
}
