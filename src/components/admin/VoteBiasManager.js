import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './VoteBiasManager.css';

const VoteBiasManager = () => {
  const { user } = useAuth();
  const [awards, setAwards] = useState([]);
  const [selectedAward, setSelectedAward] = useState(null);
  const [biasEntries, setBiasEntries] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showBiasForm, setShowBiasForm] = useState(false);
  const [editingBias, setEditingBias] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nomineeId: '',
    biasAmount: 0,
    reason: ''
  });

  useEffect(() => {
    if (user?.role === 'System_Admin') {
      fetchAwards();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAward) {
      fetchAwardData();
    }
  }, [selectedAward]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAwards = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/content/categories?include=awards');
      const allAwards = [];
      
      response.data.categories.forEach(category => {
        if (category.awards) {
          category.awards.forEach(award => {
            allAwards.push({
              ...award,
              categoryName: category.name
            });
          });
        }
      });
      
      setAwards(allAwards);
    } catch (error) {
      console.error('Error fetching awards:', error);
      setError('Failed to load awards');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAwardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch bias entries and nominees for the selected award
      const [biasResponse, nomineesResponse] = await Promise.all([
        api.get(`/admin/vote-bias/award/${selectedAward._id}`),
        api.get(`/content/awards/${selectedAward._id}/nominees`)
      ]);
      
      setBiasEntries(biasResponse.data.biasEntries || []);
      setNominees(nomineesResponse.data.nominees || []);
    } catch (error) {
      console.error('Error fetching award data:', error);
      setError('Failed to load award data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardSelect = (award) => {
    setSelectedAward(award);
    setShowBiasForm(false);
    setEditingBias(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nomineeId: '',
      biasAmount: 0,
      reason: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'biasAmount' ? parseInt(value) || 0 : value
    }));
  };

  const handleCreateBias = () => {
    setEditingBias(null);
    resetForm();
    setShowBiasForm(true);
  };

  const handleEditBias = (bias) => {
    setEditingBias(bias);
    setFormData({
      nomineeId: bias.nomineeId,
      biasAmount: bias.biasAmount,
      reason: bias.reason
    });
    setShowBiasForm(true);
  };

  const handleSubmitBias = async (e) => {
    e.preventDefault();
    
    if (!formData.nomineeId || !formData.reason || formData.biasAmount < 0) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingBias) {
        // Update existing bias using PUT
        const updateData = {
          biasAmount: formData.biasAmount,
          reason: formData.reason
        };

        await api.put(`/admin/vote-bias/${editingBias._id}`, updateData);
      } else {
        // Create new bias using POST
        const createData = {
          awardId: selectedAward._id,
          nomineeId: formData.nomineeId,
          biasAmount: formData.biasAmount,
          reason: formData.reason
        };

        await api.post('/admin/vote-bias', createData);
      }
      
      // Refresh data
      await fetchAwardData();
      
      // Reset form
      setShowBiasForm(false);
      setEditingBias(null);
      resetForm();
      
    } catch (error) {
      console.error('Error submitting bias:', error);
      setError(error.response?.data?.error?.message || 'Failed to submit bias');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBias = async (biasId) => {
    if (!window.confirm('Are you sure you want to remove this vote bias?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.delete(`/admin/vote-bias/${biasId}`, {
        data: { reason: 'Removed by admin via interface' }
      });
      
      // Refresh data
      await fetchAwardData();
    } catch (error) {
      console.error('Error removing bias:', error);
      setError(error.response?.data?.error?.message || 'Failed to remove bias');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableNominees = () => {
    const biasedNomineeIds = new Set(biasEntries.map(bias => bias.nomineeId));
    return nominees.filter(nominee => !biasedNomineeIds.has(nominee._id));
  };

  if (user?.role !== 'System_Admin') {
    return (
      <div className="vote-bias-manager">
        <div className="vote-bias-manager__error">
          <h3>Access Denied</h3>
          <p>Only System Administrators can manage vote bias.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-bias-manager">
      <div className="vote-bias-manager__header">
        <h2>Vote Bias Management</h2>
        <p>Manage administrative vote adjustments for nominees</p>
      </div>

      {error && (
        <div className="vote-bias-manager__error-banner">
          {error}
        </div>
      )}

      {/* Award Selection */}
      <div className="vote-bias-manager__award-selection">
        <h3>Select Award</h3>
        <div className="vote-bias-manager__awards-grid">
          {awards.map(award => (
            <div
              key={award._id}
              className={`vote-bias-manager__award-card ${
                selectedAward?._id === award._id ? 'vote-bias-manager__award-card--selected' : ''
              }`}
              onClick={() => handleAwardSelect(award)}
            >
              <h4>{award.title}</h4>
              <p>{award.categoryName}</p>
              <div className="vote-bias-manager__award-status">
                {award.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Award Details and Bias Management */}
      {selectedAward && (
        <div className="vote-bias-manager__award-details">
          <div className="vote-bias-manager__section-header">
            <h3>Bias Management for: {selectedAward.title}</h3>
            <button
              onClick={handleCreateBias}
              className="vote-bias-manager__add-button"
              disabled={isSubmitting || getAvailableNominees().length === 0}
            >
              Add Vote Bias
            </button>
          </div>

          {isLoading ? (
            <div className="vote-bias-manager__loading">
              Loading award data...
            </div>
          ) : (
            <>
              {/* Current Bias Entries */}
              <div className="vote-bias-manager__bias-list">
                <h4>Current Bias Adjustments</h4>
                {biasEntries.length === 0 ? (
                  <div className="vote-bias-manager__empty">
                    No bias adjustments applied to this award.
                  </div>
                ) : (
                  <div className="vote-bias-manager__bias-entries">
                    {biasEntries.map(bias => (
                      <div key={bias._id} className="vote-bias-manager__bias-entry">
                        <div className="vote-bias-manager__bias-info">
                          <h5>{bias.nominee?.name || 'Unknown Nominee'}</h5>
                          <div className="vote-bias-manager__bias-amount">
                            +{bias.biasAmount} votes
                          </div>
                          <div className="vote-bias-manager__bias-reason">
                            {bias.reason}
                          </div>
                          <div className="vote-bias-manager__bias-meta">
                            Applied by {bias.appliedBy?.name} on{' '}
                            {new Date(bias.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="vote-bias-manager__bias-actions">
                          <button
                            onClick={() => handleEditBias(bias)}
                            className="vote-bias-manager__edit-button"
                            disabled={isSubmitting}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveBias(bias._id)}
                            className="vote-bias-manager__remove-button"
                            disabled={isSubmitting}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bias Form */}
              {showBiasForm && (
                <div className="vote-bias-manager__form-overlay">
                  <div className="vote-bias-manager__form-modal">
                    <div className="vote-bias-manager__form-header">
                      <h4>{editingBias ? 'Edit Vote Bias' : 'Add Vote Bias'}</h4>
                      <button
                        onClick={() => setShowBiasForm(false)}
                        className="vote-bias-manager__close-button"
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleSubmitBias} className="vote-bias-manager__form">
                      <div className="vote-bias-manager__field">
                        <label htmlFor="nomineeId">Nominee *</label>
                        <select
                          id="nomineeId"
                          name="nomineeId"
                          value={formData.nomineeId}
                          onChange={handleFormChange}
                          required
                          disabled={isSubmitting || editingBias}
                        >
                          <option value="">Select a nominee</option>
                          {editingBias ? (
                            // In edit mode, show only the current nominee (disabled dropdown)
                            <option value={editingBias.nomineeId}>
                              {editingBias.nominee?.name}
                            </option>
                          ) : (
                            // In create mode, show only available nominees (not already biased)
                            getAvailableNominees().map(nominee => (
                              <option key={nominee._id} value={nominee._id}>
                                {nominee.name}
                              </option>
                            ))
                          )}
                        </select>
                        {editingBias && (
                          <div className="vote-bias-manager__field-help">
                            Nominee cannot be changed when editing. To change the nominee, remove this bias and create a new one.
                          </div>
                        )}
                      </div>

                      <div className="vote-bias-manager__field">
                        <label htmlFor="biasAmount">Additional Votes *</label>
                        <input
                          type="number"
                          id="biasAmount"
                          name="biasAmount"
                          value={formData.biasAmount}
                          onChange={handleFormChange}
                          min="0"
                          max="10000"
                          required
                          disabled={isSubmitting}
                        />
                        <div className="vote-bias-manager__field-help">
                          Number of additional votes to add (0-10,000)
                        </div>
                      </div>

                      <div className="vote-bias-manager__field">
                        <label htmlFor="reason">Reason *</label>
                        <textarea
                          id="reason"
                          name="reason"
                          value={formData.reason}
                          onChange={handleFormChange}
                          placeholder="Explain why this bias adjustment is being applied..."
                          rows={4}
                          maxLength={500}
                          required
                          disabled={isSubmitting}
                        />
                        <div className="vote-bias-manager__field-help">
                          {formData.reason.length}/500 characters
                        </div>
                      </div>

                      <div className="vote-bias-manager__form-actions">
                        <button
                          type="button"
                          onClick={() => setShowBiasForm(false)}
                          className="vote-bias-manager__cancel-button"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="vote-bias-manager__submit-button"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Saving...' : (editingBias ? 'Update Bias' : 'Add Bias')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoteBiasManager;