import React, { useState, useEffect } from 'react';
import FormField from '../../components/ui/FormField';
import { validators, useFormValidation } from '../../utils/validation';
import { vehiclesAPI } from '../../services/api';

const UserForm = ({ user, onSubmit, onCancel }) => {
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Form validation setup
  const initialData = {
    fullName: '',
    email: '',
    phone: '',
    role: 'Citizen',
    zone: '',
    password: '',
    confirmPassword: '',
    sendWelcomeEmail: false,
    vehicleId: '',
    vehicleNumber: '', // For backward compatibility if needed, or derived
    vehicleType: '',   // For backward compatibility if needed, or derived
    licenseNumber: '',
  };

  const {
    data: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation(initialData, (formData) => {
    const isEditMode = !!user;
    return {
      fullName: [
        (value) => validators.required(value, 'Full Name'),
        (value) => validators.minLength(value, 2, 'Full Name')
      ],
      email: [
        (value) => validators.required(value, 'Email'),
        validators.email
      ],
      phone: [
        (value) => validators.required(value, 'Phone'),
        validators.phone
      ],
      role: [validators.role],
      zone: [validators.zone],
      // Conditional validation for driver fields
      ...(formData.role === 'Driver' ? {
        vehicleId: [
          (value) => validators.required(value, 'Vehicle Assignment')
        ],
        licenseNumber: [
          (value) => validators.required(value, 'License Number'),
          (value) => validators.minLength(value, 5, 'License Number')
        ]
      } : {}),
      ...(isEditMode ? {} : {
        password: [
          (value) => validators.required(value, 'Password'),
          validators.password
        ],
        confirmPassword: [
          (value) => validators.required(value, 'Confirm Password'),
          validators.passwordConfirm
        ]
      })
    };
  });

  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (user) {
      // Update form data when user prop changes
      Object.keys(initialData).forEach(key => {
        if (user[key] !== undefined) {
          handleChange(key, user[key]);
        }
      });
      // Handle vehicle assignment mapping if user comes with vehicleId (assuming backend sends it)
      if (user.vehicle_id) {
          handleChange('vehicleId', user.vehicle_id);
      }
    }
  }, [user]);

  useEffect(() => {
    // Fetch available vehicles when role is Driver
    if (formData.role === 'Driver') {
      const fetchVehicles = async () => {
        setLoadingVehicles(true);
        try {
          const response = await vehiclesAPI.getAvailable();
          setAvailableVehicles(response.data);
        } catch (error) {
          console.error("Failed to fetch vehicles", error);
        } finally {
          setLoadingVehicles(false);
        }
      };
      fetchVehicles();
    }
  }, [formData.role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateAll()) {
      setSubmitError('Please fix the errors above before submitting');
      return;
    }

    // Additional validation for password confirmation (for new users)
    if (!user && formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    // Prepare submission data
    const submissionData = { ...formData };
    if (submissionData.role === 'Driver' && submissionData.vehicleId) {
        // Find selected vehicle to populate redundant fields if needed
        const selectedVehicle = availableVehicles.find(v => v.id === submissionData.vehicleId);
        if (selectedVehicle) {
            submissionData.vehicleNumber = selectedVehicle.registration_number;
            submissionData.vehicleType = selectedVehicle.type;
        }
    }

    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">{user ? 'Edit User' : 'Create User'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <FormField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.fullName}
              touched={touched.fullName}
              required
              placeholder="Enter full name"
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              required
              placeholder="Enter email address"
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              touched={touched.phone}
              required
              placeholder="e.g., +254700000000"
              helpText="Include country code for international numbers"
            />

            <FormField
              label="Role"
              name="role"
              type="select"
              value={formData.role}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.role}
              touched={touched.role}
              required
              options={[
                { value: 'Citizen', label: 'Citizen' },
                { value: 'Driver', label: 'Driver' },
                { value: 'Operator', label: 'Operator' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Admin', label: 'Admin' }
              ]}
            />
            {formData.role === 'Driver' && (
              <>
                <FormField
                  label="Assign Vehicle"
                  name="vehicleId"
                  type="select"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.vehicleId}
                  touched={touched.vehicleId}
                  required
                  options={[
                    { value: '', label: loadingVehicles ? 'Loading vehicles...' : 'Select a vehicle' },
                    ...availableVehicles.map(v => ({
                      value: v.id,
                      label: `${v.registration_number} - ${v.type} (${v.capacity}kg)`
                    }))
                  ]}
                  helpText={availableVehicles.length === 0 && !loadingVehicles ? 'No available vehicles found. Create one first.' : 'Select a vehicle for this driver'}
                />

                <FormField
                  label="License Number"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.licenseNumber}
                  touched={touched.licenseNumber}
                  required
                  placeholder="e.g., DL123456789"
                  helpText="Enter the driver's license number"
                />
              </>
            )}
            <FormField
              label="Location/Zone"
              name="zone"
              value={formData.zone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.zone}
              touched={touched.zone}
              required
              placeholder="e.g., Westlands, Kilimani, CBD"
              helpText="Specify the area or zone for this user"
            />

            {!user && (
              <>
                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.password}
                  touched={touched.password}
                  required
                  helpText="Must be at least 8 characters with uppercase, lowercase, and number"
                />

                <FormField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                  required
                />
              </>
            )}

            <FormField
              name="sendWelcomeEmail"
              type="checkbox"
              label="Send welcome email"
              value={formData.sendWelcomeEmail}
              onChange={handleChange}
              helpText="Send an email with login credentials to the new user"
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;