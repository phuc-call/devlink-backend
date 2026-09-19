/**
 * Storage key constants — tất cả localStorage và sessionStorage keys.
 * Dùng những constants này thay vì hardcode string để dễ bảo trì.
 */

/** localStorage keys */
export const STORAGE_KEYS = {
  IS_LOGGED_IN: 'isLoggedIn',
  USER_ID: 'userId',
  ROLE: 'role',
  USERNAME: 'username',
  /** @warning Key này chưa được set trong auth flow — luôn trả về null */
  FULL_NAME: 'fullName',
  /** @warning Key này chưa được set trong auth flow — luôn trả về null */
  AVATAR: 'avatar',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ACCESS_TOKEN_EXP: 'accessTokenExp',
} as const;

/** sessionStorage keys */
export const SESSION_KEYS = {
  CHAT_SELECTED_USER: 'chat_selectedUser',
  CHAT_SHOW_CHAT: 'chat_showChat',
  HIDDEN_UNLOCKED: 'hidden_unlocked',
} as const;

/** Các giá trị so sánh từ storage */
export const STORAGE_VALUES = {
  LOGGED_IN_TRUE: 'true',
  ROLE_ADMIN: 'ADMIN',
} as const;
