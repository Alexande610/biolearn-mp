import React from 'react';

/**
 * Optimized Galaxy Background Component
 * Renders 120 hardware-accelerated stars and subtle space glows.
 */
const STARS = Array.from({ length: 80 }).map((_, i) => ({
  id: i,
  size: Math.random() * 2 + 0.5,
  top: Math.random() * 100,
  left: Math.random() * 100,
  duration: Math.random() * 3 + 3,
  delay: Math.random() * 5,
}));

const GalaxyBackground = () => {
  const stars = STARS;

  return (
    <div className="fixed inset-0 z-0 galaxy-bg pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          }}
        />
      ))}
      {/* Deep Space Glowing Nebulae - Optimized (Static for lead performance) */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-600/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-blue-600/5 rounded-full blur-[100px]" />
    </div>
  );
};

export default GalaxyBackground;
