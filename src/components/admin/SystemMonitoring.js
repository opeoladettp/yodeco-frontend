import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './SystemMonitoring.css';

const SystemMonitoring = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSystemData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchSystemData, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [
        statsResponse, 
        healthResponse, 
        performanceResponse, 
        alertsResponse, 
        auditResponse
      ] = await Promise.all([
        api.get('/admin/system/stats').catch(() => ({ data: { stats: null } })),
        api.get('/health/summary').catch(() => ({ data: null })),
        api.get('/health/performance').catch(() => ({ data: null })),
        api.get('/health/alerts?limit=20').catch(() => ({ data: { alerts: [] } })),
        api.get('/admin/audit-logs?limit=50').catch(() => ({ data: { logs: [] } }))
      ]);

      setSystemStats(statsResponse.data.stats);
      setHealthSummary(healthResponse.data);
      setPerformanceMetrics(performanceResponse.data);
      setAlerts(alertsResponse.data.alerts || []);
      setAuditLogs(auditResponse.data.logs || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching system data:', error);
      setError(error.response?.data?.error?.message || 'Failed to load system data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'USER_PROMOTED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 11l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'VOTE_CAST':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a3 3 0 0 1 6 0v2M9 11h6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'CONTENT_CREATED':
      case 'CONTENT_UPDATED':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'LOGIN':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'USER_PROMOTED':
        return 'system-monitoring__action-icon--success';
      case 'VOTE_CAST':
        return 'system-monitoring__action-icon--primary';
      case 'CONTENT_CREATED':
      case 'CONTENT_UPDATED':
        return 'system-monitoring__action-icon--info';
      case 'LOGIN':
        return 'system-monitoring__action-icon--neutral';
      default:
        return 'system-monitoring__action-icon--default';
    }
  };

  if (isLoading) {
    return (
      <div className="system-monitoring">
        <div className="system-monitoring__loading">
          <div className="system-monitoring__spinner"></div>
          <p>Loading system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-monitoring">
        <div className="system-monitoring__error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Error Loading System Data</h3>
          <p>{error}</p>
          <button 
            onClick={fetchSystemData}
            className="system-monitoring__retry-button"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="system-monitoring">
      <div className="system-monitoring__header">
        <h2>System Monitoring</h2>
        <div className="system-monitoring__last-updated">
          Last updated: {formatDate(new Date())}
        </div>
      </div>

      <div className="system-monitoring__tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`system-monitoring__tab ${activeTab === 'overview' ? 'system-monitoring__tab--active' : ''}`}
          type="button"
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`system-monitoring__tab ${activeTab === 'performance' ? 'system-monitoring__tab--active' : ''}`}
          type="button"
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`system-monitoring__tab ${activeTab === 'alerts' ? 'system-monitoring__tab--active' : ''}`}
          type="button"
        >
          Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`system-monitoring__tab ${activeTab === 'audit' ? 'system-monitoring__tab--active' : ''}`}
          type="button"
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="system-monitoring__overview">
          {healthSummary && (
            <div className="system-monitoring__health-summary">
              <div className={`system-monitoring__health-status system-monitoring__health-status--${healthSummary.overall || 'unknown'}`}>
                <div className="system-monitoring__health-indicator">
                  {healthSummary.overall === 'healthy' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </div>
                <div className="system-monitoring__health-text">
                  <div className="system-monitoring__health-title">
                    System Status: {healthSummary.overall && typeof healthSummary.overall === 'string' 
                      ? healthSummary.overall.charAt(0).toUpperCase() + healthSummary.overall.slice(1)
                      : 'Unknown'}
                  </div>
                  <div className="system-monitoring__health-subtitle">
                    {healthSummary.alerts?.critical > 0 
                      ? `${healthSummary.alerts.critical} critical alerts` 
                      : 'All systems operational'}
                  </div>
                </div>
              </div>
              
              {healthSummary.components && typeof healthSummary.components === 'object' && (
                <div className="system-monitoring__component-status">
                  {Object.entries(healthSummary.components).map(([component, status]) => (
                    <div key={component} className="system-monitoring__component">
                      <div className="system-monitoring__component-name">
                        {component && typeof component === 'string'
                          ? component.charAt(0).toUpperCase() + component.slice(1)
                          : 'Unknown'}
                      </div>
                      <div className={`system-monitoring__component-indicator system-monitoring__component-indicator--${status?.status || 'unknown'}`}>
                        {status?.status || 'unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {systemStats ? (
            <div className="system-monitoring__stats-grid">
              <div className="system-monitoring__stat-card">
                <div className="system-monitoring__stat-icon system-monitoring__stat-icon--users">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="system-monitoring__stat-content">
                  <div className="system-monitoring__stat-number">
                    {systemStats.totalUsers || 0}
                  </div>
                  <div className="system-monitoring__stat-label">Total Users</div>
                </div>
              </div>

              <div className="system-monitoring__stat-card">
                <div className="system-monitoring__stat-icon system-monitoring__stat-icon--votes">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a3 3 0 0 1 6 0v2M9 11h6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="system-monitoring__stat-content">
                  <div className="system-monitoring__stat-number">
                    {systemStats.totalVotes || 0}
                  </div>
                  <div className="system-monitoring__stat-label">Total Votes</div>
                </div>
              </div>

              <div className="system-monitoring__stat-card">
                <div className="system-monitoring__stat-icon system-monitoring__stat-icon--categories">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="system-monitoring__stat-content">
                  <div className="system-monitoring__stat-number">
                    {systemStats.totalCategories || 0}
                  </div>
                  <div className="system-monitoring__stat-label">Categories</div>
                </div>
              </div>

              <div className="system-monitoring__stat-card">
                <div className="system-monitoring__stat-icon system-monitoring__stat-icon--awards">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="system-monitoring__stat-content">
                  <div className="system-monitoring__stat-number">
                    {systemStats.totalAwards || 0}
                  </div>
                  <div className="system-monitoring__stat-label">Awards</div>
                </div>
              </div>

              <div className="system-monitoring__stat-card">
                <div className="system-monitoring__stat-icon system-monitoring__stat-icon--nominees">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="system-monitoring__stat-content">
                  <div className="system-monitoring__stat-number">
                    {systemStats.totalNominees || 0}
                  </div>
                  <div className="system-monitoring__stat-label">Nominees</div>
                </div>
              </div>

              <div className="system-monitoring__stat-card">
                <div className="system-monitoring__stat-icon system-monitoring__stat-icon--active">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="system-monitoring__stat-content">
                  <div className="system-monitoring__stat-number">
                    {systemStats.activeUsers24h || 0}
                  </div>
                  <div className="system-monitoring__stat-label">Active Users (24h)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="system-monitoring__no-stats">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a3 3 0 0 1 6 0v2M9 11h6" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>System Statistics Unavailable</h3>
              <p>System statistics are not available at the moment.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="system-monitoring__performance">
          {performanceMetrics ? (
            <div className="system-monitoring__performance-grid">
              {performanceMetrics.requests && (
                <div className="system-monitoring__performance-section">
                  <h3>API Performance</h3>
                  <div className="system-monitoring__performance-stats">
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Total Requests:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.requests.total || 0}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Success Rate:</span>
                      <span className="system-monitoring__performance-value">
                        {performanceMetrics.requests.total > 0
                          ? ((performanceMetrics.requests.successful / performanceMetrics.requests.total) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Error Rate:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.requests.errorRate || '0%'}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Avg Response Time:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.requests.averageResponseTime || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {performanceMetrics.votes && (
                <div className="system-monitoring__performance-section">
                  <h3>Vote Processing</h3>
                  <div className="system-monitoring__performance-stats">
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Total Votes:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.votes.total || 0}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Success Rate:</span>
                      <span className="system-monitoring__performance-value">
                        {performanceMetrics.votes.total > 0
                          ? ((performanceMetrics.votes.successful / performanceMetrics.votes.total) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Failure Rate:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.votes.failureRate || '0%'}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Avg Processing Time:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.votes.averageProcessingTime || 'N/A'}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Duplicates:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.votes.duplicates || 0}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Biometric Failures:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.votes.biometricFailures || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {performanceMetrics.database && (
                <div className="system-monitoring__performance-section">
                  <h3>Database Performance</h3>
                  <div className="system-monitoring__performance-stats">
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Total Queries:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.database.queries || 0}</span>
                    </div>
                  <div className="system-monitoring__performance-stat">
                    <span className="system-monitoring__performance-label">Slow Queries:</span>
                    <span className="system-monitoring__performance-value">{performanceMetrics.database.slowQueries || 0}</span>
                  </div>
                  <div className="system-monitoring__performance-stat">
                    <span className="system-monitoring__performance-label">Slow Query Rate:</span>
                    <span className="system-monitoring__performance-value">{performanceMetrics.database.slowQueryRate || '0%'}</span>
                  </div>
                  <div className="system-monitoring__performance-stat">
                    <span className="system-monitoring__performance-label">Errors:</span>
                    <span className="system-monitoring__performance-value">{performanceMetrics.database.errors || 0}</span>
                  </div>
                </div>
              </div>
              )}

              {performanceMetrics.cache && (
                <div className="system-monitoring__performance-section">
                  <h3>Cache Performance</h3>
                  <div className="system-monitoring__performance-stats">
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Cache Hits:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.cache.hits || 0}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Cache Misses:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.cache.misses || 0}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Hit Rate:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.cache.hitRate || '0%'}</span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Fallback Used:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.cache.fallbackUsed || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {performanceMetrics.memory && (
                <div className="system-monitoring__performance-section">
                  <h3>Memory Usage</h3>
                  <div className="system-monitoring__performance-stats">
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Heap Used:</span>
                      <span className="system-monitoring__performance-value">
                        {performanceMetrics.memory.heapUsed 
                          ? (performanceMetrics.memory.heapUsed / 1024 / 1024).toFixed(2) 
                          : 0} MB
                      </span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Heap Total:</span>
                      <span className="system-monitoring__performance-value">
                        {performanceMetrics.memory.heapTotal 
                          ? (performanceMetrics.memory.heapTotal / 1024 / 1024).toFixed(2) 
                          : 0} MB
                      </span>
                    </div>
                    <div className="system-monitoring__performance-stat">
                      <span className="system-monitoring__performance-label">Usage:</span>
                      <span className="system-monitoring__performance-value">{performanceMetrics.memory.heapUsagePercent || '0%'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="system-monitoring__no-performance">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Performance Metrics Unavailable</h3>
              <p>Performance metrics are not available at the moment.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="system-monitoring__alerts">
          {alerts.length === 0 ? (
            <div className="system-monitoring__no-alerts">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>No Active Alerts</h3>
              <p>All systems are operating normally.</p>
            </div>
          ) : (
            <div className="system-monitoring__alerts-list">
              {alerts.map((alert, index) => (
                <div key={alert.id || index} className={`system-monitoring__alert system-monitoring__alert--${alert.severity}`}>
                  <div className="system-monitoring__alert-icon">
                    {alert.severity === 'critical' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                  <div className="system-monitoring__alert-content">
                    <div className="system-monitoring__alert-header">
                      <span className="system-monitoring__alert-type">{alert.type}</span>
                      <span className="system-monitoring__alert-time">{formatDate(alert.timestamp)}</span>
                    </div>
                    <div className="system-monitoring__alert-message">{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="system-monitoring__audit">
          {auditLogs.length === 0 ? (
            <div className="system-monitoring__no-logs">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>No Audit Logs</h3>
              <p>No audit logs are available at the moment.</p>
            </div>
          ) : (
            <div className="system-monitoring__audit-list">
              {auditLogs.map((log, index) => (
                <div key={log._id || index} className="system-monitoring__audit-item">
                  <div className={`system-monitoring__action-icon ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="system-monitoring__audit-content">
                    <div className="system-monitoring__audit-header">
                      <span className="system-monitoring__audit-action">
                        {log.action?.replace(/_/g, ' ') || 'Unknown Action'}
                      </span>
                      <span className="system-monitoring__audit-time">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <div className="system-monitoring__audit-details">
                      {log.details && (
                        <div className="system-monitoring__audit-description">
                          {log.details}
                        </div>
                      )}
                      {log.userId && (
                        <div className="system-monitoring__audit-user">
                          User ID: {log.userId}
                        </div>
                      )}
                      {log.ipAddress && (
                        <div className="system-monitoring__audit-ip">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemMonitoring;