class Module {
  final String id;
  final String title;
  final int order;
  final int duration;
  final String videoUrl;
  final String pdfUrl;

  Module({
    required this.id,
    required this.title,
    required this.order,
    required this.duration,
    required this.videoUrl,
    required this.pdfUrl,
  });

  factory Module.fromMap(Map<String, dynamic> map) {
    return Module(
      id: map['id'] ?? '',
      title: map['title'] ?? '',
      order: map['order'] ?? 0,
      duration: map['duration'] ?? 0,
      videoUrl: map['videoUrl'] ?? '',
      pdfUrl: map['pdfUrl'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'order': order,
      'duration': duration,
      'videoUrl': videoUrl,
      'pdfUrl': pdfUrl,
    };
  }
}
