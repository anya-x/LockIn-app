import React from 'react';
import { Badge } from '../../hooks/useBadges';

interface BadgeCardProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-24 h-24 text-4xl',
    large: 'w-32 h-32 text-5xl',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400`}
      >
        <span className="filter drop-shadow-md">{badge.icon}</span>
      </div>
      <div className="text-center">
        <p className={`font-semibold text-gray-800 ${textSizeClasses[size]}`}>
          {badge.name}
        </p>
        <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          Earned {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default BadgeCard;
