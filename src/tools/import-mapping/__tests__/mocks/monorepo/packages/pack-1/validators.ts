// @test/utils validators submodule
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};

export const validateDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};
