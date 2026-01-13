import React from 'react';

const VerticalDottedPath: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`
        w-1 h-20 
        mx-4 
        bg-repeat-y bg-[length:100%_12px]
        bg-gradient-to-t from-[#FFD700] to-[#FFD700]
        ${className}
      `}
      style={{
        backgroundImage: 'radial-gradient(circle, #FFD700 3px, transparent 4px)',
      }}
    />
  );
};

export default VerticalDottedPath;