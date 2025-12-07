import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/enrollment_model.dart';
import '../models/transaction_model.dart';
import 'dart:math';

class EnrollmentTransactionService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ========== ENROLLMENTS =========

  Future<void> addEnrollment(EnrollmentModel enrollment) async {
    try {
      await _firestore.collection('enrollments').add(enrollment.toMap());
      print('✅ Inscription ajoutée: ${enrollment.courseName}');
    } catch (e) {
      print('❌ Erreur addEnrollment: $e');
      rethrow;
    }
  }

  Future<List<EnrollmentModel>> getUserEnrollments(String userId) async {
    try {
      final snapshot = await _firestore
          .collection('enrollments')
          .where('userId', isEqualTo: userId)
          .get();

      return snapshot.docs
          .map((doc) => EnrollmentModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('❌ Erreur getUserEnrollments: $e');
      return [];
    }
  }

  Future<int> getTotalEnrollments() async {
    try {
      final snapshot = await _firestore.collection('enrollments').count().get();
      return snapshot.count ?? 0;
    } catch (e) {
      print('❌ Erreur getTotalEnrollments: $e');
      return 0;
    }
  }

  Future<Map<String, int>> getEnrollmentsByCourseName() async {
    try {
      final snapshot = await _firestore
          .collection('enrollments')
          .where('status', isEqualTo: 'active')
          .get();

      Map<String, int> distribution = {};
      for (var doc in snapshot.docs) {
        final enrollment = EnrollmentModel.fromFirestore(doc);
        distribution[enrollment.courseName] =
            (distribution[enrollment.courseName] ?? 0) + 1;
      }
      return distribution;
    } catch (e) {
      print('❌ Erreur getEnrollmentsByCourseName: $e');
      return {};
    }
  }

  // ========== TRANSACTIONS ==========

  Future<void> addTransaction(TransactionModel transaction) async {
    try {
      await _firestore.collection('transactions').add(transaction.toMap());
      print('✅ Transaction ajoutée: ${transaction.amount} TND');
    } catch (e) {
      print('❌ Erreur addTransaction: $e');
      rethrow;
    }
  }

  Future<List<TransactionModel>> getUserTransactions(String userId) async {
    try {
      final snapshot = await _firestore
          .collection('transactions')
          .where('userId', isEqualTo: userId)
          .get();

      return snapshot.docs
          .map((doc) => TransactionModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('❌ Erreur getUserTransactions: $e');
      return [];
    }
  }

  Future<double> getTotalRevenue() async {
    try {
      final snapshot = await _firestore
          .collection('transactions')
          .where('status', isEqualTo: 'completed')
          .get();

      double total = 0;
      for (var doc in snapshot.docs) {
        final transaction = TransactionModel.fromFirestore(doc);
        total += transaction.receivedAmount;
      }
      return total;
    } catch (e) {
      print('❌ Erreur getTotalRevenue: $e');
      return 0;
    }
  }

  /// 🔁 Top 5 paiements AVEC les infos complètes
  Future<List<TransactionModel>> getTop5Payments() async {
    try {
      final snapshot = await _firestore
          .collection('transactions')
          .where('status', isEqualTo: 'completed')
          .orderBy('amount', descending: true)
          .limit(5)
          .get();

      return snapshot.docs
          .map((doc) => TransactionModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('❌ Erreur getTop5Payments: $e');
      // fallback vide pour éviter les erreurs
      return [];
    }
  }
  /// Récupérer le top 3 des cours par nombre d'inscriptions
Future<List<Map<String, dynamic>>> getTop3CoursesByEnrollments() async {
  try {
    final enrollmentDist = await getEnrollmentsByCourseName();
    
    // Trier par nombre d'inscriptions décroissant
    final sortedCourses = enrollmentDist.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    // Récupérer les infos des cours (nom, prix, isFree)
    final top3 = <Map<String, dynamic>>[];
    
    for (var i = 0; i < min(3, sortedCourses.length); i++) {
      final courseName = sortedCourses[i].key;
      final enrollmentCount = sortedCourses[i].value;
      
      // Récupérer le cours pour avoir le prix
      final courseSnapshot = await _firestore
          .collection('courses')
          .where('title', isEqualTo: courseName)
          .limit(1)
          .get();
      
      if (courseSnapshot.docs.isNotEmpty) {
        final courseDoc = courseSnapshot.docs.first;
        final isFree = courseDoc['isFree'] ?? true;
        final price = courseDoc['price'] ?? 0.0;
        
        top3.add({
          'courseName': courseName,
          'enrollmentCount': enrollmentCount,
          'isFree': isFree,
          'price': price,
        });
      }
    }
    
    return top3;
  } catch (e) {
    print('❌ Erreur getTop3CoursesByEnrollments: $e');
    return [];
  }
}

}
