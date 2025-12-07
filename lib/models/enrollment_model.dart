import 'package:cloud_firestore/cloud_firestore.dart';

class EnrollmentModel {
  final String id;
  final String userId;
  final String courseId;
  final String courseName;
  final DateTime enrolledAt;
  final String status; // 'active', 'completed'

  EnrollmentModel({
    required this.id,
    required this.userId,
    required this.courseId,
    required this.courseName,
    required this.enrolledAt,
    required this.status,
  });

  factory EnrollmentModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return EnrollmentModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      courseId: data['courseId'] ?? '',
      courseName: data['courseName'] ?? '',
      enrolledAt: (data['enrolledAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      status: data['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'courseId': courseId,
      'courseName': courseName,
      'enrolledAt': Timestamp.fromDate(enrolledAt),
      'status': status,
    };
  }
}
