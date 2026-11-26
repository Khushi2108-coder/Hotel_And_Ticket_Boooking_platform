import { createContext, useContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const CURRENCIES = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 1.0,
    locale: "en-IN",
    flag: "🇮🇳",
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rate: 0.0118,
    locale: "en-US",
    flag: "🇺🇸",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.0109,
    locale: "de-DE",
    flag: "🇪🇺",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rate: 0.0093,
    locale: "en-GB",
    flag: "🇬🇧",
  },
  {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    rate: 0.0433,
    locale: "en-AE",
    flag: "🇦🇪",
  },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return localStorage.getItem("stayease-currency") || "INR";
  });

  const activeCurrency =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  useEffect(() => {
    localStorage.setItem("stayease-currency", currencyCode);
  }, [currencyCode]);

  /**
   * Formats an amount in INR into the currently selected currency.
   * If currency is INR: formats as ₹4,500
   * If currency is USD: formats as $53
   */
  const formatPrice = (amountInINR, showSuffix = false) => {
    const numeric = Number(amountInINR) || 0;
    const converted = Math.round(numeric * activeCurrency.rate);

    let formatted;
    if (activeCurrency.code === "INR") {
      formatted = `₹${converted.toLocaleString("en-IN")}`;
    } else if (activeCurrency.code === "AED") {
      formatted = `AED ${converted.toLocaleString()}`;
    } else {
      formatted = `${activeCurrency.symbol}${converted.toLocaleString()}`;
    }

    return showSuffix ? `${formatted} / night` : formatted;
  };

  /**
   * Convert an INR amount directly to numeric value in active currency
   */
  const convertAmount = (amountInINR) => {
    const numeric = Number(amountInINR) || 0;
    return Math.round(numeric * activeCurrency.rate);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency: currencyCode,
        activeCurrency,
        setCurrency: setCurrencyCode,
        currencies: CURRENCIES,
        formatPrice,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
