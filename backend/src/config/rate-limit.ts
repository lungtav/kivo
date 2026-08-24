export const rateLimitConfig = {
  login: {
    limit: 5,
    windowSeconds: 15 * 60,
  },
  logout: {
    limit: 20,
    windowSeconds: 60,
  },

  verifyEmail: {
    limit: 5,
    windowSeconds: 60,
  },

  register: {
    limit: 5,
    windowSeconds: 60 * 60,
  },

  resendVerification: {
    limit: 3,
    windowSeconds: 15 * 60,
  },

  forgotPassword: {
    limit: 3,
    windowSeconds: 60 * 60,
  },

  general: {
    limit: 100,
    windowSeconds: 60,
  },

  refresh: {
    limit: 30,
    windowSeconds: 15 * 60,
  },

  upload: {
    limit: 10,
    windowSeconds: 60,
  },
};
