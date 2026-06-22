import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scan,
  BarChart3,
  FileText,
  ShoppingBag,
  BookOpen,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const iconMap = {
  LayoutDashboard: LayoutDashboard,
  Scan: Scan,
  BarChart3: BarChart3,
  FileText: FileText,
  ShoppingBag: ShoppingBag,
  BookOpen: BookOpen,
  User: User,
  Settings: Settings,
};

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const menuSections = [
    {
      title: '메뉴',
      items: [
        { path: '/dashboard', label: '대시보드', icon: 'LayoutDashboard' },
        { path: '/scan', label: '피부 스캔', icon: 'Scan' },
        { path: '/analysis', label: '분석 결과', icon: 'BarChart3' },
        { path: '/report', label: '분석 리포트', icon: 'FileText' },
        { path: '/products', label: '제품 추천', icon: 'ShoppingBag' },
      ],
    },
    {
      title: '기타',
      items: [
        { path: '#', label: '케어 가이드', icon: 'BookOpen' },
        { path: '/mypage', label: '마이페이지', icon: 'User' },
        { path: '#', label: '설정', icon: 'Settings' },
      ],
    },
  ];

  return (
    <aside className="hidden desktop:flex flex-col w-56 min-h-[calc(100vh-64px)] bg-white border-r border-gray-100 p-4">
      {menuSections.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-4">
            {section.title}
          </p>
          <nav className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon size={18} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Logout button at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="sidebar-item w-full text-red-400 hover:text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
