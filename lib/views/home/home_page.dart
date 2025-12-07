import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/home_viewmodel.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/stat_card.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<HomeViewModel>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      // ✅ Utilise CustomAppBar comme les autres pages
      appBar: CustomAppBar(
        pageTitle: 'Acceuil',
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const _HeroSection(),
            const SizedBox(height: 16),
            const _AboutSection(),
            _StatsSection(stats: vm.stats),
            const SizedBox(height: 30),
            const Footer(),
          ],
        ),
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context) {
    final bannerHeight = MediaQuery.of(context).size.height * 0.28;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(18),
          bottom: Radius.circular(28),
        ),
        child: Stack(
          children: [
            SizedBox(
              height: bannerHeight,
              width: double.infinity,
              child: Image.asset(
                'assets/images/home_banner.png',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[300],
                    child: const Center(
                      child: Icon(Icons.image_not_supported),
                    ),
                  );
                },
              ),
            ),
            // overlay dégradé sombre
            Container(
              height: bannerHeight,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withOpacity(0.65),
                    Colors.black.withOpacity(0.25),
                  ],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
            ),
            // texte central
            SizedBox(
              height: bannerHeight,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Apprenez. Grandissez. Réussissez',
                        textAlign: TextAlign.center,
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Learnio est votre passerelle vers l\'excellence, offrant des cours de haute qualité dispensés par des experts de l\'industrie.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                            ),
                      ),
                      const SizedBox(height: 16),
                      PrimaryButton(
                        label: 'Découvrir les cours',
                        onPressed: () {
                          print('📚 Navigation vers /cours');
                          Navigator.pushNamed(context, '/cours');
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AboutSection extends StatelessWidget {
  const _AboutSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Learnio',
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 19,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Learnio est une plateforme d\'apprentissage en ligne qui aide les étudiants et le grand public à suivre des cours variés de façon simple et agréable.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.black87,
                      fontSize: 15,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Elle permet de découvrir des leçons, répondre à des quiz et obtenir des certificats après la réussite des formations. Les paiements se font facilement et en toute sécurité, offrant à chacun la possibilité d\'apprendre à son rythme.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontSize: 14,
                      height: 1.5,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  final List<Map<String, String>> stats;
  const _StatsSection({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      child: Column(
        children: [
          Text(
            'Learnio en Chiffres Clés',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 17,
                ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 400;
              return Wrap(
                spacing: 12,
                runSpacing: 12,
                alignment: WrapAlignment.center,
                children: stats.map((s) {
                  final width = isWide
                      ? (constraints.maxWidth / stats.length) - 12
                      : constraints.maxWidth;
                  return SizedBox(
                    width: width,
                    child: StatCard(
                      value: s['value'] ?? '',
                      label: s['label'] ?? '',
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class Footer extends StatelessWidget {
  const Footer({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 22),
      child: const Center(
        child: Text(
          '© Learnio 2025',
          style: TextStyle(
            fontSize: 13,
            color: Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }
}
