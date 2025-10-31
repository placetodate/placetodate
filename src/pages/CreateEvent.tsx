import React, { useState } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type CreateEventProps = {
  onClose: () => void;
};

function CreateEvent({ onClose }: CreateEventProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      setSubmitting(true);
      let coverUrl: string | null = null;
      if (cover) {
        const filePath = `events/${auth.currentUser.uid}/${Date.now()}-${cover.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, cover);
        coverUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'events'), {
        name,
        description,
        location,
        startTime,
        endTime,
        coverUrl,
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="create-event-page">
      <header className="create-header">
        <button className="back-btn" aria-label="Close" onClick={onClose}>×</button>
        <h1>Create Event</h1>
      </header>

      <form className="create-form" onSubmit={handleSubmit}>
        <input
          className="input-field"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="textarea-field"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
        />

        <input
          className="input-field"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="map-placeholder">
          <img src="/assets/events_illustration.png" alt="Map preview" />
        </div>

        <input
          className="input-field"
          placeholder="Start Time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <input
          className="input-field"
          placeholder="End Time"
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <label className="upload-btn" htmlFor="cover-input">Upload Cover Image</label>
        <input id="cover-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setCover(e.target.files?.[0] || null)} />

        <button type="submit" className="fab submit" disabled={submitting}>
          <span>{submitting ? 'Creating…' : 'Create Event'}</span>
        </button>
      </form>

      <nav className="bottom-nav">
        <button className="nav-item">📅
          <div className="nav-label">Events</div>
        </button>
        <button className="nav-item">👥
          <div className="nav-label">Matches</div>
        </button>
        <button className="nav-item">👤
          <div className="nav-label">Profile</div>
        </button>
      </nav>
    </div>
  );
}

export default CreateEvent;


