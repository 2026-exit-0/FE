// 계정이 바뀐 뒤 도착한 응답은 현재 사용자의 목록에 반영하지 않는다.
export function createWishlistActions(set, get, api) {
  let generation = 0;
  const context = () => `${api.token() || ''}:${get().user?.user_id || ''}`;
  const begin = () => {
    const owner = context();
    const request = ++generation;
    set({ wishlistBusy: true, wishlistError: '', wishlistOwner: owner });
    return () => request === generation && owner === context();
  };
  const busy = () => get().wishlistBusy && get().wishlistOwner === context();
  const save = (list) => {
    set({ wishlist: list });
    api.write(get().user.user_id, list);
  };
  return {
    wishlistBusy: false,
    wishlistError: '',
    wishlistOwner: null,
    fetchWishlist: async () => {
      if (!get().user?.user_id || busy()) return;
      const current = begin();
      try {
        const list = api.token() === 'demo_access_token'
          ? api.read(get().user.user_id)
          : (await api.load()).map(api.normalize);
        if (current()) save(list);
      } catch {
        if (current()) set({ wishlistError: '찜 목록을 불러오지 못했어요. 표시된 목록은 이전에 저장된 내용일 수 있어요.' });
      } finally {
        if (current()) set({ wishlistBusy: false });
      }
    },
    toggleWish: async (product, desired) => {
      if (!get().user?.user_id || product?.id == null || busy()) return { success: false };
      const id = String(product.id);
      const exists = get().wishlist.some((p) => String(p.id) === id);
      const add = desired ?? !exists;
      const current = begin();
      try {
        if (api.token() !== 'demo_access_token') {
          try { await api.change(product.id, add); }
          catch (error) {
            // 이미 추가/삭제된 상태도 요청한 상태와 동일하다.
            if (!(add && error.response?.status === 409) && !(!add && error.response?.status === 404)) throw error;
          }
        }
        if (!current()) return { success: false };
        const rest = get().wishlist.filter((p) => String(p.id) !== id);
        save(add ? [...rest, product] : rest);
        return { success: true, added: add };
      } catch {
        if (current()) set({ wishlistError: '찜 변경을 저장하지 못했어요. 다시 눌러 주세요.' });
        return { success: false };
      } finally {
        if (current()) set({ wishlistBusy: false });
      }
    },
  };
}
