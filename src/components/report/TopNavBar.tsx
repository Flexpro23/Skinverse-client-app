import React from 'react';
import { motion } from 'framer-motion';

interface TopNavBarProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex flex-wrap space-x-1 sm:space-x-2 p-1 bg-white rounded-full max-w-full overflow-x-auto shadow-md">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-colors duration-300 whitespace-nowrap flex-shrink-0
              ${activeTab === tab ? 'text-white' : 'text-medium-grey hover:text-midnight-blue'}
            `}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-bronze rounded-full"
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.3 
                }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopNavBar;
