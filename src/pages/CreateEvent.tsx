import React, { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent, LatLngExpression } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { auth, db, storage } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { EventItem } from './Events';

type CreateEventProps = {
  onClose: () => void;
  mode?: 'create' | 'update';
  initialEvent?: EventItem;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
};

type Coordinates = {
  lat: number;
  lng: number;
};

const DEFAULT_COVER = '/assets/events_illustration.png';
const DEFAULT_MAP_CENTER: [number, number] = [40.7128, -74.006];

const formatDateTime = (date: Date | undefined) =>
  date
    ? date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

const combineDateAndTime = (date: Date | undefined, time: string) => {
  if (!date) return undefined;
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

const parseLatLng = (value: string): Coordinates | null => {
  const [latStr, lngStr] = value.split(',').map((part) => part.trim());
  if (!latStr || !lngStr) return null;

  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const formatCoords = (coords: Coordinates | null) =>
  coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : null;

type LocationMarkerProps = {
  position: Coordinates | null;
  onSelect: (coords: Coordinates) => void;
};

const LeafletMarker = Marker as unknown as React.ComponentType<any>;

const LocationMarker = ({ position, onSelect }: LocationMarkerProps) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      const nextCenter: LatLngExpression = [position.lat, position.lng];
      map.setView(nextCenter, Math.max(map.getZoom(), 5), {
        animate: true,
      });
    }
  }, [map, position]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const newCoords: Coordinates = {
        lat: parseFloat(e.latlng.lat.toFixed(6)),
        lng: parseFloat(e.latlng.lng.toFixed(6)),
      };
      onSelect(newCoords);
    },
  });

  if (!position) {
    return null;
  }

  const markerPosition: LatLngExpression = [position.lat, position.lng];

  return <LeafletMarker position={markerPosition} />;
};

const LeafletMapContainer = MapContainer as unknown as React.ComponentType<any>;
const LeafletTileLayer = TileLayer as unknown as React.ComponentType<any>;

const toTimeInputValue = (date?: Date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

function CreateEvent({
  onClose,
  mode = 'create',
  initialEvent,
  onNavigate,
  activeView,
}: CreateEventProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<Coordinates | null>(null);
  const [isLocationPickerOpen, setLocationPickerOpen] = useState(false);
  const [draftLocationText, setDraftLocationText] = useState('');
  const [draftLocationCoords, setDraftLocationCoords] = useState<Coordinates | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>(DEFAULT_COVER);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const likesCount = 3;

  const startDateTime = combineDateAndTime(dateRange?.from, startTime);
  const endDateTime = combineDateAndTime(dateRange?.to, endTime);

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  useEffect(() => {
    if (mode === 'update' && initialEvent) {
      setName(initialEvent.name || '');
      setDescription(initialEvent.description || '');
      setLocation(initialEvent.location || '');

      const start = initialEvent.startTime ? new Date(initialEvent.startTime) : undefined;
      const end = initialEvent.endTime ? new Date(initialEvent.endTime) : undefined;

      if (start || end) {
        setDateRange({ from: start, to: end });
        setDraftRange({ from: start, to: end });
      } else {
        setDateRange(undefined);
        setDraftRange(undefined);
      }

      setStartTime(start ? toTimeInputValue(start) : '18:00');
      setEndTime(end ? toTimeInputValue(end) : '20:00');

      const coords = initialEvent.locationCoords
        ? { lat: initialEvent.locationCoords.lat, lng: initialEvent.locationCoords.lng }
        : null;
      setLocationCoords(coords);
      setDraftLocationCoords(coords);
      const initialLocationText = initialEvent.location || formatCoords(coords) || '';
      setDraftLocationText(initialLocationText);

      const coverUrl = initialEvent.coverUrl || null;
      setCoverPreview(coverUrl || DEFAULT_COVER);
      setExistingCoverUrl(coverUrl);
      setCover(null);
    }
  }, [initialEvent, mode]);

  const releasePreviewUrl = (url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocation('');
    setLocationCoords(null);
    setLocationPickerOpen(false);
    setDraftLocationText('');
    setDraftLocationCoords(null);
    setDateRange(undefined);
    setDraftRange(undefined);
    setDatePickerOpen(false);
    setStartTime('18:00');
    setEndTime('20:00');
    setCover(null);
    setExistingCoverUrl(null);
    setCoverPreview(DEFAULT_COVER);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      setSubmitting(true);
      let coverUrl: string | null = existingCoverUrl;
      if (cover) {
        const filePath = `events/${auth.currentUser.uid}/${Date.now()}-${cover.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, cover);
        coverUrl = await getDownloadURL(storageRef);
      }

      const payload = {
        name,
        description,
        location,
        locationCoords: locationCoords ? { lat: locationCoords.lat, lng: locationCoords.lng } : null,
        startTime: startDateTime ? startDateTime.toISOString() : null,
        endTime: endDateTime ? endDateTime.toISOString() : null,
        coverUrl: coverUrl ?? null,
      };

      if (mode === 'update' && initialEvent) {
        const eventRef = doc(db, 'events', initialEvent.id);
        await updateDoc(eventRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'events'), {
          ...payload,
          ownerUid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      releasePreviewUrl(coverPreview);
      resetForm();
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      releasePreviewUrl(coverPreview);
    };
  }, [coverPreview]);

  const handleCoverChange = (file: File | null) => {
    releasePreviewUrl(coverPreview);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCoverPreview(objectUrl);
      setCover(file);
      setExistingCoverUrl(null);
    } else {
      setCover(null);
      setCoverPreview(DEFAULT_COVER);
      setExistingCoverUrl(null);
    }
  };

  const handleOpenDatePicker = () => {
    setDraftRange(dateRange);
    setDatePickerOpen(true);
  };

  const handleCloseDatePicker = () => {
    setDraftRange(undefined);
    setDatePickerOpen(false);
  };

  const handleApplyDatePicker = () => {
    setDateRange(draftRange);
    setDatePickerOpen(false);
  };

  const handleOpenLocationPicker = () => {
    setDraftLocationText(location);
    setDraftLocationCoords(locationCoords);
    setLocationPickerOpen(true);
  };

  const handleCloseLocationPicker = () => {
    setLocationPickerOpen(false);
    setDraftLocationText(location);
    setDraftLocationCoords(locationCoords);
  };

  const handleApplyLocationPicker = () => {
    const cleanText = draftLocationText.trim();
    const nextText = cleanText || formatCoords(draftLocationCoords) || '';
    setLocation(nextText);
    setLocationCoords(draftLocationCoords);
    setLocationPickerOpen(false);
  };

  const handleCancel = () => {
    releasePreviewUrl(coverPreview);
    resetForm();
    onClose();
  };

  const handleDraftLocationTextChange = (value: string) => {
    setDraftLocationText(value);
    if (!value.trim()) {
      setDraftLocationCoords(null);
      return;
    }
    const coords = parseLatLng(value);
    if (coords) {
      setDraftLocationCoords(coords);
    } else {
      setDraftLocationCoords(null);
    }
  };

  const handleDraftLocationCoordsChange = (coords: Coordinates) => {
    setDraftLocationCoords(coords);
    setDraftLocationText(formatCoords(coords) ?? '');
  };

  const startSummary = formatDateTime(startDateTime) ?? 'Start date & time';
  const endSummary = formatDateTime(endDateTime) ?? 'End date & time';
  const locationSummary = location || formatCoords(locationCoords) || 'Add location';
  const locationCoordsSummary = formatCoords(locationCoords);
  const mapCenter = useMemo<LatLngExpression>(() => {
    if (draftLocationCoords) {
      return [draftLocationCoords.lat, draftLocationCoords.lng];
    }
    if (locationCoords) {
      return [locationCoords.lat, locationCoords.lng];
    }
    return DEFAULT_MAP_CENTER;
  }, [draftLocationCoords, locationCoords]);
  const mapZoom = draftLocationCoords || locationCoords ? 13 : 3;

  return (
    <div className="create-event-page">
      <header className="create-header">
        <button className="back-btn" aria-label="Close" onClick={handleCancel}>×</button>
        <h1>{mode === 'update' ? 'Edit Event' : 'Create Event'}</h1>
      </header>

      <form className="create-form" onSubmit={handleSubmit}>
        <input
          className="input-field"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="image-upload interactive">
          <label htmlFor="cover-input" className="image-click-target">
            <div className="image-preview">
              <img src={coverPreview} alt="Event cover preview" />
              <div className="image-indicator" aria-hidden="true">
                <svg
                  className="image-indicator-icon"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  focusable="false"
                >
                  <path
                    d="M15.75 2.25H8.25C5.3505 2.25 3 4.6005 3 7.5V16.5C3 19.3995 5.3505 21.75 8.25 21.75H15.75C18.6495 21.75 21 19.3995 21 16.5V7.5C21 4.6005 18.6495 2.25 15.75 2.25Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.125 10.5001C17.1605 10.5001 18 9.66057 18 8.62508C18 7.58958 17.1605 6.75008 16.125 6.75008C15.0895 6.75008 14.25 7.58958 14.25 8.62508C14.25 9.66057 15.0895 10.5001 16.125 10.5001Z"
                    fill="white"
                  />
                  <path
                    d="M4.5 17.1562L8.64881 12.9795C9.38131 12.234 10.5951 12.234 11.3276 12.9795L12.1573 13.8225C12.8898 14.568 14.1036 14.568 14.8361 13.8225L18 10.627"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="image-indicator-text">Tap to change</span>
              </div>
            </div>
          </label>
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
          />
        </div>

        <textarea
          className="textarea-field"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
        />

        <div className="location-picker">
          <button
            type="button"
            className="location-button"
            onClick={handleOpenLocationPicker}
            aria-haspopup="dialog"
            aria-expanded={isLocationPickerOpen}
          >
            <span className="location-button-title">Location</span>
            <span className="location-button-summary">
              {locationSummary}
            </span>
            {location && locationCoordsSummary && (
              <span className="location-button-coords">{locationCoordsSummary}</span>
            )}
            {!location && !locationCoordsSummary && (
              <span className="location-button-coords placeholder">Pick on map or type an address</span>
            )}
          </button>
        </div>

        <div className="date-range-picker">
          <label className="date-label" htmlFor="event-date-range">Event schedule</label>
          <button
            type="button"
            className="date-picker-button"
            onClick={handleOpenDatePicker}
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
          >
            <span className="date-button-title">Choose dates</span>
            <span className="date-button-summary">{startSummary} → {endSummary}</span>
          </button>
          <div className="time-range">
            <label>
              <span>Start time</span>
              <input
                type="time"
                className="input-field time-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              <span>End time</span>
              <input
                type="time"
                className="input-field time-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          <small className="date-summary">
            {startSummary} — {endSummary}
          </small>
        </div>

        <button type="submit" className="fab submit" disabled={submitting}>
          <span>
            {submitting
              ? mode === 'update'
                ? 'Updating…'
                : 'Saving…'
              : mode === 'update'
                ? 'Update'
                : 'Save'}
          </span>
        </button>
      </form>

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

      {isDatePickerOpen && (
        <div className="date-picker-overlay" role="dialog" aria-modal="true">
          <div className="date-picker-modal">
            <header className="date-picker-modal-header">
              <h2>Select schedule</h2>
              <button type="button" className="icon-button" onClick={handleCloseDatePicker} aria-label="Close date picker">
                ×
              </button>
            </header>
            <div className="calendar-shell">
              <DayPicker
                id="event-date-range"
                mode="range"
                selected={draftRange}
                onSelect={setDraftRange}
                showOutsideDays
                weekStartsOn={1}
                numberOfMonths={1}
                className="date-range-calendar"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-btn secondary" onClick={handleCloseDatePicker}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleApplyDatePicker}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {isLocationPickerOpen && (
        <div className="location-picker-overlay" role="dialog" aria-modal="true">
          <div className="location-picker-modal">
            <header className="location-picker-header">
              <h2>Set location</h2>
              <button
                type="button"
                className="icon-button"
                onClick={handleCloseLocationPicker}
                aria-label="Close location picker"
              >
                ×
              </button>
            </header>
            <div className="location-picker-body">
              <LeafletMapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="location-map"
                scrollWheelZoom={false}
              >
                <LeafletTileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={draftLocationCoords} onSelect={handleDraftLocationCoordsChange} />
              </LeafletMapContainer>
              <p className="location-hint">Tap on the map to drop a pin, or enter an address or coordinates.</p>
              <label className="location-input-label">
                Address or coordinates
                <input
                  className="input-field location-input"
                  placeholder="Search address or paste “37.7749, -122.4194”"
                  value={draftLocationText}
                  onChange={(e) => handleDraftLocationTextChange(e.target.value)}
                />
              </label>
              {draftLocationCoords && (
                <div className="location-coords-preview">
                  Pin position: {formatCoords(draftLocationCoords)}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-btn secondary" onClick={handleCloseLocationPicker}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleApplyLocationPicker}
                disabled={!draftLocationText.trim() && !draftLocationCoords}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateEvent;


