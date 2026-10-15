import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../services/api.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/status_badge.dart';
import 'add_info_screen.dart';

/// One report with its status timeline (FR-06). Owner: Alyana
class ReportDetailScreen extends StatefulWidget {
  const ReportDetailScreen({super.key, required this.reportId});
  final int reportId;
  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  late Future<Map<String, dynamic>> _future = Api.instance.report(widget.reportId);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report details')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final r = snap.data!;
          final history = List<Map<String, dynamic>>.from((r['history'] as List).map((e) => Map<String, dynamic>.from(e)));
          final photos = List<Map<String, dynamic>>.from((r['photos'] as List).map((e) => Map<String, dynamic>.from(e)));
          final remarks = List<Map<String, dynamic>>.from((r['remarks'] as List).map((e) => Map<String, dynamic>.from(e)));
          final vehicles = (r['vehicles'] as List).map((v) => '${v['quantity']} ${v['type']}').join(', ');
          final lat = (r['latitude'] as num?)?.toDouble();
          final lng = (r['longitude'] as num?)?.toDouble();

          return RefreshIndicator(
            onRefresh: () async {
              setState(() => _future = Api.instance.report(widget.reportId));
              await _future;
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('${r['report_code']}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Row(children: [
                  StatusBadge(status: '${r['status']}', label: '${r['status_label']}'),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      r['is_official_record'] == true ? 'Verified accident record' : 'Not yet verified',
                      style: TextStyle(
                        color: r['is_official_record'] == true ? AppColors.guide : AppColors.muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ]),
                if (r['status'] == 'info_required') ...[
                  const SizedBox(height: 12),
                  Panel(
                    accent: AppColors.lane,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      const Text('The traffic office needs more information',
                          style: TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: () async {
                          final sent = await Navigator.of(context).push<bool>(
                              MaterialPageRoute(builder: (_) => AddInfoScreen(report: r)));
                          if (sent == true) setState(() => _future = Api.instance.report(widget.reportId));
                        },
                        child: const Text('Send the missing information'),
                      ),
                    ]),
                  ),
                ],
                if (r['status'] == 'rejected' && r['rejection_reason'] != null) ...[
                  const SizedBox(height: 8),
                  Text('Rejected: ${r['rejection_reason']}', style: const TextStyle(color: AppColors.siren)),
                ],
                const SizedBox(height: 16),
                Panel(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _row('When', '${formatDate(r['accident_date'])} at ${formatTime(r['accident_time'])}'),
                    _row('Type', '${r['accident_type']}'),
                    _row('Injuries', '${r['injury_label']}'),
                    _row('Vehicles', vehicles.isEmpty ? 'None listed' : vehicles),
                    _row('Location',
                        [r['location_text'], r['barangay'], r['municipality']].where((s) => s != null && '$s'.isNotEmpty).join(', ')),
                    _row('What happened', '${r['description']}'),
                    if (r['assigned_officer'] != null) _row('Officer', '${r['assigned_officer']['name']}'),
                  ]),
                ),
                if (lat != null && lng != null) ...[
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      height: 200,
                      child: FlutterMap(
                        options: MapOptions(
                          initialCenter: LatLng(lat, lng),
                          initialZoom: 16,
                          interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'ph.edu.bulsu.roadreport',
                          ),
                          MarkerLayer(markers: [
                            Marker(
                              point: LatLng(lat, lng),
                              width: 40,
                              height: 40,
                              alignment: Alignment.topCenter,
                              child: const Icon(Icons.location_pin, color: AppColors.siren, size: 40),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ],
                if (photos.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('Photos', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 110,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: photos.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) => ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        // The URL already carries the login token
                        child: Image.network('${photos[i]['url']}', width: 110, height: 110, fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                                width: 110, color: AppColors.line, child: const Icon(Icons.broken_image))),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                const Text('Status history', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                const SizedBox(height: 8),
                for (var i = 0; i < history.length; i++)
                  _TimelineItem(item: history[i], isCurrent: i == history.length - 1, isLast: i == history.length - 1),
                if (remarks.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('Updates from the traffic office', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                  for (final m in remarks)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('${m['content']}'),
                      subtitle: Text(
                          '${m['type'] == 'reporter_info' ? 'You' : (m['officer'] ?? '')}, ${formatDateTime(m['date'])}'),
                    ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
          Text(value),
        ]),
      );
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem({required this.item, required this.isCurrent, required this.isLast});
  final Map<String, dynamic> item;
  final bool isCurrent;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(
          width: 24,
          child: Column(children: [
            Container(
              margin: const EdgeInsets.only(top: 4),
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: isCurrent ? AppColors.guide : AppColors.line,
                shape: BoxShape.circle,
              ),
            ),
            if (!isLast) Expanded(child: Container(width: 2, color: AppColors.line)),
          ]),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                StatusBadge(status: '${item['status']}', label: '${item['status_label']}'),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(formatDateTime(item['date']), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                ),
              ]),
              if (item['note'] != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('${item['note']}')),
            ]),
          ),
        ),
      ]),
    );
  }
}
