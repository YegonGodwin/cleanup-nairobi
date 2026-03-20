
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import FormField from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaTrophy,
  FaTrash
} from 'react-icons/fa';

const Profile = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    avatarUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
        avatarUrl: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const result = await updateUser(formData);
    setSaving(false);

    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.full_name || '',
      phone: user.phone || '',
      location: user.location || '',
      avatarUrl: user.avatar_url || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  if (authLoading && !user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg font-medium">Please log in to view your profile.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
        </div>
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 self-start"
            variant="outline"
          >
            <FaEdit size={14} />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden border-none shadow-xl bg-gradient-to-b from-green-50 to-white">
            <CardContent className="pt-10 pb-8">
              <div className="relative inline-block group">
                <Avatar 
                  src={user.avatar_url} 
                  name={user.full_name} 
                  size="xl" 
                  className="w-32 h-32 mx-auto ring-4 ring-white shadow-lg border-2 border-green-100"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white text-xs font-medium">Change Photo</span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold mt-4 text-gray-900">{user.full_name}</h2>
              <p className="text-gray-500 text-sm mb-4">{user.email}</p>
              <div className="flex justify-center gap-2">
                <Badge variant={user.role === 'Admin' ? 'danger' : user.role === 'Driver' ? 'warning' : 'success'}>
                  {user.role}
                </Badge>
                {user.points !== undefined && (
                  <Badge variant="info" className="flex items-center gap-1">
                    <FaTrophy className="text-yellow-500" size={10} />
                    {user.points} Points
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 py-4">
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <FaCalendarAlt size={12} />
                Joined {formatDate(user.created_at)}
              </div>
            </CardFooter>
          </Card>

          {/* User Stats Card */}
          <Card variant="outlined" padding="sm" hover={false}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-gray-500">Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100">
                <span className="text-sm font-medium text-green-800">Reports Submitted</span>
                <span className="text-lg font-bold text-green-700">12</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                <span className="text-sm font-medium text-blue-800">Events Attended</span>
                <span className="text-lg font-bold text-blue-700">4</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                <span className="text-sm font-medium text-purple-800">Member Level</span>
                <span className="text-lg font-bold text-purple-700">Silver</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Profile Details / Form */}
        <div className="lg:col-span-2">
          <Card className="h-full border-none shadow-xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl">Account Details</CardTitle>
              <p className="text-sm text-gray-500">Complete your profile to get the most out of Clean-up Nairobi</p>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      error={errors.fullName}
                      touched={true}
                      required
                    />
                    <FormField
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                      touched={true}
                      required
                    />
                  </div>
                  <FormField
                    label="Location / Address"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Westlands, Nairobi"
                  />
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <FaTimes /> Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      loading={saving}
                      className="flex items-center gap-2 px-8"
                    >
                      {!saving && <FaSave />} Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg text-gray-500 mt-1">
                        <FaUser size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                        <p className="text-gray-900 font-medium">{user.full_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg text-gray-500 mt-1">
                        <FaEnvelope size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg text-gray-500 mt-1">
                        <FaPhone size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                        <p className="text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg text-gray-500 mt-1">
                        <FaMapMarkerAlt size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                        <p className="text-gray-900 font-medium">{user.location || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 p-6 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-4 text-red-800 mb-2">
                      <FaTrash />
                      <h4 className="font-bold">Danger Zone</h4>
                    </div>
                    <p className="text-sm text-red-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <Button variant="danger" className="text-sm px-4 py-2">Delete My Account</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
