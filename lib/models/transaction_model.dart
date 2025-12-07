import 'package:cloud_firestore/cloud_firestore.dart';

class TransactionModel {
  final String id;
  final String userId;
  final String courseId;
  final String courseName;
  final double amount;
  final double receivedAmount;
  final String status; // 'completed', 'pending', 'failed'
  final String paymentProvider; // 'paymee'
  final String paymeeTransactionId;
  final DateTime paidAt;
  final DateTime createdAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.courseId,
    required this.courseName,
    required this.amount,
    required this.receivedAmount,
    required this.status,
    required this.paymentProvider,
    required this.paymeeTransactionId,
    required this.paidAt,
    required this.createdAt,
  });

  factory TransactionModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return TransactionModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      courseId: data['courseId'] ?? '',
      courseName: data['courseName'] ?? '',
      amount: (data['amount'] ?? 0).toDouble(),
      receivedAmount: (data['receivedAmount'] ?? 0).toDouble(),
      status: data['status'] ?? 'pending',
      paymentProvider: data['paymentProvider'] ?? 'paymee',
      paymeeTransactionId: data['paymeeTransactionId'] ?? '',
      paidAt: (data['paidAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'courseId': courseId,
      'courseName': courseName,
      'amount': amount,
      'receivedAmount': receivedAmount,
      'status': status,
      'paymentProvider': paymentProvider,
      'paymeeTransactionId': paymeeTransactionId,
      'paidAt': Timestamp.fromDate(paidAt),
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
