import 'package:flutter/material.dart';

import '../config.dart';
import '../services/api.dart';
import '../theme.dart';
import 'report_form_screen.dart';

/// Home: the big "Report an Accident" button, shortcuts, emergency contacts. Owner: Alyana
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.onReportSent, required this.openTab});
  final VoidCallback onReportSent;
  final void Function(int tab) openTab;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final Future<List<Map<String, dynamic>>> _contacts = Api.instance.emergencyContacts();

  Future<void> _startReport() async {
    final sent = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const ReportFormScreen()),
    );
    if (sent == true) widget.onReportSent();
  }

  @override
  Widget build(BuildContext context) {
    final name = '${Api.instance.currentUser?['full_name'] ?? ''}'.split(' ').first;
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [
          Icon(Icons.warning_rounded, color: AppColors.lane),
          SizedBox(width: 8),
          Text(appName, style: TextStyle(fontWeight: FontWeight.w800)),
        ]),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Hi $name', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          // The one loud element: styled like a yellow warning sign
          Material(
            color: AppColors.lane,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.asphalt, width: 4),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: _startReport,
              child: const Padding(
                padding: EdgeInsets.fromLTRB(20, 26, 20, 22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Report an accident',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.asphalt)),
                    SizedBox(height: 4),
                    Text('Takes about 3 minutes. Photos are optional.',
                        style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.asphalt)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _Shortcut(icon: Icons.list_alt, label: 'My reports', onTap: () => widget.openTab(1))),
            const SizedBox(width: 12),
            Expanded(
                child: _Shortcut(icon: Icons.notifications, label: 'Notifications', onTap: () => widget.openTab(2))),
          ]),
          const SizedBox(height: 24),
          const Text('Emergency contacts', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          const Text('Call first if someone is hurt.', style: TextStyle(color: AppColors.muted)),
          const SizedBox(height: 8),
          FutureBuilder<List<Map<String, dynamic>>>(
            future: _contacts,
            builder: (context, snap) {
              if (snap.hasError) return Text('${snap.error}', style: const TextStyle(color: AppColors.siren));
              if (!snap.hasData) return const LinearProgressIndicator();
              return Panel(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    for (final c in snap.data!)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('${c['name']}'),
                        trailing: Text('${c['phone']}',
                            style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.guide, fontSize: 17)),
                        // TODO (Alyana, optional): open the dialer with the url_launcher package: tel:<number>
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _Shortcut extends StatelessWidget {
  const _Shortcut({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Panel(
        child: Row(children: [
          Icon(icon, color: AppColors.guide),
          const SizedBox(width: 8),
          Flexible(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
        ]),
      ),
    );
  }
}
