import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import 'firebase_options.dart';

import 'views/home/home_page.dart';
import 'views/contact/contact_page.dart';
import 'views/auth/auth_page.dart';
import 'views/courses/courses_page.dart';
import 'views/admin/dashboard_page.dart';
import 'views/student/student_profile_page.dart';
import 'views/student/my_courses_page.dart';

import 'viewmodels/home_viewmodel.dart';
import 'viewmodels/contact_viewmodel.dart';
import 'viewmodels/courses_viewmodel.dart';
import 'viewmodels/admin_users_viewmodel.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => HomeViewModel()),
        ChangeNotifierProvider(create: (_) => ContactViewModel()),
        ChangeNotifierProvider(create: (_) => CoursesViewModel()),
        ChangeNotifierProvider(create: (_) => AdminUsersViewModel()),
      ],
      child: MaterialApp(
        title: 'Learnio',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primaryColor: const Color(0xFF5B6BF7),
          scaffoldBackgroundColor: Colors.white,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF5B6BF7),
          ),
          fontFamily: 'Roboto',
        ),
        // ✅ SessionHandler comme point d'entrée
        home: const SessionHandler(),
        routes: {
          '/home': (_) => const MainNavigationScreen(),
          '/admin': (_) => const DashboardPage(),
          '/auth': (_) => const AuthPage(),
          '/login': (_) => const AuthPage(),
          '/contact': (_) => const ContactPage(),
          '/cours': (_) => CoursesPage(),
          '/student': (_) => const StudentHomeShell(),
        },
      ),
    );
  }
}

/// ✅ NOUVEAU: SessionHandler - Vérifie la session et route l'utilisateur
class SessionHandler extends StatelessWidget {
  const SessionHandler({super.key});

  Future<String> _getUserRole(String userId) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();

      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        return (data['role'] ?? 'student') as String;
      }
      return 'student';
    } catch (e) {
      print('❌ Erreur _getUserRole: $e');
      return 'student';
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        // ⏳ En attente de vérification
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFF5B6BF7)),
            ),
          );
        }

        // ❌ Utilisateur NON CONNECTÉ → Page d'accueil publique
        if (snapshot.data == null) {
          print('📱 SessionHandler: Non connecté → MainNavigationScreen');
          return const MainNavigationScreen();
        }

        // ✅ Utilisateur CONNECTÉ → Vérifier son rôle
        final user = snapshot.data!;
        print('🔐 SessionHandler: Connecté (${user.email}) → Vérification du rôle');

        return FutureBuilder<String>(
          future: _getUserRole(user.uid),
          builder: (context, roleSnapshot) {
            if (roleSnapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFF5B6BF7),
                  ),
                ),
              );
            }

            final role = roleSnapshot.data ?? 'student';
            print('👤 Rôle détecté: $role');

            // 🔧 Admin
            if (role == 'admin') {
              print('🔧 SessionHandler: Admin → DashboardPage');
              return const DashboardPage();
            }

            // 👤 Étudiant (par défaut)
            print('👤 SessionHandler: Étudiant → StudentHomeShell');
            return const StudentHomeShell();
          },
        );
      },
    );
  }
}

/// Navigation principale publique (accueil, catalogue, contact, connexion)
class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    HomePage(),
    CoursesPage(),
    ContactPage(),
    AuthPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFF5B6BF7),
        unselectedItemColor: Colors.grey,
        onTap: (int index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Accueil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school),
            label: 'Cours',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.contact_mail),
            label: 'Contact',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Connexion',
          ),
        ],
      ),
    );
  }
}

/// Shell de navigation pour l'étudiant connecté : Profil / Mes cours / Catalogue
class StudentHomeShell extends StatefulWidget {
  const StudentHomeShell({super.key});

  @override
  State<StudentHomeShell> createState() => _StudentHomeShellState();
}

class _StudentHomeShellState extends State<StudentHomeShell> {
  int _index = 0;

  final List<Widget> _pages = [
    StudentProfilePage(), // Profil
    MyCoursesPage(),      // Mes cours
    CoursesPage(),        // Catalogue
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        selectedItemColor: const Color(0xFF5B6BF7),
        unselectedItemColor: Colors.grey,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_book),
            label: 'Mes cours',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school),
            label: 'Catalogue',
          ),
        ],
      ),
    );
  }
}
