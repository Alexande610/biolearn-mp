import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, BookOpen, Star, Lock, Sprout, Leaf, TreePine, Flower2, Dna, Microscope, GraduationCap } from 'lucide-react';

const classes = [
  { 
    id: 6, 
    name: 'Lớp 6', 
    description: 'Tế bào & Đa dạng sinh vật',
    chapters: 3,
    lessons: 13,
    color: 'from-green-400 to-emerald-700',
    icon: <Sprout className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🌱'
  },
  { 
    id: 7, 
    name: 'Lớp 7', 
    description: 'Trao đổi chất & Sinh sản',
    chapters: 4,
    lessons: 16,
    color: 'from-cyan-400 to-blue-700',
    icon: <Leaf className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🍃'
  },
  { 
    id: 8, 
    name: 'Lớp 8', 
    description: 'Sinh học cơ thể người',
    chapters: 2,
    lessons: 13,
    color: 'from-orange-400 to-red-700',
    icon: <TreePine className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🦴'
  },
  { 
    id: 9, 
    name: 'Lớp 9', 
    description: 'Di truyền và tiến hóa',
    chapters: 4,
    lessons: 16,
    color: 'from-purple-400 to-indigo-700',
    icon: <Flower2 className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🧬'
  },
  { 
    id: 10, 
    name: 'Lớp 10', 
    description: 'Tế bào & Vi sinh vật',
    chapters: 8,
    lessons: 21,
    color: 'from-blue-500 to-indigo-900',
    icon: <Dna className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🔬'
  },
  { 
    id: 11, 
    name: 'Lớp 11', 
    description: 'Sinh lý học cơ thể',
    chapters: 4,
    lessons: 14,
    color: 'from-teal-400 to-emerald-800',
    icon: <Microscope className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🫀'
  },
  { 
    id: 12, 
    name: 'Lớp 12', 
    description: 'Di truyền học & Tiến hóa',
    chapters: 6,
    lessons: 22,
    color: 'from-rose-500 to-red-900',
    icon: <GraduationCap className="w-10 h-10 text-white" />,
    unlocked: true,
    emoji: '🐒'
  }
];

export default function ClassSelectPage() {
  const navigate = useNavigate();
  const { userStats } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0f1d]">
      {/* Header */}
      <header className="bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/home')}
              className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Chọn Lớp Học</h1>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest leading-none mt-1 opacity-70">Biological Explorations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((classItem) => {
            const progress = userStats?.classProgress?.[classItem.id] || 0;
            
            return (
              <button
                key={classItem.id}
                onClick={() => classItem.unlocked && navigate(`/map/${classItem.id}`)}
                disabled={!classItem.unlocked}
                className={`group relative h-48 rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-${classItem.color.split('-')[1]}/20 ${
                  !classItem.unlocked ? 'grayscale opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {/* Background Gradient & Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${classItem.color}`} />
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                
                {/* Float Emoji */}
                <span className="absolute top-4 right-6 text-7xl opacity-20 transform -rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-0 duration-700">
                  {classItem.emoji}
                </span>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-xl">
                       {classItem.icon}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white leading-tight tracking-tighter">{classItem.name}</h3>
                      <p className="text-white/80 text-xs font-bold leading-tight">{classItem.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Stats Icons */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-white/90 text-[10px] font-black uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />
                        {classItem.chapters} chương
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-white/90 text-[10px] font-black uppercase tracking-wider">
                        <Star className="w-3 h-3 text-yellow-400" />
                        {classItem.lessons} bài
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Progress</span>
                        <span className="text-white font-black text-sm">{progress}%</span>
                      </div>
                      <div className="h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
                        <div 
                          className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lock Overlay */}
                {!classItem.unlocked && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <Lock className="w-8 h-8 text-white/40" />
                    </div>
                    <span className="text-white/40 font-black text-xs uppercase tracking-widest mt-4">Locked</span>
                  </div>
                )}

                {/* Hover Glow */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 text-center">
          <BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-2" />
          <h3 className="text-white font-semibold mb-1">Chương trình Kết nối tri thức</h3>
          <p className="text-blue-200 text-sm">
            Nội dung bài học được biên soạn theo SGK Sinh học - Kết nối tri thức với cuộc sống
          </p>
        </div>
      </main>
    </div>
  );
}
