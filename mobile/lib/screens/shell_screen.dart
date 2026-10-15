import 'package:flutter/material.dart';

import '../services/api.dart';
import 'home_screen.dart';
import 'login_screen.dart';
import 'my_reports_screen.dart';
import 'notifications_screen.dart';

/// Bottom navigation: Home, My reports, Notifications, Account. Owner: Alyana
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});
  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _tab = 0;
  // Changing the key rebuilds a tab, so lists reload after a new report
  int _refresh = 0;

  void reloadAll() => setState(() => _refresh++);

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(key: ValueKey('home$_refresh'), onReportSent: reloadAll, openTab: (i) => setState(() => _tab = i)),
      MyReportsScreen(key: ValueKey('mine$_refresh')),
      NotificationsScreen(key: ValueKey('notif$_refresh')),
      const _AccountTab(),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() {
          _tab = i;
          if (i == 1 || i == 2) _refresh++; // fresh data when opening a list
        }),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt), label: 'My reports'),
          NavigationDestination(
              icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Notifications'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
        ],
      ),
    );
  }
}

class _AccountTab extends StatelessWidget {
  const _AccountTab();

  @override
  Widget build(BuildContext context) {
    final u = Api.instance.currentUser ?? {};
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('${u['full_name'] ?? ''}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          Text('${u['email'] ?? ''}'),
          if (u['phone'] != null) Text('${u['phone']}'),
          const SizedBox(height: 24),
          // TODO (Alyana, optional): edit profile, change password
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
