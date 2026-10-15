import 'dart:async';

import 'package:flutter/material.dart';

import '../services/api.dart';
import 'account_screen.dart';
import 'home_screen.dart';
import 'my_reports_screen.dart';
import 'notifications_screen.dart';

/// Bottom navigation: Home, My reports, Notifications (with unread count), Account. Owner: Alyana
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});
  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> with WidgetsBindingObserver {
  int _tab = 0;
  // Changing the key rebuilds a tab, so lists reload after a new report
  int _refresh = 0;
  int _unread = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadUnread();
    // Check for new notifications every minute while the app is open
    _timer = Timer.periodic(const Duration(minutes: 1), (_) => _loadUnread());
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _loadUnread();
  }

  Future<void> _loadUnread() async {
    try {
      final n = await Api.instance.unreadCount();
      if (mounted) setState(() => _unread = n);
    } catch (_) {/* offline: keep the old number */}
  }

  void reloadAll() {
    setState(() => _refresh++);
    _loadUnread();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(key: ValueKey('home$_refresh'), onReportSent: reloadAll, openTab: (i) => setState(() => _tab = i)),
      MyReportsScreen(key: ValueKey('mine$_refresh')),
      NotificationsScreen(key: ValueKey('notif$_refresh'), onChanged: _loadUnread),
      const AccountScreen(),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() {
          _tab = i;
          if (i == 1 || i == 2) _refresh++; // fresh data when opening a list
          _loadUnread();
        }),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          const NavigationDestination(
              icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt), label: 'My reports'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: _unread > 0,
              label: Text(_unread > 99 ? '99+' : '$_unread'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: _unread > 0,
              label: Text(_unread > 99 ? '99+' : '$_unread'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Notifications',
          ),
          const NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
        ],
      ),
    );
  }
}
