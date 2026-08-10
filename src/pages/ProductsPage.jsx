import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Scan, RefreshCw, Sparkles, Heart } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import useAuthStore from '../store/authStore';
import { getRecommendations } from '../api/products';

const FILTER_CATEGORIES = [
  { id: '', label: '전체' },
  { id: '보습', label: '보습' },
  { id: '진정', label: '진정 / 민감' },
  { id: '미백', label: '미백 / 톤업' },
  { id: '모공', label: '모공 / 각질' },
  { id: '탄력', label: '탄력 / 항노화' },
];

// 카드
const ProductCard = ({ product, onClick }) => {
  const { wishlist, toggleWish } = useAuthStore();
  const isWished = (wishlist || []).some((p) => p.id === product.id);

  const catTags = (product.category || []).map((c) => (
    <span key={c} className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-semibold">{c}</span>
  ));

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 cursor-pointer
                 hover:border-primary-200 hover:shadow-md transition-all duration-200 group"
    >
      {/* 이미지 */}
      <div className="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-2xl">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.parentNode.textContent = '📦'; }} />
          : '📦'
        }
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="min-w-0">
            <p className="text-[11px] text-text-secondary">{product.brand || ''}</p>
            <p className="text-sm font-bold text-text-primary leading-snug line-clamp-2">{product.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">{catTags}</div>
          </div>
          <span className="text-xs font-bold bg-gradient-to-br from-primary-500 to-purple-500 text-white px-2.5 py-1 rounded-full flex-shrink-0">
            {product.score?.toFixed(1) ?? '0'}점
          </span>
        </div>

        {product.effect && (
          <p className="text-xs text-text-secondary bg-gray-50 rounded-lg px-3 py-2 mt-2 line-clamp-2">{product.effect}</p>
        )}

        <p className="text-xs text-text-secondary mt-2 line-clamp-1">
          <span className="font-medium text-primary-600">왜 추천? </span>
          {product.reason || '범용 케어'}
        </p>

        <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-2">
          {product.main_ingredients?.length > 0 ? (
            <p className="text-[10px] text-text-secondary truncate">
              <span className="font-medium">주성분: </span>
              {product.main_ingredients.slice(0, 3).join(', ')}
            </p>
          ) : <div />}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWish(product);
            }}
            className="p-1.5 rounded-full hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Heart size={16} className={isWished ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 제품 상세 모달
const ProductModal = ({ product, onClose }) => {
  const { wishlist, toggleWish } = useAuthStore();
  if (!product) return null;

  const isWished = (wishlist || []).some((p) => p.id === product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary text-sm">✕</button>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* 이미지 */}
          <div className="w-full h-40 bg-gray-50 rounded-xl flex items-center justify-center text-5xl">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="h-full object-contain" />
              : '📦'
            }
          </div>

          {/* 헤더 */}
          <div>
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold">{product.brand}</p>
                <h2 className="text-lg font-bold text-text-primary mt-1">{product.name}</h2>
              </div>
              <button
                onClick={() => toggleWish(product)}
                className="p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <Heart size={20} className={isWished ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-sm font-bold bg-gradient-to-br from-primary-500 to-purple-500 text-white px-3 py-1 rounded-full">
                {product.score?.toFixed(1) ?? '0'}점
              </span>
              {(product.category || []).map((c) => (
                <span key={c} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          </div>

          {/* 효과 */}
          {product.effect && (
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">기대 효과</p>
              <p className="text-sm text-text-primary bg-primary-50 rounded-lg px-3 py-2">{product.effect}</p>
            </div>
          )}

          {/* 추천 이유 */}
          <div>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">왜 추천했나요?</p>
            <p className="text-sm text-text-primary bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-primary-400">{product.reason || '범용 케어'}</p>
          </div>

          {/* 주의 사항 */}
          {product.warnings?.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">주의 사항</p>
              <div className="flex flex-wrap gap-1">
                {product.warnings.map((w, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-md ${w.level === 'high' ? 'bg-red-50 text-red-600' : w.level === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                    {w.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 전성분 */}
          {product.main_ingredients?.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">주성분</p>
              <div className="flex flex-wrap gap-1">
                {product.main_ingredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {/* 구매 버튼 */}
          {product.purchase_url && (
            <a
              href={product.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              구매처 보기 →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  useAuth(true);
  const { currentScan, initializeIfNeeded } = useScanStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const shownIds = useRef(new Set());

  const hasScanData = !!currentScan;
  const userInputs = useMemo(() => (
    currentScan
      ? { skin_type: currentScan.skinType, sensitivity: 3 }
      : {}
  ), [currentScan]);

  const fetchProducts = useCallback(async ({ filters = [], seed = null, excludeIds = [] } = {}) => {
    setLoading(true);
    try {
      const body = {
        measurement: currentScan
          ? { moisture: currentScan.moisture, oil: currentScan.oil, elasticity: currentScan.elasticity }
          : {},
        user_inputs: userInputs,
        top_k: 5,
      };
      if (filters.length > 0) body.filter_categories = filters;
      if (seed != null) body.seed = seed;
      if (excludeIds.length > 0) body.exclude_ids = excludeIds;

      const data = await getRecommendations(body);
      const list = (data.recommended_products || []).map((p) => ({
        ...p,
        id: p.id || p.product_id,
        name: p.name || p.name_kr,
      }));
      list.forEach((p) => p.id && shownIds.current.add(p.id));
      setProducts(list);
    } catch (err) {
      console.error('추천 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [currentScan, userInputs]);

  useEffect(() => {
    initializeIfNeeded();
  }, [initializeIfNeeded]);

  useEffect(() => {
    if (hasScanData) fetchProducts();
  }, [hasScanData]);

  // 클라이언트 사이드 카테고리 필터링
  const filteredProducts = useMemo(() => {
    if (activeFilters.length === 0) return products;
    return products.filter((p) => {
      const cats = p.category || [];
      const sub = p.subcategory || '';
      const tags = p.tags || [];
      return activeFilters.some((f) =>
        cats.some((c) => c.includes(f) || f.includes(c)) ||
        sub.includes(f) ||
        tags.some((t) => t.includes(f) || f.includes(t))
      );
    });
  }, [products, activeFilters]);

  const handleFilterToggle = (filterId) => {
    if (filterId === '') {
      setActiveFilters([]);
      return;
    }
    const next = activeFilters.includes(filterId)
      ? activeFilters.filter((f) => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(next);
  };

  const handleRefresh = () => {
    const excludeIds = Array.from(shownIds.current);
    fetchProducts({ filters: activeFilters, seed: Math.floor(Math.random() * 99999), excludeIds });
  };

  if (!hasScanData) {
    return (
      <div className="min-h-screen bg-background-gray">
        <Header variant="dashboard" />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8">
            <div className="max-w-lg mx-auto text-center py-20 animate-fadeIn">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={36} className="text-primary-300" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-3">맞춤 제품을 추천받으세요</h2>
              <p className="text-text-secondary mb-8">피부 스캔을 완료하면 AI가 맞춤 제품을 추천해드립니다.</p>
              <Link to="/scan"><Button icon={Scan}>스캔하러 가기</Button></Link>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8 animate-fadeIn">
          <div className="max-w-3xl mx-auto">

            {/* 안내 배너 */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary-700 leading-relaxed">
                  오늘 측정 결과를 분석해 선별한 제품이에요. 카드를 누르면 상세 정보를 볼 수 있어요.
                </p>
              </div>
            </div>

            {/* 헤더 + 새로고침 */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-text-primary">맞춤 제품 추천</h2>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-all disabled:opacity-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                다른 추천
              </button>
            </div>

            {/* 필터 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTER_CATEGORIES.map((cat) => {
                const isActive = cat.id === '' ? activeFilters.length === 0 : activeFilters.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleFilterToggle(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200 text-text-secondary hover:border-primary-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 제품 목록 */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-text-secondary">
                <ShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">해당 조건에 맞는 제품이 없어요.</p>
                <button onClick={() => { setActiveFilters([]); }} className="mt-3 text-primary-500 text-sm font-medium">
                  전체 보기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((p, idx) => (
                  <div key={p.id ?? idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 60}ms` }}>
                    <ProductCard product={p} onClick={() => setSelectedProduct(p)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      {/* 모달 */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};

export default ProductsPage;
