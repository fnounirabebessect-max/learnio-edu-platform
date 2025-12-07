import 'package:flutter/material.dart';

import '../models/course.dart';
import '../services/courses_service.dart';

class AdminCoursesViewModel extends ChangeNotifier {
  final CoursesService _service = CoursesService();

  List<Course> courses = [];
  bool loading = false;
  String? errorMessage;
  String? successMessage;

  AdminCoursesViewModel() {
    loadCourses();
  }

  /// Charger tous les cours
  Future<void> loadCourses() async {
    try {
      loading = true;
      errorMessage = null;
      successMessage = null;
      notifyListeners();

      print('📚 Chargement des cours (Admin)...');
      courses = await _service.getCourses();
      print('✅ ${courses.length} cours chargés');

      loading = false;
      notifyListeners();
    } catch (e) {
      print('❌ Erreur loadCourses: $e');
      errorMessage = 'Erreur lors du chargement des cours: $e';
      loading = false;
      notifyListeners();
    }
  }

  /// Ajouter un nouveau cours
  Future<void> addCourse(Course course) async {
    try {
      print('➕ Ajout du cours: ${course.title}');
      loading = true;
      errorMessage = null;
      notifyListeners();

      await _service.addCourse(course);

      print('✅ Cours ajouté avec succès');
      successMessage = 'Cours "${course.title}" ajouté avec succès';
      await loadCourses();

      // Réinitialiser le message après 2 secondes
      await Future.delayed(const Duration(seconds: 2));
      successMessage = null;
      notifyListeners();
    } catch (e) {
      print('❌ Erreur addCourse: $e');
      errorMessage = 'Erreur lors de l\'ajout du cours: $e';
      loading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Modifier un cours existant
  Future<void> editCourse(Course course) async {
    try {
      print('✏️ Modification du cours: ${course.title}');
      loading = true;
      errorMessage = null;
      notifyListeners();

      await _service.updateCourse(course.id, course);

      print('✅ Cours modifié avec succès');
      successMessage = 'Cours "${course.title}" modifié avec succès';
      await loadCourses();

      // Réinitialiser le message après 2 secondes
      await Future.delayed(const Duration(seconds: 2));
      successMessage = null;
      notifyListeners();
    } catch (e) {
      print('❌ Erreur editCourse: $e');
      errorMessage = 'Erreur lors de la modification du cours: $e';
      loading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Supprimer un cours
  Future<void> deleteCourse(String id) async {
    try {
      final course = courses.firstWhere((c) => c.id == id);
      print('🗑️ Suppression du cours: ${course.title}');

      loading = true;
      errorMessage = null;
      notifyListeners();

      await _service.deleteCourse(id);

      print('✅ Cours supprimé avec succès');
      successMessage = 'Cours "${course.title}" supprimé avec succès';
      await loadCourses();

      // Réinitialiser le message après 2 secondes
      await Future.delayed(const Duration(seconds: 2));
      successMessage = null;
      notifyListeners();
    } catch (e) {
      print('❌ Erreur deleteCourse: $e');
      errorMessage = 'Erreur lors de la suppression du cours: $e';
      loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // ═══════════════════════════════════════════════════
  // --- Getters utiles ---
  // ═══════════════════════════════════════════════════

  /// Nombre total de cours
  int get totalCourses => courses.length;

  /// Nombre de cours gratuits
  int get freeCoursesCount =>
      courses.where((c) => c.isFree).length;

  /// Nombre de cours payants
  int get paidCoursesCount =>
      courses.where((c) => !c.isFree).length;

  /// Revenus totaux potentiels
  double get totalRevenue =>
      courses.fold(0.0, (sum, c) => sum + (c.isFree ? 0 : c.price));

  /// Cours par niveau
  List<Course> getCoursesByLevel(String level) {
    return courses.where((c) => c.level == level).toList();
  }

  /// Cours triés par popularité (rating)
  List<Course> get coursesByPopularity {
    final sorted = [...courses];
    sorted.sort((a, b) => b.rating.compareTo(a.rating));
    return sorted;
  }

  /// Cours triés par prix (décroissant)
  List<Course> get coursesByPrice {
    final sorted = [...courses];
    sorted.sort((a, b) => b.price.compareTo(a.price));
    return sorted;
  }

  /// Chercher un cours par titre
  List<Course> searchCourses(String query) {
    if (query.trim().isEmpty) return courses;

    final lowerQuery = query.toLowerCase();
    return courses
        .where((course) =>
            course.title.toLowerCase().contains(lowerQuery) ||
            course.description.toLowerCase().contains(lowerQuery) ||
            course.author.toLowerCase().contains(lowerQuery))
        .toList();
  }

  /// Obtenir un cours par ID
  Course? getCourseById(String id) {
    try {
      return courses.firstWhere((c) => c.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Exporter les cours en format JSON (pour statistiques)
  Map<String, dynamic> getStatistics() {
    return {
      'totalCourses': totalCourses,
      'freeCourses': freeCoursesCount,
      'paidCourses': paidCoursesCount,
      'totalRevenue': totalRevenue,
      'averageRating': courses.isEmpty
          ? 0.0
          : courses.fold(0.0, (sum, c) => sum + c.rating) / courses.length,
      'coursesByLevel': {
        'Débutant': getCoursesByLevel('Débutant').length,
        'Intermédiaire': getCoursesByLevel('Intermédiaire').length,
        'Avancé': getCoursesByLevel('Avancé').length,
      },
    };
  }

  /// Effacer les messages
  void clearMessages() {
    errorMessage = null;
    successMessage = null;
    notifyListeners();
  }
}
