import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Scan, RefreshCw, Sparkles, Heart, Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import useAuthStore from '../store/authStore';
import { getRecommendations } from '../api/products';

// ─── 카테고리 필터 ───────────────────────────────────────────
const FILTER_CATEGORIES = [
  { id: '', label: '전체' },
  { id: '보습', label: '보습' },
  { id: '진정', label: '진정 / 민감' },
  { id: '미백', label: '미백 / 톤업' },
  { id: '모공', label: '모공 / 각질' },
  { id: '탄력', label: '탄력 / 항노화' },
];

// ─── 가격대 필터 (BE price_range 필드 기준) ──────────────────
const PRICE_RANGES = [
  { id: '', label: '전체 가격' },
  { id: '1-3만원', label: '1~3만원' },
  { id: '3-5만원', label: '3~5만원' },
  { id: '5-10만원', label: '5~10만원' },
  { id: '10만원+', label: '10만원+' },
];

// ─── 정렬 옵션 ───────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'score', label: '추천순' },
  { id: 'price_asc', label: '가격 낮은순' },
  { id: 'price_desc', label: '가격 높은순' },
];

// ─── 성분 배열 정규화 (BE: [{kr, inci}] or string[]) ─────────
function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return [];
  if (typeof ingredients[0] === 'string') return ingredients;
  return ingredients.map((ing) => ing?.kr || ing?.inci || String(ing));
}

// ─── price_range 숫자 추출 (정렬용) ──────────────────────────
function priceRangeToNum(pr) {
  if (!pr) return 9999;
  const map = { '1-3만원': 2, '3-5만원': 4, '5-10만원': 7, '10만원+': 11 };
  return map[pr] ?? 9999;
}

// ─── 제품 카드 ───────────────────────────────────────────────
const ProductCard = ({ product, onClick }) => {
  const { wishlist, toggleWish } = useAuthStore();
  const isWished = (wishlist || []).some((p) => p.id === product.id);
  const ingredients = normalizeIngredients(product.main_ingredients);

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
          <span className="font-medium text-primary-600">추천 이유: </span>
          {product.reason || '범용 케어'}
        </p>

        <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 가격대 */}
            {product.price_range && (
              <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                {product.price_range}
              </span>
            )}
            {/* 무향료 / 무알코올 뱃지 */}
            {product.fragrance_free && (
              <span className="text-[9px] bg-green-50 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">무향료</span>
            )}
            {product.alcohol_free && (
              <span className="text-[9px] bg-green-50 text-green-600 font-semibold px-1.5 py-0.5 rounded-full">무알코올</span>
            )}
            {/* 주성분 (최대 2개) */}
            {ingredients.length > 0 && (
              <p className="text-[10px] text-text-secondary truncate max-w-[140px]">
                <span className="font-medium">주성분: </span>
                {ingredients.slice(0, 2).join(', ')}
              </p>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); toggleWish(product); }}
            className="p-1.5 rounded-full hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Heart size={16} className={isWished ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 제품 상세 모달 ──────────────────────────────────────────
const ProductModal = ({ product, onClose }) => {
  const { wishlist, toggleWish } = useAuthStore();
  if (!product) return null;

  const isWished = (wishlist || []).some((p) => p.id === product.id);
  const ingredients = normalizeIngredients(product.main_ingredients);

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
              {/* 가격대 */}
              {product.price_range && (
                <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full">
                  💰 {product.price_range}
                </span>
              )}
              {(product.category || []).map((c) => (
                <span key={c} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
            {/* 무향·무알코올 뱃지 */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {product.fragrance_free && <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">✓ 무향료</span>}
              {product.alcohol_free && <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">✓ 무알코올</span>}
              {(product.tags || []).map((t) => (
                <span key={t} className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{t}</span>
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
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">추천 이유</p>
            <p className="text-sm text-text-primary bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-primary-400">{product.reason || '범용 케어'}</p>
          </div>

          {/* 주의 사항 */}
          {product.warnings?.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">주의 성분</p>
              <div className="flex flex-wrap gap-1">
                {product.warnings.map((w, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-md ${w.level === 'high' ? 'bg-red-50 text-red-600' : w.level === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                    {w.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 전성분 (주요 성분) */}
          {ingredients.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-2">주요 성분</p>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded-full">{ing}</span>
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

// ─── 메인 페이지 ─────────────────────────────────────────────
const ProductsPage = () => {
  useAuth(true);
  const { currentScan, initializeIfNeeded } = useScanStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [showSortMenu, setShowSortMenu] = useState(false);
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
        top_k: 20, // 더 많이 받아서 클라이언트 필터
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

  // 클라이언트 사이드: 카테고리 + 검색 + 가격대 + 정렬
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 카테고리 필터
    if (activeFilters.length > 0) {
      list = list.filter((p) => {
        const cats = p.category || [];
        const sub = p.subcategory || '';
        const tags = p.tags || [];
        return activeFilters.some((f) =>
          cats.some((c) => c.includes(f) || f.includes(c)) ||
          sub.includes(f) ||
          tags.some((t) => t.includes(f) || f.includes(t))
        );
      });
    }

    // 가격대 필터
    if (priceFilter) {
      list = list.filter((p) => p.price_range === priceFilter);
    }

    // 검색 필터 (이름 / 브랜드 / 성분 한글명)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const ings = normalizeIngredients(p.main_ingredients).join(' ').toLowerCase();
        return name.includes(q) || brand.includes(q) || ings.includes(q);
      });
    }

    // 정렬
    if (sortBy === 'score') {
      list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => priceRangeToNum(a.price_range) - priceRangeToNum(b.price_range));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => priceRangeToNum(b.price_range) - priceRangeToNum(a.price_range));
    }

    return list;
  }, [products, activeFilters, priceFilter, searchQuery, sortBy]);

  const handleFilterToggle = (filterId) => {
    if (filterId === '') { setActiveFilters([]); return; }
    const next = activeFilters.includes(filterId)
      ? activeFilters.filter((f) => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(next);
  };

  const handleRefresh = () => {
    const excludeIds = Array.from(shownIds.current);
    fetchProducts({ filters: activeFilters, seed: Math.floor(Math.random() * 99999), excludeIds });
  };

  const clearAll = () => {
    setActiveFilters([]);
    setPriceFilter('');
    setSearchQuery('');
    setSortBy('score');
  };

  const hasActiveFilter = activeFilters.length > 0 || priceFilter || searchQuery;

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

  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === sortBy)?.label ?? '추천순';

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8 animate-fadeIn">
          <div className="max-w-3xl mx-auto">

            {/* 안내 배너 */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary-700 leading-relaxed">
                  오늘 측정 결과를 분석해 선별한 제품이에요. 카드를 누르면 상세 정보를 볼 수 있어요.
                </p>
              </div>
            </div>

            {/* 검색바 */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제품명, 브랜드, 성분으로 검색..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-400 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* 헤더 + 정렬 + 새로고침 */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-base font-bold text-text-primary flex-shrink-0">
                맞춤 제품 추천
                <span className="ml-2 text-xs font-normal text-text-secondary">({filteredProducts.length}개)</span>
              </h2>
              <div className="flex items-center gap-2">
                {/* 정렬 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu((v) => !v)}
                    className="flex items-center gap-1 text-xs font-medium text-text-secondary border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-all bg-white"
                  >
                    <SlidersHorizontal size={12} />
                    {currentSortLabel}
                    <ChevronDown size={12} />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[120px] overflow-hidden">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                            sortBy === opt.id ? 'bg-primary-50 text-primary-600' : 'text-text-secondary hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-medium text-text-secondary border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-all disabled:opacity-50 bg-white"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  다른 추천
                </button>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2 mb-2">
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

            {/* 가격대 필터 */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRICE_RANGES.map((pr) => {
                const isActive = priceFilter === pr.id;
                return (
                  <button
                    key={pr.id}
                    onClick={() => setPriceFilter(pr.id === priceFilter ? '' : pr.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 text-text-secondary hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {pr.label}
                  </button>
                );
              })}
              {hasActiveFilter && (
                <button
                  onClick={clearAll}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1"
                >
                  <X size={10} /> 초기화
                </button>
              )}
            </div>

            {/* 제품 목록 */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-text-secondary">
                <ShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-text-primary mb-1">해당 조건에 맞는 제품이 없어요.</p>
                <p className="text-xs text-text-secondary mb-4">검색어나 필터를 변경해 보세요.</p>
                <button onClick={clearAll} className="text-primary-500 text-sm font-semibold hover:underline">
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((p, idx) => (
                  <div key={p.id ?? idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
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

      {/* 정렬 메뉴 외부 클릭 닫기 */}
      {showSortMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
};

export default ProductsPage;
