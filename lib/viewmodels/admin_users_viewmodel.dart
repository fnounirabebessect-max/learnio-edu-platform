import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/user.dart';

class AdminUsersViewModel extends ChangeNotifier {
  final CollectionReference _usersRef =
      FirebaseFirestore.instance.collection('users');

  List<User> users = [];
  bool loading = false;

  Future loadUsers() async {
    loading = true;
    notifyListeners();

    final snapshot = await _usersRef.get();

    users = snapshot.docs.map((doc) {
      final data = doc.data() as Map<String, dynamic>;
      return User(
        id: doc.id,
        email: data['email'] ?? '',
        name: data['name'] ?? '',
        role: data['role'] ?? 'student',
      );
    }).toList();

    loading = false;
    notifyListeners();
  }

  Future changeRole(String id, String newRole) async {
    await _usersRef.doc(id).update({'role': newRole});
    await loadUsers();
  }

  Future deleteUser(String id) async {
    await _usersRef.doc(id).delete();
    await loadUsers();
  }
}
