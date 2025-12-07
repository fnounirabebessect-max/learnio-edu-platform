import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../widgets/custom_app_bar.dart';

class StudentProfilePage extends StatefulWidget {
  const StudentProfilePage({super.key});

  @override
  State<StudentProfilePage> createState() => _StudentProfilePageState();
}

class _StudentProfilePageState extends State<StudentProfilePage> {
  final _auth = FirebaseAuth.instance;
  final _usersRef = FirebaseFirestore.instance.collection('users');

  final nameCtrl = TextEditingController();
  final bioCtrl = TextEditingController();
  final photoCtrl = TextEditingController();

  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = _auth.currentUser;
    if (user == null) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/auth');
      }
      return;
    }

    try {
      final doc = await _usersRef.doc(user.uid).get();

      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        nameCtrl.text = (data['name'] ?? '') as String;
        bioCtrl.text = (data['bio'] ?? '') as String;
        photoCtrl.text = (data['photoUrl'] ?? '') as String;
      } else {
        nameCtrl.text = '';
        bioCtrl.text = '';
        photoCtrl.text = '';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Impossible de charger le profil: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String _displayName() {
    final user = _auth.currentUser;
    final name = nameCtrl.text.trim();
    if (name.isNotEmpty) return name;

    final email = user?.email ?? '';
    final beforeAt = email.split('@').first;
    if (beforeAt.isNotEmpty) return beforeAt;

    return 'Étudiant';
  }

  Future<void> _saveProfile() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      await _usersRef.doc(user.uid).set({
        'email': user.email,
        'name': nameCtrl.text.trim(),
        'bio': bioCtrl.text.trim(),
        'photoUrl': photoCtrl.text.trim(),
        'role': 'student',
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil mis à jour'),
            backgroundColor: Colors.green,
          ),
        );
        setState(() {});
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  InputDecoration _fieldDecoration(String label, {int lines = 1}) {
    return InputDecoration(
      labelText: label,
      alignLabelWithHint: lines > 1,
      filled: true,
      fillColor: Colors.white,
      labelStyle: TextStyle(color: Colors.grey[700]),
      hintStyle: TextStyle(color: Colors.grey[500]),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: Colors.grey.shade400,
          width: 1.2,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: Theme.of(context).primaryColor,
          width: 1.5,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: const Color(0xFFF3F4F6),
        appBar: CustomAppBar(
          pageTitle: 'Profil Étudiant',
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Colors.indigo),
        ),
      );
    }

    final displayName = _displayName();
    final photoUrl = photoCtrl.text.trim();

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: CustomAppBar(
        pageTitle: 'Profil Étudiant',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header profil
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundImage: photoUrl.isNotEmpty
                          ? NetworkImage(photoUrl)
                          : null,
                      backgroundColor: Colors.indigo[100],
                      child: photoUrl.isEmpty
                          ? Icon(
                              Icons.person,
                              size: 40,
                              color: Colors.indigo[400],
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bienvenue, $displayName',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            bioCtrl.text.trim().isEmpty
                                ? 'Complétez votre profil pour personnaliser votre espace.'
                                : bioCtrl.text.trim(),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Section Profil (formulaire)
            Text(
              'Éditer mon profil',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.indigo[700],
                  ),
            ),
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                child: Column(
                  children: [
                    // Nom complet
                    TextField(
                      controller: nameCtrl,
                      decoration: _fieldDecoration('Nom complet'),
                    ),
                    const SizedBox(height: 12),

                    // Bio
                    TextField(
                      controller: bioCtrl,
                      maxLines: 3,
                      decoration: _fieldDecoration('Bio', lines: 3),
                    ),
                    const SizedBox(height: 12),

                    // URL photo de profil
                    TextField(
                      controller: photoCtrl,
                      decoration:
                          _fieldDecoration('URL de la photo de profil'),
                    ),
                    const SizedBox(height: 20),

                    // Bouton Enregistrer
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: _saveProfile,
                        child: const Text(
                          'Enregistrer mon profil',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    nameCtrl.dispose();
    bioCtrl.dispose();
    photoCtrl.dispose();
    super.dispose();
  }
}
