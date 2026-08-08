import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Header = ({ variant = 'landing' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorClick = (anchor) => {
    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const landingLinks = [
    { label: '서비스 소개', anchor: 'service' },
    { label: '기능', anchor: 'features' },
    { label: '사용 방법', path: '/guide' },
  ];

  const dashboardLinks = [
    { label: '대시보드', path: '/dashboard' },
    { label: '피부 스캔', path: '/scan' },
    { label: '분석 결과', path: '/analysis' },
    { label: '리포트', path: '/report' },
    { label: '제품 추천', path: '/products' },
  ];

  const links = variant === 'landing' ? landingLinks : dashboardLinks;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-500"></span>
            <span className="text-xl font-bold text-text-primary">담다</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden tablet:flex items-center gap-8">
            {links.map((link) => (
              link.path ? (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.path
                      ? 'text-primary-500 font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleAnchorClick(link.anchor)}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer"
                >
                  {link.label}
                </button>
              )
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden tablet:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link to="/mypage" className="text-sm font-medium text-text-secondary hover:text-primary-500 transition-colors duration-200">
                  {user?.nickname || '사용자'}님
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary border border-gray-200 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  시작하기
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="tablet:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="tablet:hidden py-4 border-t border-gray-100 animate-fadeIn">
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                link.path ? (
                  <Link
                    key={link.label}
                    to={link.path}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-text-secondary hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    type="button"
                    className="px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    onClick={() => { handleAnchorClick(link.anchor); setMobileMenuOpen(false); }}
                  >
                    {link.label}
                  </button>
                )
              ))}
              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/mypage"
                      className="px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-50 text-left"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 text-left"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      로그인
                    </Link>
                    <Link
                      to="/signup"
                      className="mx-4 py-3 rounded-lg text-sm font-medium bg-primary-500 text-white text-center hover:bg-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      시작하기
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
