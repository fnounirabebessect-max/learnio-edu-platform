import 'package:flutter/material.dart';

import '../models/course.dart';
import '../services/courses_service.dart';

class CoursesViewModel extends ChangeNotifier {
  final CoursesService _service = CoursesService();

  List<Course> courses = [];
  bool loading = false;
  String? errorMessage;

  // Filtres pour la page publique
  bool showFree = true;
  bool showPaid = true;
  String levelFilter = 'Tous'; // "Tous", "Débutant", "Intermédiaire", "Avancé"

  CoursesViewModel() {
    // Charger automatiquement les cours existants depuis Firestore
    loadCourses();
  }

  /// Charger tous les cours depuis Firestore
  Future<void> loadCourses() async {
    try {
      loading = true;
      errorMessage = null;
      notifyListeners();

      print('📚 Chargement des cours...');
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
      await _service.addCourse(course);
      print('✅ Cours ajouté avec succès');
      await loadCourses(); // Recharger la liste
    } catch (e) {
      print('❌ Erreur addCourse: $e');
      errorMessage = 'Erreur lors de l\'ajout du cours: $e';
      notifyListeners();
      rethrow;
    }
  }

  /// Modifier un cours existant
  Future<void> updateCourse(Course course) async {
    try {
      print('✏️ Modification du cours: ${course.title}');
      await _service.updateCourse(course.id, course);
      print('✅ Cours modifié avec succès');
      await loadCourses(); // Recharger la liste
    } catch (e) {
      print('❌ Erreur updateCourse: $e');
      errorMessage = 'Erreur lors de la modification du cours: $e';
      notifyListeners();
      rethrow;
    }
  }

  /// Supprimer un cours
  Future<void> deleteCourse(String id) async {
    try {
      print('🗑️ Suppression du cours: $id');
      await _service.deleteCourse(id);
      print('✅ Cours supprimé avec succès');
      await loadCourses(); // Recharger la liste
    } catch (e) {
      print('❌ Erreur deleteCourse: $e');
      errorMessage = 'Erreur lors de la suppression du cours: $e';
      notifyListeners();
      rethrow;
    }
  }

  // ═══════════════════════════════════════════════════
  // --- Gestion des filtres ---
  // ═══════════════════════════════════════════════════

  /// Afficher/masquer les cours gratuits
  void setShowFree(bool value) {
    if (showFree != value) {
      showFree = value;
      notifyListeners();
    }
  }

  /// Afficher/masquer les cours payants
  void setShowPaid(bool value) {
    if (showPaid != value) {
      showPaid = value;
      notifyListeners();
    }
  }

  /// Définir le filtre de niveau
  void setLevelFilter(String value) {
    if (levelFilter != value) {
      levelFilter = value;
      notifyListeners();
    }
  }

  /// Réinitialiser tous les filtres
  void resetFilters() {
    showFree = true;
    showPaid = true;
    levelFilter = 'Tous';
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════
  // --- Getters filtrés ---
  // ═══════════════════════════════════════════════════

  /// Liste des cours filtrée selon les critères
  List<Course> get filteredCourses {
    return courses.where((course) {
      // Filtre gratuit / payant
      if (course.isFree && !showFree) return false;
      if (!course.isFree && !showPaid) return false;

      // Filtre de niveau
      if (levelFilter != 'Tous' && course.level != levelFilter) {
        return false;
      }

      return true;
    }).toList();
  }

  /// Nombre de cours gratuits
  int get freeCoursesCount =>
      courses.where((c) => c.isFree).length;

  /// Nombre de cours payants
  int get paidCoursesCount =>
      courses.where((c) => !c.isFree).length;

  /// Nombre total de cours filtrés
  int get filteredCoursesCount => filteredCourses.length;

  /// Cours par niveau
  List<Course> getCoursesByLevel(String level) {
    return courses.where((c) => c.level == level).toList();
  }

  /// Rechercher des cours par titre
  List<Course> searchCourses(String query) {
    if (query.trim().isEmpty) return filteredCourses;

    final lowerQuery = query.toLowerCase();
    return filteredCourses
        .where((course) =>
            course.title.toLowerCase().contains(lowerQuery) ||
            course.description.toLowerCase().contains(lowerQuery) ||
            course.author.toLowerCase().contains(lowerQuery))
        .toList();
  }

  /// Obtenir les cours les plus populaires (par note)
  List<Course> get topRatedCourses {
    final sorted = [...filteredCourses];
    sorted.sort((a, b) => b.rating.compareTo(a.rating));
    return sorted.take(10).toList();
  }

  /// Obtenir les cours les plus récemment ajoutés
  List<Course> get latestCourses {
    final sorted = [...courses];
    return sorted.reversed.take(10).toList();
  }
}
