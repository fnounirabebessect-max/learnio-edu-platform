import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../models/enrollment_model.dart';
import '../../models/transaction_model.dart';
import '../../services/enrollment_transaction_service.dart';

class PaymeeWebViewPage extends StatefulWidget {
  final String url;
  final String userId;
  final String courseId;
  final String courseName;
  final double amount;

  const PaymeeWebViewPage({
    super.key,
    required this.url,
    required this.userId,
    required this.courseId,
    required this.courseName,
    required this.amount,
  });

  @override
  State<PaymeeWebViewPage> createState() => _PaymeeWebViewPageState();
}

class _PaymeeWebViewPageState extends State<PaymeeWebViewPage> {
  late final WebViewController _controller;
  bool _closed = false;
  final firestore = FirebaseFirestore.instance;
  final _etService = EnrollmentTransactionService();

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) async {
            final url = request.url;
            print('🌐 Navigation URL: $url');

            // 1️⃣ Détect si paiement réussi (loader ou return)
            if (url.contains('/loader') || url.contains('/paymee/return')) {
              if (!_closed) {
                _closed = true;

                print('✅ PAIEMENT RÉUSSI - Traitement en cours...');
                print('═' * 60);

                try {
                  // ====== ÉTAPE 1: Mettre à jour users/courses ======
                  print('1️⃣ Mise à jour users/[${widget.userId}]/courses/[${widget.courseId}]...');

                  await firestore
                      .collection('users')
                      .doc(widget.userId)
                      .collection('courses')
                      .doc(widget.courseId)
                      .update({
                    'isPaid': true,
                    'paidAt': DateTime.now(),
                    'receivedAmount': widget.amount,
                    'paymentProvider': 'paymee',
                    'paymeeTransactionId':
                        'paymee_${DateTime.now().millisecondsSinceEpoch}',
                  });

                  print('✅ users/courses mise à jour avec succès');

                  // ====== ÉTAPE 2: Créer la transaction ======
                  print('2️⃣ Création de la transaction...');

                  final transactionId =
                      'tx_${DateTime.now().millisecondsSinceEpoch}';
                  final transaction = TransactionModel(
                    id: transactionId,
                    userId: widget.userId,
                    courseId: widget.courseId,
                    courseName: widget.courseName,
                    amount: widget.amount,
                    receivedAmount: widget.amount,
                    status: 'completed',
                    paymentProvider: 'paymee',
                    paymeeTransactionId:
                        'paymee_${DateTime.now().millisecondsSinceEpoch}',
                    paidAt: DateTime.now(),
                    createdAt: DateTime.now(),
                  );

                  await _etService.addTransaction(transaction);

                  print('✅ Transaction créée: $transactionId');
                  print('   - Montant: ${widget.amount} TND');
                  print('   - Cours: ${widget.courseName}');
                  print('   - User: ${widget.userId}');

                  // ====== ÉTAPE 3: Créer l'enrollment ======
                  print('3️⃣ Vérification de l\'enrollment...');

                  final enrollmentSnapshot = await firestore
                      .collection('enrollments')
                      .where('userId', isEqualTo: widget.userId)
                      .where('courseId', isEqualTo: widget.courseId)
                      .get();

                  if (enrollmentSnapshot.docs.isEmpty) {
                    print('   ℹ️ Enrollment n\'existe pas, création...');

                    final enrollment = EnrollmentModel(
                      id: '',
                      userId: widget.userId,
                      courseId: widget.courseId,
                      courseName: widget.courseName,
                      enrolledAt: DateTime.now(),
                      status: 'active',
                    );

                    await _etService.addEnrollment(enrollment);
                    print('✅ Enrollment créé avec succès');
                  } else {
                    print('✅ Enrollment déjà existant (non modifié)');
                  }

                  print('═' * 60);
                  print('✅ PAIEMENT ENTIÈREMENT TRAITÉ ET SAUVEGARDÉ!');
                  print('═' * 60);

                  // Afficher un message de succès
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          '✅ Paiement réussi! Transaction enregistrée.',
                        ),
                        backgroundColor: Colors.green,
                        duration: Duration(seconds: 2),
                      ),
                    );
                  }
                } catch (e) {
                  print('═' * 60);
                  print('❌ ERREUR LORS DU TRAITEMENT DU PAIEMENT');
                  print('═' * 60);
                  print('Message d\'erreur: $e');
                  print('Type: ${e.runtimeType}');
                  print('═' * 60);

                  // Afficher un message d'erreur
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Erreur lors du traitement: $e',
                        ),
                        backgroundColor: Colors.red,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                  }
                }

                if (mounted) {
                  Future.delayed(const Duration(seconds: 2), () {
                    Navigator.pop(context, true);
                  });
                }
              }
              return NavigationDecision.prevent;
            }

            // 2️⃣ Détect si utilisateur annule (fallback)
            if (url.startsWith('https://example.com')) {
              if (!_closed) {
                _closed = true;
                print('❌ Paiement annulé par l\'utilisateur');
                if (mounted) {
                  Navigator.pop(context, false);
                }
              }
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paiement Paymee'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: WebViewWidget(controller: _controller),
      bottomNavigationBar: Container(
        color: Colors.grey[100],
        padding: const EdgeInsets.all(16),
        child: const Text(
          'Veuillez ne pas fermer cette fenêtre pendant le paiement',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey,
            fontStyle: FontStyle.italic,
          ),
        ),
      ),
    );
  }
}
