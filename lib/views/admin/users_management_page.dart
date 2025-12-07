import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/admin_users_viewmodel.dart';

class UsersManagementPage extends StatefulWidget {
  const UsersManagementPage({super.key});

  @override
  State<UsersManagementPage> createState() => _UsersManagementPageState();
}

class _UsersManagementPageState extends State<UsersManagementPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<AdminUsersViewModel>(context, listen: false).loadUsers();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AdminUsersViewModel>(
      builder: (context, vm, child) {
        final roles = ["admin", "teacher", "student"];

        if (vm.loading) {
          return Scaffold(
            backgroundColor: const Color(0xFFF3F4F6),
            appBar: AppBar(
              title: const Text("Gestion des utilisateurs"),
              backgroundColor: Colors.white,
              foregroundColor: Theme.of(context).primaryColor,
              centerTitle: true,
              elevation: 0,
            ),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        if (vm.users.isEmpty) {
          return Scaffold(
            backgroundColor: const Color(0xFFF3F4F6),
            appBar: AppBar(
              title: const Text("Gestion des utilisateurs"),
              backgroundColor: Colors.white,
              foregroundColor: Theme.of(context).primaryColor,
              centerTitle: true,
              elevation: 0,
            ),
            body: const Center(
              child: Text(
                "Aucun utilisateur trouvé.",
                style: TextStyle(fontSize: 16),
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF3F4F6),
          appBar: AppBar(
            title: const Text("Gestion des utilisateurs"),
            backgroundColor: Colors.white,
            foregroundColor: Theme.of(context).primaryColor,
            centerTitle: true,
            elevation: 0,
          ),
          body: ListView.builder(
            padding: const EdgeInsets.all(14),
            itemCount: vm.users.length,
            itemBuilder: (ctx, i) {
              final user = vm.users[i];
              final currentRole =
                  roles.contains(user.role) ? user.role : "student";

              return Card(
                margin: const EdgeInsets.symmetric(vertical: 6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.blueGrey[100],
                    child: Text(
                      user.name.isNotEmpty
                          ? user.name[0].toUpperCase()
                          : '?',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  title: Text(
                    user.name.isEmpty ? user.email : user.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.email,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Rôle : ${user.role}",
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blueAccent,
                        ),
                      ),
                    ],
                  ),
                  trailing: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        DropdownButton<String>(
                          value: currentRole,
                          onChanged: (val) {
                            if (val != null) vm.changeRole(user.id, val);
                          },
                          items: roles
                              .map(
                                (r) => DropdownMenuItem<String>(
                                  value: r,
                                  child: Text(r),
                                ),
                              )
                              .toList(),
                        ),
                        IconButton(
                          icon:
                              const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => vm.deleteUser(user.id),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
