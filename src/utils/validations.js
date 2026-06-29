// src/utils/validation.js
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
  }
  if (!hasUpperCase) errors.push('Debe incluir al menos una mayúscula');
  if (!hasLowerCase) errors.push('Debe incluir al menos una minúscula');
  if (!hasNumbers) errors.push('Debe incluir al menos un número');
  if (!hasSpecialChar) errors.push('Debe incluir al menos un carácter especial');

  return {
    isValid: errors.length === 0,
    errors
  };
};

// src/utils/security.js
export const rateLimit = (() => {
  const attempts = new Map();
  const maxAttempts = 5;
  const timeWindow = 15 * 60 * 1000; // 15 minutos

  return {
    checkLimit: (userId) => {
      const userAttempts = attempts.get(userId) || { count: 0, timestamp: Date.now() };

      if (Date.now() - userAttempts.timestamp > timeWindow) {
        attempts.set(userId, { count: 1, timestamp: Date.now() });
        return true;
      }

      if (userAttempts.count >= maxAttempts) {
        return false;
      }

      attempts.set(userId, {
        count: userAttempts.count + 1,
        timestamp: userAttempts.timestamp
      });
      return true;
    },
    resetLimit: (userId) => {
      attempts.delete(userId);
    }
  };
})();