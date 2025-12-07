import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../models/module.dart';

class ModuleContentPage extends StatefulWidget {
  final Module module;

  const ModuleContentPage({super.key, required this.module});

  @override
  State<ModuleContentPage> createState() => _ModuleContentPageState();
}

class _ModuleContentPageState extends State<ModuleContentPage> {
  late WebViewController _webViewController;
  String _selectedTab = 'video'; // 'video' ou 'pdf'
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initWebViewController();
  }

  void _initWebViewController() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (url) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {
            if (mounted) {
              setState(() => _isLoading = false);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Erreur: ${error.description}'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
        ),
      );

    // charger le contenu initial
    if (widget.module.videoUrl.isNotEmpty) {
      _selectedTab = 'video';
      _loadVideo(widget.module.videoUrl);
    } else if (widget.module.pdfUrl.isNotEmpty) {
      _selectedTab = 'pdf';
      _loadPdf(widget.module.pdfUrl);
    } else {
      setState(() => _isLoading = false);
    }
  }

  // --------- Helpers Drive ---------

  String? _extractGoogleDriveFileId(String url) {
    final regex = RegExp(r'/d/([a-zA-Z0-9_-]+)');
    final match = regex.firstMatch(url);
    return match?.group(1);
  }

  String _buildGoogleDriveDirectUrl(String url) {
    if (!url.contains('drive.google.com')) return url;
    final fileId = _extractGoogleDriveFileId(url);
    if (fileId == null) return url;
    return 'https://drive.google.com/uc?export=download&id=$fileId';
  }

  String _buildGoogleDrivePdfViewerUrl(String url) {
    final direct = _buildGoogleDriveDirectUrl(url);
    final encoded = Uri.encodeComponent(direct);
    return 'https://drive.google.com/viewerng/viewer?embedded=true&url=$encoded';
  }

  // --------- Chargement contenu ---------

  void _loadPdf(String url) {
    if (url.isEmpty) return;
    final finalUrl = _buildGoogleDrivePdfViewerUrl(url);
    setState(() => _isLoading = true);
    _webViewController.loadRequest(Uri.parse(finalUrl));
  }

  void _loadVideo(String url) {
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Aucune vidéo disponible')),
      );
      return;
    }

    // Important : on charge directement la page Drive /file/d/.../view
    // => lecteur vidéo intégré dans la page
    setState(() => _isLoading = true);
    _webViewController.loadRequest(Uri.parse(url));
  }

  // --------- UI ---------

  @override
  Widget build(BuildContext context) {
    final hasVideo = widget.module.videoUrl.isNotEmpty;
    final hasPdf = widget.module.pdfUrl.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.module.title),
        backgroundColor: Colors.indigo,
      ),
      body: Column(
        children: [
          if (hasVideo || hasPdf)
            Row(
              children: [
                if (hasVideo)
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _selectedTab = 'video');
                        _loadVideo(widget.module.videoUrl);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: _selectedTab == 'video'
                                  ? Colors.indigo
                                  : Colors.transparent,
                              width: 3,
                            ),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.play_circle,
                              color: _selectedTab == 'video'
                                  ? Colors.indigo
                                  : Colors.grey,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Vidéo',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: _selectedTab == 'video'
                                    ? Colors.indigo
                                    : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                if (hasPdf)
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _selectedTab = 'pdf');
                        _loadPdf(widget.module.pdfUrl);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: _selectedTab == 'pdf'
                                  ? Colors.indigo
                                  : Colors.transparent,
                              width: 3,
                            ),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.picture_as_pdf,
                              color: _selectedTab == 'pdf'
                                  ? Colors.indigo
                                  : Colors.grey,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Fichier',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: _selectedTab == 'pdf'
                                    ? Colors.indigo
                                    : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),

          const Divider(height: 1),

          Expanded(
            child: hasVideo || hasPdf
                ? Stack(
                    children: [
                      WebViewWidget(controller: _webViewController),
                      if (_isLoading)
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const CircularProgressIndicator(
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.indigo),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chargement du contenu...',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                    ],
                  )
                : const Center(
                    child: Text('Aucun contenu disponible pour ce module'),
                  ),
          ),
        ],
      ),
    );
  }
}
