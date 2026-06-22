import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scan,
  BarChart3,
  FileText,
  ShoppingBag,
  User,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { path: '/scan', label: '스캔', icon: Scan },
  { path: '/analysis', label: '분석', icon: BarChart3 },
  { path: '/products', label: '추천', icon: ShoppingBag },
  { path: '/mypage', label: 'MY', icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="desktop:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'text-primary-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
