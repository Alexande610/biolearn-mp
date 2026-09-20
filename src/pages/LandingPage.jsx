import { getAvatarUrl as resolveAvatarUrl } from '../utils/avatar';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Info, Phone, LogIn, ChevronRight,
  GraduationCap, Users, Mail, MapPin,
  Trophy, BookOpen, Star, Sparkles, User, LogOut, ChevronDown, UserCircle, Gamepad2,
  Compass, Moon, Sun, Heart, Clock, MessageCircle, Headphones
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GalaxyBackground from '../components/GalaxyBackground';

// --- Components ---

const FacebookIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M14 8.5V7c0-.8.5-1 1-1h2V2.1A26 26 0 0 0 14.1 2C11.2 2 9 3.8 9 7.2v1.3H6V13h3v9h4.5v-9h3.1l.5-4.5H14Z" /></svg>
);

const YouTubeIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" /></svg>
);

// --- Components ---

export const LandingHeader = () => {
  const { user, userStats, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Avatar mapping - copied from HomePage for consistency


  const getAvatarUrl = () => resolveAvatarUrl(user?.avatar_url || user?.avatar || userStats?.avatar_url);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const openProtectedPage = (path) => {
    navigate(user ? path : '/login');
  };

  const navItems = [
    { label: 'Trang chủ', icon: Home, action: () => {
      if (user) navigate('/home');
      else if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
      else navigate('/');
    } },
    { label: 'Trạm sinh học', icon: Compass, action: () => openProtectedPage('/stations') },
    { label: 'Xếp hạng', icon: Trophy, action: () => openProtectedPage('/leaderboard') },
    { label: 'Bài học', icon: BookOpen, action: () => openProtectedPage('/more') },
    { label: 'Giới thiệu', icon: Info, action: () => navigate('/#intro') },
    { label: 'Liên hệ', icon: Phone, action: () => navigate('/#contact') }
  ];

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
        <nav className="hidden lg:flex items-center gap-5">
          {navItems.map(item => {
            const Icon = item.icon;
            return <a key={item.label} href="#" onClick={event => { event.preventDefault(); item.action(); }} className="landing-nav-link hover-text-gradient"><Icon className="w-4 h-4" />{item.label}</a>;
          })}
        </nav>

        {/* Auth Section */}
        <div className="relative">
          <div className="flex items-center gap-2">
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
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all group"
                    >
                      {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" /> : <Sun className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />}
                      <span className="font-semibold">{theme === 'light' ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}</span>
                    </button>

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

const CONTACT_ADDRESS = '3F Nguyễn Hữu Thọ, Tân Hưng, Hồ Chí Minh, Việt Nam';
const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/pc1dZgD3VhodyG778';

const LandingContact = () => (
  <section id="contact" className="landing-contact-section px-6 sm:px-10 relative scroll-mt-[90px]">
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-4xl sm:text-5xl font-black text-white">Liên hệ với chúng tôi</h2>
        <p className="text-base text-white/50 mt-3">BioLearn luôn sẵn sàng hỗ trợ quá trình học tập và giảng dạy của bạn.</p>
      </div>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="grid gap-4">
          <a href="mailto:supportbiolearn@gmail.com" className="contact-liquid-card group">
            <span className="contact-icon"><Mail className="w-6 h-6" /></span><span><strong>Email hỗ trợ</strong><small>supportbiolearn@gmail.com</small></span>
          </a>
          <a href="tel:+84838667369" className="contact-liquid-card group">
            <span className="contact-icon"><Phone className="w-6 h-6" /></span><span><strong>Điện thoại</strong><small>(+84) 83 8667 369</small></span>
          </a>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="contact-liquid-card group">
            <span className="contact-icon"><MapPin className="w-6 h-6" /></span><span className="flex-1"><strong>Địa chỉ</strong><small>{CONTACT_ADDRESS}</small></span>
          </a>
        </div>
        <div className="support-liquid-card">
          <div className="relative z-10">
            <span className="support-main-icon"><Headphones className="w-8 h-8" /></span>
            <h3 className="text-2xl font-black text-white mt-4">Trung tâm hỗ trợ BioLearn</h3>
            <p className="text-white/55 mt-2 max-w-xl">Gửi câu hỏi về tài khoản, tiến trình học tập hoặc các chức năng trên hệ thống. Đội ngũ BioLearn sẽ tiếp nhận và phản hồi sớm nhất.</p>
            <div className="support-highlights">
              <span><Clock className="w-5 h-5" /><span><strong>Thời gian phản hồi</strong><small>Trong vòng 24 giờ</small></span></span>
              <span><MessageCircle className="w-5 h-5" /><span><strong>Kênh hỗ trợ</strong><small>Email và điện thoại</small></span></span>
            </div>
            <a href="mailto:supportbiolearn@gmail.com" className="support-action">Gửi yêu cầu hỗ trợ</a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const LandingFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  return (
    <footer className="relative pt-8">
      {/* Footer Content - Made transparent to show galaxy */}
      <div className="w-full px-6 sm:px-12 py-10 bg-white/5 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Logo & Slogan - Fixed alignment */}
            <div className="space-y-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center gap-4">
                <img src="/images/Logo.png" alt="Logo" className="h-12 w-auto" />
                <span className="text-xl font-black text-gradient-moving tracking-widest uppercase">BIOLEARN</span>
              </div>
              <p className="text-white/40 leading-relaxed font-medium text-base max-w-sm">
                Kiến tạo tương lai Sinh học Việt Nam thông qua công nghệ và sự sáng tạo.
                Cùng nhau học tập, cùng nhau khám phá.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://www.facebook.com/niieinstitute2009" target="_blank" rel="noopener noreferrer" className="social-liquid-button social-facebook" aria-label="Facebook của BioLearn"><FacebookIcon className="w-6 h-6" /></a>
                <a href="https://www.youtube.com/@LearnBio-2026" target="_blank" rel="noopener noreferrer" className="social-liquid-button social-youtube" aria-label="YouTube của BioLearn"><YouTubeIcon className="w-6 h-6" /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-white font-black text-lg mb-5 uppercase tracking-widest text-gradient-moving">Liên kết</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (user) navigate('/home');
                      else if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
                      else navigate('/');
                    }}
                    className="text-white/40 hover:text-purple-400 transition-all font-bold text-base cursor-pointer block"
                  >
                    Trang chủ
                  </a>
                </li>
                <li><Link to="/#intro" className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Giới thiệu</Link></li>
                <li><Link to={user ? '/stations' : '/login'} className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Trạm sinh học</Link></li>
                <li><Link to={user ? '/leaderboard' : '/login'} className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Xếp hạng</Link></li>
                <li><Link to={user ? '/more' : '/login'} className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Bài học</Link></li>
                <li><Link to={user ? '/battle' : '/login'} className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Đấu trường</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-white font-black text-lg mb-5 uppercase tracking-widest text-gradient-moving">Hỗ trợ</h4>
              <ul className="space-y-3">
                <li><Link to="/guide" className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Hướng dẫn sử dụng</Link></li>
                <li><Link to="/faq" className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Câu hỏi thường gặp</Link></li>
                <li><Link to="/privacy" className="text-white/40 hover:text-purple-400 transition-all font-bold text-base">Chính sách bảo mật</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-white font-black text-lg mb-5 uppercase tracking-widest text-gradient-moving">Liên hệ</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-5 group justify-center lg:justify-start">
                  <Mail className="w-7 h-7 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-white/40 font-bold text-base">supportbiolearn@gmail.com</span>
                </li>
                <li className="flex items-center gap-5 group justify-center lg:justify-start">
                  <Phone className="w-7 h-7 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-white/40 font-bold text-base">(+84) 83 8667 369</span>
                </li>
                <li className="flex items-start gap-5 group justify-center lg:justify-start text-left">
                  <MapPin className="w-7 h-7 text-purple-500 shrink-0 group-hover:scale-110 transition-transform mt-1" />
                  <span className="text-white/40 font-bold text-base leading-snug">3F Nguyễn Hữu Thọ, Tân Hưng, <br /> Hồ Chí Minh, Việt Nam</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="landing-copyright border-t mt-8 pt-6 text-center text-xs font-black uppercase tracking-[0.18em] flex flex-wrap items-center justify-center gap-2">
            <span>@2026 BIOLEARN. HOANG SA TRUONG SA LA CUA VIET NAM</span><Heart className="w-4 h-4 fill-rose-500 text-rose-500" aria-label="Trái tim" /><span>. ALL RIGHT RESERVED.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    const targetId = location.hash.replace('#', '');
    const frame = window.requestAnimationFrame(() => {
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return (
    <div className="landing-page min-h-screen overflow-x-hidden selection:bg-purple-500/30 selection:text-white relative">
      <GalaxyBackground />
      <LandingHeader />
      <main className="relative z-10 h-auto">
        <LandingHero />
        <LandingMission />
        <LandingRoadmap />
        <LandingSimulation />
        <LandingContact />
        <LandingFooter />
      </main>
    </div>
  );
}
