import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Lock, Save, ChevronRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useScanStore from '../store/scanStore';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import { SKIN_TYPES, SKIN_CONCERNS, COSMETIC_INTERESTS, AGE_GROUPS } from '../utils/constants';

const MyPage = () => {
  const navigate = useNavigate();
  const { user, updateUser, changePassword, updateProfileImage } = useAuthStore();
  const { scans, setCurrentScan } = useScanStore();
  
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, scans
  const [toastMessage, setToastMessage] = useState('');

  // Profile Form State
  const [profileData, setProfileData] = useState({
    nickname: user?.nickname || '',
    gender: user?.gender || '선택 안 함',
    ageGroup: user?.ageGroup || '',
    skinType: user?.skinType || '',
    skinConcerns: user?.skinConcerns || [],
    cosmeticInterests: user?.cosmeticInterests || [],
  });

  // Password Form State
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = await updateProfileImage(reader.result);
        if (result.success) showToast('프로필 사진이 변경되었습니다.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (key, value) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item) => {
    setProfileData(prev => {
      const array = prev[key];
      if (array.includes(item)) {
        return { ...prev, [key]: array.filter(i => i !== item) };
      } else {
        return { ...prev, [key]: [...array, item] };
      }
    });
  };

  const handleSaveProfile = async () => {
    const result = await updateUser(profileData);
    if (result.success) {
      showToast('내 정보가 성공적으로 수정되었습니다.');
    } else {
      showToast(result.message || '정보 수정에 실패했습니다.');
    }
  };

  const handleSavePassword = async () => {
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (pwdData.newPassword.length < 8) {
      showToast('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    const result = await changePassword(pwdData.currentPassword, pwdData.newPassword);
    if (result.success) {
      showToast('비밀번호가 변경되었습니다.');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showToast(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm animate-fadeIn">
          {toastMessage}
        </div>
      )}

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-text-primary mb-6">마이페이지</h1>

            {/* Top Profile Section */}
            <div className="card flex flex-col tablet:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-500">
                      <User size={40} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="text-center tablet:text-left">
                <h2 className="text-2xl font-bold text-text-primary">{user?.nickname}</h2>
                <p className="text-text-secondary">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  총 스캔 횟수: {user?.scanCount || 0}회
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100">
              <button
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('profile')}
              >
                내 정보 수정
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'password' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('password')}
              >
                비밀번호 변경
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'scans' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('scans')}
              >
                스캔 기록
              </button>
            </div>

            {/* Tab Content */}
            <div className="card min-h-[400px]">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-text-primary border-b pb-4">내 정보 및 피부 상태</h3>
                  
                  <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">닉네임</label>
                      <input
                        type="text"
                        value={profileData.nickname}
                        onChange={(e) => handleProfileChange('nickname', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">연령대</label>
                      <select
                        value={profileData.ageGroup}
                        onChange={(e) => handleProfileChange('ageGroup', e.target.value)}
                        className="input-field"
                      >
                        <option value="">선택 안 함</option>
                        {AGE_GROUPS.map(age => <option key={age} value={age}>{age}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">성별</label>
                    <div className="flex gap-4">
                      {['남', '여', '선택 안 함'].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            checked={profileData.gender === g}
                            onChange={() => handleProfileChange('gender', g)}
                            className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">피부 타입</label>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TYPES.map((type) => (
                        <label key={type} className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${profileData.skinType === type ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 hover:border-primary-300'}`}>
                          <input
                            type="radio"
                            name="skinType"
                            checked={profileData.skinType === type}
                            onChange={() => handleProfileChange('skinType', type)}
                            className="hidden"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">피부 고민 (다중 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_CONCERNS.map((concern) => {
                        const isSelected = profileData.skinConcerns.includes(concern);
                        return (
                          <label key={concern} className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 hover:border-primary-300'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleArrayItem('skinConcerns', concern)}
                              className="hidden"
                            />
                            <span className="text-sm">{concern}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">관심 화장품 (다중 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {COSMETIC_INTERESTS.map((item) => {
                        const isSelected = profileData.cosmeticInterests.includes(item);
                        return (
                          <label key={item} className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 hover:border-primary-300'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleArrayItem('cosmeticInterests', item)}
                              className="hidden"
                            />
                            <span className="text-sm">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSaveProfile} className="w-full tablet:w-auto">
                      <Save size={18} className="mr-2" /> 변경사항 저장
                    </Button>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="max-w-md space-y-5 animate-fadeIn">
                  <h3 className="text-lg font-bold text-text-primary border-b pb-4 mb-4">비밀번호 변경</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">현재 비밀번호</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={pwdData.currentPassword}
                        onChange={(e) => setPwdData(p => ({ ...p, currentPassword: e.target.value }))}
                        className="input-field pl-11"
                        placeholder="현재 비밀번호 입력"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">새 비밀번호</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={pwdData.newPassword}
                        onChange={(e) => setPwdData(p => ({ ...p, newPassword: e.target.value }))}
                        className="input-field pl-11"
                        placeholder="새 비밀번호 입력 (8자 이상)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">새 비밀번호 확인</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={pwdData.confirmPassword}
                        onChange={(e) => setPwdData(p => ({ ...p, confirmPassword: e.target.value }))}
                        className="input-field pl-11"
                        placeholder="새 비밀번호 다시 입력"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSavePassword} className="w-full">
                      비밀번호 변경하기
                    </Button>
                  </div>
                </div>
              )}

              {/* Scans Tab */}
              {activeTab === 'scans' && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-text-primary border-b pb-4 mb-6">나의 스캔 기록</h3>
                  
                  {scans.length > 0 ? (
                    <div className="space-y-4">
                      {scans.map((scan) => (
                        <div 
                          key={scan.id}
                          onClick={() => {
                            setCurrentScan(scan);
                            navigate('/analysis');
                          }}
                          className="flex items-center justify-between p-4 bg-background-gray rounded-xl border border-gray-100 cursor-pointer hover:border-primary-300 hover:bg-white transition-all group"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-1 bg-white rounded shadow-sm text-xs font-semibold text-primary-600">
                                {scan.area}
                              </span>
                              <span className="text-xs text-text-secondary">{scan.date}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary">
                              종합 피부 점수: <span className="text-lg text-primary-500 ml-1">{scan.overallScore}</span>점
                            </p>
                          </div>
                          <ChevronRight className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-text-primary font-medium mb-1">아직 스캔 기록이 없습니다</h4>
                      <p className="text-sm text-text-secondary mb-4">첫 번째 피부 스캔을 진행해보세요!</p>
                      <Button onClick={() => navigate('/scan')} variant="outline">
                        스캔 페이지로 이동
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyPage;
