import { getToken } from "./auth";

// Helper to make authenticated requests with auto-refresh
export const fetchWithAuth = async (url, options = {}) => {
  let token = await getToken();
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  // If unauthorized, try to get a new token and retry once
  if (res.status === 401) {
    token = await getToken();
    res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
};