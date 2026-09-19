/**
 * Route path constants — tất cả đường dẫn trong ứng dụng.
 * Dùng những constants này trong navigate() và Link to= để tránh typo.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CHAT: '/chat',
  GROUPS_CREATE: '/groups/create',
  GROUP_DETAIL: (id: number | string) => `/groups/${id}`,
  PROFILE_ME: '/profile/me',
  PROFILE_USER: (userId: number | string) => `/profile/${userId}`,
  DASHBOARD: '/dashboard',
  SAVED: '/saved',
  ADMIN: '/admin',
  HIDDEN: '/hidden',
  FOLLOWING: '/following',
  OAUTH_GOOGLE: '/oauth2/authorization/google',
} as const;
