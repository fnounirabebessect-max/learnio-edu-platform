import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../models/course.dart';
import 'course_detail_page.dart';

class CourseCard extends StatelessWidget {
  final Course course;
  const CourseCard({super.key, required this.course});

  @override
  Widget build(BuildContext context) {
    // normaliser le chemin d'image
    String raw = course.image.trim();
    String imagePath;

    if (raw.isEmpty) {
      // aucun visuel -> image par défaut
      imagePath = 'assets/images/default.jpg';
    } else if (raw.startsWith('assets/')) {
      // déjà un chemin complet
      imagePath = raw;
    } else {
      // seulement un nom de fichier -> on préfixe avec assets/images/
      imagePath = 'assets/images/$raw';
    }

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.symmetric(vertical: 7),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                imagePath,
                height: 110,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 7),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: course.level == "Avancé"
                    ? Colors.red[100]
                    : course.level == "Intermédiaire"
                        ? Colors.blue[100]
                        : Colors.green[100],
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                course.level,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              course.title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              "Par ${course.author}",
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            Row(
              children: [
                Icon(Icons.star, color: Colors.yellow[800], size: 15),
                Text(
                  "${course.rating}",
                  style: const TextStyle(fontSize: 13),
                ),
                Text(
                  " (${course.reviews} avis)",
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            Row(
              children: [
                if (!course.isFree)
                  Text(
                    "${course.price.toStringAsFixed(2)} TND",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                      fontSize: 16,
                    ),
                  ),
                if (course.oldPrice > 0)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Text(
                      "${course.oldPrice.toStringAsFixed(2)} TND",
                      style: const TextStyle(
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                        fontSize: 13,
                      ),
                    ),
                  ),
                if (course.isFree)
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      "Gratuit",
                      style: TextStyle(
                        color: Colors.green[700],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final user = FirebaseAuth.instance.currentUser;

                  // On exige maintenant la connexion pour tous les cours
                  if (user == null) {
                    Navigator.pushNamed(context, '/auth');
                  } else {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CourseDetailPage(course: course),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                ),
                child: const Text("Voir le cours"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
