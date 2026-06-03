export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePasswordRules = (password: string) => {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    specialChar: /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };
};
