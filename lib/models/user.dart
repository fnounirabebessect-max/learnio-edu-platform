class User {
  final String id;
  final String email;
  final String name;
  String role; // 'admin', 'student', etc.

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
  });
}
