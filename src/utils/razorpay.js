export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initializeRazorpay = async () => {
  const res = await loadRazorpay();
  if (!res) {
    throw new Error('Razorpay SDK failed to load');
  }
  return window.Razorpay;
}; 