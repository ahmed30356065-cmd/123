
// This file provides a dummy implementation to prevent build or runtime errors 
// if components attempt to import the deprecated Gemini service.

export const parseOrderDetails = async (text: string) => {
  try {
    // Gracefully return empty data instead of throwing
    return { phone: '', address: '', notes: '' };
  } catch (e) {
    console.warn("Gemini parse error", e);
    return { phone: '', address: '', notes: '' };
  }
};

const GeminiService = {
  parseOrderDetails
};

export default GeminiService;
