import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../viewmodels/courses_viewmodel.dart';
import 'course_form_page.dart';

class AdminCoursesPage extends StatelessWidget {
  const AdminCoursesPage({super.key}); // constructeur const

  @override
  Widget build(BuildContext context) {
    // typage explicite pour le ViewModel
    final vm = Provider.of<CoursesViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Gestion des cours"),
      ),
      body: vm.loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: vm.courses.length,
              itemBuilder: (context, index) {
                final course = vm.courses[index];
                return ListTile(
                  title: Text(course.title),
                  subtitle: Text(course.description),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CourseFormPage(course: course),
                            ),
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => vm.deleteCourse(course.id),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.add),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => CourseFormPage(),
            ),
          );
        },
      ),
    );
  }
}
