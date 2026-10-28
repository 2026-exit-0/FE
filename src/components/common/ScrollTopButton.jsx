// src/components/common/ScrollTopButton.jsx
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollTopButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed right-4 bottom-[88px] desktop:bottom-6 z-40 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-primary-600 hover:bg-primary-50"
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default ScrollTopButton;