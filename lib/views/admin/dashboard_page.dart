import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../models/transaction_model.dart';
import '../../services/auth_service.dart';
import '../../services/enrollment_transaction_service.dart';
import 'users_management_page.dart';
import 'courses_management_page.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final auth = AuthService();
  final _etService = EnrollmentTransactionService();

  Map<String, dynamic> stats = {};
  bool isLoading = true;

  List<BarChartGroupData> barGroups = [];
  List<TransactionModel> topPayments = [];
  List<Map<String, dynamic>> top3Courses = [];

  @override
  void initState() {
    super.initState();
    loadStats();
  }

  Future<void> loadStats() async {
    try {
      final totalRevenue = await _etService.getTotalRevenue();
      final totalEnrollments = await _etService.getTotalEnrollments();
      final payments = await _etService.getTop5Payments();
      final courses = await _etService.getTop3CoursesByEnrollments();

      topPayments = payments;
      top3Courses = courses;
      final revenueData = payments.map((p) => p.amount).toList();
      print('revenueData: $revenueData');
      print('top3Courses: $top3Courses');

      setState(() {
        stats = {
          'totalRevenue': totalRevenue,
          'totalEnrollments': totalEnrollments,
          'revenueData': revenueData,
        };

        barGroups = List.generate(
          revenueData.length,
          (index) => BarChartGroupData(
            x: index,
            barRods: [
              BarChartRodData(
                toY: revenueData[index],
                color: Colors.primaries[index % Colors.primaries.length],
                width: 24,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(6)),
              ),
            ],
          ),
        );

        isLoading = false;
      });
    } catch (e) {
      print('Erreur loadStats: $e');
      setState(() {
        stats = {
          'totalRevenue': 0.0,
          'totalEnrollments': 0,
          'revenueData': <double>[100, 80, 60, 40, 20],
        };
        topPayments = [];
        top3Courses = [];
        barGroups = List.generate(
          5,
          (index) => BarChartGroupData(
            x: index,
            barRods: [
              BarChartRodData(
                toY: 100.0 - index * 20,
                color: Colors.primaries[index % Colors.primaries.length],
              ),
            ],
          ),
        );
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Tableau de Bord Admin',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        elevation: 2,
        actions: [
          Tooltip(
            message: 'Actualiser les données',
            child: IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: loadStats,
            ),
          ),
          Tooltip(
            message: 'Déconnexion',
            child: IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Déconnexion'),
                    content: const Text(
                      'Êtes-vous sûr de vouloir vous déconnecter ?',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Annuler'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text(
                          'Déconnecter',
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                );

                if (confirmed == true) {
                  await auth.signOut();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/auth',
                      (route) => false,
                    );
                  }
                }
              },
            ),
          ),
        ],
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Colors.indigo),
            )
          : RefreshIndicator(
              onRefresh: loadStats,
              color: Colors.indigo,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Titre
                    const Text(
                      'Bienvenue sur votre tableau de bord',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.indigo,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Suivi des revenus, inscriptions et performances',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Stats Cards
                    _buildStatsCards(),
                    const SizedBox(height: 32),

                    // Charts
                    _buildCharts(),
                    const SizedBox(height: 32),

                    // Top 3 Courses
                    _buildTop3Courses(),
                    const SizedBox(height: 32),

                    // Navigation Tiles
                    _buildNavigationTiles(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
    );
  }

  /// ✅ Stats Cards (Revenue + Enrollments) - CORRIGÉ (NO OVERFLOW)
  Widget _buildStatsCards() {
    return Row(
      children: [
        // Total Revenue
        Expanded(
          child: Container(
            height: 140, // ✅ RÉDUIT à 140
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green[400]!, Colors.green[600]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(16), // ✅ RÉDUIT à 16
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceEvenly, // ✅ CHANGÉ
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.attach_money,
                      size: 28,
                      color: Colors.white,
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${(stats['totalRevenue'] ?? 0.0).toStringAsFixed(2)} TND',
                        style: const TextStyle(
                          fontSize: 24, // ✅ RÉDUIT à 24
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 3), // ✅ RÉDUIT à 3
                      const Text(
                        'Revenus Totaux',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12, // ✅ RÉDUIT à 12
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),

        // Total Enrollments
        Expanded(
          child: Container(
            height: 140, // ✅ RÉDUIT à 140
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue[400]!, Colors.blue[600]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.blue.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(16), // ✅ RÉDUIT à 16
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceEvenly, // ✅ CHANGÉ
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.school,
                      size: 28,
                      color: Colors.white,
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${stats['totalEnrollments'] ?? 0}',
                        style: const TextStyle(
                          fontSize: 24, // ✅ RÉDUIT à 24
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 3), // ✅ RÉDUIT à 3
                      const Text(
                        'Total Inscriptions',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12, // ✅ RÉDUIT à 12
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// Charts Section
  Widget _buildCharts() {
    final revenueData =
        (stats['revenueData'] as List?)?.cast<double>() ?? [];
    final maxRevenue = revenueData.isNotEmpty
        ? revenueData.reduce((a, b) => a > b ? a : b) * 1.2
        : 100.0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Top 5 Paiements',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.indigo,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Revenus des 5 derniers paiements',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 250,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: maxRevenue,
                  barTouchData: BarTouchData(
                    enabled: true,
                    touchTooltipData: BarTouchTooltipData(
                      tooltipRoundedRadius: 8,
                      tooltipPadding: const EdgeInsets.all(8),
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        final value = revenueData[group.x.toInt()];
                        return BarTooltipItem(
                          '${value.toStringAsFixed(2)} TND',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        );
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          final index = value.toInt();
                          if (index < 0 || index >= topPayments.length) {
                            return const SizedBox.shrink();
                          }
                          final courseName = topPayments[index].courseName;
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: SizedBox(
                              width: 60,
                              child: Text(
                                courseName,
                                style: const TextStyle(fontSize: 10),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: barGroups,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Top 3 Courses by Enrollments
  Widget _buildTop3Courses() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Top 3 Cours (Par Inscriptions)',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.indigo,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Vos cours les plus populaires',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            if (top3Courses.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(
                    children: [
                      Icon(
                        Icons.library_books_outlined,
                        size: 48,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Aucun cours disponible',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: top3Courses.length,
                itemBuilder: (context, index) {
                  final course = top3Courses[index];
                  final courseName = course['courseName'] ?? 'Inconnu';
                  final enrollmentCount = course['enrollmentCount'] ?? 0;
                  final isFree = course['isFree'] ?? true;
                  final price = course['price'] ?? 0.0;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: 1,
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor:
                            Colors.primaries[index % Colors.primaries.length],
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(
                        courseName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Row(
                        children: [
                          Icon(
                            Icons.people_outline,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$enrollmentCount inscription${enrollmentCount > 1 ? 's' : ''}',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isFree ? Colors.green[100] : Colors.blue[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          isFree
                              ? 'Gratuit'
                              : '${price.toStringAsFixed(2)} TND',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: isFree
                                ? Colors.green[700]
                                : Colors.blue[700],
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  /// Navigation Tiles
  Widget _buildNavigationTiles() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          // Users Management
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.people_alt, color: Colors.blue[700]),
            ),
            title: const Text(
              'Gestion des Utilisateurs',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            subtitle: const Text('Voir et gérer tous les utilisateurs'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const UsersManagementPage(),
              ),
            ),
          ),
          Divider(height: 1, color: Colors.grey[300]),

          // Courses Management
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.library_books, color: Colors.green[700]),
            ),
            title: const Text(
              'Gestion des Cours',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            subtitle: const Text('Créer, modifier et supprimer les cours'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const AdminCoursesPage(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
