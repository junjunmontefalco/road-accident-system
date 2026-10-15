import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../config.dart';
import '../services/api.dart';
import '../theme.dart';

/// Answer "Additional Information Required": the missing details + more photos.
/// The report goes back to "Under Review". Owner: Alyana
class AddInfoScreen extends StatefulWidget {
  const AddInfoScreen({super.key, required this.report});
  final Map<String, dynamic> report;
  @override
  State<AddInfoScreen> createState() => _AddInfoScreenState();
}

class _AddInfoScreenState extends State<AddInfoScreen> {
  final _message = TextEditingController();
  final _picker = ImagePicker();
  final List<XFile> _photos = [];
  bool _busy = false;
  String? _error;
  Map<String, String> _errors = {};

  int get _room => maxPhotos - ((widget.report['photos'] as List?)?.length ?? 0) - _photos.length;

  /// What the traffic office asked for (the note of the last "info_required" step).
  String? get _question {
    final history = (widget.report['history'] as List?) ?? [];
    for (final h in history.reversed) {
      if (h['status'] == 'info_required' && h['note'] != null) return '${h['note']}';
    }
    return null;
  }

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _addPhoto(ImageSource source) async {
    if (_room <= 0) return;
    try {
      final f = await _picker.pickImage(
          source: source, imageQuality: photoQuality, maxWidth: photoMaxSide, maxHeight: photoMaxSide);
      if (f != null) setState(() => _photos.add(f));
    } catch (e) {
      setState(() => _error = 'Could not open the camera or gallery: $e');
    }
  }

  Future<void> _send() async {
    if (_message.text.trim().length < 5) {
      setState(() => _errors = {'message': 'Write the missing details'});
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
      _errors = {};
    });
    try {
      await Api.instance.addInfo(
          widget.report['id'] as int, _message.text.trim(), _photos.map((p) => p.path).toList());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Information sent')));
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _errors = e.errors;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _question;
    return Scaffold(
      appBar: AppBar(title: Text('More info: ${widget.report['report_code']}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (q != null)
            Panel(
              accent: AppColors.lane,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('The traffic office asked:', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(q),
              ]),
            ),
          const SizedBox(height: 16),
          if (_error != null) Text(_error!, style: const TextStyle(color: AppColors.siren)),
          TextField(
            controller: _message,
            maxLines: 5,
            decoration: InputDecoration(labelText: 'Your answer', errorText: _errors['message'], alignLabelWithHint: true),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _room <= 0 ? null : () => _addPhoto(ImageSource.camera),
                icon: const Icon(Icons.photo_camera),
                label: const Text('Camera'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _room <= 0 ? null : () => _addPhoto(ImageSource.gallery),
                icon: const Icon(Icons.photo_library),
                label: const Text('Gallery'),
              ),
            ),
          ]),
          if (_errors['photos'] != null)
            Text(_errors['photos']!, style: const TextStyle(color: AppColors.siren)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (var i = 0; i < _photos.length; i++)
              Stack(children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(File(_photos[i].path), width: 96, height: 96, fit: BoxFit.cover),
                ),
                Positioned(
                  right: 2,
                  top: 2,
                  child: InkWell(
                    onTap: () => setState(() => _photos.removeAt(i)),
                    child: const CircleAvatar(radius: 12, backgroundColor: Colors.black54,
                        child: Icon(Icons.close, size: 14, color: Colors.white)),
                  ),
                ),
              ]),
          ]),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'Sending…' : 'Send information'),
          ),
        ],
      ),
    );
  }
}
