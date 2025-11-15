import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faHeart, faUser, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AvatarDisplay from '../components/AvatarDisplay';
import AvatarLibrary from '../components/AvatarLibrary';

type ProfileData = {
  name: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  interestedIn?: string;
  homeLocation?: string;
  education?: string;
  hobbies?: string;
  location: string;
  goal?: string;
  about?: string;
  interests?: string[];
  photos: string[];
  avatar: string;
  makeAllPhotosVisible?: boolean;
  positions?: string[];
};

type ProfileProps = {
  profile: ProfileData;
  onUpdate: (profile: ProfileData) => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  onBack?: () => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
  user: any;
};

type DraftState = {
  name: string;
  dateOfBirth: string;
  gender: string;
  interestedIn: string;
  homeLocation: string;
  education: string;
  hobbies: string;
  avatar: string;
  makeAllPhotosVisible: boolean;
};

const createDraftFromProfile = (profile: ProfileData): DraftState => ({
  name: profile.name || '',
  dateOfBirth: profile.dateOfBirth || '',
  gender: profile.gender || '',
  interestedIn: profile.interestedIn || '',
  homeLocation: profile.homeLocation || profile.location || '',
  education: profile.education || '',
  hobbies: profile.hobbies || '',
  avatar: profile.avatar || '',
  makeAllPhotosVisible: profile.makeAllPhotosVisible || false,
});

function Profile({ profile, onUpdate, onLogout, onBack, onNavigate, activeView, user }: ProfileProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState<string>('');
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromProfile(profile));
  const [photos, setPhotos] = useState<string[]>(profile.photos || []);
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isAvatarLibraryOpen, setIsAvatarLibraryOpen] = useState(false);
  const likesCount = 3;

  useEffect(() => {
    setDraft(createDraftFromProfile(profile));
    setPhotos(profile.photos || []);
    setLocalPhotos([]);
    setPhotoFiles([]);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [profile]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const handleChange = (field: keyof DraftState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (field === 'makeAllPhotosVisible') {
      const checkbox = event.target as HTMLInputElement;
      setDraft((prev) => ({ ...prev, [field]: checkbox.checked }));
    } else {
      setDraft((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const interestedInOptions = ['Men', 'Women', 'Everyone'];

  // Helper function to get display photos and indices
  const getDisplayPhotosData = (): { photos: string[]; indices: number[] } => {
    // Avatar is only used when "make all photos visible" is unchecked
    const useAvatar = !draft.makeAllPhotosVisible;
    const currentAvatar = useAvatar ? (draft.avatar || profile.avatar) : null;
    
    // First, use current photos if available
    if (photos.length > 0) {
      const validPhotos: string[] = [];
      const validIndices: number[] = [];
      
      // If we have an avatar and makeAllPhotosVisible is false, put it first in the main slot
      if (useAvatar && currentAvatar && currentAvatar.trim() !== '') {
        validPhotos.push(currentAvatar);
        validIndices.push(-1); // -1 indicates it's the avatar
      }
      
      // Then add the regular photos
      photos.forEach((photo, index) => {
        if (photo && photo.trim() !== '') {
          validPhotos.push(photo);
          validIndices.push(index);
        }
      });
      
      // If we have photos but no avatar in the list yet, return them
      if (validPhotos.length > 0) {
        return { photos: validPhotos, indices: validIndices };
      }
    }
    
    // Then use profile photos
    if (profile.photos && profile.photos.length > 0) {
      const validPhotos: string[] = [];
      const validIndices: number[] = [];
      
      // If we have an avatar and makeAllPhotosVisible is false, put it first
      if (useAvatar && currentAvatar && currentAvatar.trim() !== '') {
        validPhotos.push(currentAvatar);
        validIndices.push(-1);
      }
      
      profile.photos.forEach((photo, index) => {
        if (photo && photo.trim() !== '') {
          validPhotos.push(photo);
          validIndices.push(index);
        }
      });
      
      if (validPhotos.length > 0) {
        return { photos: validPhotos, indices: validIndices };
      }
    }
    
    // Finally, use avatar if it exists and makeAllPhotosVisible is false
    // This ensures selected avatar from library is immediately visible
    if (useAvatar && currentAvatar && currentAvatar.trim() !== '') {
      // For avatar, we don't have a real index, so we'll use -1 as a marker
      return { photos: [currentAvatar], indices: [-1] };
    }
    
    // No photos or avatar, return empty array (will show icon placeholders)
    return { photos: [], indices: [] };
  };

  const handleLocalPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Store File objects for later upload
    setPhotoFiles((prev) => [...prev, ...files]);
    
    // Also create preview URLs for immediate display
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((images) => {
      const newPhotos = [...photos, ...images];
      setPhotos(newPhotos);
      setLocalPhotos((prev) => [...prev, ...images]);
    });
    
    // Reset the input
    event.target.value = '';
  };

  const handleRemovePhoto = (displayIndex: number) => {
    // Get current display photos data
    const displayData = getDisplayPhotosData();
    
    // Get the original index in the photos array
    const originalIndex = displayIndex >= 0 && displayIndex < displayData.indices.length
      ? displayData.indices[displayIndex]
      : -1;
    
    // If originalIndex is -1, it means it's the avatar, so clear it from draft
    if (originalIndex === -1) {
      setDraft((prev) => ({ ...prev, avatar: '' }));
      return;
    }
    
    // If photos state is empty but we're displaying profile.photos, initialize photos from profile
    let currentPhotos = photos;
    if (photos.length === 0 && profile.photos && profile.photos.length > 0) {
      currentPhotos = [...profile.photos];
    }
    
    // Remove from photos array using the original index
    const newPhotos = currentPhotos.filter((_, index) => index !== originalIndex);
    setPhotos(newPhotos);
    
    // Also remove from localPhotos if it was a newly uploaded photo
    const existingPhotosCount = currentPhotos.length - localPhotos.length;
    if (originalIndex >= existingPhotosCount && localPhotos.length > 0) {
      const localIdx = originalIndex - existingPhotosCount;
      setLocalPhotos((prev) => prev.filter((_, index) => index !== localIdx));
      // Also remove the corresponding file
      setPhotoFiles((prev) => prev.filter((_, index) => index !== localIdx));
    }
  };

  const handlePhotoSelect = (idx: number) => {
    // This could be used to toggle visibility of individual photos
    // For now, we'll keep it simple and use the "Make all photos visible" checkbox
  };

  const handleOpenCamera = async () => {
    if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
      alert('Camera access is not supported in this browser.');
      return;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (err) {
      console.error(err);
      alert('Unable to access the camera.');
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob and create a File object
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.png`, { type: 'image/png' });
      setPhotoFiles((prev) => [...prev, file]);
      
      // Create preview URL
      const dataUrl = canvas.toDataURL('image/png');
      const newPhotos = [...photos, dataUrl];
      setPhotos(newPhotos);
      setLocalPhotos((prev) => [...prev, dataUrl]);
      setDraft((prev) => ({ ...prev, avatar: dataUrl }));
    }, 'image/png');
  };


  const uploadImageToStorage = async (file: File, userId: string, index: number): Promise<string> => {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `photo_${timestamp}_${index}.${fileExtension}`;
    const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);
    
    setUploadingProgress(`Uploading image ${index + 1} of ${photoFiles.length}...`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleSave = async () => {
    if (!user) {
      alert('User not found. Please log in again.');
      return;
    }

    try {
      setIsSaving(true);
      setUploadingProgress('Preparing upload...');

      // Upload new photo files to Firebase Storage
      const uploadedPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setUploadingProgress(`Uploading ${photoFiles.length} image(s)...`);
        for (let i = 0; i < photoFiles.length; i++) {
          const url = await uploadImageToStorage(photoFiles[i], user.uid, i);
          uploadedPhotoUrls.push(url);
        }
      }

      // Get existing photo URLs (those that are already URLs, not base64 data URLs)
      const existingPhotoUrls = photos
        .filter((photo) => photo.startsWith('http://') || photo.startsWith('https://'))
        .filter((photo) => !photo.startsWith('data:'));

      // Combine existing URLs with newly uploaded URLs
      const allPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls];

      // Handle avatar - only use it if "make all photos visible" is unchecked
      // Avatar can be from library (URL) or uploaded file (data URL)
      let avatarUrl = '';
      if (!draft.makeAllPhotosVisible) {
        avatarUrl = draft.avatar || profile.avatar || '';
        
        // If avatar is a data URL (uploaded file), upload it to storage
        if (avatarUrl.startsWith('data:')) {
          if (photoFiles.length > 0) {
            // Use the first uploaded photo as avatar
            avatarUrl = uploadedPhotoUrls[0] || avatarUrl;
          } else {
            // If it's a data URL but no files to upload, keep the data URL
            // (This handles camera captures that haven't been uploaded yet)
            avatarUrl = avatarUrl;
          }
        }
        // If avatar is already a URL (from avatar library or existing), use it directly
        // No need to upload - it's already a valid URL
      } else {
        // If "make all photos visible" is checked, don't use avatar
        // Use the first photo as avatar instead, or keep existing avatar if no photos
        if (allPhotoUrls.length > 0) {
          avatarUrl = allPhotoUrls[0];
        } else {
          avatarUrl = profile.avatar || '';
        }
      }

      const nextProfile: ProfileData = {
        ...profile,
        name: draft.name.trim() || profile.name,
        dateOfBirth: draft.dateOfBirth || profile.dateOfBirth,
        gender: draft.gender || profile.gender,
        interestedIn: draft.interestedIn || profile.interestedIn,
        homeLocation: draft.homeLocation.trim() || profile.homeLocation || profile.location,
        location: draft.homeLocation.trim() || profile.location,
        education: draft.education.trim() || profile.education,
        hobbies: draft.hobbies.trim() || profile.hobbies,
        photos: allPhotoUrls.length > 0 ? allPhotoUrls : profile.photos,
        avatar: avatarUrl,
        makeAllPhotosVisible: draft.makeAllPhotosVisible,
      };

      setUploadingProgress('Saving profile...');
      await onUpdate(nextProfile);
      
      // Clear local state
      setLocalPhotos([]);
      setPhotoFiles([]);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setUploadingProgress('');
    } catch (error) {
      console.error('Error saving profile:', error);
      setUploadingProgress('');
    } finally {
      setIsSaving(false);
    }
  };

  // Get photos to display for rendering
  const displayPhotosData = getDisplayPhotosData();
  const displayPhotos = displayPhotosData.photos;
  
  // Get the image source for a photo slot (similar to EventDetails logic)
  const getPhotoSrc = (index: number): string => {
    // If there's a photo at this index, use it
    if (displayPhotos[index] && displayPhotos[index].trim()) {
      return displayPhotos[index];
    }
    // Otherwise return empty string (AvatarDisplay will show icon)
    return '';
  };

  // Check if a photo at display index is the avatar (not a regular photo)
  const isAvatarPhoto = (displayIndex: number): boolean => {
    return displayPhotosData.indices[displayIndex] === -1;
  };

  return (
    <div className="profile-setup-page">
      <header className="profile-setup-header">
        <h1>Profile Setup</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {uploadingProgress && (
            <span style={{ fontSize: '12px', color: '#7b677a' }}>{uploadingProgress}</span>
          )}
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="profile-setup-content">
        {/* Photos Section */}
        <section className="photos-section">
          <h2>Photos</h2>
          <p className="photos-instruction">Add photos to your profile. Select photos to make them visible to others.</p>
          
          <div className="photos-grid">
            <div 
              className={`photo-item photo-main ${!getPhotoSrc(0) ? 'photo-placeholder' : ''}`}
              onClick={getPhotoSrc(0) ? () => handlePhotoSelect(0) : undefined}
            >
              <AvatarDisplay
                src={getPhotoSrc(0)}
                alt="Main photo"
                gender={draft.gender}
                size="large"
                shape="rounded"
                className="photo-placeholder-avatar"
              />
              {getPhotoSrc(0) && !isAvatarPhoto(0) && (
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(0);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            
            <div 
              className={`photo-item photo-small ${!getPhotoSrc(1) ? 'photo-placeholder' : ''}`}
              onClick={getPhotoSrc(1) ? () => handlePhotoSelect(1) : undefined}
            >
              <AvatarDisplay
                src={getPhotoSrc(1)}
                alt="Photo 2"
                gender={draft.gender}
                size="medium"
                shape="rounded"
                className="photo-placeholder-avatar"
              />
              {getPhotoSrc(1) && (
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(1);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            
            <div 
              className={`photo-item photo-small ${!getPhotoSrc(2) ? 'photo-placeholder' : ''}`}
              onClick={getPhotoSrc(2) ? () => handlePhotoSelect(2) : undefined}
            >
              <AvatarDisplay
                src={getPhotoSrc(2)}
                alt="Photo 3"
                gender={draft.gender}
                size="medium"
                shape="rounded"
                className="photo-placeholder-avatar"
              />
              {getPhotoSrc(2) && (
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(2);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Additional Photos Section (4th image and beyond) */}
          {displayPhotos.length > 3 && (
            <div className="additional-photos-section">
              <div className="additional-photos-grid">
                {displayPhotos.slice(3).map((photo, index) => {
                  const displayIndex = index + 3; // Display index in displayPhotos array
                  return (
                    <div
                      key={`additional-photo-${displayIndex}-${index}`}
                      className="photo-item photo-additional"
                      onClick={() => handlePhotoSelect(displayIndex)}
                    >
                      <AvatarDisplay
                        src={photo}
                        alt={`Photo ${displayIndex + 1}`}
                        gender={draft.gender}
                        size="medium"
                        shape="rounded"
                        className="photo-placeholder-avatar"
                      />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(displayIndex);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className="upload-photos-label">
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleLocalPhotoUpload}
            />
            <span className="upload-photos-btn">Upload Photos</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.makeAllPhotosVisible}
              onChange={handleChange('makeAllPhotosVisible')}
            />
            <span>Make all photos visible</span>
          </label>

          {!draft.makeAllPhotosVisible && (
            <button
              type="button"
              className="choose-avatar-btn"
              onClick={() => setIsAvatarLibraryOpen(true)}
            >
              Choose Avatar from Library
            </button>
          )}

          <AvatarLibrary
            isOpen={isAvatarLibraryOpen}
            onClose={() => setIsAvatarLibraryOpen(false)}
            onSelect={(avatarUrl) => {
              setDraft((prev) => ({ ...prev, avatar: avatarUrl }));
            }}
            gender={draft.gender}
          />

          {cameraStream && (
            <div className="camera-preview">
              <video ref={videoRef} autoPlay muted playsInline />
              <div className="camera-actions">
                <button type="button" className="upload-btn secondary" onClick={handleCapturePhoto}>
                  Capture Photo
                </button>
                <button type="button" className="upload-btn" onClick={handleOpenCamera}>
                  Close
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Personal Details Section */}
        <section className="personal-details-section">
          <h2>Personal Details</h2>
          
          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              type="date"
              className="input-field"
              value={draft.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">I'm</label>
            <div className="dropdown-wrapper">
              <select
                id="gender"
                className="input-field dropdown-field"
                value={draft.gender}
                onChange={handleChange('gender')}
              >
                <option value="">Select...</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="interestedIn">Interested In</label>
            <div className="dropdown-wrapper">
              <select
                id="interestedIn"
                className="input-field dropdown-field"
                value={draft.interestedIn}
                onChange={handleChange('interestedIn')}
              >
                <option value="">Select...</option>
                {interestedInOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="homeLocation">Home Location</label>
            <input
              id="homeLocation"
              type="text"
              className="input-field"
              value={draft.homeLocation}
              onChange={handleChange('homeLocation')}
              placeholder="Enter your location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="education">Education</label>
            <input
              id="education"
              type="text"
              className="input-field"
              value={draft.education}
              onChange={handleChange('education')}
              placeholder="Enter your education"
            />
          </div>

          <div className="form-group">
            <label htmlFor="hobbies">Hobbies</label>
            <textarea
              id="hobbies"
              className="textarea-field"
              rows={4}
              value={draft.hobbies}
              onChange={handleChange('hobbies')}
              placeholder="Tell us about your hobbies"
            />
          </div>
        </section>
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => onNavigate('events')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faCalendar} />
          </span>
          <span className="nav-label">Events</span>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faHeart} />
          </span>
          {likesCount > 0 && <span className="nav-badge">{likesCount}</span>}
          <span className="nav-label">Matches</span>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default Profile;


