import React, { useEffect, useMemo, useRef, useState } from 'react';

type ProfileData = {
  name: string;
  age: number;
  location: string;
  goal: string;
  about: string;
  interests: string[];
  photos: string[];
  avatar: string;
};

type ProfileProps = {
  profile: ProfileData;
  onUpdate: (profile: ProfileData) => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  onBack?: () => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
};

type DraftState = {
  name: string;
  age: string;
  location: string;
  goal: string;
  about: string;
  interestsText: string;
  photosText: string;
  photoPreview?: string | null;
  cameraPreview?: string | null;
  avatar: string;
};

const createDraftFromProfile = (profile: ProfileData): DraftState => ({
  name: profile.name,
  age: profile.age.toString(),
  location: profile.location,
  goal: profile.goal,
  about: profile.about,
  interestsText: profile.interests.join(', '),
  photosText: profile.photos.join('\n'),
  avatar: profile.avatar,
  photoPreview: null,
  cameraPreview: null,
});

function Profile({ profile, onUpdate, onLogout, onBack, onNavigate, activeView }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromProfile(profile));
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const likesCount = 3;

  useEffect(() => {
    if (!isEditing) {
      setDraft(createDraftFromProfile(profile));
      setLocalPhotos([]);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
  }, [profile, isEditing, cameraStream]);

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

  const displayProfile = useMemo(() => profile, [profile]);

  const handleChange = (field: keyof DraftState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleLocalPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
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
      setLocalPhotos((prev) => [...prev, ...images]);
    });
  };

  const handleRemoveLocalPhoto = (idx: number) => {
    setLocalPhotos((prev) => prev.filter((_, index) => index !== idx));
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
    const dataUrl = canvas.toDataURL('image/png');
    setLocalPhotos((prev) => [...prev, dataUrl]);
    setDraft((prev) => ({ ...prev, avatar: dataUrl }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoutClick = async () => {
    try {
      setIsLoggingOut(true);
      await Promise.resolve(onLogout());
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    setDraft(createDraftFromProfile(profile));
    setIsEditing(false);
    setLocalPhotos([]);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsSaving(false);
  };

  const handleSave = async () => {
    const interests = draft.interestsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const photos = draft.photosText
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);
    const age = parseInt(draft.age, 10);
    const nextProfile: ProfileData = {
      name: draft.name.trim() || profile.name,
      age: Number.isNaN(age) ? profile.age : age,
      location: draft.location.trim() || profile.location,
      goal: draft.goal.trim() || profile.goal,
      about: draft.about.trim() || profile.about,
      interests: interests.length ? interests : profile.interests,
      photos: photos.length || localPhotos.length ? [...photos, ...localPhotos] : profile.photos,
    avatar: draft.avatar || profile.avatar,
    };

    try {
      setIsSaving(true);
      await Promise.resolve(onUpdate(nextProfile));
      setIsEditing(false);
      setLocalPhotos([]);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const nameToDisplay = isEditing ? draft.name || profile.name : displayProfile.name;
  const ageToDisplay = isEditing ? draft.age || profile.age.toString() : displayProfile.age.toString();
  const locationToDisplay = isEditing ? draft.location || profile.location : displayProfile.location;
  const goalToDisplay = isEditing ? draft.goal || profile.goal : displayProfile.goal;
  const avatarToDisplay = isEditing ? draft.avatar || profile.avatar : displayProfile.avatar;

  const aboutToDisplay = isEditing ? draft.about : displayProfile.about;
  const interestsToDisplay = isEditing
    ? draft.interestsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : displayProfile.interests;
  const photosToDisplay = isEditing
    ? [
        ...draft.photosText
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean),
        ...localPhotos,
      ]
    : displayProfile.photos;

  return (
    <div className="profile-page">
      <header className="profile-header">
        {onBack ? (
          <button className="icon-button" aria-label="Back" onClick={onBack}>
            ←
          </button>
        ) : (
          <span className="header-spacer" aria-hidden="true" />
        )}
        <h1>Profile</h1>
        <button
          className={`icon-button ${isEditing ? 'danger' : ''}`}
          aria-label={isEditing ? 'Cancel editing' : 'Edit profile'}
          onClick={() => {
            if (isEditing) {
              handleCancel();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? '✕' : '✎'}
        </button>
      </header>

      <section className="profile-hero">
        <img src={avatarToDisplay} alt={nameToDisplay} className="profile-avatar" />
        <h2>{nameToDisplay}</h2>
        <p className="profile-meta">{ageToDisplay}, {locationToDisplay}</p>
        <p className="profile-goal">{goalToDisplay}</p>
      </section>

      {isEditing ? (
        <div className="profile-form">
          <div className="avatar-editor">
            <span>Profile photo</span>
            <div className="avatar-editor-row">
              <img src={draft.avatar || profile.avatar} alt="Avatar preview" />
              <div className="avatar-editor-actions">
                <label className="upload-btn primary" htmlFor="profile-avatar-file">
                  Choose Photo
                </label>
                <input
                  id="profile-avatar-file"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  className="upload-btn"
                  onClick={handleOpenCamera}
                  disabled={!('mediaDevices' in navigator)}
                >
                  {cameraStream ? 'Close Camera' : 'Use Camera'}
                </button>
              </div>
            </div>
          </div>
          <label>
            <span>Name</span>
            <input
              className="input-field"
              value={draft.name}
              onChange={handleChange('name')}
              placeholder="Full name"
            />
          </label>
          <div className="profile-file-row">
            <label className="upload-btn primary" htmlFor="profile-photo-file">
              Upload Gallery Photos
            </label>
            <input
              id="profile-photo-file"
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleLocalPhotoUpload}
            />
          </div>
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
          {localPhotos.length > 0 && (
            <div className="local-photo-preview">
              {localPhotos.map((url, idx) => (
                <div key={idx} className="local-photo-item">
                  <img src={url} alt={`Local upload ${idx + 1}`} />
                  <button
                    type="button"
                    className="remove-local-photo"
                    onClick={() => handleRemoveLocalPhoto(idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <label>
            <span>Age</span>
            <input
              className="input-field"
              value={draft.age}
              onChange={handleChange('age')}
              placeholder="Age"
              inputMode="numeric"
            />
          </label>
          <label>
            <span>Location</span>
            <input
              className="input-field"
              value={draft.location}
              onChange={handleChange('location')}
              placeholder="City, State"
            />
          </label>
          <label>
            <span>Relationship goal</span>
            <input
              className="input-field"
              value={draft.goal}
              onChange={handleChange('goal')}
              placeholder="Looking for..."
            />
          </label>
          <label>
            <span>About</span>
            <textarea
              className="textarea-field"
              rows={5}
              value={draft.about}
              onChange={handleChange('about')}
              placeholder="Tell others about yourself"
            />
          </label>
          <label>
            <span>Interests (comma separated)</span>
            <input
              className="input-field"
              value={draft.interestsText}
              onChange={handleChange('interestsText')}
              placeholder="Hiking, Travel, Photography"
            />
          </label>
          <label>
            <span>Photo URLs (one per line)</span>
            <textarea
              className="textarea-field"
              rows={4}
              value={draft.photosText}
              onChange={handleChange('photosText')}
              placeholder="https://example.com/photo.jpg"
            />
          </label>
        </div>
      ) : (
        <>
          <section className="profile-section">
            <h3>About</h3>
            <p>{displayProfile.about}</p>
          </section>

          <section className="profile-section">
            <h3>Interests</h3>
            <div className="profile-pills">
              {displayProfile.interests.map((interest) => (
                <span key={interest} className="profile-pill">
                  {interest}
                </span>
              ))}
            </div>
          </section>

          <section className="profile-section">
            <h3>Photos</h3>
            <div className="profile-photos">
              {displayProfile.photos.map((url, idx) => (
                <img key={idx} src={url} alt={`${displayProfile.name} ${idx + 1}`} />
              ))}
            </div>
          </section>
        </>
      )}

      <div className="profile-actions">
        {isEditing ? (
          <>
            <button
              className="chip-button"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="chip-button primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button className="chip-button primary">Chat</button>
            <button className="chip-button">Request Photos</button>
            <button
              className="chip-button danger"
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </>
        )}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => onNavigate('events')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24">
              <path d="M5 8.5h14M5 12.5h14M8.5 4v4.5M15.5 4v4.5M6.75 19.5h10.5c1.243 0 2.25-1.007 2.25-2.25V7.75A2.25 2.25 0 0 0 17.25 5.5H6.75A2.25 2.25 0 0 0 4.5 7.75v9.5A2.25 2.25 0 0 0 6.75 19.5Z" />
            </svg>
          </span>
          <span className="nav-label">Events</span>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 20.25s-7.5-4.5-7.5-10.125a4.125 4.125 0 0 1 7.125-2.7l.375.45.375-.45A4.125 4.125 0 0 1 19.5 10.125C19.5 15.75 12 20.25 12 20.25Z" />
            </svg>
          </span>
          {likesCount > 0 && <span className="nav-badge">{likesCount}</span>}
          <span className="nav-label">Matches</span>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 12.25c2.347 0 4.25-1.903 4.25-4.25S14.347 3.75 12 3.75 7.75 5.653 7.75 8s1.903 4.25 4.25 4.25Z" />
              <path d="M5.5 19.25c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default Profile;


