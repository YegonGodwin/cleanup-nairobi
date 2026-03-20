import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/card';
import FormField from '../ui/FormField';
import { reportsAPI } from '../../services/api';
import { validators, useFormValidation } from '../../utils/validation';
import { useFormSubmission } from '../../hooks/useApiState';
import { FaMapMarkerAlt, FaCamera, FaSpinner } from 'react-icons/fa';

const ReportForm = ({ onReportCreated }) => {
  // Form validation setup
  const initialData = {
    location: '',
    latitude: null,
    longitude: null,
    description: '',
    waste_type: '',
    image_url: ''
  };

  const validationRules = {
    location: [validators.location],
    description: [validators.description],
    waste_type: [validators.wasteType]
  };

  const {
    data: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset
  } = useFormValidation(initialData, validationRules);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [coordinateStatus, setCoordinateStatus] = useState('none'); // 'none', 'getting', 'success', 'failed', 'manual'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Use form submission hook with enhanced error handling
  const {
    loading: isLoading,
    error: submitError,
    submit,
    retry,
    canRetry
  } = useFormSubmission({
    successMessage: 'Waste report submitted successfully!',
    resetOnSuccess: false,
    showSuccessToast: false, // We'll handle success toast manually for better messaging
    onSuccess: (response) => {
      // Show success message based on coordinate status
      const hasCoordinates = formData.latitude && formData.longitude;
      const successMessage = hasCoordinates 
        ? 'Report submitted with GPS location!'
        : 'Report submitted successfully!';
      const successDescription = hasCoordinates
        ? 'Your report includes precise GPS coordinates for faster response.'
        : 'Your report was saved with the manual location you provided.';

      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.success(successMessage, {
          description: successDescription,
          duration: 6000
        });
      });

      // Reset form and coordinate status
      reset();
      setImageFile(null);
      setImagePreview(null);
      setCoordinateStatus('none');
      setLocationError('');

      // Notify parent component
      if (onReportCreated) {
        onReportCreated(response.data);
      }
    },
    onError: (error) => {
      // Enhanced error handling for coordinate-related database issues
      if (error.message && (error.message.includes('latitude') || error.message.includes('longitude') || error.message.includes('coordinate'))) {
        import('../../components/ui/Toast').then(({ default: toast }) => {
          toast.error('Location data error', {
            description: 'There was an issue with the location information. Please try entering the location manually.',
            duration: 8000
          });
        });
      } else if (error.message && error.message.includes('constraint')) {
        import('../../components/ui/Toast').then(({ default: toast }) => {
          toast.error('Unable to save report', {
            description: 'There was a technical issue. Please check your information and try again.',
            duration: 8000
          });
        });
      }
    }
  });

  const wasteTypes = [
    { value: 'plastic', label: 'Plastic' },
    { value: 'organic', label: 'Organic' },
    { value: 'paper', label: 'Paper' },
    { value: 'metal', label: 'Metal' },
    { value: 'glass', label: 'Glass' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'hazardous', label: 'Hazardous' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'other', label: 'Other' }
  ];

  // Get current location with improved error handling and user feedback
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');
    setCoordinateStatus('getting');

    if (!navigator.geolocation) {
      const errorMsg = 'GPS is not supported by this browser. Please enter your location manually.';
      setLocationError(errorMsg);
      setIsGettingLocation(false);
      setCoordinateStatus('failed');
      
      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.error(errorMsg, { 
          id: 'location-toast',
          description: 'You can still submit your report by typing the location manually.'
        });
      });
      return;
    }

    // Show immediate feedback with helpful information
    import('../../components/ui/Toast').then(({ default: toast }) => {
      toast.warning('Getting your location...', { 
        id: 'location-toast',
        description: 'Make sure GPS is enabled and you have a clear view of the sky.',
        duration: 0 // Don't auto-dismiss
      });
    });

    // Set a backup timeout in case the GPS request hangs
    const backupTimeout = setTimeout(() => {
      setIsGettingLocation(false);
      setCoordinateStatus('failed');
      const timeoutMsg = 'GPS is taking too long. You can enter your location manually and still submit your report.';
      setLocationError(timeoutMsg);
      
      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.warning(timeoutMsg, { 
          id: 'location-toast',
          description: 'Your report will be saved without GPS coordinates.'
        });
      });
    }, 10000); // 10 second timeout for better user experience

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Try to get a more user-friendly location name using reverse geocoding
          let locationName = '';
          
          try {
            // Use a free geocoding service (OpenStreetMap Nominatim)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'CleanupNairobi/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                // Extract relevant parts of the address
                const address = data.address || {};
                const parts = [
                  address.road || address.pedestrian || address.path,
                  address.suburb || address.neighbourhood || address.village,
                  address.city || address.town || address.county,
                ].filter(Boolean);
                
                locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
              }
            }
          } catch (geocodeError) {
            console.log('Geocoding failed, using coordinates:', geocodeError);
          }
          
          // Fallback to coordinates if geocoding fails
          if (!locationName) {
            locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }
          
          handleChange('location', locationName);
          handleChange('latitude', latitude);
          handleChange('longitude', longitude);
          setCoordinateStatus('success');
          
          // Show success message with coordinates info
          import('../../components/ui/Toast').then(({ default: toast }) => {
            toast.success('Location found with GPS coordinates!', { 
              id: 'location-toast',
              description: 'Your report will include precise location data.'
            });
          });
        } catch (error) {
          console.error('Error processing location:', error);
          const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          handleChange('location', locationName);
          handleChange('latitude', latitude);
          handleChange('longitude', longitude);
          setCoordinateStatus('success');
          
          import('../../components/ui/Toast').then(({ default: toast }) => {
            toast.success('Location found (coordinates only)', { 
              id: 'location-toast',
              description: 'Address lookup failed, but GPS coordinates were saved.'
            });
          });
        }
        
        clearTimeout(backupTimeout);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to get GPS location';
        let userGuidance = 'You can still submit your report by entering the location manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'GPS access was denied';
            userGuidance = 'To use GPS: go to your browser settings, allow location access for this site, then try again. Or enter location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS signal unavailable';
            userGuidance = 'Try moving to an area with better GPS signal, or enter your location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS request timed out';
            userGuidance = 'GPS is taking too long. Try again or enter location manually.';
            break;
          default:
            errorMessage = 'GPS failed';
            userGuidance = 'There was a problem with GPS. Please enter your location manually.';
        }
        
        setLocationError(`${errorMessage}. ${userGuidance}`);
        setCoordinateStatus('failed');
        clearTimeout(backupTimeout);
        setIsGettingLocation(false);
        
        // Show helpful error message
        import('../../components/ui/Toast').then(({ default: toast }) => {
          toast.error(errorMessage, { 
            id: 'location-toast',
            description: userGuidance,
            duration: 8000 // Longer duration for error messages
          });
        });
      },
      {
        enableHighAccuracy: true, // Use high accuracy for better results
        timeout: 8000, // 8 second timeout
        maximumAge: 300000 // Cache location for 5 minutes
      }
    );
  };

  // Handle image upload with validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate file using our validation utility
    const fileError = validators.file(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      fieldName: 'Image'
    });

    if (fileError) {
      // Show error toast for file validation
      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.error(fileError);
      });
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle form submission with improved coordinate handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateAll()) {
      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.error('Please fix the errors above before submitting', {
          description: 'Check the highlighted fields and try again.'
        });
      });
      return;
    }

    // Additional validation for coordinates if they exist
    if (formData.latitude !== null && formData.longitude !== null) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        import('../../components/ui/Toast').then(({ default: toast }) => {
          toast.error('Invalid GPS coordinates detected', {
            description: 'Please use the GPS button again or enter location manually.'
          });
        });
        return;
      }
    }

    try {
      // Prepare report data - coordinates are optional
      const reportData = {
        location: formData.location.trim(),
        description: formData.description.trim(),
        waste_type: formData.waste_type,
      };

      // Only include coordinates if they are valid numbers
      if (formData.latitude !== null && formData.longitude !== null && 
          !isNaN(formData.latitude) && !isNaN(formData.longitude)) {
        reportData.latitude = formData.latitude;
        reportData.longitude = formData.longitude;
      }

      // Show appropriate submission message based on coordinate status
      const hasCoordinates = reportData.latitude && reportData.longitude;
      const submissionMessage = hasCoordinates 
        ? 'Submitting report with GPS coordinates...'
        : 'Submitting report with manual location...';

      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.warning(submissionMessage, { 
          id: 'submit-toast',
          duration: 0 // Don't auto-dismiss during submission
        });
      });

      // Debug logging for development
      if (import.meta.env.DEV) {
        console.log('Submitting report data:', reportData);
        console.log('Coordinate status:', coordinateStatus);
        console.log('Has coordinates:', hasCoordinates);
      }

      await submit(reportsAPI.create, reportData);
      
      // Clear the submission toast on success (success toast will be shown by useFormSubmission)
      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.dismiss('submit-toast');
      });

    } catch (error) {
      // Clear submission toast
      import('../../components/ui/Toast').then(({ default: toast }) => {
        toast.dismiss('submit-toast');
      });

      // Enhanced error handling for coordinate-related issues
      if (error.message && error.message.includes('coordinate')) {
        import('../../components/ui/Toast').then(({ default: toast }) => {
          toast.error('Location data issue', {
            description: 'There was a problem with the location information. Try using GPS again or enter location manually.',
            duration: 8000
          });
        });
      } else if (error.message && error.message.includes('constraint')) {
        import('../../components/ui/Toast').then(({ default: toast }) => {
          toast.error('Database error', {
            description: 'There was a technical issue saving your report. Please try again.',
            duration: 8000
          });
        });
      }
      
      console.error('Error creating report:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Report Waste Issue</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Field */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <FormField
                    name="location"
                    value={formData.location}
                    onChange={(name, value) => {
                      handleChange(name, value);
                      // If user manually types location, update coordinate status
                      if (value && coordinateStatus === 'none') {
                        setCoordinateStatus('manual');
                      }
                      setLocationError('');
                    }}
                    onBlur={handleBlur}
                    error={errors.location || locationError}
                    touched={touched.location}
                    placeholder="Enter location manually or use GPS"
                    className="pr-8"
                  />
                  {/* Coordinate status indicator */}
                  {coordinateStatus === 'success' && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="GPS coordinates available"></div>
                    </div>
                  )}
                  {coordinateStatus === 'manual' && formData.location && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Manual location (no GPS)"></div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="px-3 min-w-[44px]"
                  title={isGettingLocation ? "Getting location..." : "Use GPS to get current location"}
                >
                  {isGettingLocation ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaMapMarkerAlt />
                  )}
                </Button>
              </div>
              
              {/* Quick location suggestions for Nairobi */}
              <div className="flex flex-wrap gap-1">
                {['CBD', 'Westlands', 'Karen', 'Kilimani', 'Kasarani', 'Embakasi'].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      handleChange('location', `${area}, Nairobi`);
                      setLocationError('');
                      setCoordinateStatus('manual');
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Location status feedback */}
            {isGettingLocation && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <FaSpinner className="animate-spin" size={14} />
                  Getting your GPS location... This may take up to 10 seconds.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Make sure GPS is enabled and you have a clear view of the sky.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsGettingLocation(false);
                    setCoordinateStatus('failed');
                    setLocationError('GPS cancelled. You can enter location manually.');
                    // Cancel any pending toast
                    import('../../components/ui/Toast').then(({ default: toast }) => {
                      toast.dismiss('location-toast');
                    });
                  }}
                  className="text-xs text-blue-700 underline hover:no-underline mt-1"
                >
                  Cancel and enter manually
                </button>
              </div>
            )}
            
            {locationError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{locationError}</p>
              </div>
            )}
            
            {/* Coordinate status messages */}
            {coordinateStatus === 'success' && formData.location && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Location found with GPS coordinates - your report will include precise location data.
                </p>
              </div>
            )}
            
            {coordinateStatus === 'manual' && formData.location && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700 flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Manual location entered - your report will be saved without GPS coordinates.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  You can still use the GPS button to add precise coordinates.
                </p>
              </div>
            )}
            
            {coordinateStatus === 'failed' && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-700">
                  GPS unavailable - you can still submit your report by entering the location manually above.
                </p>
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              {coordinateStatus === 'none' || coordinateStatus === 'failed' 
                ? 'GPS coordinates help with precise location, but manual location works too.'
                : 'Reports can be submitted with or without GPS coordinates.'
              }
            </p>
          </div>

          {/* Description Field */}
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.description}
            touched={touched.description}
            required
            placeholder="Describe the waste issue in detail..."
            rows={4}
            maxLength={500}
            helpText="Provide as much detail as possible to help with collection"
          />

          {/* Waste Type Field */}
          <FormField
            label="Waste Type"
            name="waste_type"
            type="select"
            value={formData.waste_type}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.waste_type}
            touched={touched.waste_type}
            required
            options={[
              { value: '', label: 'Select waste type' },
              ...wasteTypes
            ]}
          />

          {/* Image Upload Field */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Photo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <FaCamera className="text-gray-500" />
                <span className="text-sm text-gray-700">Choose Photo</span>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <span className="text-sm text-gray-600">{imageFile.name}</span>
              )}
            </div>
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          {/* Submit Error with Enhanced Retry Options */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Unable to submit report
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {typeof submitError === 'string' 
                        ? submitError 
                        : submitError.getUserMessage?.() || submitError.message || 'An unexpected error occurred'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Enhanced retry options */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {canRetry && (
                    <button
                      type="button"
                      onClick={retry}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                  
                  {/* Coordinate-specific retry options */}
                  {(submitError.message?.includes('coordinate') || submitError.message?.includes('latitude') || submitError.message?.includes('longitude')) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          // Clear coordinates and try manual location only
                          handleChange('latitude', null);
                          handleChange('longitude', null);
                          setCoordinateStatus('manual');
                          import('../../components/ui/Toast').then(({ default: toast }) => {
                            toast.warning('Coordinates cleared', {
                              description: 'Try submitting with manual location only.'
                            });
                          });
                        }}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Remove GPS Data
                      </button>
                      
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Get GPS Again
                      </button>
                    </>
                  )}
                </div>
                
                {/* Helpful guidance */}
                <div className="mt-2 text-xs text-red-600">
                  {submitError.message?.includes('coordinate') || submitError.message?.includes('latitude') || submitError.message?.includes('longitude') ? (
                    'Location data issue: Try removing GPS coordinates or getting a fresh GPS location.'
                  ) : submitError.message?.includes('network') || submitError.message?.includes('connection') ? (
                    'Network issue: Check your internet connection and try again.'
                  ) : (
                    'If the problem persists, try refreshing the page or contact support.'
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            {/* Test button for debugging */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const testData = {
                    location: "Test Location, Nairobi",
                    latitude: -1.2921,
                    longitude: 36.8219,
                    description: "This is a test waste report with sufficient description length to meet validation requirements.",
                    waste_type: "plastic"
                  };
                  console.log('Testing with data:', testData);
                  try {
                    await submit(reportsAPI.create, testData);
                  } catch (error) {
                    console.error('Test submission error:', error);
                  }
                }}
                className="px-4 py-2"
              >
                Test Submit
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;