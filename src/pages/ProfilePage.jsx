import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, User, Star, Coins, Trophy, Leaf,
  Lock, Check, Settings, Camera, BookOpen, Edit2, Save, X,
  Volume2, VolumeX
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

// Available avatars từ folder /images/Avatar/ - sử dụng tên file đơn giản
// Nhóm theo style để dễ quản lý
const avatarImages = [
  // Adventurer style - miễn phí (5 đầu tiên)
  { id: 'adventurer-1', src: '/images/Avatar/adventurer-1.png', name: 'Nhà phiêu lưu 1', cost: 0 },
  { id: 'adventurer-2', src: '/images/Avatar/adventurer-2.png', name: 'Nhà phiêu lưu 2', cost: 0 },
  { id: 'adventurer-3', src: '/images/Avatar/adventurer-3.png', name: 'Nhà phiêu lưu 3', cost: 0 },
  { id: 'adventurer-4', src: '/images/Avatar/adventurer-4.png', name: 'Nhà phiêu lưu 4', cost: 0 },
  { id: 'adventurer-5', src: '/images/Avatar/adventurer-5.png', name: 'Nhà phiêu lưu 5', cost: 0 },
  // Avataaars style - 200 xu
  { id: 'avataaars-1', src: '/images/Avatar/avataaars-1.png', name: 'Người 1', cost: 200 },
  { id: 'avataaars-2', src: '/images/Avatar/avataaars-2.png', name: 'Người 2', cost: 200 },
  { id: 'avataaars-3', src: '/images/Avatar/avataaars-3.png', name: 'Người 3', cost: 200 },
  { id: 'avataaars-4', src: '/images/Avatar/avataaars-4.png', name: 'Người 4', cost: 200 },
  { id: 'avataaars-5', src: '/images/Avatar/avataaars-5.png', name: 'Người 5', cost: 200 },
  // BigEars style - 200 xu
  { id: 'bigEars-1', src: '/images/Avatar/bigEars-1.png', name: 'Tai to 1', cost: 200 },
  { id: 'bigEars-2', src: '/images/Avatar/bigEars-2.png', name: 'Tai to 2', cost: 200 },
  { id: 'bigEars-3', src: '/images/Avatar/bigEars-3.png', name: 'Tai to 3', cost: 200 },
  { id: 'bigEars-4', src: '/images/Avatar/bigEars-4.png', name: 'Tai to 4', cost: 200 },
  { id: 'bigEars-5', src: '/images/Avatar/bigEars-5.png', name: 'Tai to 5', cost: 200 },
  // Bottts style - 200 xu
  { id: 'bottts-1', src: '/images/Avatar/bottts-1.png', name: 'Robot 1', cost: 200 },
  { id: 'bottts-2', src: '/images/Avatar/bottts-2.png', name: 'Robot 2', cost: 200 },
  { id: 'bottts-3', src: '/images/Avatar/bottts-3.png', name: 'Robot 3', cost: 200 },
  { id: 'bottts-4', src: '/images/Avatar/bottts-4.png', name: 'Robot 4', cost: 200 },
  { id: 'bottts-5', src: '/images/Avatar/bottts-5.png', name: 'Robot 5', cost: 200 },
  // Rings style - 200 xu
  { id: 'rings-1', src: '/images/Avatar/rings-1.png', name: 'Vòng 1', cost: 200 },
  { id: 'rings-2', src: '/images/Avatar/rings-2.png', name: 'Vòng 2', cost: 200 },
  { id: 'rings-3', src: '/images/Avatar/rings-3.png', name: 'Vòng 3', cost: 200 },
  { id: 'rings-4', src: '/images/Avatar/rings-4.png', name: 'Vòng 4', cost: 200 },
  { id: 'rings-5', src: '/images/Avatar/rings-5.png', name: 'Vòng 5', cost: 200 },
];

// Hàm lấy avatar từ ID
const getAvatarById = (avatarId) => {
  return avatarImages.find(a => a.id === avatarId) || avatarImages[0];
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userStats, updateStats, refreshUserStats, bgVolume, sfxVolume, bgMuted, sfxMuted, setBgVolume, setSfxVolume, toggleBgMute, toggleSfxMute } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [unlockedAvatars, setUnlockedAvatars] = useState(['adventurer-1', 'adventurer-2', 'adventurer-3', 'adventurer-4', 'adventurer-5']);
  const [currentAvatar, setCurrentAvatar] = useState(null); // Bắt đầu với null để đợi load từ server
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [avatarToUnlock, setAvatarToUnlock] = useState(null);
  
  // Chỉnh sửa tên
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      setDisplayName(user?.displayName || 'Học sinh');
      setEditName(user?.displayName || '');
    }
  }, [user]);

  async function fetchProfile() {
    try {
      // Dữ liệu đã được fetch trong App.jsx qua refreshUserStats/useAuth
      // Chúng ta chỉ cần ánh xạ từ userStats sang các state local
      if (userStats) {
        setUnlockedAvatars(userStats.inventory || ['adventurer-1', 'adventurer-2', 'adventurer-3', 'adventurer-4', 'adventurer-5']);
        setCurrentAvatar(userStats.avatar_url || 'adventurer-1');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Xử lý tải lên ảnh
    const handleFileUpload = async (event) => {
      try {
        setUploading(true);
        const file = event.target.files[0];
        if (!file) return;

        // Giới hạn 2MB
        if (file.size > 2 * 1024 * 1024) {
          showToast('Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.', 'warning');
          return;
        }

        const userId = user?.id || user?.uid;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Tải lên Supabase Storage
        // Lưu ý: Người dùng cần tạo bucket 'avatars' trước trong dashboard
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Lấy URL công khai
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Cập nhật DB
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        if (updateError) throw updateError;

        setCurrentAvatar(publicUrl);
        if (refreshUserStats) await refreshUserStats();
        showToast('Đã cập nhật ảnh đại diện!', 'success');
      } catch (err) {
        console.error('Error uploading avatar:', err);
        showToast('Lỗi khi tải ảnh lên. Hãy đảm bảo bucket "avatars" đã được tạo trong Supabase Storage.', 'error');
      } finally {
        setUploading(false);
      }
    };

    const handleSelectAvatar = (avatar) => {
      // Avatar miễn phí luôn được chọn
      const freeAvatarIds = avatarImages.filter(a => a.cost === 0).map(a => a.id);
      const isUnlocked = freeAvatarIds.includes(avatar.id) || unlockedAvatars.includes(avatar.id);
      
      if (isUnlocked) {
        setSelectedAvatar(avatar.id);
        setCurrentAvatar(avatar.id);
        saveAvatarSelection(avatar.id);
      } else {
        setAvatarToUnlock(avatar);
        setShowUnlockModal(true);
      }
    };

    const saveAvatarSelection = async (avatarId) => {
      try {
        const userId = user?.id || user?.uid;
        const avatar = getAvatarById(avatarId);
        
        await supabase
          .from('profiles')
          .update({ 
            avatar_url: avatar.id // Nếu chọn từ list mẫu, lưu ID mẫu
          })
          .eq('id', userId);
          
        if (refreshUserStats) await refreshUserStats();
      } catch (err) {
        console.error('Error saving avatar:', err);
      }
    };

    const unlockAvatar = async () => {
      if (!avatarToUnlock) return;
      
      if (avatarToUnlock.cost > 0 && (userStats?.coins || 0) < avatarToUnlock.cost) {
        showToast('Không đủ xu!', 'warning');
        return;
      }

      try {
        const userId = user?.id || user?.uid;
        const newCoins = (userStats?.coins || 0) - avatarToUnlock.cost;
        const newInventory = [...(userStats?.inventory || []), avatarToUnlock.id];

        const { error } = await supabase
          .from('profiles')
          .update({
            coins: newCoins,
            inventory: newInventory,
            avatar_url: avatarToUnlock.id
          })
          .eq('id', userId);

        if (!error) {
          setUnlockedAvatars(newInventory);
          setCurrentAvatar(avatarToUnlock.id);
          setShowUnlockModal(false);
          setAvatarToUnlock(null);
          if (refreshUserStats) await refreshUserStats();
          showToast('Đã mở khóa avatar mới!', 'success');
        } else {
          showToast('Có lỗi xảy ra!', 'error');
        }
      } catch (err) {
        console.error('Error unlocking avatar:', err);
        showToast('Có lỗi xảy ra!', 'error');
      }
    };

    // Lưu tên mới - SỬA LỖI ĐỔI TÊN
    const saveDisplayName = async () => {
      const nameToSave = editName.trim();
      if (!nameToSave || nameToSave.length < 2) {
        setNameError('Tên phải có ít nhất 2 ký tự');
        return;
      }
      
      try {
        const userId = user?.id || user?.uid;
        
        // Kiểm tra trùng tên
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('display_name', nameToSave)
          .neq('id', userId)
          .maybeSingle();

        if (existing) {
          setNameError('Tên này đã bị trùng, vui lòng chọn tên khác');
          return;
        }

        setNameError('');
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: nameToSave
          })
          .eq('id', userId);
        
        if (!error) {
          setDisplayName(nameToSave);
          setIsEditingName(false);
          if (refreshUserStats) {
            await refreshUserStats();
          }
          showToast('Đã cập nhật tên hiển thị!', 'success');
        } else {
          console.error('Update error:', error);
          showToast('Không thể cập nhật tên: ' + error.message, 'error');
        }
      } catch (err) {
        console.error('Error updating name:', err);
        showToast('Có lỗi xảy ra!', 'error');
      }
    };

    const currentAvatarData = getAvatarById(currentAvatar);
    // Ưu tiên hiển thị: 1. URL (ảnh tải lên) -> 2. Ảnh mẫu từ list (theo ID) -> 3. Ảnh mặc định
    const displayedAvatar = currentAvatar?.includes('/') 
      ? currentAvatar 
      : (currentAvatarData?.src || '/images/Avatar/adventurer-1.png');
    
    // Chỉ hiện tiến độ các lớp đã chơi (có progress > 0 hoặc có completedLessons)
    const playedClasses = [6, 7, 8, 9, 10, 11, 12].filter(classNum => {
      const progress = userStats?.classProgress?.[classNum] || 0;
      const completed = userStats?.completedLessons?.filter(l => l.startsWith(`class${classNum}`))?.length || 0;
      return progress > 0 || completed > 0;
    });

    const stats = [
      { label: 'Tổng điểm', value: userStats?.total_score || 0, icon: Star, color: 'text-yellow-400' },
      { label: 'Điểm tuần', value: userStats?.weekly_score || 0, icon: Trophy, color: 'text-orange-400' },
      { label: 'Xu', value: userStats?.coins || 0, icon: Coins, color: 'text-yellow-300' },
      { label: 'Màn hoàn thành', value: userStats?.levels_completed || 0, icon: Check, color: 'text-green-400' },
      { label: 'Chuỗi ngày', value: userStats?.login_streak || 0, icon: Leaf, color: 'text-green-300' },
    ];

    return (
      <div className="min-h-screen relative bg-transparent">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
        />

        {/* Header */}
        <header className="bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Hồ sơ
              </h1>

              <button 
                onClick={() => navigate('/settings')}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Card */}
          <div className="game-card text-center mb-6">
            {/* Avatar - Sử dụng hình ảnh thay vì emoji */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 avatar-circle overflow-hidden border-4 border-white/20">
                {uploading ? (
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                ) : (
                  <img 
                    src={displayedAvatar} 
                    alt="Current Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/Avatar/adventurer-1.png';
                    }}
                  />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

          {/* Tên người dùng - có thể chỉnh sửa */}
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (nameError) setNameError('');
                }}
                className="bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Nhập tên mới"
                maxLength={30}
                autoFocus
              />
              <button
                onClick={saveDisplayName}
                className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400"
              >
                <Save className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setEditName(displayName);
                }}
                className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <button
                onClick={() => {
                  setIsEditingName(true);
                  setEditName(displayName);
                }}
                className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
              >
                <Edit2 className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          {nameError && <p className="text-red-500 text-[10px] font-bold mt-1 bg-red-500/10 py-1 px-3 rounded-full border border-red-500/20 inline-block">{nameError}</p>}
          <p className="text-gray-400">{user?.email}</p>

          {/* Level Badge */}
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-semibold">Level {userStats?.level}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'stats' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Thống kê
          </button>
          <button
            onClick={() => setActiveTab('avatars')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'avatars' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Avatar
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'achievements' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Thành tựu
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="game-card text-center">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}

            {/* Class Progress - Chỉ hiện lớp đã chơi */}
            {playedClasses.length > 0 && (
              <div className="game-card col-span-2">
                <h3 className="text-white font-semibold mb-4">Tiến độ học tập</h3>
                <div className="space-y-3">
                  {playedClasses.map((classNum) => {
                    const progress = userStats?.classProgress?.[classNum] || 0;
                    const colors = {
                      6: 'from-green-400 to-emerald-500',
                      7: 'from-blue-400 to-cyan-500',
                      8: 'from-purple-400 to-violet-500',
                      9: 'from-orange-400 to-red-500',
                      10: 'from-cyan-400 to-teal-500',
                      11: 'from-amber-400 to-orange-500',
                      12: 'from-pink-400 to-fuchsia-500',
                    };
                    return (
                      <div key={classNum}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Lớp {classNum}</span>
                          <span className="text-gray-400">{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${colors[classNum]}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {playedClasses.length === 0 && (
              <div className="game-card col-span-2 text-center py-6">
                <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Bạn chưa chơi lớp nào</p>
                <p className="text-gray-500 text-sm">Hãy chọn lớp và bắt đầu học!</p>
              </div>
            )}
          </div>
        )}

        {/* Avatars Tab - Sử dụng ảnh từ folder */}
        {activeTab === 'avatars' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Chọn Avatar</h3>
              <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 font-semibold">{userStats?.coins || 0}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {avatarImages.map((avatar) => {
                const isUnlocked = unlockedAvatars.includes(avatar.id) || avatar.cost === 0;
                const isSelected = currentAvatar === avatar.id;
                
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar)}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all overflow-hidden ${
                      isSelected 
                        ? 'bg-blue-500/50 ring-2 ring-blue-400' 
                        : isUnlocked 
                          ? 'bg-white/10 hover:bg-white/20' 
                          : 'bg-white/5'
                    }`}
                  >
                    <img 
                      src={avatar.src}
                      alt={avatar.name}
                      className={`w-12 h-12 rounded-full object-cover ${!isUnlocked ? 'opacity-30' : ''}`}
                    />
                    <span className={`text-xs mt-1 truncate w-full text-center ${isUnlocked ? 'text-gray-300' : 'text-gray-500'}`}>
                      {avatar.name}
                    </span>
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                        <div className="text-center">
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                          <span className="text-yellow-400 text-xs">{avatar.cost}</span>
                        </div>
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="text-center text-gray-400 py-8">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>Thành tựu sẽ sớm có mặt!</p>
              <p className="text-sm">Tiếp tục học tập để mở khóa</p>
            </div>
          </div>
        )}

        {/* Âm thanh Controls */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-400" />
            Âm thanh
          </h3>

          {/* Nhạc nền */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={toggleBgMute}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                bgMuted ? 'bg-red-500/30 text-red-400' : 'bg-blue-500/30 text-blue-400'
              }`}
            >
              {bgMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 mb-1.5">Nhạc nền</p>
              <input
                type="range"
                min="0"
                max="100"
                value={bgMuted ? 0 : bgVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBgVolume(val);
                  if (bgMuted && val > 0) toggleBgMute();
                }}
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
            <span className="text-white text-sm font-medium w-10 text-right shrink-0">{bgMuted ? 0 : bgVolume}%</span>
          </div>

          {/* Hiệu ứng âm thanh */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSfxMute}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                sfxMuted ? 'bg-red-500/30 text-red-400' : 'bg-green-500/30 text-green-400'
              }`}
            >
              {sfxMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 mb-1.5">Hiệu ứng âm thanh</p>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxMuted ? 0 : sfxVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSfxVolume(val);
                  if (sfxMuted && val > 0) toggleSfxMute();
                }}
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
            <span className="text-white text-sm font-medium w-10 text-right shrink-0">{sfxMuted ? 0 : sfxVolume}%</span>
          </div>
        </div>
      </main>

      {/* Unlock Avatar Modal - Sử dụng ảnh */}
      {showUnlockModal && avatarToUnlock && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="game-card max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img 
                src={avatarToUnlock.src}
                alt={avatarToUnlock.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Mở khóa {avatarToUnlock.name}?</h2>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-300">{avatarToUnlock.cost}</span>
              <span className="text-gray-400">xu</span>
            </div>

            {(userStats?.coins || 0) < avatarToUnlock.cost && (
              <p className="text-red-400 mb-4">Bạn không đủ xu!</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={unlockAvatar}
                disabled={(userStats?.coins || 0) < avatarToUnlock.cost}
                className={`flex-1 py-3 rounded-xl font-semibold ${
                  (userStats?.coins || 0) >= avatarToUnlock.cost
                    ? 'bg-blue-500 hover:bg-blue-400 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Mở khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
