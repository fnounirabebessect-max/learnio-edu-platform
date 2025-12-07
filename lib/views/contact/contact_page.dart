import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/contact_viewmodel.dart';
import '../../widgets/custom_app_bar.dart';

class ContactPage extends StatefulWidget {
  const ContactPage({super.key});

  @override
  State<ContactPage> createState() => _ContactPageState();
}

class _ContactPageState extends State<ContactPage> {
  final _formKey = GlobalKey<FormState>();
  final nameCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final messageCtrl = TextEditingController();

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
    );
  }

  @override
  void dispose() {
    nameCtrl.dispose();
    emailCtrl.dispose();
    messageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<ContactViewModel>(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final maxPageWidth = screenWidth > 500 ? 500.0 : screenWidth * 0.96;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: CustomAppBar(
        pageTitle: 'Nous Contacter',
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            width: maxPageWidth,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 18),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Text(
                  'Nous sommes à votre écoute',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.indigo[700],
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Envoyez-nous vos questions ou suggestions',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // ═══════════════════════════════════════════════════
                // FORMULAIRE DE CONTACT
                // ═══════════════════════════════════════════════════
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 4,
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const Text(
                            'Formulaire de contact',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Nom
                          TextFormField(
                            controller: nameCtrl,
                            decoration: _fieldDecoration('Nom complet'),
                            validator: (v) =>
                                v == null || v.trim().isEmpty
                                    ? 'Le nom est requis'
                                    : null,
                          ),
                          const SizedBox(height: 12),

                          // Email
                          TextFormField(
                            controller: emailCtrl,
                            decoration: _fieldDecoration('Adresse email'),
                            keyboardType: TextInputType.emailAddress,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'L\'email est requis';
                              }
                              if (!v.contains('@') || !v.contains('.')) {
                                return 'Email invalide';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Message
                          TextFormField(
                            controller: messageCtrl,
                            decoration:
                                _fieldDecoration('Votre message', lines: 4),
                            minLines: 4,
                            maxLines: 6,
                            validator: (v) =>
                                v == null || v.trim().isEmpty
                                    ? 'Le message est requis'
                                    : null,
                          ),
                          const SizedBox(height: 20),

                          // Bouton Envoyer
                          SizedBox(
                            width: double.infinity,
                            child: vm.isSending
                                ? ElevatedButton(
                                    onPressed: null,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigo,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                    ),
                                    child: const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                      ),
                                    ),
                                  )
                                : ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigo,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                    ),
                                    onPressed: () {
                                      if (_formKey.currentState!.validate()) {
                                        vm.sendMessage(
                                          name: nameCtrl.text.trim(),
                                          email: emailCtrl.text.trim(),
                                          message: messageCtrl.text.trim(),
                                        );

                                        // Réinitialiser le formulaire
                                        nameCtrl.clear();
                                        emailCtrl.clear();
                                        messageCtrl.clear();
                                      }
                                    },
                                    child: const Text(
                                      'Envoyer',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 16),

                          // Messages de succès/erreur
                          if (vm.successMessage != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.green[50],
                                border: Border.all(
                                  color: Colors.green[400]!,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.check_circle,
                                    color: Colors.green[600],
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      vm.successMessage!,
                                      style: TextStyle(
                                        color: Colors.green[700],
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          if (vm.errorMessage != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red[50],
                                border: Border.all(
                                  color: Colors.red[400]!,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.error,
                                    color: Colors.red[600],
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      vm.errorMessage!,
                                      style: TextStyle(
                                        color: Colors.red[700],
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // ═══════════════════════════════════════════════════
                // INFORMATIONS DE CONTACT
                // ═══════════════════════════════════════════════════
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  margin: EdgeInsets.zero,
                  elevation: 4,
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Column(
                      children: [
                        const Text(
                          'Informations de contact',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ListTile(
                          leading: Icon(
                            Icons.location_on,
                            color: Colors.indigo[400],
                          ),
                          title: const Text(
                            'Adresse',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: const Text('Tunis, Tunisie'),
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: Icon(
                            Icons.email,
                            color: Colors.indigo[400],
                          ),
                          title: const Text(
                            'Email',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: const Text('contact@learnio.tn'),
                          onTap: () {
                            // Copier ou ouvrir email
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('contact@learnio.tn copié'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: Icon(
                            Icons.phone,
                            color: Colors.indigo[400],
                          ),
                          title: const Text(
                            'Téléphone',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: const Text('+216 27 722 469'),
                          onTap: () {
                            // Copier ou appeler
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('+216 27 722 469 copié'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
