import React from 'react';

// 1. Define a type for the component's props to accept an optional className
type DottedPathProps = {
  className?: string;
};

// 2. Use the props type in the component's signature
const DottedPath: React.FC<DottedPathProps> = ({ className = '' }) => {
  return (
    <div
      // 3. Use a template literal to combine the default classes with the passed-in className
      className={`
        w-20 h-1 
        mx-2 
        bg-repeat-x bg-[length:12px_100%]
        bg-gradient-to-r from-[#FFD700] to-[#FFD700]
        ${className} 
      `}
      style={{
        backgroundImage: 'radial-gradient(circle, #FFD700 3px, transparent 4px)',
      }}
    />
  );
};

export default DottedPath;