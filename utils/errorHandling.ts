/**
 * Error handling utilities for Supabase and general app errors
 */

export interface AppError {
  title: string;
  message: string;
  code?: string;
}

/**
 * Parse Supabase error and return user-friendly message
 */
export function parseSupabaseError(error: any, t: (key: string) => string): AppError {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';

  // Authentication errors
  if (errorMessage.includes('Invalid login credentials')) {
    return {
      title: t('auth.login.errors.loginFailed'),
      message: t('auth.login.errors.invalidCredentials'),
      code: 'INVALID_CREDENTIALS',
    };
  }

  if (errorMessage.includes('User already registered') || errorMessage.includes('already registered')) {
    return {
      title: t('auth.signup.errors.signupFailed'),
      message: t('auth.signup.errors.userExists'),
      code: 'USER_EXISTS',
    };
  }

  if (errorMessage.includes('Email not confirmed')) {
    return {
      title: t('common.error'),
      message: 'Please confirm your email before logging in.',
      code: 'EMAIL_NOT_CONFIRMED',
    };
  }

  // Database errors
  if (errorCode === '23505' || errorMessage.includes('duplicate key')) {
    if (errorMessage.includes('users_username_key')) {
      return {
        title: t('auth.signup.errors.signupFailed'),
        message: t('auth.signup.errors.usernameExists'),
        code: 'USERNAME_EXISTS',
      };
    }
    if (errorMessage.includes('users_pkey') || errorMessage.includes('users_email_key')) {
      return {
        title: t('auth.signup.errors.signupFailed'),
        message: t('auth.signup.errors.userExists'),
        code: 'USER_EXISTS',
      };
    }
    return {
      title: t('common.error'),
      message: 'This record already exists.',
      code: 'DUPLICATE_KEY',
    };
  }

  if (errorCode === '23503') {
    return {
      title: t('common.error'),
      message: 'Referenced record does not exist.',
      code: 'FOREIGN_KEY_VIOLATION',
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
    return {
      title: t('common.error'),
      message: t('auth.login.errors.networkError'),
      code: 'NETWORK_ERROR',
    };
  }

  // RLS errors
  if (errorMessage.includes('row-level security') || errorMessage.includes('violates row level security')) {
    return {
      title: t('common.error'),
      message: 'Permission denied. Please contact support.',
      code: 'RLS_VIOLATION',
    };
  }

  // Generic error
  return {
    title: t('common.error'),
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('credentials') ||
    message.includes('unauthorized') ||
    message.includes('not authenticated') ||
    message.includes('session')
  );
}

/**
 * Log error with context
 */
export function logError(context: string, error: any) {
  console.error(`[${context}]`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    timestamp: new Date().toISOString(),
  });
}

