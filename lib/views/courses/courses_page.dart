import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/courses_viewmodel.dart';
import '../../widgets/custom_app_bar.dart';
import 'course_card.dart';

class CoursesPage extends StatelessWidget {
  const CoursesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CoursesViewModel>(
      builder: (context, vm, child) => Scaffold(
        appBar: CustomAppBar(
          pageTitle: '',
        ),
        backgroundColor: Colors.grey[50],
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Filtres
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Ligne 1: Checkboxes
                    Row(
                      children: [
                        // Gratuits
                        Expanded(
                          child: Row(
                            children: [
                              Checkbox(
                                value: vm.showFree,
                                activeColor: Colors.indigo,
                                onChanged: (v) =>
                                    vm.setShowFree(v ?? true),
                              ),
                              const Expanded(
                                child: Text(
                                  'Gratuits',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Payants
                        Expanded(
                          child: Row(
                            children: [
                              Checkbox(
                                value: vm.showPaid,
                                activeColor: Colors.indigo,
                                onChanged: (v) =>
                                    vm.setShowPaid(v ?? true),
                              ),
                              const Expanded(
                                child: Text(
                                  'Payants',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Ligne 2: Dropdown Niveau
                    Row(
                      children: [
                        const Text(
                          'Niveau:',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: Colors.grey[300]!,
                                width: 1,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: DropdownButton<String>(
                              value: vm.levelFilter,
                              isExpanded: true,
                              underline: const SizedBox(),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              items: [
                                'Tous',
                                'Débutant',
                                'Intermédiaire',
                                'Avancé'
                              ]
                                  .map(
                                    (e) => DropdownMenuItem(
                                      value: e,
                                      child: Text(e),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (String? val) {
                                vm.setLevelFilter(val ?? 'Tous');
                              },
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Bouton Reset
                        Tooltip(
                          message: 'Réinitialiser les filtres',
                          child: IconButton(
                            icon: const Icon(
                              Icons.refresh,
                              color: Colors.indigo,
                            ),
                            onPressed: vm.resetFilters,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Liste des cours
              if (vm.loading)
                Expanded(
                  child: Center(
                    child: CircularProgressIndicator(
                      color: Colors.indigo[400],
                    ),
                  ),
                )
              else if (vm.filteredCourses.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Aucun cours ne correspond à vos critères',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: vm.resetFilters,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo,
                          ),
                          child: const Text(
                            'Réinitialiser les filtres',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: vm.filteredCourses.length,
                    itemBuilder: (context, index) => CourseCard(
                      course: vm.filteredCourses[index],
                    ),
                  ),
                ),

              // Nombre de cours trouvés
              if (vm.filteredCourses.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    '${vm.filteredCourses.length} cours trouvé${vm.filteredCourses.length > 1 ? 's' : ''}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
