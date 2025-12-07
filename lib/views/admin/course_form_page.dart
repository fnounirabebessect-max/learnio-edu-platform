import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../models/course.dart';
import '../../../models/module.dart';
import '../../../viewmodels/courses_viewmodel.dart';

class CourseFormPage extends StatefulWidget {
  final Course? course;

  const CourseFormPage({super.key, this.course});

  @override
  State<CourseFormPage> createState() => _CourseFormPageState();
}

class _CourseFormPageState extends State<CourseFormPage> {
  final _formKey = GlobalKey<FormState>();

  final titleCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final authorCtrl = TextEditingController();
  final priceCtrl = TextEditingController();
  final oldPriceCtrl = TextEditingController();
  final ratingCtrl = TextEditingController();
  final imageCtrl = TextEditingController();
  final durationCtrl = TextEditingController();
  final reviewsCtrl = TextEditingController();

  final List<ModuleFormData> modules = [];

  String level = 'Débutant';
  String language = 'Français';
  bool isFree = true;
  bool hasCertificate = false;

  @override
  void initState() {
    super.initState();
    final c = widget.course;
    if (c != null) {
      titleCtrl.text = c.title;
      descCtrl.text = c.description;
      authorCtrl.text = c.author;
      level = c.level;
      isFree = c.isFree;
      priceCtrl.text = c.price == 0 ? '' : c.price.toString();
      oldPriceCtrl.text = c.oldPrice == 0 ? '' : c.oldPrice.toString();
      ratingCtrl.text = c.rating == 0 ? '' : c.rating.toString();
      reviewsCtrl.text = c.reviews == 0 ? '' : c.reviews.toString();
      imageCtrl.text = c.image;
      durationCtrl.text = c.duration;
      language = c.language;
      hasCertificate = c.hasCertificate;

      // ✅ Charger les modules existants
      for (var module in c.modules) {
        modules.add(ModuleFormData(
          id: module.id,
          title: module.title,
          order: module.order,
          duration: module.duration.toString(),
          videoUrl: module.videoUrl,
          pdfUrl: module.pdfUrl,
        ));
      }
    }
  }

  @override
  void dispose() {
    titleCtrl.dispose();
    descCtrl.dispose();
    authorCtrl.dispose();
    priceCtrl.dispose();
    oldPriceCtrl.dispose();
    ratingCtrl.dispose();
    imageCtrl.dispose();
    durationCtrl.dispose();
    reviewsCtrl.dispose();
    super.dispose();
  }

  InputDecoration _fieldDecoration(String label, {int lines = 1}) {
    return InputDecoration(
      labelText: label,
      alignLabelWithHint: lines > 1,
      filled: true,
      fillColor: Colors.white,
      labelStyle: TextStyle(color: Colors.grey[700]),
      hintStyle: TextStyle(color: Colors.grey[500]),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: Colors.grey.shade400,
          width: 1.2,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: Theme.of(context).primaryColor,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: Colors.red,
          width: 1.5,
        ),
      ),
    );
  }

  String _normalizeDuration(String raw) {
    final t = raw.trim();
    if (t.isEmpty) return '';
    if (!t.toLowerCase().contains('h')) {
      return '${t}h';
    }
    return t;
  }

  void _addModule() {
    setState(() {
      modules.add(ModuleFormData(
        id: 'module_${DateTime.now().millisecondsSinceEpoch}',
        title: '',
        order: modules.length + 1,
        duration: '',
        videoUrl: '',
        pdfUrl: '',
      ));
    });
  }

  void _removeModule(int index) {
    setState(() {
      modules.removeAt(index);
      for (int i = 0; i < modules.length; i++) {
        modules[i].order = i + 1;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<CoursesViewModel>(context, listen: false);
    final screenWidth = MediaQuery.of(context).size.width;
    final maxPageWidth = screenWidth > 600 ? 600.0 : screenWidth * 0.96;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: Text(
          widget.course == null ? "Créer un cours" : "Modifier un cours",
        ),
        backgroundColor: Colors.white,
        foregroundColor: Theme.of(context).primaryColor,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            width: maxPageWidth,
            padding: const EdgeInsets.all(16),
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // === SECTION: INFORMATIONS DE BASE ===
                      const Text(
                        '📋 Informations générales',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo,
                        ),
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: titleCtrl,
                        decoration: _fieldDecoration("Titre *"),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Le titre est obligatoire';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: descCtrl,
                        maxLines: 3,
                        decoration:
                            _fieldDecoration("Description *", lines: 3),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'La description est obligatoire';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: authorCtrl,
                        decoration: _fieldDecoration("Auteur (optionnel)"),
                      ),
                      const SizedBox(height: 10),

                      DropdownButtonFormField<String>(
                        value: level,
                        decoration: _fieldDecoration("Niveau *"),
                        items: const [
                          DropdownMenuItem(
                              value: "Débutant", child: Text("Débutant")),
                          DropdownMenuItem(
                              value: "Intermédiaire",
                              child: Text("Intermédiaire")),
                          DropdownMenuItem(
                              value: "Avancé", child: Text("Avancé")),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => level = val);
                        },
                      ),
                      const SizedBox(height: 10),

                      DropdownButtonFormField<String>(
                        value: language,
                        decoration: _fieldDecoration("Langue *"),
                        items: const [
                          DropdownMenuItem(
                              value: "Français", child: Text("Français")),
                          DropdownMenuItem(
                              value: "Anglais", child: Text("Anglais")),
                          DropdownMenuItem(
                              value: "Arabe", child: Text("Arabe")),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => language = val);
                        },
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: durationCtrl,
                        decoration: _fieldDecoration(
                            "Durée totale en heures *"),
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'La durée est obligatoire';
                          }
                          if (double.tryParse(val.replaceAll(',', '.')) ==
                              null) {
                            return 'Entrez un nombre (ex: 6 ou 6.5)';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: imageCtrl,
                        decoration: _fieldDecoration(
                            "URL ou asset de l'image (optionnel)"),
                      ),
                      const SizedBox(height: 10),

                      SwitchListTile(
                        title: const Text("Certificat inclus"),
                        value: hasCertificate,
                        onChanged: (val) {
                          setState(() => hasCertificate = val);
                        },
                      ),
                      const SizedBox(height: 16),

                      // === SECTION: TARIFICATION ===
                      const Divider(height: 32),
                      const Text(
                        '💰 Tarification',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo,
                        ),
                      ),
                      const SizedBox(height: 16),

                      SwitchListTile(
                        title: const Text("Cours gratuit"),
                        value: isFree,
                        onChanged: (val) {
                          setState(() => isFree = val);
                        },
                      ),
                      const SizedBox(height: 10),

                      if (!isFree) ...[
                        TextFormField(
                          controller: priceCtrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: _fieldDecoration("Prix (TND) *"),
                          validator: (val) {
                            if (isFree) return null;
                            if (val == null || val.trim().isEmpty) {
                              return 'Le prix est obligatoire';
                            }
                            if (double.tryParse(
                                    val.replaceAll(',', '.')) ==
                                null) {
                              return 'Entrez un nombre valide';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: oldPriceCtrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration:
                              _fieldDecoration("Ancien prix (optionnel)"),
                        ),
                        const SizedBox(height: 10),
                      ],

                      // === SECTION: ÉVALUATION ===
                      const Divider(height: 32),
                      const Text(
                        '⭐ Évaluation',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo,
                        ),
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: ratingCtrl,
                        keyboardType:
                            const TextInputType.numberWithOptions(
                                decimal: true),
                        decoration:
                            _fieldDecoration("Note (0–5, optionnel)"),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return null;
                          }
                          final v = double.tryParse(
                              val.replaceAll(',', '.'));
                          if (v == null || v < 0 || v > 5) {
                            return 'Entrez une note entre 0 et 5';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),

                      TextFormField(
                        controller: reviewsCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            _fieldDecoration("Nombre d'avis (optionnel)"),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return null;
                          }
                          if (int.tryParse(val) == null) {
                            return 'Entrez un nombre entier';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // === SECTION: MODULES ===
                      const Divider(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            '📚 Modules du cours',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.indigo,
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _addModule,
                            icon: const Icon(Icons.add),
                            label: const Text('Ajouter'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      if (modules.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Text(
                              'Aucun module. Cliquez sur "Ajouter" pour en créer un.',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: modules.length,
                          itemBuilder: (ctx, i) {
                            final module = modules[i];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ExpansionTile(
                                title: Text(
                                  module.title.isEmpty
                                      ? 'Module ${i + 1}'
                                      : module.title,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  '${module.duration} min',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete,
                                      color: Colors.red),
                                  onPressed: () => _removeModule(i),
                                ),
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      children: [
                                        TextFormField(
                                          initialValue: module.title,
                                          decoration: _fieldDecoration(
                                              "Titre du module *"),
                                          onChanged: (val) {
                                            setState(() {
                                              module.title = val;
                                            });
                                          },
                                          validator: (val) {
                                            if (val == null ||
                                                val.trim().isEmpty) {
                                              return 'Le titre est obligatoire';
                                            }
                                            return null;
                                          },
                                        ),
                                        const SizedBox(height: 10),

                                        TextFormField(
                                          initialValue: module.duration,
                                          decoration: _fieldDecoration(
                                              "Durée (minutes) *"),
                                          keyboardType:
                                              TextInputType.number,
                                          onChanged: (val) {
                                            setState(() {
                                              module.duration = val;
                                            });
                                          },
                                          validator: (val) {
                                            if (val == null ||
                                                val.trim().isEmpty) {
                                              return 'Entrez la durée';
                                            }
                                            if (int.tryParse(val) == null) {
                                              return 'Entrez un nombre entier';
                                            }
                                            return null;
                                          },
                                        ),
                                        const SizedBox(height: 10),

                                        TextFormField(
                                          initialValue: module.videoUrl,
                                          decoration: _fieldDecoration(
                                            "URL Vidéo (Google Drive)",
                                            lines: 2,
                                          ),
                                          maxLines: 2,
                                          onChanged: (val) {
                                            setState(() {
                                              module.videoUrl = val;
                                            });
                                          },
                                        ),
                                        const SizedBox(height: 10),

                                        TextFormField(
                                          initialValue: module.pdfUrl,
                                          decoration: _fieldDecoration(
                                            "URL PDF (Google Drive)",
                                            lines: 2,
                                          ),
                                          maxLines: 2,
                                          onChanged: (val) {
                                            setState(() {
                                              module.pdfUrl = val;
                                            });
                                          },
                                        ),
                                        const SizedBox(height: 10),

                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: Colors.blue[50],
                                            borderRadius:
                                                BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            'Vidéo: ${module.videoUrl.isEmpty ? '❌' : '✅'} | PDF: ${module.pdfUrl.isEmpty ? '❌' : '✅'}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      const SizedBox(height: 24),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            if (!_formKey.currentState!.validate()) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content:
                                      Text('Veuillez remplir tous les champs'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }

                            for (int i = 0; i < modules.length; i++) {
                              final m = modules[i];
                              if (m.title.trim().isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        'Module ${i + 1}: titre obligatoire'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                return;
                              }
                              if (m.duration.trim().isEmpty ||
                                  int.tryParse(m.duration) == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        'Module ${i + 1}: durée invalide'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                return;
                              }
                            }

                            final moduleList = modules
                                .map((m) => Module(
                                      id: m.id,
                                      title: m.title.trim(),
                                      order: m.order,
                                      duration: int.parse(m.duration.trim()),
                                      videoUrl: m.videoUrl.trim(),
                                      pdfUrl: m.pdfUrl.trim(),
                                    ))
                                .toList();

                            final durationNormalized =
                                _normalizeDuration(durationCtrl.text);

                            final course = Course(
                              id: widget.course?.id ?? '',
                              title: titleCtrl.text.trim(),
                              description: descCtrl.text.trim(),
                              author: authorCtrl.text.trim().isEmpty
                                  ? "admin"
                                  : authorCtrl.text.trim(),
                              level: level,
                              isFree: isFree,
                              price: isFree
                                  ? 0
                                  : double.parse(
                                      priceCtrl.text
                                          .replaceAll(',', '.'),
                                    ),
                              oldPrice: isFree ||
                                      oldPriceCtrl.text.trim().isEmpty
                                  ? 0
                                  : double.tryParse(oldPriceCtrl.text
                                          .replaceAll(',', '.')) ??
                                      0,
                              rating: ratingCtrl.text.trim().isEmpty
                                  ? 0
                                  : double.tryParse(ratingCtrl.text
                                          .replaceAll(',', '.')) ??
                                      0,
                              reviews: reviewsCtrl.text.trim().isEmpty
                                  ? 0
                                  : int.tryParse(reviewsCtrl.text) ?? 0,
                              image: imageCtrl.text.trim(),
                              duration: durationNormalized,
                              language: language,
                              hasCertificate: hasCertificate,
                              modules: moduleList,
                            );

                            if (widget.course == null) {
                              vm.addCourse(course);
                            } else {
                              vm.updateCourse(course);
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  widget.course == null
                                      ? '✅ Cours créé avec ${moduleList.length} modules'
                                      : '✅ Cours modifié avec ${moduleList.length} modules',
                                ),
                                backgroundColor: Colors.green,
                              ),
                            );

                            Navigator.pop(context);
                          },
                          icon: const Icon(Icons.save),
                          label: const Text("Enregistrer le cours"),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            backgroundColor: Colors.indigo,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ModuleFormData {
  String id;
  String title;
  int order;
  String duration;
  String videoUrl;
  String pdfUrl;

  ModuleFormData({
    required this.id,
    required this.title,
    required this.order,
    required this.duration,
    required this.videoUrl,
    required this.pdfUrl,
  });
}
