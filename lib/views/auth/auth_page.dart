import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../services/auth_service.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final AuthService _auth = AuthService();
  final TextEditingController _firstName = TextEditingController();
  final TextEditingController _lastName = TextEditingController();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _phone = TextEditingController();
  final TextEditingController _dateOfBirth = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final TextEditingController _confirmPassword = TextEditingController();

  bool _isLogin = true;
  bool _isLoading = false;
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
        _dateOfBirth.text = '${picked.day}/${picked.month}/${picked.year}';
      });
    }
  }

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      var credential;
      if (_isLogin) {
        // LOGIN
        if (_email.text.trim().isEmpty) {
          setState(() => _error = 'L\'email est requis');
          setState(() => _isLoading = false);
          return;
        }
        if (_password.text.isEmpty) {
          setState(() => _error = 'Le mot de passe est requis');
          setState(() => _isLoading = false);
          return;
        }

        credential =
            await _auth.signInWithEmail(_email.text.trim(), _password.text);
      } else {
        // REGISTER
        if (_firstName.text.trim().isEmpty) {
          setState(() => _error = 'Le prénom est requis');
          setState(() => _isLoading = false);
          return;
        }
        if (_lastName.text.trim().isEmpty) {
          setState(() => _error = 'Le nom est requis');
          setState(() => _isLoading = false);
          return;
        }
        if (_email.text.trim().isEmpty) {
          setState(() => _error = 'L\'email est requis');
          setState(() => _isLoading = false);
          return;
        }
        if (_phone.text.trim().isEmpty) {
          setState(() => _error = 'Le téléphone est requis');
          setState(() => _isLoading = false);
          return;
        }
        if (_dateOfBirth.text.isEmpty) {
          setState(() => _error = 'La date de naissance est requise');
          setState(() => _isLoading = false);
          return;
        }
        if (_password.text.isEmpty) {
          setState(() => _error = 'Le mot de passe est requis');
          setState(() => _isLoading = false);
          return;
        }
        if (_password.text != _confirmPassword.text) {
          setState(() => _error = 'Les mots de passe ne correspondent pas');
          setState(() => _isLoading = false);
          return;
        }
        if (_password.text.length < 6) {
          setState(() =>
              _error = 'Le mot de passe doit contenir au moins 6 caractères');
          setState(() => _isLoading = false);
          return;
        }

        credential =
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
        }
      }

      final user = credential?.user;
      if (user != null) {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        String role = 'student';
        if (doc.exists) {
          final data = doc.data() as Map<String, dynamic>;
          role = (data['role'] ?? 'student') as String;
        }

        if (!mounted) return;
        if (role == 'admin') {
          Navigator.pushReplacementNamed(context, '/admin');
        } else {
          Navigator.pushReplacementNamed(context, '/student');
        }
      }
    } catch (e) {
      setState(() => _error = _formatError(e.toString()));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _googleLogin() async {
    try {
      setState(() => _error = null);

      final credential = await _auth.signInWithGoogle();
      final user = credential?.user;

      if (user != null) {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        String role = 'student';
        if (doc.exists) {
          final data = doc.data() as Map<String, dynamic>;
          role = (data['role'] ?? 'student') as String;
        }

        if (!mounted) return;
        if (role == 'admin') {
          Navigator.pushReplacementNamed(context, '/admin');
        } else {
          Navigator.pushReplacementNamed(context, '/student');
        }
      }
    } catch (e) {
      setState(() => _error = 'Erreur Google: ${_formatError(e.toString())}');
    }
  }

  String _formatError(String error) {
    if (error.contains('user-not-found')) {
      return 'Utilisateur non trouvé';
    } else if (error.contains('wrong-password')) {
      return 'Mot de passe incorrect';
    } else if (error.contains('email-already-in-use')) {
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

  void _clearFields() {
    _firstName.clear();
    _lastName.clear();
    _email.clear();
    _phone.clear();
    _dateOfBirth.clear();
    _password.clear();
    _confirmPassword.clear();
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

                  // ✅ Logo depuis assets (SANS background + AGRANDI)
                  Image.asset(
                    'assets/images/logo_learnio.png',
                    width: 100, // ✅ Agrandi de 64 à 100
                    height: 100, // ✅ Agrandi de 64 à 100
                    fit: BoxFit.contain, // ✅ Enlève le background
                    errorBuilder: (context, error, stackTrace) {
                      // Fallback si image charge pas
                      return Container(
                        width: 100,
                        height: 100,
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
                              fontSize: 48,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24), // ✅ Augmenté de 16 à 24
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
                    _isLogin ? 'Heureux de vous revoir' : 'Rejoignez Learnio',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isLogin
                        ? 'Accédez à vos cours et progressez à votre rythme.'
                        : 'Créez un compte et commencez à apprendre',
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
                          // ✅ CHAMPS D'INSCRIPTION
                          if (!_isLogin) ...[
                            // Prénom
                            TextField(
                              controller: _firstName,
                              enabled: !_isLoading,
                              decoration: _fieldDecoration(
                                label: 'Prénom',
                                icon: Icons.person,
                              ),
                            ),
                            const SizedBox(height: 15),

                            // Nom
                            TextField(
                              controller: _lastName,
                              enabled: !_isLoading,
                              decoration: _fieldDecoration(
                                label: 'Nom',
                                icon: Icons.person_outline,
                              ),
                            ),
                            const SizedBox(height: 15),

                            // Téléphone
                            TextField(
                              controller: _phone,
                              keyboardType: TextInputType.phone,
                              enabled: !_isLoading,
                              decoration: _fieldDecoration(
                                label: 'Téléphone',
                                icon: Icons.phone,
                              ),
                            ),
                            const SizedBox(height: 15),

                            // Date de naissance
                            TextField(
                              controller: _dateOfBirth,
                              enabled: !_isLoading,
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
                          ],

                          // Email
                          TextField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            enabled: !_isLoading,
                            decoration: _fieldDecoration(
                              label: 'Email',
                              icon: Icons.email,
                            ),
                          ),
                          const SizedBox(height: 15),

                          // Mot de passe
                          TextField(
                            obscureText: _obscurePassword,
                            controller: _password,
                            enabled: !_isLoading,
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
                            onSubmitted: (_) => _submit(),
                          ),
                          const SizedBox(height: 15),

                          // ✅ Confirmation mot de passe (seulement en inscription)
                          if (!_isLogin)
                            TextField(
                              obscureText: _obscureConfirmPassword,
                              controller: _confirmPassword,
                              enabled: !_isLoading,
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

                          // Bouton Connexion/Inscription
                          SizedBox(
                            width: double.infinity,
                            child: _isLoading
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
                                    onPressed: _submit,
                                    child: Text(
                                      _isLogin
                                          ? 'Se connecter'
                                          : 'S\'inscrire',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 14),

                          // ✅ Google Login avec logo depuis URL
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _googleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: Colors.black,
                                side: BorderSide(
                                  color: Colors.grey[300]!,
                                  width: 1,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  // ✅ Logo Google depuis URL
                                  Image.network(
                                    'https://www.gstatic.com/firebaseapps/87b19fb9163327347cdf12efc6be6955a96ea48d/google-logo.svg',
                                    height: 20,
                                    width: 20,
                                    errorBuilder:
                                        (context, error, stackTrace) {
                                      return const Icon(
                                        Icons.g_mobiledata_outlined,
                                        size: 40,
                                        color: Colors.blue,
                                      );
                                    },
                                  ),
                                  const SizedBox(width: 8),
                                  const Text('Continuer avec Google'),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Basculer Login/Register
                          TextButton(
                            onPressed: _isLoading
                                ? null
                                : () {
                                    setState(() => _isLogin = !_isLogin);
                                    _error = null;
                                    _clearFields();
                                  },
                            child: Text(
                              _isLogin
                                  ? 'Pas de compte ? Créer un'
                                  : 'J\'ai déjà un compte',
                              style: const TextStyle(
                                color: Colors.indigo,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
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
