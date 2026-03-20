import { useState } from "react";
import { CheckCircle, Play, Upload, X, Camera, FileText } from "lucide-react";
import { assignmentsAPI } from "../../../services/api";
import { useApiState } from "../../../hooks/useApiState";

const TaskActions = ({ task, onTaskUpdate, onError }) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    completion_notes: "",
    completion_image_url: null,
  });

  // API state management with error handling
  const {
    loading: actionLoading,
    error: actionError,
    execute: executeAction,
    retry: retryAction,
    canRetry,
  } = useApiState({
    showToast: true,
    retryable: true,
    onSuccess: (response) => {
      // Update the task in parent component
      if (onTaskUpdate && response.data) {
        onTaskUpdate(response.data);
      }

      // Close completion modal if it was open
      if (showCompletionModal) {
        setShowCompletionModal(false);
        setCompletionData({ completion_notes: "", completion_image_url: null });
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error.getUserMessage());
      }
    },
  });

  // Handle task actions
  const handleTaskAction = async (action, data = {}) => {
    try {
      let apiCall;
      switch (action) {
        case "accept":
          apiCall = () => assignmentsAPI.accept(task.id);
          break;
        case "start":
          apiCall = () => assignmentsAPI.start(task.id);
          break;
        case "complete":
          // Add completion timestamp and additional metadata
          const completionData = {
            ...data,
            completed_at: new Date().toISOString(),
            // Only include image URL if it's actually set and not empty
            completion_image_url: data.completion_image_url || null,
            completion_metadata: {
              completion_method: "mobile_app",
              has_photo: !!data.completion_image_url,
              has_notes: !!data.completion_notes,
              estimated_weight: data.estimated_weight || null,
            },
          };
          apiCall = () => assignmentsAPI.complete(task.id, completionData);
          break;
        default:
          throw new Error("Unknown action");
      }

      await executeAction(apiCall);
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      // Error is already handled by the useApiState hook
    }
  };

  // Handle completion form submission
  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    handleTaskAction("complete", completionData);
  };

  // Handle image upload (placeholder - would need actual upload implementation)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real implementation, you would upload the file to your storage service
      // For now, we'll use a more reliable placeholder URL format
      const timestamp = Date.now();
      const imageUrl = `https://picsum.photos/400/300?random=${timestamp}`;
      setCompletionData((prev) => ({
        ...prev,
        completion_image_url: imageUrl,
      }));
    }
  };

  // Render action buttons based on task status
  const renderActionButtons = () => {
    switch (task.status) {
      case "pending":
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleTaskAction("accept")}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Accept Task</span>
            </button>
            {actionError && canRetry && (
              <button
                onClick={retryAction}
                className="text-sm text-red-600 underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>
        );

      case "accepted":
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleTaskAction("start")}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Start Task</span>
            </button>
            {actionError && canRetry && (
              <button
                onClick={retryAction}
                className="text-sm text-red-600 underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>
        );

      case "in_progress":
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowCompletionModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Complete Task</span>
            </button>
            {actionError && canRetry && (
              <button
                onClick={retryAction}
                className="text-sm text-red-600 underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>
        );

      case "completed":
        return (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Completed</span>
          </div>
        );

      case "cancelled":
        return (
          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg flex items-center space-x-2">
            <X className="w-4 h-4" />
            <span>Cancelled</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center space-x-2">{renderActionButtons()}</div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Complete Task
                </h3>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="space-y-4">
                {/* Completion Notes */}
                <div>
                  <label
                    htmlFor="completion_notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Completion Notes
                  </label>
                  <textarea
                    id="completion_notes"
                    rows={4}
                    value={completionData.completion_notes}
                    onChange={(e) =>
                      setCompletionData((prev) => ({
                        ...prev,
                        completion_notes: e.target.value,
                      }))
                    }
                    placeholder="Add any notes about the task completion..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Photo (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                      <Camera className="w-4 h-4 mr-2" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {completionData.completion_image_url && (
                      <div className="flex items-center text-sm text-green-600">
                        <Upload className="w-4 h-4 mr-1" />
                        <span>Photo uploaded</span>
                      </div>
                    )}
                  </div>
                  {completionData.completion_image_url && (
                    <div className="mt-3">
                      <img
                        src={completionData.completion_image_url}
                        alt="Completion photo"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                {/* Task Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Task Summary
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {task.waste_reports?.location || "Unknown"}
                    </p>
                    <p>
                      <span className="font-medium">Waste Type:</span>{" "}
                      {task.waste_reports?.waste_type || "General"}
                    </p>
                    <p>
                      <span className="font-medium">Description:</span>{" "}
                      {task.waste_reports?.description || "No description"}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompletionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Complete Task</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskActions;
