export const getAgeGroup = (age) => {
  const numericAge = Number(age);

  if (!numericAge || numericAge < 5) {
    return "invalid";
  }

  if (numericAge <= 7) {
    return "kids_early";
  }

  if (numericAge <= 12) {
    return "kids";
  }

  if (numericAge <= 17) {
    return "teens";
  }

  return "adults";
};
