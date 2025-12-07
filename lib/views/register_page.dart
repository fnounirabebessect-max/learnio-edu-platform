import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../services/auth_service.dart';
import 'login_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final AuthService _auth = AuthService();
  final TextEditingController _firstName = TextEditingController();
  final TextEditingController _lastName = TextEditingController();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _phone = TextEditingController();
  final TextEditingController _dateOfBirth = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final TextEditingController _confirmPassword = TextEditingController();

  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _error;

  Future<void> _selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _dateOfBirth.text =
            '${picked.day}/${picked.month}/${picked.year}';
      });
    }
  }

  Future<void> _register() async {
    // Validation
    if (_firstName.text.trim().isEmpty) {
      setState(() => _error = 'Le prénom est requis');
      return;
    }

    if (_lastName.text.trim().isEmpty) {
      setState(() => _error = 'Le nom est requis');
      return;
    }

    if (_email.text.trim().isEmpty) {
      setState(() => _error = 'L\'email est requis');
      return;
    }

    if (_phone.text.trim().isEmpty) {
      setState(() => _error = 'Le téléphone est requis');
      return;
    }

    if (_dateOfBirth.text.isEmpty) {
      setState(() => _error = 'La date de naissance est requise');
      return;
    }

    if (_password.text.isEmpty) {
      setState(() => _error = 'Le mot de passe est requis');
      return;
    }

    if (_password.text != _confirmPassword.text) {
      setState(() => _error = 'Les mots de passe ne correspondent pas');
      return;
    }

    if (_password.text.length < 6) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Créer l'utilisateur
      final credential =
          await _auth.register(_email.text.trim(), _password.text);

      // Enregistrer les données utilisateur dans Firestore
      if (credential?.user != null) {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(credential!.user!.uid)
            .set({
          'firstName': _firstName.text.trim(),
          'lastName': _lastName.text.trim(),
          'email': _email.text.trim(),
          'phone': _phone.text.trim(),
          'dateOfBirth': _dateOfBirth.text.trim(),
          'role': 'student',
          'createdAt': DateTime.now(),
        });

        if (mounted) {
          Navigator.pushReplacementNamed(context, '/student');
        }
      }
    } catch (e) {
      setState(() => _error = _formatError(e.toString()));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String _formatError(String error) {
    if (error.contains('email-already-in-use')) {
      return 'Cet email est déjà utilisé';
    } else if (error.contains('weak-password')) {
      return 'Le mot de passe est trop faible';
    } else if (error.contains('invalid-email')) {
      return 'Email invalide';
    }
    return error;
  }

  InputDecoration _fieldDecoration({
    required String label,
    IconData? icon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: icon != null ? Icon(icon, color: Colors.grey[700]) : null,
      suffixIcon: suffixIcon,
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
        borderSide: const BorderSide(
          color: Colors.indigo,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: Colors.red.shade400,
          width: 1.2,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _dateOfBirth.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final maxPageWidth = screenWidth > 420 ? 420.0 : screenWidth * 0.96;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SingleChildScrollView(
        child: SafeArea(
          child: Center(
            child: Container(
              width: maxPageWidth,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 24),
              child: Column(
                children: [
                  const SizedBox(height: 32),

                  // Logo
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.indigo,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text(
                        'L',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 36,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Learnio',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.indigo,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Texte d'accueil
                  Text(
                    'Rejoignez Learnio',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Créez un compte et commencez à apprendre',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[700],
                        ),
                  ),
                  const SizedBox(height: 28),

                  // Card formulaire
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 4,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 20,
                      ),
                      child: Column(
                        children: [
                          // ✅ Prénom
                          TextField(
                            controller: _firstName,
                            enabled: !_loading,
                            decoration: _fieldDecoration(
                              label: 'Prénom',
                              icon: Icons.person,
                            ),
                          ),
                          const SizedBox(height: 15),

                          // ✅ Nom
                          TextField(
                            controller: _lastName,
                            enabled: !_loading,
                            decoration: _fieldDecoration(
                              label: 'Nom',
                              icon: Icons.person_outline,
                            ),
                          ),
                          const SizedBox(height: 15),

                          // Email
                          TextField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            enabled: !_loading,
                            decoration: _fieldDecoration(
                              label: 'Email',
                              icon: Icons.email,
                            ),
                          ),
                          const SizedBox(height: 15),

                          // ✅ Téléphone
                          TextField(
                            controller: _phone,
                            keyboardType: TextInputType.phone,
                            enabled: !_loading,
                            decoration: _fieldDecoration(
                              label: 'Téléphone',
                              icon: Icons.phone,
                            ),
                          ),
                          const SizedBox(height: 15),

                          // ✅ Date de naissance
                          TextField(
                            controller: _dateOfBirth,
                            enabled: !_loading,
                            readOnly: true,
                            onTap: () => _selectDate(context),
                            decoration: _fieldDecoration(
                              label: 'Date de naissance',
                              icon: Icons.calendar_today,
                              suffixIcon: IconButton(
                                icon: const Icon(
                                  Icons.calendar_today,
                                  color: Colors.indigo,
                                ),
                                onPressed: () => _selectDate(context),
                              ),
                            ),
                          ),
                          const SizedBox(height: 15),

                          // Mot de passe
                          TextField(
                            obscureText: _obscurePassword,
                            controller: _password,
                            enabled: !_loading,
                            decoration: _fieldDecoration(
                              label: 'Mot de passe',
                              icon: Icons.lock,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                  color: Colors.grey[700],
                                ),
                                onPressed: () {
                                  setState(() =>
                                      _obscurePassword = !_obscurePassword);
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 15),

                          // Confirmation mot de passe
                          TextField(
                            obscureText: _obscureConfirmPassword,
                            controller: _confirmPassword,
                            enabled: !_loading,
                            decoration: _fieldDecoration(
                              label: 'Confirmer le mot de passe',
                              icon: Icons.lock,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscureConfirmPassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                  color: Colors.grey[700],
                                ),
                                onPressed: () {
                                  setState(() => _obscureConfirmPassword =
                                      !_obscureConfirmPassword);
                                },
                              ),
                            ),
                          ),

                          // Message d'erreur
                          if (_error != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red[50],
                                border: Border.all(
                                  color: Colors.red[400]!,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.error,
                                    color: Colors.red[600],
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      _error!,
                                      style: TextStyle(
                                        color: Colors.red[700],
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 20),

                          // Bouton S'inscrire
                          SizedBox(
                            width: double.infinity,
                            child: _loading
                                ? ElevatedButton(
                                    onPressed: null,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigo,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                    ),
                                    child: const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              Colors.white,
                                            ),
                                      ),
                                    ),
                                  )
                                : ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigo,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                    ),
                                    onPressed: _register,
                                    child: const Text(
                                      'S\'inscrire',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 14),

                          // Lien Connexion
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Vous avez déjà un compte ? ',
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 14,
                                ),
                              ),
                              TextButton(
                                onPressed: _loading
                                    ? null
                                    : () {
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                const LoginPage(),
                                          ),
                                        );
                                      },
                                child: const Text(
                                  'Connexion',
                                  style: TextStyle(
                                    color: Colors.indigo,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
