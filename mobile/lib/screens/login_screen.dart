import 'package:flutter/material.dart';

import '../config.dart';
import '../services/api.dart';
import '../theme.dart';
import 'register_screen.dart';
import 'shell_screen.dart';

/// FR-02 login. Owner: Alyana
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final user = await Api.instance.login(_email.text.trim(), _password.text);
      if (user['role'] != 'reporter') {
        await Api.instance.logout();
        throw ApiException('Admins and officers use the website. This app is for reporting accidents.');
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const ShellScreen()));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.asphalt,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Row(children: [
                  Icon(Icons.warning_rounded, color: AppColors.lane, size: 36),
                  SizedBox(width: 8),
                  Text(appName, style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                ]),
                const SizedBox(height: 8),
                const Text('Report road accidents in Bulacan and follow their status.',
                    style: TextStyle(color: Colors.white70)),
                const SizedBox(height: 28),
                Panel(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Log in', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 16),
                      if (_error != null) ...[
                        Text(_error!, style: const TextStyle(color: AppColors.siren)),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        decoration: const InputDecoration(labelText: 'Email'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _password,
                        obscureText: true,
                        decoration: const InputDecoration(labelText: 'Password'),
                        onSubmitted: (_) => _login(),
                      ),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: _busy ? null : _login,
                        child: Text(_busy ? 'Logging in…' : 'Log in'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.of(context)
                            .push(MaterialPageRoute(builder: (_) => const RegisterScreen())),
                        child: const Text('No account yet? Create one'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text('In an emergency, call 911 first.',
                    textAlign: TextAlign.center, style: TextStyle(color: Colors.white54, fontSize: 13)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
