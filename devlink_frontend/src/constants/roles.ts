/**
 * Role và error code constants — phải khớp với giá trị server trả về.
 */

/** Các role của user */
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

/** Error codes trả về từ server */
export const ERROR_CODES = {
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NOTIFICATION_PASSWORD_NOT_SET: 'NOTIFICATION_PASSWORD_NOT_SET',
  NOTIFICATION_PASSWORD_WRONG: 'NOTIFICATION_PASSWORD_WRONG',
  NOTIFICATION_PASSWORD_ALREADY_SET: 'NOTIFICATION_PASSWORD_ALREADY_SET',
} as const;
