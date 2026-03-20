import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaUser, FaMapMarkerAlt, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const ReportAssignmentModal = ({ 
  isOpen, 
  onClose, 
  report, 
  drivers, 
  onAssign, 
  loading 
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDriverId('');
      setNotes('');
      setPriority('medium');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDriverId) {
      setError('Please select a driver');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAssign({
        reportId: report.id,
        driverId: selectedDriverId,
        notes: notes.trim(),
        priority
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableDrivers = () => {
    return drivers.filter(driver => driver.is_available);
  };

  const getPriorityColor = (priorityLevel) => {
    const colors = {
      'low': 'text-green-600 bg-green-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'high': 'text-orange-600 bg-orange-50',
      'urgent': 'text-red-600 bg-red-50'
    };
    return colors[priorityLevel] || colors['medium'];
  };

  const getWasteTypeIcon = (wasteType) => {
    // Simple mapping - could be expanded with specific icons
    return '🗑️';
  };

  if (!isOpen) return null;

  const availableDrivers = getAvailableDrivers();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assign Driver to Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Report Summary */}
        {report && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{getWasteTypeIcon(report.waste_type)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Report #{report.id?.substring(0, 8)}...
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-2 text-gray-400" />
                    <span className="truncate">{report.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaUser className="mr-2 text-gray-400" />
                    <span>Reported by: {report.user_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">🗑️</span>
                    <span>Type: {report.waste_type?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📅</span>
                    <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {report.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong>Description:</strong> {report.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assignment Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Driver Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Driver <span className="text-red-500">*</span>
            </label>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading drivers...</p>
              </div>
            ) : availableDrivers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <FaTruck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No available drivers found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                      selectedDriverId === driver.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="driver"
                        value={driver.id}
                        checked={selectedDriverId === driver.id}
                        onChange={() => setSelectedDriverId(driver.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {driver.full_name}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                <FaTruck className="mr-1" />
                                {driver.vehicle_number}
                              </span>
                              <span>{driver.vehicle_type}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                              Available
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assignment Priority
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['low', 'medium', 'high', 'urgent'].map((level) => (
                <div
                  key={level}
                  className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
                    priority === level
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPriority(level)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      value={level}
                      checked={priority === level}
                      onChange={() => setPriority(level)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(level)}`}>
                        {level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any special instructions or notes for the driver..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDriverId || availableDrivers.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Assign Driver
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportAssignmentModal;