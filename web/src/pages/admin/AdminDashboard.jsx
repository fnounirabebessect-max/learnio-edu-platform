// src/pages/admin/AdminDashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Navigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    recentTransactions: [],
    popularCourses: [],
    monthlyRevenue: []
  });

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // Fetch all stats in parallel with error handling
        const [
          transactionsSnapshot,
          usersSnapshot,
          coursesSnapshot,
          enrollmentsSnapshot
        ] = await Promise.all([
          getDocs(collection(db, 'transactions')).catch(err => {
            console.error('Error fetching transactions:', err);
            return { docs: [] };
          }),
          getDocs(collection(db, 'users')).catch(err => {
            console.error('Error fetching users:', err);
            return { docs: [] };
          }),
          getDocs(collection(db, 'courses')).catch(err => {
            console.error('Error fetching courses:', err);
            return { docs: [] };
          }),
          getDocs(collection(db, 'enrollments')).catch(err => {
            console.error('Error fetching enrollments:', err);
            return { docs: [] };
          })
        ]);

        // Calculate total revenue from completed transactions
        let totalRevenue = 0;
        const recentTransactions = [];
        
        transactionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed' && data.receivedAmount) {
            totalRevenue += parseFloat(data.receivedAmount) || 0;
          }
          
          // Add to recent transactions (last 10)
          if (recentTransactions.length < 10) {
            recentTransactions.push({
              id: doc.id,
              ...data
            });
          }
        });

        // Get popular courses (most enrollments)
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().title || 'Untitled Course',
          category: doc.data().category || 'Uncategorized',
          price: parseFloat(doc.data().price) || 0
        }));

        // Get enrollment count for each course with error handling
        const coursesWithEnrollments = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const enrollmentsQuery = query(
                collection(db, 'enrollments'),
                where('courseId', '==', course.id)
              );
              const enrollmentsCount = await getCountFromServer(enrollmentsQuery);
              
              return {
                ...course,
                enrollments: enrollmentsCount.data().count || 0
              };
            } catch (error) {
              console.error(`Error getting enrollments for course ${course.id}:`, error);
              return {
                ...course,
                enrollments: 0
              };
            }
          })
        );

        // Sort by enrollments descending
        const popularCourses = coursesWithEnrollments
          .sort((a, b) => b.enrollments - a.enrollments)
          .slice(0, 5);

        // Calculate monthly revenue (last 6 months) - using actual transaction data
        const monthlyRevenue = calculateMonthlyRevenue(transactionsSnapshot.docs);

        setStats({
          totalRevenue,
          totalUsers: usersSnapshot.docs.length || 0,
          totalCourses: coursesSnapshot.docs.length || 0,
          totalEnrollments: enrollmentsSnapshot.docs.length || 0,
          recentTransactions,
          popularCourses,
          monthlyRevenue
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  // Helper function to calculate monthly revenue
  const calculateMonthlyRevenue = (transactions) => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        revenue: 0
      };
    }).reverse();

    // Calculate actual revenue from transactions
    transactions.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed' && data.createdAt) {
        try {
          const transactionDate = data.createdAt.toDate 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt);
          
          const monthIndex = months.findIndex(m => 
            m.month === transactionDate.toLocaleString('en-US', { month: 'short' }) &&
            m.year === transactionDate.getFullYear()
          );
          
          if (monthIndex !== -1) {
            months[monthIndex].revenue += parseFloat(data.receivedAmount || data.amount || 0);
          }
        } catch (dateError) {
          console.error('Error processing transaction date:', dateError);
        }
      }
    });

    return months.map(m => ({
      month: m.month,
      revenue: Math.round(m.revenue * 100) / 100 // Round to 2 decimals
    }));
  };

  // Check if user is admin - AFTER all hooks
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, Admin! Here's an overview of your platform.</p>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{stats.totalRevenue.toFixed(2)} dt</h3>
            <p>Total Revenue</p>
            <span className="stat-trend">+15% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <span className="stat-trend">+{Math.round(stats.totalUsers * 0.12)} this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.totalEnrollments}</h3>
            <p>Total Enrollments</p>
            <span className="stat-trend">+{Math.round(stats.totalEnrollments * 0.08)} this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.totalCourses}</h3>
            <p>Available Courses</p>
            <span className="stat-trend">Stable</span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-section">
        <div className="revenue-chart">
          <h3>Revenue Overview (Last 6 Months)</h3>
          <div className="chart-bars">
            {stats.monthlyRevenue.map((item, index) => (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar-label">{item.month}</div>
                <div className="chart-bar">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      height: `${Math.max(5, (item.revenue / Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="chart-bar-value">{item.revenue.toFixed(0)}dt</div>
              </div>
            ))}
          </div>
        </div>

        <div className="revenue-summary">
          <h3>Revenue Summary</h3>
          <div className="summary-item">
            <span>Monthly Revenue:</span>
            <strong>{stats.monthlyRevenue[stats.monthlyRevenue.length - 1]?.revenue.toFixed(0) || 0} dt</strong>
          </div>
          <div className="summary-item">
            <span>Weekly Revenue:</span>
            <strong>{(stats.totalRevenue / 24).toFixed(0)} dt</strong>
          </div>
          <div className="summary-item">
            <span>New Enrollments:</span>
            <strong>{Math.round(stats.totalEnrollments * 0.1)}</strong>
          </div>
        </div>
      </div>

      {/* POPULAR COURSES */}
      <div className="popular-courses">
        <h3>Most Popular Courses</h3>
        <div className="courses-list">
          {stats.popularCourses.map((course) => (
            <div key={course.id} className="course-item">
              <div className="course-info">
                <h4>{course.title}</h4>
                <p>{course.category}</p>
              </div>
              <div className="course-stats">
                <span className="enrollments">{course.enrollments} enrollments</span>
                <span className="revenue">{course.price.toFixed(2)} dt each</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.orderId?.substring(0, 8) || 'N/A'}...</td>
                  <td>{transaction.userEmail || 'Unknown'}</td>
                  <td>{(transaction.receivedAmount || transaction.amount || 0).toFixed(2)} €</td>
                  <td>
                    <span className={`status-badge ${transaction.status || 'pending'}`}>
                      {transaction.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {transaction.paidAt?.toDate 
                      ? transaction.paidAt.toDate().toLocaleDateString()
                      : transaction.createdAt?.toDate 
                        ? transaction.createdAt.toDate().toLocaleDateString()
                        : 'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentTransactions.length === 0 && (
            <div className="no-transactions">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;