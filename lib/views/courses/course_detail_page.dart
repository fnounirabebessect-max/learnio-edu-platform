import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../models/course.dart';
import '../../models/enrollment_model.dart';
import '../../services/paymee_service.dart';
import '../../services/enrollment_transaction_service.dart';
import '../../widgets/custom_app_bar.dart';
import '../payment/paymee_webview_page.dart';
import '../student/module_content_page.dart';

class CourseDetailPage extends StatefulWidget {
  final Course course;

  const CourseDetailPage({super.key, required this.course});

  @override
  State<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends State<CourseDetailPage> {
  final _auth = FirebaseAuth.instance;
  final _etService = EnrollmentTransactionService();
  final _firestore = FirebaseFirestore.instance;
  CollectionReference<Map<String, dynamic>>? _userCoursesRef;

  List<bool> _completedModules = [];
  bool _loading = true;
  bool _notConnected = false;
  bool _enrolled = false;

  @override
  void initState() {
    super.initState();
    _initProgress();
  }

  Future<void> _initProgress() async {
    final user = _auth.currentUser;

    _completedModules =
        List<bool>.filled(widget.course.modules.length, false);

    if (user == null) {
      setState(() {
        _loading = false;
        _notConnected = true;
      });
      return;
    }

    try {
      _userCoursesRef = _firestore
          .collection('users')
          .doc(user.uid)
          .collection('courses');

      final doc = await _userCoursesRef!.doc(widget.course.id).get();

      if (doc.exists) {
        _enrolled = true;
        final data = doc.data()!;
        final List<dynamic> completedIdx =
            (data['completedModules'] ?? []) as List<dynamic>;
        for (final idx in completedIdx) {
          if (idx is int &&
              idx >= 0 &&
              idx < _completedModules.length) {
            _completedModules[idx] = true;
          }
        }
      } else {
        _enrolled = false;
      }
    } catch (e) {
      print('❌ Erreur _initProgress: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Impossible de charger la progression: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        _notConnected = false;
        _loading = false;
        setState(() {});
      }
    }
  }

  double get _progress {
    if (widget.course.modules.isEmpty) return 0;
    final done = _completedModules.where((e) => e).length;
    return done / widget.course.modules.length;
  }

  Future<void> _toggleModule(int index) async {
    if (!_enrolled) return;
    final user = _auth.currentUser;
    if (user == null || _userCoursesRef == null) return;

    setState(() {
      _completedModules[index] = !_completedModules[index];
    });

    final completedIdx = <int>[];
    for (int i = 0; i < _completedModules.length; i++) {
      if (_completedModules[i]) completedIdx.add(i);
    }

    try {
      await _userCoursesRef!.doc(widget.course.id).set({
        'courseId': widget.course.id,
        'title': widget.course.title,
        'image': widget.course.image,
        'completedModules': completedIdx,
        'totalModules': widget.course.modules.length,
        'isFree': widget.course.isFree,
      }, SetOptions(merge: true));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de la mise à jour: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// ✅ Inscription gratuite
  Future<void> _enroll() async {
    final user = _auth.currentUser;
    if (user == null) {
      Navigator.pushNamed(context, '/auth');
      return;
    }

    try {
      print('📝 Inscription gratuite au cours: ${widget.course.title}');

      _userCoursesRef ??= _firestore
          .collection('users')
          .doc(user.uid)
          .collection('courses');

      // 1️⃣ Ajouter dans users/[userId]/courses
      print('1️⃣ Création du document users/courses...');
      await _userCoursesRef!.doc(widget.course.id).set({
        'courseId': widget.course.id,
        'title': widget.course.title,
        'image': widget.course.image,
        'completedModules': [],
        'totalModules': widget.course.modules.length,
        'isFree': widget.course.isFree,
        'createdAt': DateTime.now(),
        'isPaid': true,
        'amount': 0,
        'receivedAmount': 0,
      }, SetOptions(merge: true));
      print('✅ users/courses créé');

      // 2️⃣ Créer l'enrollment
      print('2️⃣ Création de l\'enrollment...');
      final enrollment = EnrollmentModel(
        id: '',
        userId: user.uid,
        courseId: widget.course.id,
        courseName: widget.course.title,
        enrolledAt: DateTime.now(),
        status: 'active',
      );

      await _etService.addEnrollment(enrollment);
      print('✅ Enrollment créé');

      if (mounted) {
        setState(() {
          _enrolled = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Inscription au cours réussie'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Erreur _enroll: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de l\'inscription: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// ✅ Paiement Paymee pour les cours payants
  Future<void> _payWithPaymee() async {
    final c = widget.course;
    final user = _auth.currentUser;

    if (user == null) {
      Navigator.pushNamed(context, '/auth');
      return;
    }

    try {
      print('💳 Début du processus de paiement');
      print('═' * 60);

      // 0️⃣ Créer le document users/courses AVANT le paiement
      print('0️⃣ Création du document users/courses (AVANT paiement)...');

      _userCoursesRef ??= _firestore
          .collection('users')
          .doc(user.uid)
          .collection('courses');

      await _userCoursesRef!.doc(widget.course.id).set({
        'courseId': widget.course.id,
        'title': widget.course.title,
        'image': widget.course.image,
        'completedModules': [],
        'totalModules': widget.course.modules.length,
        'isFree': widget.course.isFree,
        'createdAt': DateTime.now(),
        'isPaid': false,
        'amount': c.price,
        'receivedAmount': 0,
        'paymentProvider': '',
        'paymeeTransactionId': '',
        'paidAt': null,
      }, SetOptions(merge: true));

      print('✅ Document users/courses créé');
      print('   - Cours: ${widget.course.title}');
      print('   - Montant: ${c.price} TND');

      // 1️⃣ Créer paiement Paymee
      print('1️⃣ Création du paiement Paymee...');

      final paymentUrl = await PaymeeService.createSandboxPayment(
        amount: c.price,
        note: 'Achat cours: ${c.title}',
        firstName: 'Test',
        lastName: 'User',
        email: user.email ?? 'test@paymee.tn',
        phone: '+21611111111',
        userId: user.uid,
        courseId: c.id,
      );

      if (paymentUrl == null) {
        print('❌ paymentUrl est null');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('❌ Erreur: Impossible de créer le paiement'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      print('✅ Paiement créé avec succès');
      print('   URL: $paymentUrl');
      print('═' * 60);

      // 2️⃣ Ouvrir la page Paymee
      print('2️⃣ Ouverture du WebView Paymee...');

      final success = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => PaymeeWebViewPage(
            url: paymentUrl,
            userId: user.uid,
            courseId: c.id,
            courseName: c.title,
            amount: c.price,
          ),
        ),
      );

      print('3️⃣ Retour du WebView - Succès: $success');

      // 3️⃣ Si succès, mettre à jour l'UI
      if (success == true) {
        if (mounted) {
          setState(() {
            _enrolled = true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                '✅ Paiement réussi! Vous êtes maintenant inscrit.',
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      } else {
        print('ℹ️ Paiement annulé par l\'utilisateur');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Paiement annulé'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      print('═' * 60);
      print('❌ ERREUR DANS _payWithPaymee');
      print('═' * 60);
      print('Erreur: $e');
      print('═' * 60);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.course;

    String raw = c.image.trim();
    String headerImage;
    if (raw.isEmpty) {
      headerImage = 'assets/images/default.jpg';
    } else if (raw.startsWith('assets/')) {
      headerImage = raw;
    } else {
      headerImage = 'assets/images/$raw';
    }

    if (_loading) {
      return Scaffold(
        appBar: CustomAppBar(
          pageTitle: 'Chargement...',
          showBackButton: true,
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Colors.indigo),
        ),
      );
    }

    if (_notConnected) {
      return Scaffold(
        appBar: CustomAppBar(
          pageTitle: c.title,
          showBackButton: true,
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock, size: 60, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Connectez-vous pour voir ce cours',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                ),
                onPressed: () => Navigator.pushNamed(context, '/auth'),
                child: const Text(
                  'Se connecter',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 2,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.indigo),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                c.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    headerImage,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Image.asset(
                        'assets/images/default.jpg',
                        fit: BoxFit.cover,
                      );
                    },
                  ),
                  Container(
                    color: Colors.black.withOpacity(0.4),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ✅ Auteur et détails
                  Text(
                    'Par ${c.author}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // ✅ Rating
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        color: Colors.amber[400],
                        size: 18,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${c.rating.toStringAsFixed(1)} (${c.reviews} avis)',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // ✅ Chips - Niveau, Durée, Langue, Certificat
                  Row(
                    children: [
                      Chip(label: Text('Niveau : ${c.level}')),
                      const SizedBox(width: 8),
                      if (c.duration.isNotEmpty)
                        Chip(label: Text('Durée : ${c.duration}')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Chip(label: Text('Langue : ${c.language}')),
                      const SizedBox(width: 8),
                      Chip(
                        label: Text(
                          c.hasCertificate
                              ? '✓ Certificat inclus'
                              : 'Sans certificat',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ✅ Prix
                  if (!c.isFree)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.indigo[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.indigo, width: 1),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.attach_money,
                              color: Colors.indigo),
                          Text(
                            '${c.price.toStringAsFixed(2)} TND',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.indigo,
                            ),
                          ),
                          if (c.oldPrice > 0) ...[
                            const SizedBox(width: 8),
                            Text(
                              '${c.oldPrice.toStringAsFixed(2)} TND',
                              style: const TextStyle(
                                fontSize: 14,
                                decoration: TextDecoration.lineThrough,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green, width: 1),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            'Cours GRATUIT',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),

                  // ✅ Description
                  Text(
                    c.description,
                    style: const TextStyle(
                      fontSize: 15,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ✅ Modules du cours
                  if (c.modules.isNotEmpty) ...[
                    const Text(
                      'Modules du cours',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_enrolled) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: _progress,
                          minHeight: 8,
                          backgroundColor: Colors.grey[300],
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.indigo),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_completedModules.where((e) => e).length} / ${c.modules.length} modules complétés',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 12),
                      // ✅ Modules inscrit avec bouton "Consulter"
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: c.modules.length,
                        itemBuilder: (ctx, i) {
                          final module = c.modules[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            elevation: 1,
                            child: ListTile(
                              leading: Checkbox(
                                value: _completedModules[i],
                                activeColor: Colors.indigo,
                                onChanged: (_) => _toggleModule(i),
                              ),
                              title: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    module.title,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      decoration: _completedModules[i]
                                          ? TextDecoration.lineThrough
                                          : null,
                                      color: _completedModules[i]
                                          ? Colors.grey
                                          : Colors.black,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.schedule,
                                        size: 14,
                                        color: Colors.grey[600],
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${module.duration} min',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              trailing: TextButton(
                                onPressed: (module.videoUrl.isEmpty &&
                                        module.pdfUrl.isEmpty)
                                    ? null
                                    : () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                ModuleContentPage(
                                              module: module,
                                            ),
                                          ),
                                        );
                                      },
                                child: Text(
                                  (module.videoUrl.isEmpty &&
                                          module.pdfUrl.isEmpty)
                                      ? 'Sans contenu'
                                      : 'Consulter',
                                  style: TextStyle(
                                    color: (module.videoUrl.isEmpty &&
                                            module.pdfUrl.isEmpty)
                                        ? Colors.grey
                                        : Colors.indigo,
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Inscrivez-vous pour accéder au contenu des modules.',
                          style: TextStyle(
                            color: Colors.grey,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // ✅ Modules verrouillés
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: c.modules.length,
                        itemBuilder: (ctx, i) {
                          final module = c.modules[i];
                          return ListTile(
                            leading: const Icon(
                              Icons.lock_outline,
                              color: Colors.grey,
                            ),
                            title: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  module.title,
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.schedule,
                                      size: 14,
                                      color: Colors.grey[400],
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${module.duration} min',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[400],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ],
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: SizedBox(
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _enrolled ? Colors.grey : Colors.indigo,
            ),
            onPressed: () async {
              if (_enrolled) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Vous êtes déjà inscrit à ce cours',
                    ),
                    backgroundColor: Colors.blue,
                  ),
                );
                return;
              }

              if (widget.course.isFree) {
                print('📝 Cours GRATUIT - Inscription directe');
                await _enroll();
              } else {
                print('💳 Cours PAYANT - Ouverture du paiement');
                await _payWithPaymee();
              }
            },
            child: Text(
              _enrolled
                  ? 'Déjà inscrit'
                  : (c.isFree
                      ? 'S\'inscrire gratuitement'
                      : 'Acheter le cours (${c.price.toStringAsFixed(2)} TND)'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
