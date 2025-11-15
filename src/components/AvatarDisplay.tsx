import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserTie, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// Helper function to get gender-based Font Awesome icon
const getGenderBasedIcon = (gender?: string): IconDefinition => {
  if (!gender) {
    // No gender specified, use generic user icon
    return faUserCircle;
  }
  
  const genderLower = gender.toLowerCase();
  
  if (genderLower === 'male') {
    // Male: use UserTie icon
    return faUserTie;
  } else if (genderLower === 'female') {
    // Female: use User icon
    return faUser;
  } else {
    // Non-binary or other: use generic user circle
    return faUserCircle;
  }
};

// Avatar component that renders either an image or Font Awesome icon
type AvatarDisplayProps = {
  src?: string;
  alt: string;
  gender?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  shape?: 'circle' | 'rounded'; // Add shape prop for circular or rounded rectangle
};

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
  src, 
  alt, 
  gender, 
  className = '',
  size = 'medium',
  shape = 'circle'
}) => {
  // Size configurations
  const sizeConfig = {
    small: { container: '48px', icon: '24px' },
    medium: { container: '72px', icon: '36px' },
    large: { container: '128px', icon: '64px' }
  };
  
  const config = sizeConfig[size];
  
  // Determine border radius based on shape
  const borderRadius = shape === 'circle' ? '50%' : '16px';
  
  if (src && src.trim() !== '') {
    // If we have an image URL, use it
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        style={{
          width: shape === 'rounded' ? '100%' : config.container,
          height: shape === 'rounded' ? '100%' : config.container,
          borderRadius: borderRadius,
          objectFit: 'cover'
        }}
      />
    );
  }
  
  // Otherwise, use Font Awesome icon based on gender
  const icon = getGenderBasedIcon(gender);
  return (
    <div 
      className={`avatar-icon ${className}`}
      style={{
        width: shape === 'rounded' ? '100%' : config.container,
        height: shape === 'rounded' ? '100%' : config.container,
        borderRadius: borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3edf1',
        color: '#7b677a',
        boxShadow: shape === 'rounded' ? 'none' : '0 10px 20px rgba(17, 26, 50, 0.16)',
        overflow: 'hidden'
      }}
    >
      <FontAwesomeIcon 
        icon={icon} 
        style={{ 
          fontSize: shape === 'rounded' ? 'min(64px, 40%)' : config.icon,
          width: shape === 'rounded' ? 'auto' : config.icon,
          height: shape === 'rounded' ? 'auto' : config.icon
        }} 
      />
    </div>
  );
};

export default AvatarDisplay;

