import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  Future<void> saveUserIfNeeded(User user) async {
    final usersRef = FirebaseFirestore.instance.collection('users');
    final doc = await usersRef.doc(user.uid).get();
    if (!doc.exists) {
      await usersRef.doc(user.uid).set({
        'email': user.email,
        'name': user.displayName ?? '',
        'role': 'student',
        'createdAt': DateTime.now(),
      });
    }
  }

  Future<UserCredential?> register(String email, String password) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password.trim(),
      );
      await saveUserIfNeeded(credential.user!);
      return credential;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthError(e);
    }
  }

  Future<UserCredential?> signInWithEmail(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password.trim(),
      );
      await saveUserIfNeeded(credential.user!);
      return credential;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthError(e);
    }
  }

  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final userCredential = await _auth.signInWithCredential(credential);
      await saveUserIfNeeded(userCredential.user!);
      return userCredential;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
  }

  String _handleAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-email':
        return "Email invalide.";
      case 'user-not-found':
        return "Aucun utilisateur trouvé.";
      case 'wrong-password':
        return "Mot de passe incorrect.";
      case 'email-already-in-use':
        return "Cet email est déjà utilisé.";
      case 'weak-password':
        return "Mot de passe trop faible (min 6 chars).";
      default:
        return "Erreur inconnue.";
    }
  }
}
