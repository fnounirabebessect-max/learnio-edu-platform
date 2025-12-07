import 'package:flutter/material.dart';

class ContactViewModel extends ChangeNotifier {
  bool isSending = false;
  String? successMessage;
  String? errorMessage;

  Future<void> sendMessage({
    required String name,
    required String email,
    required String message,
  }) async {
    if (name.isEmpty || email.isEmpty || message.isEmpty) {
      errorMessage = 'Veuillez remplir tous les champs.';
      notifyListeners();
      return;
    }

    try {
      isSending = true;
      errorMessage = null;
      successMessage = null;
      notifyListeners();

      // Simule envoi réseau (remplacer par envoi réel: Firestore / Cloud Function / Email)
      await Future.delayed(const Duration(seconds: 2));

      successMessage = 'Message envoyé. Nous vous répondrons bientôt.';
    } catch (e) {
      errorMessage = 'Erreur lors de l\'envoi. Réessayez plus tard.';
    } finally {
      isSending = false;
      notifyListeners();
    }
  }
}
