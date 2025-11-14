import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';
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

type NominatimAddress = Record<string, string | undefined>;

const buildAddressLabel = (address?: NominatimAddress | null): string | null => {
  if (!address) return null;
  const house = address.house_number;
  const road =
    address.road ||
    address.pedestrian ||
    address.path ||
    address.cycleway ||
    address.footway;
  const neighbourhood = address.neighbourhood || address.suburb;
  const city = address.city || address.town || address.village || neighbourhood;
  const stateRaw = address.state || address.region;
  const state =
    stateRaw && /district/i.test(stateRaw) ? undefined : stateRaw;
  const parts: string[] = [];
  const street = [house, road].filter(Boolean).join(' ').trim();
  if (street) parts.push(street);
  if (city) parts.push(city);
  if (state && state !== city) parts.push(state);
  return parts.join(', ') || null;
};

const cleanDisplayName = (value?: string | null): string | null => {
  if (!value) return null;
  const segments = value.split(',').map((segment) => segment.trim()).filter(Boolean);
  const filtered: string[] = [];
  for (const segment of segments) {
    if (/district/i.test(segment)) continue;
    if (filtered.some((existing) => existing.toLowerCase() === segment.toLowerCase())) continue;
    filtered.push(segment);
    if (filtered.length >= 3) break;
  }
  return filtered.join(', ') || null;
};

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
  const [resolvedLocationText, setResolvedLocationText] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'searching' | 'success' | 'not-found' | 'error'>('idle');
  const skipGeocodeRef = useRef(false);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);
  const [suggestions, setSuggestions] = useState<
    { label: string; coords: Coordinates; raw: any }[]
  >([]);
  const [isSuggestionOpen, setSuggestionOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const suggestionListRef = useRef<HTMLUListElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const likesCount = 3;

  const updateAddressFromCoords = useCallback(
    async (coords: Coordinates) => {
      if (!isLocationPickerOpen) return;
      reverseGeocodeAbortRef.current?.abort();
      const controller = new AbortController();
      reverseGeocodeAbortRef.current = controller;
      setIsGeocoding(true);
      setGeocodeStatus('searching');
      try {
        const params = new URLSearchParams({
          format: 'json',
          lat: coords.lat.toString(),
          lon: coords.lng.toString(),
          addressdetails: '1',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'en',
          },
        });
        if (!response.ok) {
          throw new Error(`Reverse geocode failed with status ${response.status}`);
        }
        const data = await response.json();
        if (controller.signal.aborted) return;
        const formatted =
          buildAddressLabel(data.address) ||
          cleanDisplayName(data.display_name) ||
          '';
        skipGeocodeRef.current = true;
        setDraftLocationText(formatted);
        setResolvedLocationText(formatted);
        setDraftLocationCoords(coords);
        setGeocodeStatus('success');
        setSuggestions([]);
        setSuggestionOpen(false);
        setHighlightIndex(-1);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Reverse geocoding error', err);
        setGeocodeStatus('error');
        setSuggestions([]);
        setSuggestionOpen(false);
        setHighlightIndex(-1);
      } finally {
        if (!controller.signal.aborted) {
          setIsGeocoding(false);
        }
      }
    },
    [isLocationPickerOpen],
  );

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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        suggestionListRef.current &&
        !suggestionListRef.current.contains(target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(target)
      ) {
        setSuggestionOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    geocodeAbortRef.current?.abort();
    geocodeAbortRef.current = null;
    if (!isLocationPickerOpen) {
      setIsGeocoding(false);
      setGeocodeStatus('idle');
      return undefined;
    }

    const value = draftLocationText.trim();
    if (!value) {
      setDraftLocationCoords(null);
      setResolvedLocationText('');
      setIsGeocoding(false);
      setGeocodeStatus('idle');
      return undefined;
    }

    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      setSuggestionOpen(false);
      setSuggestions([]);
      setHighlightIndex(-1);
      return undefined;
    }

    const parsedCoords = parseLatLng(value);
    if (parsedCoords) {
      setDraftLocationCoords(parsedCoords);
      updateAddressFromCoords(parsedCoords);
      return undefined;
    }

    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    const debounceId = window.setTimeout(async () => {
      setIsGeocoding(true);
      setGeocodeStatus('searching');
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: value,
          limit: '1',
          addressdetails: '1',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'en',
          },
        });
        if (!response.ok) {
          throw new Error(`Geocoding failed with status ${response.status}`);
        }
        const results = await response.json();
        if (controller.signal.aborted) return;
        if (Array.isArray(results) && results.length > 0) {
          const mapped = results
            .slice(0, 6)
            .map((result: any) => {
              const coords: Coordinates = {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
              };
              const label =
                buildAddressLabel(result.address) ||
                cleanDisplayName(result.display_name) ||
                value;
              return {
                label,
                coords,
                raw: result,
              };
            })
            .filter(
              (item) =>
                Number.isFinite(item.coords.lat) &&
                Number.isFinite(item.coords.lng) &&
                item.label,
            );

          setSuggestions(mapped);
          setSuggestionOpen(mapped.length > 0);
          setHighlightIndex(mapped.length > 0 ? 0 : -1);

          if (mapped.length > 0) {
            const top = mapped[0];
            setDraftLocationCoords(top.coords);
            setResolvedLocationText(top.label);
            setGeocodeStatus('success');
          } else {
            setDraftLocationCoords(null);
            setResolvedLocationText(value);
            setGeocodeStatus('not-found');
          }
        } else {
          setDraftLocationCoords(null);
          setResolvedLocationText(value);
          setGeocodeStatus('not-found');
          setSuggestions([]);
          setSuggestionOpen(false);
          setHighlightIndex(-1);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Geocoding error', err);
        setGeocodeStatus('error');
        setSuggestions([]);
        setSuggestionOpen(false);
        setHighlightIndex(-1);
      } finally {
        if (!controller.signal.aborted) {
          setIsGeocoding(false);
        }
      }
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(debounceId);
      if (geocodeAbortRef.current === controller) {
        geocodeAbortRef.current = null;
      }
    };
  }, [draftLocationText, isLocationPickerOpen, updateAddressFromCoords]);

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
      const initialLocationText = initialEvent.location || '';
      setDraftLocationText(initialLocationText);
      setResolvedLocationText(initialLocationText);

      const coverUrl = initialEvent.coverUrl || null;
      setCoverPreview(coverUrl || DEFAULT_COVER);
      setExistingCoverUrl(coverUrl);
      setCover(null);
    }
  }, [initialEvent, mode]);

  useEffect(() => {
    return () => {
      geocodeAbortRef.current?.abort();
      reverseGeocodeAbortRef.current?.abort();
    };
  }, []);

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
    setResolvedLocationText('');
    setGeocodeStatus('idle');
    setIsGeocoding(false);
    setSuggestions([]);
    setSuggestionOpen(false);
    setHighlightIndex(-1);
    skipGeocodeRef.current = false;
    geocodeAbortRef.current?.abort();
    reverseGeocodeAbortRef.current?.abort();
    geocodeAbortRef.current = null;
    reverseGeocodeAbortRef.current = null;
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
    const baseText = location || resolvedLocationText || '';
    setDraftLocationText(baseText);
    setResolvedLocationText(baseText);
    setDraftLocationCoords(locationCoords);
    setLocationPickerOpen(true);
    setGeocodeStatus('idle');
    skipGeocodeRef.current = false;
    setSuggestionOpen(Boolean(baseText));
  };

  const handleCloseLocationPicker = () => {
    setLocationPickerOpen(false);
    setDraftLocationText(location);
    setDraftLocationCoords(locationCoords);
    setResolvedLocationText(location || resolvedLocationText || '');
    setIsGeocoding(false);
    setGeocodeStatus('idle');
    geocodeAbortRef.current?.abort();
    reverseGeocodeAbortRef.current?.abort();
    skipGeocodeRef.current = false;
    setSuggestions([]);
    setSuggestionOpen(false);
    setHighlightIndex(-1);
  };

  const handleApplyLocationPicker = () => {
    geocodeAbortRef.current?.abort();
    reverseGeocodeAbortRef.current?.abort();
    setIsGeocoding(false);
    const cleanText = (resolvedLocationText || draftLocationText).trim();
    const nextText = cleanText;
    setLocation(nextText);
    setLocationCoords(draftLocationCoords);
    setResolvedLocationText(nextText);
    setLocationPickerOpen(false);
    skipGeocodeRef.current = false;
    setSuggestions([]);
    setSuggestionOpen(false);
    setHighlightIndex(-1);
  };

  const handleCancel = () => {
    releasePreviewUrl(coverPreview);
    resetForm();
    onClose();
  };

  const handleDraftLocationTextChange = (value: string) => {
    geocodeAbortRef.current?.abort();
    reverseGeocodeAbortRef.current?.abort();
    setIsGeocoding(false);
    setDraftLocationText(value);
    setGeocodeStatus('idle');
    setSuggestionOpen(Boolean(value.trim()));
    setHighlightIndex(-1);
    if (!value.trim()) {
      setDraftLocationCoords(null);
      setResolvedLocationText('');
      setSuggestions([]);
      return;
    }
    const coords = parseLatLng(value);
    if (coords) {
      setDraftLocationCoords(coords);
      setResolvedLocationText((prev) => prev);
      updateAddressFromCoords(coords);
      setSuggestionOpen(false);
      setSuggestions([]);
      setHighlightIndex(-1);
      return;
    }
    setResolvedLocationText(value);
  };

  const handleDraftLocationCoordsChange = (coords: Coordinates) => {
    geocodeAbortRef.current?.abort();
    skipGeocodeRef.current = true;
    setDraftLocationCoords(coords);
    setDraftLocationText('Fetching address…');
    setResolvedLocationText((prev) => prev);
    setGeocodeStatus('searching');
    updateAddressFromCoords(coords);
    setSuggestions([]);
    setSuggestionOpen(false);
    setHighlightIndex(-1);
  };

  const handleSuggestionSelect = (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    skipGeocodeRef.current = true;
    geocodeAbortRef.current?.abort();
    reverseGeocodeAbortRef.current?.abort();
    setDraftLocationText(suggestion.label);
    setResolvedLocationText(suggestion.label);
    setDraftLocationCoords(suggestion.coords);
    setSuggestionOpen(false);
    setSuggestions([]);
    setHighlightIndex(-1);
    setIsGeocoding(false);
    setGeocodeStatus('success');
  };

  const handleLocationInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionOpen || suggestions.length === 0) {
      if (event.key === 'Escape') {
        setSuggestionOpen(false);
        setHighlightIndex(-1);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => {
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => {
        if (prev <= 0) {
          return suggestions.length - 1;
        }
        return prev - 1;
      });
    } else if (event.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        event.preventDefault();
        handleSuggestionSelect(highlightIndex);
      }
    } else if (event.key === 'Escape') {
      setSuggestionOpen(false);
      setHighlightIndex(-1);
    }
  };

  const startSummary = formatDateTime(startDateTime) ?? 'Start date & time';
  const endSummary = formatDateTime(endDateTime) ?? 'End date & time';
  const locationSummary =
    location || resolvedLocationText || 'Add location';
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
        <button className="back-btn" aria-label="Close" onClick={handleCancel}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
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
            {!location && !resolvedLocationText && (
              <span className="location-button-helper">Pick on map or type an address</span>
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

      {isDatePickerOpen && (
        <div className="date-picker-overlay" role="dialog" aria-modal="true">
          <div className="date-picker-modal">
            <header className="date-picker-modal-header">
              <h2>Select schedule</h2>
              <button type="button" className="icon-button" onClick={handleCloseDatePicker} aria-label="Close date picker">
                <FontAwesomeIcon icon={faTimes} />
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
                <FontAwesomeIcon icon={faTimes} />
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
              {(isGeocoding || geocodeStatus === 'not-found' || geocodeStatus === 'error') && (
                <div
                  className={`location-status ${
                    geocodeStatus === 'not-found' || geocodeStatus === 'error' ? 'error' : 'loading'
                  }`}
                >
                  {isGeocoding
                    ? 'Searching for location…'
                    : geocodeStatus === 'not-found'
                      ? 'No results found. Try refining the address.'
                      : 'Could not verify the location right now. Please try again.'}
                </div>
              )}
              <div className="location-input-wrapper">
                <label className="location-input-label">
                  Address or coordinates
                  <input
                    ref={locationInputRef}
                    className="input-field location-input"
                    placeholder="Search address"
                    value={draftLocationText}
                    onChange={(e) => handleDraftLocationTextChange(e.target.value)}
                    onKeyDown={handleLocationInputKeyDown}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setSuggestionOpen(true);
                      }
                    }}
                    aria-autocomplete="list"
                    aria-expanded={isSuggestionOpen}
                    aria-controls="location-suggestion-list"
                    aria-activedescendant={
                      highlightIndex >= 0 ? `location-suggestion-${highlightIndex}` : undefined
                    }
                  />
                </label>
                {isSuggestionOpen && suggestions.length > 0 && (
                  <ul
                    id="location-suggestion-list"
                    className="location-suggestions"
                    role="listbox"
                    ref={suggestionListRef}
                  >
                    {suggestions.map((item, index) => (
                      <li
                        key={`${item.label}-${index}`}
                        id={`location-suggestion-${index}`}
                        role="option"
                        aria-selected={highlightIndex === index}
                        className={`location-suggestion ${highlightIndex === index ? 'active' : ''}`}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onMouseLeave={() => setHighlightIndex(-1)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSuggestionSelect(index);
                        }}
                      >
                        <span className="suggestion-label">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {resolvedLocationText && (
                <div className="location-coords-preview">
                  <span>{resolvedLocationText}</span>
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


