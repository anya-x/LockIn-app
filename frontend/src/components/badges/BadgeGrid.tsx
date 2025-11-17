import React from 'react';
import { useBadges } from '../../hooks/useBadges';
import BadgeCard from './BadgeCard';

const BadgeGrid: React.FC = () => {
  const { data: badges, isLoading, error } = useBadges();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading badges: {error.message}
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 text-lg">🎯 No badges earned yet!</p>
        <p className="text-gray-500 mt-2">
          Complete tasks, focus sessions, and goals to earn badges
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
};

export default BadgeGrid;
