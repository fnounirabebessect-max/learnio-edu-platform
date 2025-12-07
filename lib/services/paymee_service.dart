import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/transaction_model.dart';
import 'enrollment_transaction_service.dart';

class PaymeeService {
  // Clé API SANDBOX Paymee
  static const String _apiKey = 'd6f147136fcb06e355c899964d8dbeabd8c7e55a';

  static const String _createUrl =
      'https://sandbox.paymee.tn/api/v2/payments/create';

  // URLs de ton backend (via ngrok pour les tests)
  static const String _webhookUrl =
      'https://viperously-suggestible-dwight.ngrok-free.dev/paymee/webhook';
  static const String _returnUrl =
      'https://viperously-suggestible-dwight.ngrok-free.dev/paymee/return';
  static const String _cancelUrl =
      'https://viperously-suggestible-dwight.ngrok-free.dev/paymee/cancel';

  final EnrollmentTransactionService _etService =
      EnrollmentTransactionService();

  /// Crée un paiement Paymee SANDBOX et renvoie payment_url, ou null si échec.
  static Future<String?> createSandboxPayment({
    required double amount,
    required String note,
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String userId,
    required String courseId,
  }) async {
    try {
      final res = await http.post(
        Uri.parse(_createUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $_apiKey',
        },
        body: jsonEncode({
          "amount": amount,
          "note": note,
          "first_name": firstName,
          "last_name": lastName,
          "email": email,
          "phone": phone,
          "return_url": _returnUrl,
          "cancel_url": _cancelUrl,
          "webhook_url": _webhookUrl,
          "order_id": "$userId|$courseId",
        }),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['status'] == true) {
          return data['data']['payment_url'] as String;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Créer une transaction après paiement Paymee réussi (NOUVEAU)
  Future<void> createTransactionAfterPayment({
    required String userId,
    required String courseId,
    required String courseName,
    required double amount,
    required double receivedAmount,
    required String paymeeTransactionId,
  }) async {
    try {
      final transaction = TransactionModel(
        id: '',
        userId: userId,
        courseId: courseId,
        courseName: courseName,
        amount: amount,
        receivedAmount: receivedAmount,
        status: 'completed',
        paymentProvider: 'paymee',
        paymeeTransactionId: paymeeTransactionId,
        paidAt: DateTime.now(),
        createdAt: DateTime.now(),
      );

      await _etService.addTransaction(transaction);
      print('✅ Transaction sauvegardée avec succès');
    } catch (e) {
      print('❌ Erreur createTransactionAfterPayment: $e');
    }
  }
}
