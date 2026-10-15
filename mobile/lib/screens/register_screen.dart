import 'package:flutter/material.dart';

import '../services/api.dart';
import 'shell_screen.dart';

/// FR-01 registration (reporter account). Owner: Alyana
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _c = {
    'full_name': TextEditingController(),
    'email': TextEditingController(),
    'phone': TextEditingController(),
    'password': TextEditingController(),
    'password_confirmation': TextEditingController(),
  };
  Map<String, String> _errors = {};
  String? _message;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in _c.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _errors = {};
      _message = null;
    });
    try {
      await Api.instance.register({
        for (final e in _c.entries) e.key: e.value.text.trim().isEmpty && e.key == 'phone' ? null : e.value.text.trim(),
      });
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const ShellScreen()),
        (_) => false,
      );
    } on ApiException catch (e) {
      setState(() {
        _errors = e.errors;
        _message = e.errors.isEmpty ? e.message : null;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _field(String key, String label, {bool secret = false, TextInputType? type}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: _c[key],
          obscureText: secret,
          keyboardType: type,
          decoration: InputDecoration(labelText: label, errorText: _errors[key]),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create an account')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('You need an account so you can track your reports.'),
          const SizedBox(height: 16),
          if (_message != null) ...[
            Text(_message!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 12),
          ],
          _field('full_name', 'Full name'),
          _field('email', 'Email', type: TextInputType.emailAddress),
          _field('phone', 'Mobile number (optional), 09XXXXXXXXX', type: TextInputType.phone),
          _field('password', 'Password (8+ characters, letters and numbers)', secret: true),
          _field('password_confirmation', 'Confirm password', secret: true),
          const SizedBox(height: 8),
          FilledButton(onPressed: _busy ? null : _submit, child: Text(_busy ? 'Creating account…' : 'Create account')),
        ],
      ),
    );
  }
}
