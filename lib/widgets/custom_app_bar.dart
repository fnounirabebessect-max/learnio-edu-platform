import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String pageTitle;
  final bool showBackButton;
  final VoidCallback? onBackPressed;

  const CustomAppBar({
    super.key,
    required this.pageTitle,
    this.showBackButton = false,
    this.onBackPressed,
  });

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final isLoggedIn = user != null;

    return AppBar(
      backgroundColor: Colors.white,
      elevation: 2,
      shadowColor: Colors.grey.withOpacity(0.2),
      leading: showBackButton
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.indigo),
              onPressed: onBackPressed ?? () => Navigator.pop(context),
            )
          : null,
      title: Row(
        children: [
          // Logo + Nom de l'app
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                // ✅ Logo depuis le chemin réel
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: _buildLogo(),
                ),
                const SizedBox(width: 8),
                // Nom de l'app
                const Text(
                  'Learnio',
                  style: TextStyle(
                    color: Colors.indigo,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          // Titre de la page
          Expanded(
            child: Center(
              child: Text(
                pageTitle,
                style: const TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const Spacer(),
        ],
      ),
      actions: [
        if (!isLoggedIn)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Center(
              child: GestureDetector(
                onTap: () {
                  Navigator.pushNamed(context, '/auth');
                },
                child: Tooltip(
                  message: 'Connexion',
                  child: Icon(
                    Icons.assignment_ind,
                    color: Colors.indigo[400],
                    size: 24,
                  ),
                ),
              ),
            ),
          )
        else ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'logout') {
                  await FirebaseAuth.instance.signOut();
                  await GoogleSignIn().signOut();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/home',
                      (route) => false,
                    );
                  }
                }
              },
              itemBuilder: (BuildContext context) => [
                PopupMenuItem<String>(
                  value: 'profile',
                  child: Row(
                    children: [
                      const Icon(Icons.person, color: Colors.indigo),
                      const SizedBox(width: 8),
                      Text(
                        user.displayName ?? 'Profil',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Déconnexion'),
                    ],
                  ),
                ),
              ],
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Center(
                  child: Row(
                    children: [
                      if (user.photoURL != null)
                        CircleAvatar(
                          radius: 16,
                          backgroundImage: NetworkImage(user.photoURL!),
                        )
                      else
                        const Icon(
                          Icons.account_circle,
                          color: Colors.indigo,
                          size: 32,
                        ),
                      const SizedBox(width: 8),
                      Text(
                        user.displayName?.split(' ').first ??
                            user.email?.split('@').first ??
                            'User',
                        style: const TextStyle(
                          color: Colors.indigo,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// ✅ Fonction pour charger le logo (Asset + Fallback)
  Widget _buildLogo() {
    return SizedBox(
      width: 32,
      height: 32,
      child: Image.asset(
        'assets/images/logo_learnio.png',
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          // ✅ Fallback: affiche la lettre 'L' si l'image charge pas
          print('❌ Image not found, using fallback');
          return Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.indigo,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Center(
              child: Text(
                'L',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(60);
}
