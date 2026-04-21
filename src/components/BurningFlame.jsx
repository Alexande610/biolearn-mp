import React from 'react';

const BurningFlame = ({ size = 'md', active = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${active ? 'animate-pulse' : 'opacity-40 grayscale'}`}>
      {/* Container cho ngọn lửa */}
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        {/* Lớp lửa cốt lõi */}
        <div className={`
          relative w-1/2 h-4/5 rounded-full bg-gradient-to-t from-orange-600 via-orange-400 to-transparent
          ${active ? 'animate-flame-main' : ''}
        `}>
          {/* Lớp lửa sáng ở giữa */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 rounded-full bg-gradient-to-t from-yellow-400 to-transparent opacity-80 mix-blend-screen" />
          
          {/* Tia lửa nhỏ bay lên */}
          {active && (
            <>
              <div className="absolute -top-4 left-1/4 w-2 h-2 rounded-full bg-orange-400 animate-spark-1" />
              <div className="absolute -top-6 left-1/2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-spark-2" />
              <div className="absolute -top-3 right-1/4 w-2 h-2 rounded-full bg-red-400 animate-spark-3" />
            </>
          )}
        </div>
      </div>

      {/* Hiệu ứng hào quang nhiệt */}
      {active && (
        <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-heat-glow" />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flame-main {
          0%, 100% { transform: scaleY(1) skewX(0deg); }
          25% { transform: scaleY(1.1) skewX(-2deg); }
          50% { transform: scaleY(0.9) skewX(3deg); }
          75% { transform: scaleY(1.05) skewX(-1deg); }
        }
        @keyframes spark-1 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0); opacity: 0; }
        }
        @keyframes spark-2 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-60px) scale(0); opacity: 0; }
        }
        @keyframes spark-3 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-35px) scale(0); opacity: 0; }
        }
        @keyframes heat-glow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
        .animate-flame-main { animation: flame-main 0.6s infinite ease-in-out; }
        .animate-spark-1 { animation: spark-1 0.8s infinite ease-in-out; }
        .animate-spark-2 { animation: spark-2 1.2s infinite ease-in-out; }
        .animate-spark-3 { animation: spark-3 0.7s infinite ease-in-out; }
        .animate-heat-glow { animation: heat-glow 2s infinite ease-in-out; }
      `}} />
    </div>
  );
};

export default BurningFlame;
