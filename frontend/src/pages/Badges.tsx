import React from 'react';
import { useBadges, useCheckBadges } from '../hooks/useBadges';
import BadgeGrid from '../components/badges/BadgeGrid';

const Badges: React.FC = () => {
  const { data: badges } = useBadges();
  const checkBadges = useCheckBadges();

  const handleCheckBadges = () => {
    checkBadges.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🏆 Achievement Badges
            </h1>
            <p className="text-gray-600 mt-2">
              Earn badges by completing tasks, staying consistent, and achieving goals!
            </p>
          </div>
          <button
            onClick={handleCheckBadges}
            disabled={checkBadges.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {checkBadges.isPending ? 'Checking...' : 'Check for New Badges'}
          </button>
        </div>

        {/* Badge Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">
              {badges?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">
              {badges ? Math.round((badges.length / 12) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Collection Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">
              {badges ? 12 - badges.length : 12}
            </div>
            <div className="text-sm text-gray-600">To Unlock</div>
          </div>
        </div>
      </div>

      {/* Badge Categories */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ⭐ Easy Badges (Quick Wins)
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Perfect for getting started! Complete these to build momentum.
          </p>
          <BadgeGrid />
        </div>
      </div>

      {/* Badge Legend */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📋 All Available Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👣</span>
              <span className="font-medium">First Steps</span>
            </div>
            <p className="text-sm text-gray-600">Complete your first task</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💪</span>
              <span className="font-medium">Task Terminator</span>
            </div>
            <p className="text-sm text-gray-600">Complete 100 total tasks</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍅</span>
              <span className="font-medium">100 Pomodoros</span>
            </div>
            <p className="text-sm text-gray-600">Complete 100 pomodoro sessions</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚔️</span>
              <span className="font-medium">Week Warrior</span>
            </div>
            <p className="text-sm text-gray-600">7 consecutive productive days</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧠</span>
              <span className="font-medium">Deep Work Master</span>
            </div>
            <p className="text-sm text-gray-600">4+ hours focus/day for a week</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌊</span>
              <span className="font-medium">Flow State</span>
            </div>
            <p className="text-sm text-gray-600">Achieve 5+ hours focus in one day</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💥</span>
              <span className="font-medium">Goal Crusher</span>
            </div>
            <p className="text-sm text-gray-600">Complete 10 goals</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌅</span>
              <span className="font-medium">Early Bird</span>
            </div>
            <p className="text-sm text-gray-600">Start work before 8 AM for 7 days</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧘</span>
              <span className="font-medium">Zen Mode</span>
            </div>
            <p className="text-sm text-gray-600">Low burnout risk for a month</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏃</span>
              <span className="font-medium">Month Marathoner</span>
            </div>
            <p className="text-sm text-gray-600">30 consecutive productive days</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍅🍅</span>
              <span className="font-medium">500 Pomodoros</span>
            </div>
            <p className="text-sm text-gray-600">Complete 500 pomodoro sessions</p>
          </div>
          <div className="bg-white rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌱</span>
              <span className="font-medium">Sustainable Pace</span>
            </div>
            <p className="text-sm text-gray-600">5-6 hours daily for 2 weeks</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Badges;
