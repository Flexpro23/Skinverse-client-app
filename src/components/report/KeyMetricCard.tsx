import React from 'react';

interface KeyMetricCardProps {
  title: string;
  score: number;
  level: string;
}

const KeyMetricCard: React.FC<KeyMetricCardProps> = ({ title, score, level }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <p className="text-lg font-semibold text-midnight-blue">{title}</p>
      <p className="text-5xl font-bold text-bronze my-2">
        {score}
        <span className="text-3xl text-gray-400">/100</span>
      </p>
      <p className="text-md text-gray-500">{level}</p>
    </div>
  );
};

export default KeyMetricCard;
