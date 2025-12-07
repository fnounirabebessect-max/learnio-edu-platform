import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../models/course.dart';
import '../../widgets/custom_app_bar.dart';
import '../courses/course_detail_page.dart';

class MyCoursesPage extends StatelessWidget {
  const MyCoursesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return Scaffold(
        appBar: CustomAppBar(
          pageTitle: 'Mes cours',
        ),
        body: const Center(
          child: Text('Connectez-vous pour voir vos cours.'),
        ),
      );
    }

    return Scaffold(
      appBar: CustomAppBar(
        pageTitle: 'Mes cours',
      ),
      backgroundColor: Colors.grey[50],
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .collection('courses')
            .snapshots(),
        builder: (context, snapshot) {
          // Chargement
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: Colors.indigo),
            );
          }

          // Erreur
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Erreur: ${snapshot.error}',
                style: const TextStyle(color: Colors.red),
              ),
            );
          }

          // Aucun cours
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.school_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Vous n\'êtes inscrit à aucun cours pour le moment.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.pushNamed(context, '/courses'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                    ),
                    child: const Text(
                      'Découvrir les cours',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            );
          }

          // Liste des cours
          final docs = snapshot.data!.docs;

          return RefreshIndicator(
            onRefresh: () async {
              // Refresh the stream
              await Future.delayed(const Duration(milliseconds: 500));
            },
            color: Colors.indigo,
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: docs.length,
              itemBuilder: (ctx, i) {
                final doc = docs[i];
                final data = doc.data();

                final courseId = doc.id;
                final title = data['title'] ?? 'Sans titre';
                final image = (data['image'] ?? '') as String;
                final totalModules = data['totalModules'] ?? 0;
                final completedList =
                    (data['completedModules'] ?? []) as List<dynamic>;
                final completedCount = completedList.length;
                final progress = totalModules == 0
                    ? 0.0
                    : completedCount.toDouble() / totalModules.toDouble();

                // Normaliser le chemin de l'image
                final imgPath = image.trim().isEmpty
                    ? 'assets/images/default.jpg'
                    : (image.startsWith('assets/')
                        ? image
                        : 'assets/images/$image');

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 2,
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    // ✅ Image du cours
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.asset(
                        imgPath,
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.grey[300],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.image_not_supported,
                              color: Colors.grey[600],
                            ),
                          );
                        },
                      ),
                    ),
                    // ✅ Titre du cours
                    title: Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    // ✅ Progression et détails
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Progress bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 6,
                              backgroundColor: Colors.grey.shade300,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.indigo[400]!,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          // Progress text
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '$completedCount / $totalModules modules',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              // ✅ Badge de progression
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: progress == 1.0
                                      ? Colors.green[100]
                                      : Colors.orange[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${(progress * 100).toStringAsFixed(0)}%',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: progress == 1.0
                                        ? Colors.green[700]
                                        : Colors.orange[700],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          // ✅ Indicateur de complétion
                          const SizedBox(height: 6),
                          if (progress == 1.0)
                            Row(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 14,
                                  color: Colors.green[600],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Cours complété',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.green[600],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            )
                          else
                            Row(
                              children: [
                                Icon(
                                  Icons.schedule,
                                  size: 14,
                                  color: Colors.grey[600],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'En cours',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                    // ✅ Flèche de navigation
                    trailing: const Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: Colors.grey,
                    ),
                    onTap: () => _openCourse(
                      context,
                      courseId,
                      data,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  /// ✅ Ouvrir un cours depuis les données Firestore avec modules
  Future<void> _openCourse(
    BuildContext context,
    String courseId,
    Map<String, dynamic> userCourseData,
  ) async {
    try {
      print('📖 Ouverture du cours: $courseId');

      // ✅ Récupérer les données complètes du cours depuis la collection 'courses'
      final courseSnap = await FirebaseFirestore.instance
          .collection('courses')
          .doc(courseId)
          .get();

      if (!courseSnap.exists) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Ce cours n\'existe plus dans le catalogue.',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      // ✅ IMPORTANT: Correct order (data, id)
      final courseData = courseSnap.data() as Map<String, dynamic>;
      
      // ✅ Utiliser Course.fromFirestore pour parser les modules
      final course = Course.fromFirestore(courseData);

      print('✅ Cours chargé: ${course.title}');
      print('📚 Nombre de modules: ${course.modules.length}');

      // ✅ Afficher les modules chargés
      for (var (index, module) in course.modules.indexed) {
        print('   Module ${index + 1}: ${module.title} (${module.duration} min)');
        if (module.videoUrl.isNotEmpty) print('      ▶️ Vidéo disponible');
        if (module.pdfUrl.isNotEmpty) print('      📄 PDF disponible');
      }

      if (context.mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => CourseDetailPage(course: course),
          ),
        );
      }
    } catch (e) {
      print('❌ Erreur _openCourse: $e');

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Impossible d\'ouvrir ce cours: $e',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
