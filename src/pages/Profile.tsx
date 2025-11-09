import React, { useEffect, useMemo, useState } from 'react';

type ProfileData = {
  name: string;
  age: number;
  location: string;
  goal: string;
  about: string;
  interests: string[];
  photos: string[];
};

type ProfileProps = {
  profile: ProfileData;
  onUpdate: (profile: ProfileData) => void | Promise<void>;
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
};

const createDraftFromProfile = (profile: ProfileData): DraftState => ({
  name: profile.name,
  age: profile.age.toString(),
  location: profile.location,
  goal: profile.goal,
  about: profile.about,
  interestsText: profile.interests.join(', '),
  photosText: profile.photos.join('\n'),
  photoPreview: null,
  cameraPreview: null,
});

function Profile({ profile, onUpdate, onBack, onNavigate, activeView }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromProfile(profile));
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(createDraftFromProfile(profile));
      setLocalPhotos([]);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
  }, [profile, isEditing]);

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
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
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
  };

  const handleCancel = () => {
    setDraft(createDraftFromProfile(profile));
    setIsEditing(false);
    setLocalPhotos([]);
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
        <img src="https://i.pravatar.cc/240?img=45" alt="Ethan" className="profile-avatar" />
        <h2>{nameToDisplay}</h2>
        <p className="profile-meta">{ageToDisplay}, {locationToDisplay}</p>
        <p className="profile-goal">{goalToDisplay}</p>
      </section>

      {isEditing ? (
        <div className="profile-form">
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
              Upload Photos
            </label>
            <input
              id="profile-photo-file"
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleLocalPhotoUpload}
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
          </>
        )}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => onNavigate('events')}
        >📅
          <div className="nav-label">Events</div>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >👥
          <div className="nav-label">Matches</div>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >👤
          <div className="nav-label">Profile</div>
        </button>
      </nav>
    </div>
  );
}

export default Profile;


