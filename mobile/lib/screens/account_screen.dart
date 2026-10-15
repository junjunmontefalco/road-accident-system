import 'package:flutter/material.dart';

import '../services/api.dart';
import '../theme.dart';
import 'login_screen.dart';

/// Account tab: edit name, email and phone, change the password, log out. Owner: Alyana
class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _currentForEmail = TextEditingController();
  final _current = TextEditingController();
  final _newPass = TextEditingController();
  final _confirm = TextEditingController();
  Map<String, String> _profileErrors = {};
  Map<String, String> _passErrors = {};
  bool _savingProfile = false;
  bool _savingPass = false;

  Map<String, dynamic> get _user => Api.instance.currentUser ?? {};
  bool get _emailChanged => _email.text.trim().toLowerCase() != '${_user['email'] ?? ''}';

  @override
  void initState() {
    super.initState();
    _fill();
    _email.addListener(() => setState(() {}));
  }

  void _fill() {
    _name.text = '${_user['full_name'] ?? ''}';
    _email.text = '${_user['email'] ?? ''}';
    _phone.text = '${_user['phone'] ?? ''}';
  }

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _currentForEmail, _current, _newPass, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  Future<void> _saveProfile() async {
    setState(() {
      _savingProfile = true;
      _profileErrors = {};
    });
    try {
      await Api.instance.updateProfile({
        'full_name': _name.text.trim(),
        'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        if (_emailChanged) 'email': _email.text.trim(),
        if (_emailChanged) 'current_password': _currentForEmail.text,
      });
      _currentForEmail.clear();
      _fill();
      if (mounted) _toast('Profile saved');
    } on ApiException catch (e) {
      setState(() => _profileErrors = e.errors.isEmpty ? {'full_name': e.message} : e.errors);
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _savePassword() async {
    setState(() {
      _savingPass = true;
      _passErrors = {};
    });
    try {
      await Api.instance.updateProfile({
        'current_password': _current.text,
        'password': _newPass.text,
        'password_confirmation': _confirm.text,
      });
      _current.clear();
      _newPass.clear();
      _confirm.clear();
      if (mounted) _toast('Password changed. Your other devices were logged out.');
    } on ApiException catch (e) {
      setState(() => _passErrors = e.errors.isEmpty ? {'password': e.message} : e.errors);
    } finally {
      if (mounted) setState(() => _savingPass = false);
    }
  }

  Widget _field(TextEditingController c, String label, Map<String, String> errors, String key,
      {bool obscure = false, TextInputType? type, String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: c,
        obscureText: obscure,
        keyboardType: type,
        decoration: InputDecoration(labelText: label, hintText: hint, errorText: errors[key]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Panel(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Text('Profile', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _field(_name, 'Full name', _profileErrors, 'full_name'),
              _field(_email, 'Email', _profileErrors, 'email', type: TextInputType.emailAddress),
              if (_emailChanged)
                _field(_currentForEmail, 'Current password (to change the email)', _profileErrors, 'current_password',
                    obscure: true),
              _field(_phone, 'Mobile number', _profileErrors, 'phone', type: TextInputType.phone, hint: '09XXXXXXXXX'),
              FilledButton(
                onPressed: _savingProfile ? null : _saveProfile,
                child: Text(_savingProfile ? 'Saving…' : 'Save profile'),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          Panel(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Text('Change password', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _field(_current, 'Current password', _passErrors, 'current_password', obscure: true),
              _field(_newPass, 'New password', _passErrors, 'password', obscure: true),
              _field(_confirm, 'Confirm new password', _passErrors, 'password_confirmation', obscure: true),
              const Text('At least 8 characters with letters and numbers.',
                  style: TextStyle(color: AppColors.muted, fontSize: 13)),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _savingPass ? null : _savePassword,
                child: Text(_savingPass ? 'Saving…' : 'Change password'),
              ),
            ]),
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () async {
              await Api.instance.logout();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            },
            child: const Text('Log out'),
          ),
        ],
      ),
    );
  }
}
