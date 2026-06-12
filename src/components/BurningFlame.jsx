import React from 'react';
import { Flame } from 'lucide-react';

const BurningFlame = ({ size = 'md', active = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Background Heat Glow Layer */}
      {active && (
        <div className="absolute inset-0 rounded-full bg-orange-600/30 blur-xl animate-heat-glow scale-125" />
      )}

      {/* Flame Shapes (Stacked for realistic glow/depth) */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Layer 1: Outer Orange Glow (Blurred) */}
        {active && (
          <Flame 
            className="absolute text-red-600 opacity-70 blur-[4px] animate-flicker-slow w-full h-full"
            fill="currentColor"
          />
        )}

        {/* Layer 2: Middle Vibrant Orange/Yellow */}
        {active ? (
          <Flame 
            className="absolute text-orange-500 blur-[1px] animate-flicker-medium w-[90%] h-[90%]"
            fill="currentColor"
          />
        ) : (
          <Flame 
            className="absolute text-orange-950/40 w-[90%] h-[90%] stroke-[1.5]"
          />
        )}

        {/* Layer 3: Inner Bright Core */}
        {active && (
          <Flame 
            className="absolute text-yellow-300 animate-flicker-fast w-[75%] h-[75%]"
            fill="currentColor"
          />
        )}

        {/* Layer 4: Hot White Center Spot */}
        {active && (
          <Flame 
            className="absolute text-white animate-pulse w-[45%] h-[45%] opacity-90"
            fill="currentColor"
          />
        )}
      </div>

      {/* Spark particles floating upwards */}
      {active && (
        <div className="absolute inset-x-0 -top-8 h-8 overflow-visible pointer-events-none">
          <div className="absolute left-[30%] w-1.5 h-1.5 rounded-full bg-orange-400 animate-spark-1" />
          <div className="absolute left-[50%] w-1 h-1 rounded-full bg-yellow-300 animate-spark-2" />
          <div className="absolute left-[70%] w-1.5 h-1.5 rounded-full bg-red-400 animate-spark-3" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flicker-slow {
          0%, 100% { transform: scale(1) rotate(0deg) skewX(0deg); filter: brightness(1) blur(4px); }
          50% { transform: scale(1.06) rotate(-1deg) skewX(-2deg); filter: brightness(1.2) blur(3px); }
        }
        @keyframes flicker-medium {
          0%, 100% { transform: scale(1) rotate(0deg) skewX(0deg); }
          25% { transform: scale(0.97) rotate(1.5deg) skewX(2deg); }
          50% { transform: scale(1.03) rotate(-1deg) skewX(-1deg); }
          75% { transform: scale(0.98) rotate(1deg) skewX(1deg); }
        }
        @keyframes flicker-fast {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-1px, 1px); }
          66% { transform: scale(0.95) translate(1px, -1px); }
        }
        @keyframes spark-1 {
          0% { transform: translateY(15px) translateX(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) translateX(-8px) scale(0); opacity: 0; }
        }
        @keyframes spark-2 {
          0% { transform: translateY(15px) translateX(0) scale(1); opacity: 1; }
          100% { transform: translateY(-45px) translateX(5px) scale(0); opacity: 0; }
        }
        @keyframes spark-3 {
          0% { transform: translateY(15px) translateX(0) scale(1); opacity: 1; }
          100% { transform: translateY(-25px) translateX(-4px) scale(0); opacity: 0; }
        }
        @keyframes heat-glow {
          0%, 100% { transform: scale(1.15); opacity: 0.25; }
          50% { transform: scale(1.35); opacity: 0.45; }
        }
        .animate-flicker-slow { animation: flicker-slow 1.4s infinite ease-in-out; }
        .animate-flicker-medium { animation: flicker-medium 0.8s infinite ease-in-out; }
        .animate-flicker-fast { animation: flicker-fast 0.25s infinite linear; }
        .animate-spark-1 { animation: spark-1 0.9s infinite ease-in-out; }
        .animate-spark-2 { animation: spark-2 1.4s infinite ease-in-out; }
        .animate-spark-3 { animation: spark-3 0.7s infinite ease-in-out; }
        .animate-heat-glow { animation: heat-glow 2.2s infinite ease-in-out; }
      `}} />
    </div>
  );
};

export default BurningFlame;
