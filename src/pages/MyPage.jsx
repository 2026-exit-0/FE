import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Lock, Save, ChevronRight, Bell, Heart, RotateCcw, Scan, BarChart3, TrendingUp } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useScanStore from '../store/scanStore';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import { SKIN_TYPES, SKIN_CONCERNS } from '../utils/constants';

const MyPage = () => {
  const navigate = useNavigate();
  const { user, survey, wishlist, toggleWish, setWishlist, updateUser, changePassword, updateProfileImage, fetchSurvey, saveSurvey } = useAuthStore();
  const { scans, setCurrentScan } = useScanStore();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, scans, survey, wishlist
  const [toastMessage, setToastMessage] = useState('');

  // 5초 되돌리기(Undo) 스낵바 상태
  const [undoBackup, setUndoBackup] = useState(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);

  // BE MypageOut: { nickname, notify_analysis, notify_recommend }
  const [profileData, setProfileData] = useState({
    nickname: user?.nickname || '',
    notify_analysis: user?.notify_analysis ?? true,
    notify_recommend: user?.notify_recommend ?? true,
  });

  // 피부 설문 (SurveyIn/Out)
  const [surveyData, setSurveyData] = useState({
    skin_type: survey?.skin_type || '',
    concerns: survey?.concerns || [],
    allergies: survey?.allergies || [],
    preferred_categories: survey?.preferred_categories || [],
  });

  // 비밀번호 폼
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 마운트 시 최신 survey 및 스캔 이력 조회
  useEffect(() => {
    fetchSurvey().then((s) => {
      if (s) {
        setSurveyData({
          skin_type: s.skin_type || '',
          concerns: s.concerns || [],
          allergies: s.allergies || [],
          preferred_categories: s.preferred_categories || [],
        });
      }
    });
    useScanStore.getState().fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // store의 survey 변경 시 surveyData 폼 상태 자동 동기화
  useEffect(() => {
    if (survey) {
      setSurveyData({
        skin_type: survey.skin_type || '',
        concerns: survey.concerns || [],
        allergies: survey.allergies || [],
        preferred_categories: survey.preferred_categories || [],
      });
    }
  }, [survey]);

  // 5초 타이머 관리
  useEffect(() => {
    let timer;
    if (showUndoSnackbar) {
      timer = setTimeout(() => {
        setShowUndoSnackbar(false);
        setUndoBackup(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showUndoSnackbar]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = await updateUser({
          profile_image_url: reader.result,
        });
        if (result.success) showToast('프로필 사진이 변경되었습니다.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    // BE PATCH /mypage: nickname, notify_analysis, notify_recommend 만 전송
    const result = await updateUser({
      nickname: profileData.nickname,
      notify_analysis: profileData.notify_analysis,
      notify_recommend: profileData.notify_recommend,
    });
    if (result.success) {
      showToast('내 정보가 성공적으로 수정되었습니다.');
    } else {
      showToast(result.message || '정보 수정에 실패했습니다.');
    }
  };

  const handleSaveSurvey = async () => {
    const result = await saveSurvey(surveyData);
    if (result.success) {
      showToast('피부 설문이 저장되었습니다.');
    } else {
      showToast(result.message || '설문 저장에 실패했습니다.');
    }
  };

  const toggleConcern = (concern) => {
    setSurveyData(prev => {
      const arr = prev.concerns;
      return { ...prev, concerns: arr.includes(concern) ? arr.filter(c => c !== concern) : [...arr, concern] };
    });
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

  // 찜 삭제 핸들러 (5초 되돌리기 활성화)
  const handleCancelWish = (product) => {
    const backup = [...wishlist];
    setUndoBackup(backup);
    toggleWish(product);
    setShowUndoSnackbar(true);
  };

  // 찜 되돌리기 실행
  const handleUndo = () => {
    if (undoBackup) {
      setWishlist(undoBackup);
      setShowUndoSnackbar(false);
      setUndoBackup(null);
      showToast('찜 취소가 복원되었습니다.');
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

      {/* 5초 되돌리기(Undo) 스낵바 */}
      {showUndoSnackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-6 text-sm border border-gray-800 animate-slideUp">
          <span>찜 목록에서 삭제되었습니다.</span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-primary-400 font-bold hover:text-primary-300 transition-colors uppercase tracking-wider"
          >
            <RotateCcw size={14} /> 되돌리기
          </button>
        </div>
      )}

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-36 desktop:pb-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-text-primary mb-6">마이페이지</h1>

            {/* Top Profile Section */}
            <div className="card flex flex-col tablet:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                  {(user?.profile_image_url || user?.profileImage) ? (
                    <img src={user.profile_image_url || user.profileImage} alt="Profile" className="w-full h-full object-cover" />
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

              <div className="text-center tablet:text-left flex-1">
                <h2 className="text-2xl font-bold text-text-primary">{user?.nickname}</h2>
                <p className="text-text-secondary text-sm">{user?.email}</p>

                {/* 핵심 통계 카드 3개 */}
                <div className="mt-4 grid grid-cols-3 gap-3 max-w-xs tablet:max-w-none">
                  {/* 총 스캔 횟수 */}
                  <div className="bg-primary-50 border border-primary-100 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Scan size={12} className="text-primary-500" />
                      <span className="text-[10px] text-primary-600 font-semibold">총 스캔</span>
                    </div>
                    <p className="text-xl font-black text-primary-600">{scans.length}</p>
                    <p className="text-[9px] text-primary-500">회</p>
                  </div>

                  {/* 최근 종합 점수 */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <BarChart3 size={12} className="text-blue-500" />
                      <span className="text-[10px] text-blue-600 font-semibold">최근 점수</span>
                    </div>
                    <p className="text-xl font-black text-blue-600">
                      {scans[0]?.overallScore ?? scans[0]?.narrative?.overall_score ?? '-'}
                    </p>
                    <p className="text-[9px] text-blue-500">점</p>
                  </div>

                  {/* 찜한 제품 수 */}
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Heart size={12} className="text-rose-500" />
                      <span className="text-[10px] text-rose-600 font-semibold">찜 목록</span>
                    </div>
                    <p className="text-xl font-black text-rose-500">{wishlist.length}</p>
                    <p className="text-[9px] text-rose-400">개</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100 overflow-x-auto scrollbar-hide">
              <button
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('profile')}
              >
                내 정보 수정
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'survey' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('survey')}
              >
                피부 설문
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'wishlist' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('wishlist')}
              >
                찜 목록 ({wishlist.length})
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'password' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('password')}
              >
                비밀번호 변경
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'scans' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                onClick={() => setActiveTab('scans')}
              >
                스캔 기록
              </button>
            </div>

            {/* Tab Content */}
            <div className="card min-h-[400px]">
              
              {/* Profile Tab - BE MypageOut 필드만 수정 */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-text-primary border-b pb-4">내 계정 정보</h3>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">닉네임</label>
                    <input
                      type="text"
                      value={profileData.nickname}
                      onChange={(e) => setProfileData(p => ({ ...p, nickname: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Bell size={16} /> 알림 설정
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-text-primary">분석 결과 알림</p>
                          <p className="text-xs text-text-secondary">스캔 분석이 완료되면 알려드려요</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileData.notify_analysis}
                          onChange={(e) => setProfileData(p => ({ ...p, notify_analysis: e.target.checked }))}
                          className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-text-primary">제품 추천 알림</p>
                          <p className="text-xs text-text-secondary">맞춤 화장품 추천이 있을 때 알려드려요</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileData.notify_recommend}
                          onChange={(e) => setProfileData(p => ({ ...p, notify_recommend: e.target.checked }))}
                          className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSaveProfile} className="w-full tablet:w-auto">
                      <Save size={18} className="mr-2" /> 변경사항 저장
                    </Button>
                  </div>
                </div>
              )}

              {/* Survey Tab - BE SurveyIn 필드 */}
              {activeTab === 'survey' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-text-primary border-b pb-4">피부 설문 관리</h3>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">피부 타입</label>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TYPES.map((type) => (
                        <label key={type} className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                          surveyData.skin_type === type
                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}>
                          <input
                            type="radio"
                            name="skinType"
                            checked={surveyData.skin_type === type}
                            onChange={() => setSurveyData(p => ({ ...p, skin_type: type }))}
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
                        const isSelected = surveyData.concerns.includes(concern);
                        return (
                          <label key={concern} className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 hover:border-primary-300'
                          }`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleConcern(concern)} className="hidden" />
                            <span className="text-sm">{concern}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSaveSurvey} className="w-full tablet:w-auto">
                      <Save size={18} className="mr-2" /> 설문 저장
                    </Button>
                  </div>
                </div>
              )}

              {/* Wishlist Tab (J.4 찜 목록 조회 및 찜 취소) */}
              {activeTab === 'wishlist' && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-text-primary border-b pb-4 mb-6">내가 찜한 제품</h3>

                  {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                      {wishlist.map((product) => (
                        <div key={product.id} className="bg-white border border-gray-100 hover:border-primary-200 rounded-xl p-4 flex gap-3 shadow-sm hover:shadow relative group transition-all">
                          <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">📦</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-text-secondary">{product.brand}</p>
                            <p className="text-xs font-bold text-text-primary truncate">{product.name}</p>
                            <span className="text-[10px] text-primary-600 font-bold mt-1 inline-block">매칭율 {product.compatibility || product.score || 90}%</span>
                          </div>
                          
                          <button
                            onClick={() => handleCancelWish(product)}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"
                            title="찜 취소"
                          >
                            <Heart size={18} className="fill-rose-500 text-rose-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-text-secondary">
                      <Heart size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">찜한 화장품이 없습니다.</p>
                    </div>
                  )}
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
