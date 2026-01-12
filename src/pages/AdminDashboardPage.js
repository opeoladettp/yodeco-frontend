import { useState } from 'react';
import { UserManagement, SystemMonitoring } from '../components/admin';
import VoteBiasManager from '../components/admin/VoteBiasManager';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div className="admin-dashboard__title-section">
          <h1>Admin Dashboard</h1>
          <p>Manage users, monitor system activity, and configure vote bias.</p>
        </div>
      </div>

      <div className="admin-dashboard__tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={`admin-dashboard__tab ${activeTab === 'users' ? 'admin-dashboard__tab--active' : ''}`}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
          </svg>
          User Management
        </button>
        <button
          onClick={() => setActiveTab('vote-bias')}
          className={`admin-dashboard__tab ${activeTab === 'vote-bias' ? 'admin-dashboard__tab--active' : ''}`}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Vote Bias
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`admin-dashboard__tab ${activeTab === 'monitoring' ? 'admin-dashboard__tab--active' : ''}`}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a3 3 0 0 1 6 0v2M9 11h6" stroke="currentColor" strokeWidth="2"/>
          </svg>
          System Monitoring
        </button>
      </div>

      <div className="admin-dashboard__content">
        {activeTab === 'users' && (
          <div className="admin-dashboard__tab-content">
            <UserManagement />
          </div>
        )}

        {activeTab === 'vote-bias' && (
          <div className="admin-dashboard__tab-content">
            <VoteBiasManager />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="admin-dashboard__tab-content">
            <SystemMonitoring />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;