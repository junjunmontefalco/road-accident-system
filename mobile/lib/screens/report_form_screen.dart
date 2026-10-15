import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../config.dart';
import '../services/api.dart';
import '../theme.dart';
import '../utils/format.dart';
import 'confirmation_screen.dart';

/// FR-03, FR-04, FR-05: report an accident in three steps.
/// Owner: Alyana. Field names match api/reports/create.php
class ReportFormScreen extends StatefulWidget {
  const ReportFormScreen({super.key});
  @override
  State<ReportFormScreen> createState() => _ReportFormScreenState();
}

class _ReportFormScreenState extends State<ReportFormScreen> {
  int _step = 0;
  bool _busy = false;
  String? _message;
  Map<String, String> _errors = {};

  // Options from GET /accident-types/list.php
  List<Map<String, dynamic>> _types = [];
  List<Map<String, dynamic>> _injuries = [];
  List<String> _vehicleTypes = ['Car', 'Motorcycle', 'Jeepney', 'Tricycle', 'Truck', 'Bus', 'Bicycle', 'Other'];

  // Step 1: details
  DateTime _date = DateTime.now();
  TimeOfDay _time = TimeOfDay.now();
  int? _typeId;
  String? _injury;
  final _description = TextEditingController();
  final List<Map<String, dynamic>> _vehicles = [
    {'type': 'Car', 'quantity': 1},
  ];

  // Step 2: location
  final _mapController = MapController();
  LatLng? _point;
  bool _locating = false;
  final _locationText = TextEditingController();
  final _barangay = TextEditingController();
  final _municipality = TextEditingController();

  // Step 3: photos
  final _picker = ImagePicker();
  final List<XFile> _photos = [];
  int _maxPhotos = maxPhotos; // the admin can change it; the server sends the current limit

  @override
  void initState() {
    super.initState();
    Api.instance.formOptions().then((o) {
      if (!mounted) return;
      setState(() {
        _types = List<Map<String, dynamic>>.from((o['accident_types'] as List).map((e) => Map<String, dynamic>.from(e)));
        _injuries = List<Map<String, dynamic>>.from((o['injury_options'] as List).map((e) => Map<String, dynamic>.from(e)));
        _vehicleTypes = List<String>.from(o['vehicle_types'] as List);
        _maxPhotos = (o['max_photos'] as num?)?.toInt() ?? maxPhotos;
      });
    }).catchError((e) {
      if (mounted) setState(() => _message = '$e');
    });
  }

  @override
  void dispose() {
    _description.dispose();
    _locationText.dispose();
    _barangay.dispose();
    _municipality.dispose();
    super.dispose();
  }

  // ---------- validation ----------

  bool _checkStep(int s) {
    final e = <String, String>{};
    if (s == 0) {
      if (_typeId == null) e['accident_type_id'] = 'Choose the accident type';
      if (_injury == null) e['injury_status'] = 'Choose an injury option';
      if (_description.text.trim().length < 10) e['description'] = 'Describe what happened (at least 10 characters)';
    }
    if (s == 1 && _locationText.text.trim().length < 3) e['location_text'] = 'Enter the road, street or landmark';
    setState(() => _errors = e);
    return e.isEmpty;
  }

  static const _stepOfField = {
    'accident_date': 0, 'accident_time': 0, 'accident_type_id': 0, 'injury_status': 0, 'description': 0,
    'vehicles': 0, 'location_text': 1, 'latitude': 1, 'photos': 2,
  };

  // ---------- GPS ----------

  Future<void> _useGps() async {
    setState(() {
      _locating = true;
      _message = null;
    });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw 'Turn on Location in your phone settings, or tap the map.';
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        throw 'Location permission was denied. Tap the map to place the pin instead.';
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final p = LatLng(pos.latitude, pos.longitude);
      setState(() => _point = p);
      try {
        _mapController.move(p, 17);
      } catch (_) {/* map not on screen yet; it opens centered on the pin */}
    } catch (e) {
      setState(() => _message = '$e');
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  // ---------- photos ----------

  Future<void> _addPhoto(ImageSource source) async {
    if (_photos.length >= _maxPhotos) return;
    try {
      if (source == ImageSource.camera) {
        final f = await _picker.pickImage(source: source, imageQuality: photoQuality, maxWidth: photoMaxSide, maxHeight: photoMaxSide);
        if (f != null) setState(() => _photos.add(f));
      } else {
        final files = await _picker.pickMultiImage(imageQuality: photoQuality, maxWidth: photoMaxSide, maxHeight: photoMaxSide);
        setState(() => _photos.addAll(files.take(_maxPhotos - _photos.length)));
      }
    } catch (e) {
      setState(() => _message = 'Could not open the camera or gallery: $e');
    }
  }

  // ---------- submit ----------

  Future<void> _submit() async {
    if (!_checkStep(0)) {
      setState(() => _step = 0);
      return;
    }
    if (!_checkStep(1)) {
      setState(() => _step = 1);
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    final vehiclesJson = jsonEncode(_vehicles.where((v) => (v['quantity'] as int) > 0).toList());
    final fields = <String, String>{
      'accident_date': isoDate(_date),
      'accident_time': hhmm(_time.hour, _time.minute),
      'accident_type_id': '$_typeId',
      'injury_status': _injury ?? 'unknown',
      'description': _description.text.trim(),
      'location_text': _locationText.text.trim(),
      'barangay': _barangay.text.trim(),
      'municipality': _municipality.text.trim(),
      'vehicles': vehiclesJson,
      if (_point != null) 'latitude': _point!.latitude.toStringAsFixed(7),
      if (_point != null) 'longitude': _point!.longitude.toStringAsFixed(7),
    };
    try {
      final report = await Api.instance.submitReport(fields, _photos.map((p) => p.path).toList());
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ConfirmationScreen(report: report)));
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() {
        _errors = e.errors;
        _message = e.message;
        final first = e.errors.keys.isEmpty ? null : e.errors.keys.first;
        if (first != null && _stepOfField.containsKey(first)) _step = _stepOfField[first]!;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ---------- UI ----------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report an accident')),
      body: Column(
        children: [
          if (_message != null)
            Container(
              width: double.infinity,
              color: const Color(0xFFF9E0DE),
              padding: const EdgeInsets.all(12),
              child: Text(_message!, style: const TextStyle(color: Color(0xFF8F201A))),
            ),
          Expanded(
            child: Stepper(
              type: StepperType.horizontal,
              currentStep: _step,
              onStepTapped: (s) {
                if (s < _step || _checkStep(_step)) setState(() => _step = s);
              },
              controlsBuilder: (context, details) => Padding(
                padding: const EdgeInsets.only(top: 20),
                child: Row(children: [
                  if (_step > 0)
                    OutlinedButton(onPressed: _busy ? null : details.onStepCancel, child: const Text('Back')),
                  const Spacer(),
                  if (_step < 2)
                    FilledButton(
                      style: FilledButton.styleFrom(minimumSize: const Size(140, 48)),
                      onPressed: details.onStepContinue,
                      child: Text(_step == 0 ? 'Next: Location' : 'Next: Photos'),
                    )
                  else
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.lane,
                        foregroundColor: AppColors.asphalt,
                        minimumSize: const Size(160, 48),
                        side: const BorderSide(color: AppColors.asphalt, width: 2),
                      ),
                      onPressed: _busy ? null : _submit,
                      child: Text(_busy ? 'Sending…' : 'Send report'),
                    ),
                ]),
              ),
              onStepContinue: () {
                if (_checkStep(_step)) setState(() => _step++);
              },
              onStepCancel: () => setState(() => _step--),
              steps: [
                Step(title: const Text('Details'), isActive: _step >= 0, content: _detailsStep()),
                Step(title: const Text('Location'), isActive: _step >= 1, content: _locationStep()),
                Step(title: const Text('Photos'), isActive: _step >= 2, content: _photosStep()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              icon: const Icon(Icons.calendar_today, size: 18),
              label: Text(formatDate(isoDate(_date))),
              onPressed: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime.now().subtract(const Duration(days: 365)),
                  lastDate: DateTime.now(),
                );
                if (d != null) setState(() => _date = d);
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              icon: const Icon(Icons.schedule, size: 18),
              label: Text(formatTime(hhmm(_time.hour, _time.minute))),
              onPressed: () async {
                final t = await showTimePicker(context: context, initialTime: _time);
                if (t != null) setState(() => _time = t);
              },
            ),
          ),
        ]),
        if (_errors['accident_date'] != null || _errors['accident_time'] != null)
          Text(_errors['accident_date'] ?? _errors['accident_time']!, style: const TextStyle(color: AppColors.siren)),
        const SizedBox(height: 16),
        DropdownButtonFormField<int>(
          value: _typeId,
          decoration: InputDecoration(labelText: 'Type of accident', errorText: _errors['accident_type_id']),
          items: [for (final t in _types) DropdownMenuItem(value: t['id'] as int, child: Text('${t['name']}'))],
          onChanged: (v) => setState(() => _typeId = v),
        ),
        const SizedBox(height: 16),
        const Text('Injuries or fatalities', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            for (final o in _injuries)
              ChoiceChip(
                label: Text('${o['label']}'),
                selected: _injury == o['value'],
                onSelected: (_) => setState(() => _injury = o['value'] as String),
              ),
          ],
        ),
        if (_errors['injury_status'] != null)
          Text(_errors['injury_status']!, style: const TextStyle(color: AppColors.siren)),
        const SizedBox(height: 16),
        const Text('Vehicles involved', style: TextStyle(fontWeight: FontWeight.w600)),
        for (var i = 0; i < _vehicles.length; i++)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _vehicleTypes.contains(_vehicles[i]['type']) ? _vehicles[i]['type'] as String : null,
                  items: [for (final t in _vehicleTypes) DropdownMenuItem(value: t, child: Text(t))],
                  onChanged: (v) => setState(() => _vehicles[i]['type'] = v),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.remove_circle_outline),
                onPressed: () => setState(() {
                  final q = _vehicles[i]['quantity'] as int;
                  if (q > 1) _vehicles[i]['quantity'] = q - 1;
                }),
              ),
              Text('${_vehicles[i]['quantity']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              IconButton(
                icon: const Icon(Icons.add_circle_outline),
                onPressed: () => setState(() => _vehicles[i]['quantity'] = (_vehicles[i]['quantity'] as int) + 1),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                tooltip: 'Remove vehicle',
                onPressed: () => setState(() => _vehicles.removeAt(i)),
              ),
            ]),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            onPressed: () => setState(() => _vehicles.add({'type': 'Motorcycle', 'quantity': 1})),
            child: const Text('Add another vehicle'),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _description,
          maxLines: 4,
          decoration: InputDecoration(
            labelText: 'What happened?',
            alignLabelWithHint: true,
            hintText: 'Example: A tricycle was hit from behind while turning into the market road.',
            errorText: _errors['description'],
          ),
        ),
      ],
    );
  }

  Widget _locationStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton.icon(
          onPressed: _locating ? null : _useGps,
          icon: const Icon(Icons.my_location),
          label: Text(_locating ? 'Finding your location…' : 'Use my current location'),
        ),
        const SizedBox(height: 4),
        Text(
          _point == null
              ? 'Or tap the map where the accident happened.'
              : 'Pinned at ${_point!.latitude.toStringAsFixed(5)}, ${_point!.longitude.toStringAsFixed(5)}',
          style: const TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            height: 280,
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _point ?? const LatLng(defaultLat, defaultLng),
                initialZoom: 13,
                onTap: (tapPosition, latLng) => setState(() => _point = latLng),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'ph.edu.bulsu.roadreport',
                ),
                if (_point != null)
                  MarkerLayer(markers: [
                    Marker(
                      point: _point!,
                      width: 44,
                      height: 44,
                      alignment: Alignment.topCenter,
                      child: const Icon(Icons.location_pin, color: AppColors.siren, size: 44),
                    ),
                  ]),
                const RichAttributionWidget(attributions: [TextSourceAttribution('OpenStreetMap contributors')]),
              ],
            ),
          ),
        ),
        if (_errors['latitude'] != null) Text(_errors['latitude']!, style: const TextStyle(color: AppColors.siren)),
        const SizedBox(height: 16),
        TextField(
          controller: _locationText,
          decoration: InputDecoration(
            labelText: 'Road, street or landmark',
            hintText: 'Example: MacArthur Highway in front of the market',
            errorText: _errors['location_text'],
          ),
        ),
        const SizedBox(height: 12),
        TextField(controller: _barangay, decoration: const InputDecoration(labelText: 'Barangay')),
        const SizedBox(height: 12),
        TextField(controller: _municipality, decoration: const InputDecoration(labelText: 'City or municipality')),
      ],
    );
  }

  Widget _photosStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _photos.length >= _maxPhotos ? null : () => _addPhoto(ImageSource.camera),
              icon: const Icon(Icons.photo_camera),
              label: const Text('Take photo'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _photos.length >= _maxPhotos ? null : () => _addPhoto(ImageSource.gallery),
              icon: const Icon(Icons.photo_library),
              label: const Text('From gallery'),
            ),
          ),
        ]),
        const SizedBox(height: 6),
        Text('Optional. Up to $_maxPhotos photos.', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
        if (_errors['photos'] != null) Text(_errors['photos']!, style: const TextStyle(color: AppColors.siren)),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          children: [
            for (var i = 0; i < _photos.length; i++)
              Stack(fit: StackFit.expand, children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(File(_photos[i].path), fit: BoxFit.cover),
                ),
                Positioned(
                  top: 2,
                  right: 2,
                  child: IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: AppColors.asphalt, minimumSize: const Size(30, 30)),
                    iconSize: 16,
                    tooltip: 'Remove photo',
                    onPressed: () => setState(() => _photos.removeAt(i)),
                    icon: const Icon(Icons.close),
                  ),
                ),
              ]),
          ],
        ),
        const SizedBox(height: 16),
        const Text('Check before sending', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text('When: ${formatDate(isoDate(_date))}, ${formatTime(hhmm(_time.hour, _time.minute))}'),
        Text('Type: ${_types.where((t) => t['id'] == _typeId).map((t) => t['name']).join()}'),
        Text('Where: ${[_locationText.text, _barangay.text, _municipality.text].where((s) => s.trim().isNotEmpty).join(', ')}'
            '${_point == null ? ' (no map pin)' : ' (pinned on map)'}'),
        Text('Vehicles: ${_vehicles.map((v) => '${v['quantity']} ${v['type']}').join(', ')}'),
      ],
    );
  }
}
