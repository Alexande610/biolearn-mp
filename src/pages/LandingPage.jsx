import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Info, Phone, LogIn, ChevronRight,
  GraduationCap, Users, Mail, MapPin,
  Trophy, BookOpen, Star, Sparkles, User, LogOut, ChevronDown, UserCircle, Gamepad2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GalaxyBackground from '../components/GalaxyBackground';

// --- Components ---

// --- Components ---

const LandingHeader = () => {
  const { user, userStats, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Avatar mapping - copied from HomePage for consistency
  const avatarMap = {
    'adventurer-1': '/images/Avatar/adventurer-1.png',
    'adventurer-2': '/images/Avatar/adventurer-2.png',
    'adventurer-3': '/images/Avatar/adventurer-3.png',
    'adventurer-4': '/images/Avatar/adventurer-4.png',
    'adventurer-5': '/images/Avatar/adventurer-5.png',
    'avataaars-1': '/images/Avatar/avataaars-1.png',
    'avataaars-2': '/images/Avatar/avataaars-2.png',
    'avataaars-3': '/images/Avatar/avataaars-3.png',
    'avataaars-4': '/images/Avatar/avataaars-4.png',
    'avataaars-5': '/images/Avatar/avataaars-5.png',
    'bigEars-1': '/images/Avatar/bigEars-1.png',
    'bigEars-2': '/images/Avatar/bigEars-2.png',
    'bigEars-3': '/images/Avatar/bigEars-3.png',
    'bigEars-4': '/images/Avatar/bigEars-4.png',
    'bigEars-5': '/images/Avatar/bigEars-5.png',
    'bottts-1': '/images/Avatar/bottts-1.png',
    'bottts-2': '/images/Avatar/bottts-2.png',
    'bottts-3': '/images/Avatar/bottts-3.png',
    'bottts-4': '/images/Avatar/bottts-4.png',
    'bottts-5': '/images/Avatar/bottts-5.png',
    'rings-1': '/images/Avatar/rings-1.png',
    'rings-2': '/images/Avatar/rings-2.png',
    'rings-3': '/images/Avatar/rings-3.png',
    'rings-4': '/images/Avatar/rings-4.png',
    'rings-5': '/images/Avatar/rings-5.png',
    'rings-6': '/images/Avatar/rings-6.png',
  };

  const getAvatarUrl = () => {
    const avatar = user?.avatar_url || user?.avatar || userStats?.avatar_url;
    if (!avatar) return avatarMap['adventurer-1'];
    if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar;
    return avatarMap[avatar] || avatarMap['adventurer-1'];
  };

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-[90px] px-6 sm:px-10 flex items-center justify-between relative">
        {/* Logo - Standardized h-28 */}
        <div className="flex items-center -ml-4">
          <Link to="/">
            <img
              src="/images/Logo.png"
              alt="BioLearn Logo"
              className="logo-standard"
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              user ? navigate('/home') : window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-white/90 hover-text-gradient font-medium transition-all flex items-center gap-2 cursor-pointer group"
          >
            <Home className="w-5 h-5 group-hover:text-purple-400 transition-colors" /> Trang chủ
          </a>
          <a href="#intro" className="text-white/90 hover-text-gradient font-medium transition-all flex items-center gap-2 group">
            <Info className="w-5 h-5 group-hover:text-purple-400 transition-colors" /> Giới thiệu
          </a>
          <a href="#contact" className="text-white/90 hover-text-gradient font-medium transition-all flex items-center gap-2 group">
            <Phone className="w-5 h-5 group-hover:text-purple-400 transition-colors" /> Liên hệ
          </a>
        </nav>

        {/* Auth Section */}
        <div className="relative">
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 glass p-1 rounded-full hover:bg-white/10 transition-all border border-white/10 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/50">
                  <img
                    src={getAvatarUrl()}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/images/Avatar/adventurer-1.png'; }}
                  />
                </div>
                <div className="text-left hidden sm:block pr-2">
                  <p className="text-white text-xs font-bold truncate max-w-[100px]">
                    {user?.displayName || user?.username || 'Hành giả'}
                  </p>
                  <p className="text-purple-400 text-[9px] font-bold uppercase tracking-wider">Học sinh</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-white/50 transition-transform duration-300 mr-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Liquid Glass Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute top-full right-0 mt-3 w-64 glass-dropdown rounded-2xl p-2 animate-bounce-in">
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Tài khoản của tôi</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <UserCircle className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10 group-hover:text-white" />
                      <span className="font-semibold relative z-10 group-hover:text-white">Hồ sơ cá nhân</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-red-500/80 transition-all group mt-1"
                    >
                      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform text-red-400 group-hover:text-white" />
                      <span className="font-semibold">Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl btn-liquid-glass text-white font-bold flex items-center gap-2 group text-sm"
            >
              <LogIn className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const LandingHero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <section id="home" className="relative pt-40 sm:pt-48 pb-20 px-6 sm:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div className="z-10 text-center lg:text-left space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full badge-liquid-glass group">
            <Gamepad2 className="w-5 h-5 text-gradient-moving" />
            <span className="text-gradient-moving text-xs font-black uppercase tracking-[0.2em]">
              Học mà chơi - Chơi mà học
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="hero-title-balanced text-white">
              Khám phá trò chơi
            </h1>
            <h1 className="hero-title-balanced text-white flex items-center justify-center lg:justify-start gap-4 flex-wrap">
              và học tập
              <span className="inline-flex items-center gap-3">
                <span className="text-gradient-moving animate-twinkle px-2">thú vị</span>
                <Sparkles className="w-10 h-10 text-gradient-moving animate-twinkle" />
              </span>
            </h1>
            <h1 className="hero-title-balanced text-white">
              cùng BioLearn
            </h1>
          </div>

          <p className="text-base text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Nền tảng giáo dục tương tác hàng đầu dành cho học sinh đam mê Sinh học.
            Biến mọi bài học thành một cuộc phiêu lưu kỳ thú.
          </p>

          <div className="flex justify-center lg:justify-start pt-2">
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-2xl btn-liquid-glass text-white font-black text-lg flex items-center justify-center gap-4 btn-pop group"
            >
              Khám phá <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="relative z-10 flex justify-center lg:justify-end">
          <div className="sparkle-border-container max-w-xl group">
            <div className="sparkle-border-content">
              <div className="absolute inset-x-0 -bottom-10 h-2/3 bg-gradient-to-t from-purple-500/20 to-transparent blur-3xl opacity-40" />
              <img
                src="/images/BIOGOD.png"
                alt="BioLearn Hero"
                className="relative rounded-[3rem] w-full h-auto hero-image-zoom cursor-pointer shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingRoadmap = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 px-6 sm:px-10 relative bg-transparent">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Image Left */}
          <div className="order-2 lg:order-1 relative group flex justify-center">
            <div className="sparkle-border-container w-full max-w-[320px] lg:max-w-[420px]">
              <div className="sparkle-border-content">
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                <img
                  src="/images/LoTrinh.png"
                  alt="Biology Roadmap"
                  className="relative w-full image-square-premium hero-image-zoom cursor-pointer"
                />
              </div>
            </div>
          </div>
          {/* Content Right */}
          <div className="order-1 lg:order-2 space-y-10 text-center lg:text-left">
            <div className="w-24 h-1.5 bg-gradient-purple rounded-full mx-auto lg:mx-0" />
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight">
              Lộ trình học tập <br />
              <span className="text-gradient-moving">Sinh học phổ thông</span>
            </h2>
            <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
              Kiến thức Sinh học được chuẩn hóa từ dự án giáo dục hiện đại.
              Mỗi chặng đường là một trải nghiệm mới với đầy đủ lý thuyết, bài tập và kho tàng kiến thức sống động.
            </p>
            <button
              onClick={() => navigate('/more')}
              className="px-12 py-5 rounded-2xl btn-liquid-glass text-white font-black text-xl flex items-center justify-center gap-4 btn-pop group mx-auto lg:mx-0"
            >
              Lớp học <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingSimulation = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 px-6 sm:px-10 relative bg-transparent">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Content Left */}
          <div className="space-y-10 text-center lg:text-left">
            <div className="w-24 h-1.5 bg-gradient-purple rounded-full mx-auto lg:mx-0" />
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight">
              Mô phỏng 3D <br />
              <span className="text-gradient-moving">Tương tác Sống động</span>
            </h2>
            <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
              Khám phá thế giới vi quan và vĩ quan qua nền tảng mô phỏng 3D độc quyền.
              Trải nghiệm thực tế ảo ngay trên trình duyệt, giúp nắm vững cơ chế sinh học phức tạp nhất.
            </p>
            <button
              onClick={() => navigate('/simulations')}
              className="px-12 py-5 rounded-2xl btn-liquid-glass text-white font-black text-xl flex items-center justify-center gap-4 btn-pop group mx-auto lg:mx-0"
            >
              Mô phỏng <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
          {/* Image Right */}
          <div className="relative group flex justify-center">
            <div className="sparkle-border-container w-full max-w-[320px] lg:max-w-[420px]">
              <div className="sparkle-border-content">
                <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                <img
                  src="/images/MoPhong.png"
                  alt="Biology Simulation"
                  className="relative w-full image-square-premium hero-image-zoom cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingMission = () => {
  const [activeTab, setActiveTab] = useState('student');

  const missions = {
    student: [
      {
        title: "Học tập sống động",
        desc: "Học thông qua các bài giảng 3D và trò chơi tương tác đầy màu sắc.",
        icon: BookOpen,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
      },
      {
        title: "Cạnh tranh lành mạnh",
        desc: "Tham gia giải đấu PvP và leo bảng xếp hạng cùng bạn bè trên toàn quốc.",
        icon: Trophy,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10"
      },
      {
        title: "Phòng thí nghiệm ảo",
        desc: "Thực hành thí nghiệm sinh học ngay trên trình duyệt mà không cần dụng cụ thật.",
        icon: Sparkles,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
      },
      {
        title: "Lộ trình cá nhân",
        desc: "Hệ thống tự động đề xuất bài học dựa trên năng lực và sở thích của bạn.",
        icon: GraduationCap,
        color: "text-green-400",
        bg: "bg-green-400/10"
      },
    ],
    teacher: [
      {
        title: "Quản lý lớp học",
        desc: "Theo dõi tiến độ học tập và điểm số của từng học sinh một cách trực quan.",
        icon: Users,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10"
      },
      {
        title: "Thư viện bài giảng",
        desc: "Tiếp cận kho tài liệu sinh học phong phú và công cụ tạo bài giảng tương tác.",
        icon: BookOpen,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
      },
      {
        title: "Phòng Quiz trực tuyến",
        desc: "Tổ chức các buổi kiểm tra nhanh với hiệu ứng gamification sinh động.",
        icon: Trophy,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
      },
      {
        title: "Báo cáo phân tích",
        desc: "Nhận báo cáo chi tiết về lỗ hổng kiến thức của lớp để có phương án hỗ trợ.",
        icon: Info,
        color: "text-rose-400",
        bg: "bg-rose-400/10"
      },
    ]
  };

  return (
    <section id="intro" className="pt-48 pb-60 px-6 sm:px-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 uppercase tracking-tighter">Sứ mệnh của BioLearn</h2>
          <p className="text-lg text-white/50 max-w-3xl mx-auto font-medium">
            BioLearn sinh ra để đem lại một môi trường học tập Sinh học hiện đại,
            kết hợp giữa kiến thức chuyên sâu và trải nghiệm giải trí hấp dẫn.
          </p>
        </div>

        {/* Tabs Sliding Switcher - Upgraded to Liquid Glass */}
        <div className="flex justify-center mb-20">
          <div className="tab-liquid-glass p-1.5 rounded-full flex gap-1 relative overflow-hidden w-full max-w-[360px]">
            {/* Sliding Indicator */}
            <div
              className="tab-active-blob-liquid"
              style={{
                width: 'calc(50% - 6px)',
                left: activeTab === 'student' ? '4px' : 'calc(50% + 2px)',
              }}
            />

            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 relative z-10 ${activeTab === 'student' ? 'text-white' : 'text-white/40 hover:text-white'}`}
            >
              Học sinh
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 relative z-10 ${activeTab === 'teacher' ? 'text-white' : 'text-white/40 hover:text-white'}`}
            >
              Giáo viên
            </button>
          </div>
        </div>

        {/* Content Grid - 4 cards upgraded to Liquid Glass */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {missions[activeTab].map((item, idx) => (
            <div key={idx} className="card-liquid-glass p-10 rounded-[3rem] group card-shine-effect relative overflow-hidden">
              <div className={`w-20 h-20 ${item.bg} rounded-[2rem] flex items-center justify-center mb-10 transition-all group-hover:scale-110 group-hover:rotate-12 shadow-2xl`}>
                <item.icon className={`w-10 h-10 ${item.color}`} />
              </div>
              <h3 className="text-2xl font-black text-white mb-6 leading-tight">{item.title}</h3>
              <p className="text-white/50 leading-relaxed font-medium text-lg">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LandingFooter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <footer id="contact" className="relative pt-20">
      {/* Footer Content - Made transparent to show galaxy */}
      <div className="w-full px-6 sm:px-16 py-20 bg-white/5 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Logo & Slogan - Fixed alignment */}
            <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center gap-4">
                <img src="/images/Logo.png" alt="Logo" className="h-16 w-auto" />
                <span className="text-2xl font-black text-gradient-moving tracking-widest uppercase">BIOLEARN</span>
              </div>
              <p className="text-white/30 leading-relaxed font-medium text-lg max-w-sm">
                Kiến tạo tương lai Sinh học Việt Nam thông qua công nghệ và sự sáng tạo.
                Cùng nhau học tập, cùng nhau khám phá.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-white font-black text-2xl mb-10 uppercase tracking-widest text-gradient-moving">Liên kết</h4>
              <ul className="space-y-6">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      user ? navigate('/home') : window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl cursor-pointer block"
                  >
                    Trang chủ
                  </a>
                </li>
                <li><a href="#intro" className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl">Giới thiệu</a></li>
                <li><Link to="/leaderboard" className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl">Xếp hạng</Link></li>
                <li><Link to="/login" className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl">Tham gia ngay</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-white font-black text-2xl mb-10 uppercase tracking-widest text-gradient-moving">Tài liệu</h4>
              <ul className="space-y-6">
                <li><a href="#" className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="text-white/40 hover:text-purple-400 transition-all font-bold text-xl">Chính sách bảo mật</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-white font-black text-2xl mb-10 uppercase tracking-widest text-gradient-moving">Liên hệ</h4>
              <ul className="space-y-8">
                <li className="flex items-center gap-5 group justify-center lg:justify-start">
                  <Mail className="w-7 h-7 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-white/40 font-bold text-lg">supportbiolearn@gmail.com</span>
                </li>
                <li className="flex items-center gap-5 group justify-center lg:justify-start">
                  <Phone className="w-7 h-7 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-white/40 font-bold text-lg">0838667369</span>
                </li>
                <li className="flex items-start gap-5 group justify-center lg:justify-start text-left">
                  <MapPin className="w-7 h-7 text-purple-500 shrink-0 group-hover:scale-110 transition-transform mt-1" />
                  <span className="text-white/40 font-bold text-lg leading-snug">3F Nguyễn Hữu Thọ, Tân Hưng, <br /> Hồ Chí Minh, Vietnam</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-24 pt-12 text-center text-white/10 text-sm font-black uppercase tracking-[0.3em]">
            © 2026 BioLearn Platform. All rights reserved. Made with ❤️ in Vietnam.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden selection:bg-purple-500/30 selection:text-white relative">
      <GalaxyBackground />
      <LandingHeader />
      <main className="relative z-10 h-auto">
        <LandingHero />
        <LandingMission />
        <LandingRoadmap />
        <LandingSimulation />
        <LandingFooter />
      </main>
    </div>
  );
}
