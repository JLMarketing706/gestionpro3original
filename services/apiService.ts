// Using a free, public API for demonstration purposes.
// In a real application, consider a more reliable, paid service.
const API_URL = 'https://api.bluelytics.com.ar/v2/latest';

interface ExchangeRateResponse {
    blue: {
        value_sell: number;
    };
}

export const fetchExchangeRate = async (): Promise<number> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data: ExchangeRateResponse = await response.json();
        return data.blue.value_sell;
    } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
        // Fallback rate in case the API fails
        return 1000;
    }
};
