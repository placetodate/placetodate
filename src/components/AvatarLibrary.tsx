import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

type AvatarLibraryProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  gender?: string;
};

// Generate avatar URL using DiceBear API with avataaars style
const generateAvatarUrl = (seed: string): string => {
  // DiceBear API v7 format - seed determines the avatar appearance
  // Different seeds will produce different looking avatars
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
};

// Generate multiple avatar options based on gender
const generateAvatarOptions = (gender?: string, count: number = 24): string[] => {
  const avatars: string[] = [];
  const genderLower = gender?.toLowerCase() || '';
  
  // Use gender-specific seed patterns to get more appropriate avatars
  // Different seed patterns tend to produce different looking avatars
  if (genderLower === 'female') {
    // Female avatars
    const femaleSeeds = ['Aria', 'Luna', 'Zoe', 'Maya', 'Ivy', 'Eva', 'Lily', 'Nora', 
                         'Emma', 'Olivia', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
                         'Grace', 'Chloe', 'Victoria', 'Scarlett', 'Aubrey', 'Hannah', 'Addison', 'Madison'];
    for (let i = 0; i < count; i++) {
      const seed = `female-${femaleSeeds[i % femaleSeeds.length]}-${i}`;
      avatars.push(generateAvatarUrl(seed));
    }
  } else if (genderLower === 'male') {
    // Male avatars
    const maleSeeds = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Sage',
                       'Noah', 'Liam', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
                       'Mason', 'Michael', 'Ethan', 'Daniel', 'Matthew', 'Jackson', 'Sebastian', 'David'];
    for (let i = 0; i < count; i++) {
      const seed = `male-${maleSeeds[i % maleSeeds.length]}-${i}`;
      avatars.push(generateAvatarUrl(seed));
    }
  } else {
    // Non-binary, Prefer not to say, or no gender selected - mix of both
    const baseSeeds = ['Aria', 'Luna', 'Zoe', 'Maya', 'Ivy', 'Eva', 'Lily', 'Nora',
                       'Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Sage',
                       'Emma', 'Olivia', 'Noah', 'Liam', 'William', 'James', 'Benjamin', 'Lucas'];
    for (let i = 0; i < count; i++) {
      const seed = `neutral-${baseSeeds[i % baseSeeds.length]}-${i}`;
      avatars.push(generateAvatarUrl(seed));
    }
  }
  
  return avatars;
};

const AvatarLibrary: React.FC<AvatarLibraryProps> = ({ isOpen, onClose, onSelect, gender }) => {
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Generate avatar options based on gender from the "I'm" field
      // This will update whenever the gender changes, even if modal is already open
      const avatarOptions = generateAvatarOptions(gender, 24);
      setAvatars(avatarOptions);
    } else {
      // Clear avatars when modal closes
      setAvatars([]);
    }
  }, [isOpen, gender]);

  const handleSelect = (avatarUrl: string) => {
    onSelect(avatarUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="avatar-library-overlay" onClick={onClose}>
      <div className="avatar-library-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-library-header">
          <h2>Choose an Avatar</h2>
          <button className="avatar-library-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="avatar-library-content">
          <div className="avatar-library-grid">
            {avatars.map((avatarUrl, index) => (
              <div
                key={index}
                className="avatar-library-item"
                onClick={() => handleSelect(avatarUrl)}
              >
                <img
                  src={avatarUrl}
                  alt={`Avatar ${index + 1}`}
                  className="avatar-library-image"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarLibrary;

