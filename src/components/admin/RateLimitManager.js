import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './RateLimitManager.css';

const RateLimitManager = () => {
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIPs, setSelectedIPs] = useState(new Set());
  const [showDetails, setShowDetails] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [blockedResponse, statsResponse] = await Promise.all([
        api.get('/rate-limit/blocked-ips'),
        api.get('/rate-limit/stats')
      ]);

      setBlockedIPs(blockedResponse.data.data.blockedIPs);
      setStats(statsResponse.data.data.stats);
    } catch (err) {
      console.error('Error fetching rate limit data:', err);
      setError('Failed to load rate limit data');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      setError(null);
      setSuccessMessage('');

      await api.post(`/rate-limit/unblock/${ip}`);
      
      setSuccessMessage(`Successfully unblocked IP: ${ip}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error unblocking IP:', err);
      setError(`Failed to unblock IP: ${ip}`);
    }
  };

  const handleUnblockSelected = async () => {
    if (selectedIPs.size === 0) {
      setError('Please select at least one IP to unblock');
      return;
    }

    try {
      setError(null);
      setSuccessMessage('');

      const ips = Array.from(selectedIPs);
      await api.post('/rate-limit/unblock-multiple', { ips });
      
      setSuccessMessage(`Successfully unblocked ${ips.length} IP(s)`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Clear selection and refresh data
      setSelectedIPs(new Set());
      fetchData();
    } catch (err) {
      console.error('Error unblocking multiple IPs:', err);
      setError('Failed to unblock selected IPs');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL rate limits? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage('');

      await api.delete('/rate-limit/clear-all');
      
      setSuccessMessage('Successfully cleared all rate limits');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error clearing all rate limits:', err);
      setError('Failed to clear all rate limits');
    }
  };

  const toggleIPSelection = (ip) => {
    const newSelected = new Set(selectedIPs);
    if (newSelected.has(ip)) {
      newSelected.delete(ip);
    } else {
      newSelected.add(ip);
    }
    setSelectedIPs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIPs.size === blockedIPs.length) {
      setSelectedIPs(new Set());
    } else {
      setSelectedIPs(new Set(blockedIPs.map(item => item.ip)));
    }
  };

  const toggleDetails = (ip) => {
    setShowDetails(prev => ({
      ...prev,
      [ip]: !prev[ip]
    }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="rate-limit-manager">
        <div className="loading">Loading rate limit data...</div>
      </div>
    );
  }

  return (
    <div className="rate-limit-manager">
      <div className="rate-limit-header">
        <h2>Rate Limit Management</h2>
        <button onClick={fetchData} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="alert-close">×</button>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="rate-limit-stats">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalBlockedIPs}</div>
              <div className="stat-label">Blocked IPs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalRateLimits}</div>
              <div className="stat-label">Active Rate Limits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.byType.auth || 0}</div>
              <div className="stat-label">Auth Limits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.byType.vote || 0}</div>
              <div className="stat-label">Vote Limits</div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked IPs Table */}
      <div className="blocked-ips-section">
        <div className="section-header">
          <h3>Blocked IP Addresses ({blockedIPs.length})</h3>
          <div className="section-actions">
            {selectedIPs.size > 0 && (
              <button 
                onClick={handleUnblockSelected} 
                className="btn-unblock-selected"
              >
                Unblock Selected ({selectedIPs.size})
              </button>
            )}
            <button 
              onClick={handleClearAll} 
              className="btn-clear-all"
            >
              Clear All Rate Limits
            </button>
          </div>
        </div>

        {blockedIPs.length === 0 ? (
          <div className="no-data">
            <p>No blocked IPs found</p>
          </div>
        ) : (
          <div className="blocked-ips-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedIPs.size === blockedIPs.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>IP Address</th>
                  <th>Total Blocks</th>
                  <th>Last Blocked</th>
                  <th>Endpoint</th>
                  <th>User ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map((item) => (
                  <React.Fragment key={item.ip}>
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIPs.has(item.ip)}
                          onChange={() => toggleIPSelection(item.ip)}
                        />
                      </td>
                      <td className="ip-address">{item.ip}</td>
                      <td>{item.totalBlocks}</td>
                      <td>{formatTimestamp(item.latestBlock.timestamp)}</td>
                      <td>
                        <code>{item.latestBlock.method} {item.latestBlock.endpoint}</code>
                      </td>
                      <td>{item.latestBlock.userId}</td>
                      <td className="actions">
                        <button
                          onClick={() => toggleDetails(item.ip)}
                          className="btn-details"
                        >
                          {showDetails[item.ip] ? 'Hide' : 'Details'}
                        </button>
                        <button
                          onClick={() => handleUnblockIP(item.ip)}
                          className="btn-unblock"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                    {showDetails[item.ip] && (
                      <tr className="details-row">
                        <td colSpan="7">
                          <div className="block-details">
                            <h4>Block History for {item.ip}</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <strong>User Agent:</strong>
                                <span>{item.latestBlock.userAgent}</span>
                              </div>
                              <div className="detail-item">
                                <strong>Request Count:</strong>
                                <span>{item.latestBlock.count} / {item.latestBlock.limit}</span>
                              </div>
                              <div className="detail-item">
                                <strong>Reset Time:</strong>
                                <span>{formatTimestamp(item.latestBlock.resetTime)}</span>
                              </div>
                            </div>
                            {item.allBlocks.length > 1 && (
                              <div className="block-history">
                                <h5>Recent Blocks:</h5>
                                <ul>
                                  {item.allBlocks.slice(-5).reverse().map((block, idx) => (
                                    <li key={idx}>
                                      {formatTimestamp(block.timestamp)} - {block.method} {block.endpoint}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rate-limit-info">
        <h4>ℹ️ Information</h4>
        <ul>
          <li>System Admins are automatically exempt from all rate limiting</li>
          <li>Blocked IPs are automatically cleared after 7 days</li>
          <li>Rate limits reset based on the configured time window</li>
          <li>Unblocking an IP clears all associated rate limit counters</li>
        </ul>
      </div>
    </div>
  );
};

export default RateLimitManager;
