import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final AuthService _auth = AuthService();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();

  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;

  Future<void> _login() async {
    // Validation
    if (_email.text.trim().isEmpty) {
      setState(() => _error = 'L\'email est requis');
      return;
    }

    if (_password.text.isEmpty) {
      setState(() => _error = 'Le mot de passe est requis');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await _auth.signInWithEmail(_email.text.trim(), _password.text);

      if (mounted) {
        Navigator.pushReplacementNamed(context, '/student');
      }
    } catch (e) {
      setState(() => _error = _formatError(e.toString()));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _googleLogin() async {
    setState(() => _error = null);

    try {
      await _auth.signInWithGoogle();

      if (mounted) {
        Navigator.pushReplacementNamed(context, '/student');
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
    _email.dispose();
    _password.dispose();
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

                  // Logo Learnio
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
                    'Heureux de vous revoir',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Connectez-vous pour accéder à vos cours',
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
                            onSubmitted: (_) => _login(),
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

                          // Bouton Connexion
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
                                    onPressed: _login,
                                    child: const Text(
                                      'Se connecter',
                                      style: TextStyle(
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
                              onPressed: _loading ? null : _googleLogin,
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
                                      // Fallback si l'image ne charge pas
                                      return const Icon(
                                        Icons.g_translate,
                                        size: 20,
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

                          // Lien Inscription
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Pas de compte ? ',
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
                                                const RegisterPage(),
                                          ),
                                        );
                                      },
                                child: const Text(
                                  'S\'inscrire',
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
