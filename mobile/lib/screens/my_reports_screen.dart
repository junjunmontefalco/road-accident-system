import 'package:flutter/material.dart';

import '../services/api.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/status_badge.dart';
import 'report_detail_screen.dart';

/// FR-06 report history and tracking. Owner: Alyana
class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});
  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  late Future<List<Map<String, dynamic>>> _future = Api.instance.myReports();

  Future<void> _reload() async {
    setState(() => _future = Api.instance.myReports());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My reports')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) {
            return Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('${snap.error}')));
          }
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final reports = snap.data!;
          if (reports.isEmpty) {
            return const Center(child: Text('You have not sent any reports yet.'));
          }
          return RefreshIndicator(
            onRefresh: _reload,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: reports.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final r = reports[i];
                return InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () => Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => ReportDetailScreen(reportId: r['id'] as int))),
                  child: Panel(
                    accent: AppColors.guide,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Expanded(
                            child: Text('${r['report_code']}',
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                          ),
                          StatusBadge(status: '${r['status']}', label: '${r['status_label']}'),
                        ]),
                        const SizedBox(height: 4),
                        Text('${r['accident_type']}, ${r['location_text']}'),
                        Text('${formatDate(r['accident_date'])} at ${formatTime(r['accident_time'])}',
                            style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
