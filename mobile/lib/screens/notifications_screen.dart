import 'package:flutter/material.dart';

import '../services/api.dart';
import '../theme.dart';
import '../utils/format.dart';
import 'report_detail_screen.dart';

/// FR-09 notifications. Owner: Alyana
/// The bottom bar shows the unread count; [onChanged] refreshes it after marking items read.
/// Optional extra: real push notifications with Firebase Cloud Messaging (see mobile/README.md).
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.onChanged});
  final VoidCallback? onChanged;
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<Map<String, dynamic>> _future = Api.instance.notifications();

  Future<void> _reload() async {
    setState(() => _future = Api.instance.notifications());
    await _future;
    widget.onChanged?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await Api.instance.markRead();
              _reload();
            },
            child: const Text('Mark all read', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final items = List<Map<String, dynamic>>.from((snap.data!['items'] as List).map((e) => Map<String, dynamic>.from(e)));
          if (items.isEmpty) return const Center(child: Text('No notifications yet.'));
          return RefreshIndicator(
            onRefresh: _reload,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final n = items[i];
                final unread = n['is_read'] != true;
                return InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () async {
                    if (unread) await Api.instance.markRead(id: n['id'] as int);
                    if (!context.mounted) return;
                    if (n['report_id'] != null) {
                      await Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => ReportDetailScreen(reportId: n['report_id'] as int)));
                    }
                    _reload();
                  },
                  child: Panel(
                    accent: unread ? AppColors.lane : null,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${n['title']}', style: TextStyle(fontWeight: unread ? FontWeight.w800 : FontWeight.w600)),
                      Text('${n['message']}'),
                      Text(formatDateTime(n['date']), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                    ]),
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
