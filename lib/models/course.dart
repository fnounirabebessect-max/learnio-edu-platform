import 'module.dart';

class Course {
  final String id;
  final String title;
  final String description;
  final String author;
  final String image;
  final double price;
  final double oldPrice;
  final bool isFree;
  final String level;
  final String duration;
  final String language;
  final bool hasCertificate;
  final double rating;
  final int reviews;
  final List<Module> modules;

  Course({
    required this.id,
    required this.title,
    required this.description,
    required this.author,
    required this.image,
    required this.price,
    required this.oldPrice,
    required this.isFree,
    required this.level,
    required this.duration,
    required this.language,
    required this.hasCertificate,
    required this.rating,
    required this.reviews,
    required this.modules,
  });

  /// Création depuis les données Firestore (avec champ 'id' déjà injecté)
  factory Course.fromFirestore(Map<String, dynamic> map) {
    // Modules
    final modulesList = <Module>[];
    if (map['modules'] is List) {
      for (var m in (map['modules'] as List)) {
        if (m is Map<String, dynamic>) {
          try {
            modulesList.add(
              Module(
                id: (m['id'] ?? '').toString(),
                title: (m['title'] ?? '').toString(),
                order: _toInt(m['order']),
                duration: _toInt(m['duration']),
                videoUrl: (m['videoUrl'] ?? '').toString(),
                pdfUrl: (m['pdfUrl'] ?? '').toString(),
              ),
            );
          } catch (e) {
            print('⚠️ Erreur parsing module: $e');
            continue;
          }
        }
      }
    }

    return Course(
      id: (map['id'] ?? '').toString(), // important pour l’inscription
      title: (map['title'] ?? '').toString(),
      description: (map['description'] ?? '').toString(),
      author: (map['author'] ?? 'admin').toString(),
      image: (map['image'] ?? '').toString(),
      price: _toDouble(map['price']),
      oldPrice: _toDouble(map['oldPrice']),
      isFree: map['isFree'] ?? true,
      level: (map['level'] ?? 'Débutant').toString(),
      duration: (map['duration'] ?? '').toString(),
      language: (map['language'] ?? 'Français').toString(),
      hasCertificate: map['hasCertificate'] ?? false,
      rating: _toDouble(map['rating']),
      reviews: _toInt(map['reviews']),
      modules: modulesList,
    );
  }

  /// Ancienne méthode compatible quand on a l'id séparé
  factory Course.fromMap(Map<String, dynamic> map, String id) {
    return Course.fromFirestore({...map, 'id': id});
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'author': author,
      'image': image,
      'price': price,
      'oldPrice': oldPrice,
      'isFree': isFree,
      'level': level,
      'duration': duration,
      'language': language,
      'hasCertificate': hasCertificate,
      'rating': rating,
      'reviews': reviews,
      'modules': modules.map((m) => m.toMap()).toList(),
    };
  }

  // Helpers

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}
