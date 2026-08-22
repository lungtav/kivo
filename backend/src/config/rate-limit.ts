export const rateLimitConfig = {
  authLogin: {
    limit: 5,
    windowSeconds: 15 * 60,
  },

  register: {
    limit: 5,
    windowSeconds: 60 * 60,
  },
  forgotPassword: {
    limit: 3,
    windowSeconds: 60 * 60,
  },
};
