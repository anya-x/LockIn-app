import React from 'react';
import { useBadges } from '../../hooks/useBadges';

interface BadgeShowcaseProps {
  maxDisplay?: number;
}

const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ maxDisplay = 5 }) => {
  const { data: badges, isLoading } = useBadges();

  if (isLoading || !badges || badges.length === 0) {
    return null;
  }

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700">Badges:</span>
      <div className="flex items-center gap-1">
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className="relative group"
            title={`${badge.name}: ${badge.description}`}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-400 text-lg">
              {badge.icon}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {badge.name}
              </div>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeShowcase;
