// src/pages/admin/AdminUsers.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Navigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './AdminUsers.css';

const AdminUsers = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  // Check if user is admin - AFTER all hooks
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = await Promise.all(
        usersSnapshot.docs.map(async (docSnapshot) => {
          const userData = docSnapshot.data();
          const userId = docSnapshot.id; // Use document ID as fallback
          
          // Use uid if exists, otherwise use document ID
          const userUid = userData.uid || userId;
          
          let enrollmentsCount = 0;
          
          // Only query enrollments if we have a valid user ID
          if (userUid) {
            try {
              const enrollmentsQuery = query(
                collection(db, 'enrollments'),
                where('userId', '==', userUid)
              );
              const enrollmentsSnapshot = await getCountFromServer(enrollmentsQuery);
              enrollmentsCount = enrollmentsSnapshot.data().count;
            } catch (queryError) {
              console.error(`Error fetching enrollments for user ${userUid}:`, queryError);
            }
          }
          
          return {
            id: userId,
            ...userData,
            uid: userUid, // Ensure uid is defined
            enrollments: enrollmentsCount,
            // Add default values for missing fields
            displayName: userData.displayName || userData.name || userData.email?.split('@')[0] || 'No name',
            email: userData.email || 'No email',
            role: userData.role || 'user',
            status: userData.status || 'active',
            createdAt: userData.createdAt || userData.joinedAt || null
          };
        })
      );
      
      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role. Please try again.');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage all users and their roles on the platform</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users by email, name, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="total-users">Total Users: {users.length}</span>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Enrollments</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    {user.photoUrl && (
                      <img src={user.photoUrl} alt={user.displayName} className="user-avatar" />
                    )}
                    <div>
                      <div className="user-name">{user.displayName}</div>
                      <div className="user-id">ID: {user.uid?.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </td>
                <td>
                  <button
                    className={`status-btn ${user.status}`}
                    onClick={() => handleStatusChange(user.id, user.status)}
                  >
                    {user.status === 'active' ? 'Active' : 'Suspended'}
                  </button>
                </td>
                <td>
                  <span className="enrollments-count">{user.enrollments || 0}</span>
                </td>
                <td>
                  {user.createdAt?.toDate 
                    ? user.createdAt.toDate().toLocaleDateString()
                    : user.createdAt || 'N/A'
                  }
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Delete User"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="no-results">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;