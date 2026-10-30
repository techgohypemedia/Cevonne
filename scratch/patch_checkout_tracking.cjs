const fs = require('fs');

const path = 'components/pages/CheckoutPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = '  const currencySymbol = cartItems[0]?.currency === "INR" || !cartItems[0]?.currency ? "₹" : cartItems[0].currency;';

const trackingCode = `  // Track abandoned cart if contact info is provided but order is not placed yet
  useEffect(() => {
    if (typeof window === "undefined" || !cartItems.length) return;
    const email = shippingData.email?.trim() || "";
    const phone = shippingData.phone?.replace(/[^0-9]/g, "") || "";

    const hasValidEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
    const hasValidPhone = phone.length >= 10;
    if (!hasValidEmail && !hasValidPhone) return;

    const timer = setTimeout(() => {
      fetch("/api/orders/track-abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: hasValidEmail ? email : "",
          phone: hasValidPhone ? phone : "",
          fullName: shippingData.fullName || user?.name || "there",
          items: cartItems.map((item) => ({
            name: item.title || item.name || "Lipstick",
            shadeName: item.shadeName || item.shade || "",
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
        }),
      }).catch((err) => console.warn("Failed to queue cart recovery alert", err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [shippingData.email, shippingData.phone, cartItems, shippingData.fullName, user?.name]);

`;

if (!content.includes('track-abandoned-cart')) {
  content = content.replace(target, trackingCode + target);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched CheckoutPage.tsx with cart recovery tracking!');
} else {
  console.log('Already present in CheckoutPage.tsx');
}

