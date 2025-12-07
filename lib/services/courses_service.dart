import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/course.dart';

class CoursesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Récupérer tous les cours avec modules
  Future<List<Course>> getCourses() async {
    try {
      final snapshot = await _firestore.collection('courses').get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        // injecter l'id du document dans les données
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getCourses: $e');
      return [];
    }
  }

  Future<List<Course>> getFreeCourses() async {
    try {
      final snapshot = await _firestore
          .collection('courses')
          .where('isFree', isEqualTo: true)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getFreeCourses: $e');
      return [];
    }
  }

  Future<List<Course>> getPaidCourses() async {
    try {
      final snapshot = await _firestore
          .collection('courses')
          .where('isFree', isEqualTo: false)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getPaidCourses: $e');
      return [];
    }
  }

  Future<List<Course>> getCoursesByLevel(String level) async {
    try {
      final snapshot = await _firestore
          .collection('courses')
          .where('level', isEqualTo: level)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getCoursesByLevel: $e');
      return [];
    }
  }

  Future<List<Course>> getCoursesByLanguage(String language) async {
    try {
      final snapshot = await _firestore
          .collection('courses')
          .where('language', isEqualTo: language)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getCoursesByLanguage: $e');
      return [];
    }
  }

  Future<Course?> getCourseById(String courseId) async {
    try {
      final doc =
          await _firestore.collection('courses').doc(courseId).get();

      if (!doc.exists) return null;

      final data = doc.data() as Map<String, dynamic>;
      data['id'] = doc.id;
      return Course.fromFirestore(data);
    } catch (e) {
      print('❌ Erreur getCourseById: $e');
      return null;
    }
  }

  /// Ajouter un cours avec modules
  Future<String?> addCourse(Course course) async {
    try {
      final docRef =
          await _firestore.collection('courses').add(course.toMap());

      // stocker aussi l'id dans le document pour les anciens cours
      await docRef.update({'id': docRef.id});

      return docRef.id;
    } catch (e) {
      print('❌ Erreur addCourse: $e');
      rethrow;
    }
  }

  Future<void> updateCourse(String courseId, Course course) async {
    try {
      await _firestore
          .collection('courses')
          .doc(courseId)
          .update(course.toMap());
    } catch (e) {
      print('❌ Erreur updateCourse: $e');
      rethrow;
    }
  }

  Future<void> deleteCourse(String courseId) async {
    try {
      await _firestore.collection('courses').doc(courseId).delete();
    } catch (e) {
      print('❌ Erreur deleteCourse: $e');
      rethrow;
    }
  }

  Future<List<Course>> searchCourses(String query) async {
    try {
      final snapshot = await _firestore.collection('courses').get();

      final q = query.toLowerCase();
      return snapshot.docs.where((doc) {
        final title = (doc['title'] ?? '').toString().toLowerCase();
        final description =
            (doc['description'] ?? '').toString().toLowerCase();
        return title.contains(q) || description.contains(q);
      }).map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur searchCourses: $e');
      return [];
    }
  }

  Future<List<Course>> getTopRatedCourses({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection('courses')
          .orderBy('rating', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getTopRatedCourses: $e');
      return [];
    }
  }

  Future<List<Course>> getNewestCourses({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection('courses')
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return Course.fromFirestore(data);
      }).toList();
    } catch (e) {
      print('❌ Erreur getNewestCourses: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> getCourseStats() async {
    try {
      final snapshot = await _firestore.collection('courses').get();

      int totalCourses = snapshot.docs.length;
      int freeCourses = 0;
      int paidCourses = 0;
      double avgRating = 0;

      for (var doc in snapshot.docs) {
        final data = doc.data();
        if (data['isFree'] == true) {
          freeCourses++;
        } else {
          paidCourses++;
        }
        avgRating += (data['rating'] ?? 0).toDouble();
      }

      avgRating = totalCourses > 0 ? avgRating / totalCourses : 0;

      return {
        'totalCourses': totalCourses,
        'freeCourses': freeCourses,
        'paidCourses': paidCourses,
        'avgRating': avgRating,
      };
    } catch (e) {
      print('❌ Erreur getCourseStats: $e');
      return {};
    }
  }
}
