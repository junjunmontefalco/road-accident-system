import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

/// Thrown when the API answers { success: false }. [errors] holds field messages.
class ApiException implements Exception {
  ApiException(this.message, {this.status = 0, this.errors = const {}});
  final String message;
  final int status;
  final Map<String, String> errors;
  @override
  String toString() => message;
}

/// One place for every API call (same endpoints as the website).
/// Owner: Alyana. Endpoint list: docs/API_CONTRACT.md
class Api {
  Api._();
  static final Api instance = Api._();

  static const _tokenKey = 'rr_token';
  String? _token;
  Map<String, dynamic>? currentUser;

  bool get isLoggedIn => _token != null && currentUser != null;
  String? get token => _token;

  // ---------- session ----------

  /// Called on app start: loads the saved token and checks it still works.
  Future<bool> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    if (_token == null) return false;
    try {
      currentUser = Map<String, dynamic>.from(await get('/auth/me.php'));
      return true;
    } catch (_) {
      await _saveToken(null);
      return false;
    }
  }

  Future<void> _saveToken(String? t) async {
    _token = t;
    final prefs = await SharedPreferences.getInstance();
    if (t == null) {
      await prefs.remove(_tokenKey);
      currentUser = null;
    } else {
      await prefs.setString(_tokenKey, t);
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await post('/auth/login.php', {'email': email, 'password': password, 'device': 'mobile'});
    await _saveToken(data['token'] as String);
    currentUser = Map<String, dynamic>.from(data['user']);
    return currentUser!;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> fields) async {
    final data = await post('/auth/register.php', {...fields, 'device': 'mobile'});
    await _saveToken(data['token'] as String);
    currentUser = Map<String, dynamic>.from(data['user']);
    return currentUser!;
  }

  Future<void> logout() async {
    try {
      await post('/auth/logout.php', {});
    } catch (_) {/* token may already be expired */}
    await _saveToken(null);
  }

  // ---------- low-level calls ----------

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, [Map<String, String>? query]) {
    final uri = Uri.parse('$apiBaseUrl$path');
    return query == null ? uri : uri.replace(queryParameters: {...uri.queryParameters, ...query});
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send(() => http.get(_uri(path, query), headers: _headers));

  Future<dynamic> post(String path, Map<String, dynamic> body) => _send(() => http.post(
        _uri(path),
        headers: {..._headers, 'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ));

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    http.Response res;
    try {
      res = await request().timeout(const Duration(seconds: 30));
    } on SocketException {
      throw ApiException('Cannot reach the server at $apiBaseUrl. Check the Wi-Fi and the API address in lib/config.dart.');
    } on HttpException {
      throw ApiException('Connection problem. Try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Connection problem: $e');
    }
    return _decode(res.statusCode, res.body);
  }

  dynamic _decode(int status, String body) {
    Map<String, dynamic> json;
    try {
      json = Map<String, dynamic>.from(jsonDecode(body));
    } catch (_) {
      throw ApiException('The server did not send JSON (HTTP $status). Check the PHP file for errors.', status: status);
    }
    if (status == 401 && _token != null) {
      _saveToken(null);
    }
    if (json['success'] != true) {
      final errs = <String, String>{};
      if (json['errors'] is Map) {
        (json['errors'] as Map).forEach((k, v) => errs['$k'] = '$v');
      }
      throw ApiException('${json['message'] ?? 'Request failed'}', status: status, errors: errs);
    }
    return json['data'];
  }

  // ---------- reports ----------

  Future<Map<String, dynamic>> formOptions() async =>
      Map<String, dynamic>.from(await get('/accident-types/list.php'));

  Future<List<Map<String, dynamic>>> myReports() async =>
      List<Map<String, dynamic>>.from((await get('/reports/mine.php') as List).map((e) => Map<String, dynamic>.from(e)));

  Future<Map<String, dynamic>> report(int id) async =>
      Map<String, dynamic>.from(await get('/reports/view.php', query: {'id': '$id'}));

  /// FR-03/04/05: multipart upload with photos. Field names match api/reports/create.php
  Future<Map<String, dynamic>> submitReport(Map<String, String> fields, List<String> photoPaths) async {
    final req = http.MultipartRequest('POST', _uri('/reports/create.php'));
    req.headers.addAll(_headers);
    req.fields.addAll({...fields, 'source': 'mobile'});
    for (final p in photoPaths) {
      req.files.add(await http.MultipartFile.fromPath('photos[]', p));
    }
    return Map<String, dynamic>.from(await _send(() async => http.Response.fromStream(await req.send())));
  }

  Future<Map<String, dynamic>> notifications() async => Map<String, dynamic>.from(await get('/notifications/list.php'));

  Future<void> markRead({int? id}) => post('/notifications/read.php', id == null ? {'all': true} : {'id': id});

  Future<List<Map<String, dynamic>>> emergencyContacts() async =>
      List<Map<String, dynamic>>.from((await get('/emergency-contacts/list.php') as List).map((e) => Map<String, dynamic>.from(e)));
}
