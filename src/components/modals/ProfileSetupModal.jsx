import React, { useState } from 'react';
import { X, User, Mail, Camera, Link as LinkIcon, Upload, Eye, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { updateUser, uploadExpenseImage, mergePhoneUserWithEmail } from '../../services/database';
import { useAlert } from '../../hooks/useAlert';

const ProfileSetupModal = ({ isOpen, onClose, user, onComplete }) => {
  const [name, setName] = useState(user?.name || '');
  // Don't pre-fill with auto-generated phone email
  const [email, setEmail] = useState(
    user?.email && !user.email.includes('@phone.user') ? user.email : ''
  );
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.picture || '');
  const [isLoading, setIsLoading] = useState(false);
  const [linkGoogle, setLinkGoogle] = useState(false);
  
  const { showError, showSuccess } = useAlert();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }

      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate name
    if (!name || name.trim() === '') {
      showError('Please enter your name');
      return;
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      let pictureUrl = user?.picture || '';

      // Upload profile image if provided
      if (profileImage) {
        const uploadResult = await uploadExpenseImage(profileImage, user.id, 'profile');
        if (uploadResult.success) {
          pictureUrl = uploadResult.publicUrl || uploadResult.url;
        } else if (uploadResult.isFileSizeError) {
          showError(uploadResult.error);
          setIsLoading(false);
          return;
        }
        // If upload fails for other reasons, continue without image
      }

      // Build update data - only include fields that have changed
      const updateData = {
        name: name.trim(),
        picture: pictureUrl,
        avatar: name.substring(0, 2).toUpperCase()
      };

      // Only include email if it's provided and different from current
      const newEmail = email?.trim();
      if (newEmail && newEmail !== user.email) {
        updateData.email = newEmail;
      }

      const result = await updateUser(user.id, updateData);
      
      if (result.success) {
        showSuccess('Profile updated successfully!');
        onComplete({
          ...user,
          ...updateData,
          email: newEmail || user.email, // Ensure email is included in the result
          linkGoogle
        });
      } else if (result.error === 'EMAIL_EXISTS') {
        // Email already exists - try to merge accounts
        const mergeResult = await mergePhoneUserWithEmail(
          user.id,
          newEmail,
          user.phone,
          {
            name: name.trim(),
            avatar: name.substring(0, 2).toUpperCase(),
            picture: pictureUrl
          }
        );

        if (mergeResult.success) {
          showSuccess(mergeResult.message || 'Account linked successfully!');
          onComplete({
            ...mergeResult.data,
            linkGoogle
          });
        } else {
          showError('Failed to link accounts: ' + mergeResult.error);
        }
      } else {
        showError('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      showError('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete({
      ...user,
      name: user.phone || 'Phone User',
      linkGoogle: false
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Help us personalize your experience by completing your profile.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            
            {!profileImageUrl ? (
              <div className="space-y-3">
                {/* Camera Capture (Mobile Only) */}
                {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                  <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center bg-emerald-50 hover:border-emerald-400 transition-colors">
                    <input
                      type="file"
                      id="camera-capture"
                      accept="image/*"
                      capture="user"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="camera-capture"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Camera className="w-8 h-8 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">
                        Take Selfie
                      </span>
                      <span className="text-xs text-emerald-600">
                        Capture with front camera
                      </span>
                    </label>
                  </div>
                )}
                
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="profile-image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Upload from Gallery
                    </span>
                    <span className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={profileImageUrl}
                  alt="Profile preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(profileImageUrl, '_blank')}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
                    title="View full size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 bg-red-500 bg-opacity-80 text-white rounded-lg hover:bg-opacity-100 transition-all"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">We'll use this for important notifications</p>
          </div>

          {/* Link Google Account */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={linkGoogle}
                onChange={(e) => setLinkGoogle(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">Link Google Account</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Connect your Google account for faster sign-in next time
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProfileSetupModal;
