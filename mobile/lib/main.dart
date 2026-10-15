import 'package:flutter/material.dart';

import 'config.dart';
import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';
import 'services/api.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RoadReportApp());
}

class RoadReportApp extends StatelessWidget {
  const RoadReportApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: appName,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const StartGate(),
    );
  }
}

/// Checks the saved login, then opens the app or the login screen.
class StartGate extends StatefulWidget {
  const StartGate({super.key});
  @override
  State<StartGate> createState() => _StartGateState();
}

class _StartGateState extends State<StartGate> {
  late final Future<bool> _restore = Api.instance.restoreSession();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _restore,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            backgroundColor: AppColors.asphalt,
            body: Center(child: CircularProgressIndicator(color: AppColors.lane)),
          );
        }
        final user = Api.instance.currentUser;
        if (snap.data == true && user != null && user['role'] == 'reporter') {
          return const ShellScreen();
        }
        return const LoginScreen();
      },
    );
  }
}
