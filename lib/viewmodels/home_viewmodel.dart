import 'package:flutter/material.dart';

class HomeViewModel extends ChangeNotifier {
  // Ici tu peux charger les données depuis Firestore si besoin
  bool isLoading = false;

  // données d'exemple pour la section "chiffres clés"
  final List<Map<String, String>> stats = [
    {'value': '200+', 'label': 'Cours Disponibles'},
    {'value': '10K+', 'label': 'Étudiants Inscrits'},
    {'value': '50+', 'label': 'Formateurs Experts'},
  ];
}
