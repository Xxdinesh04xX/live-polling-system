const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const apiFetch = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.message ?? "Request failed.";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export { API_URL };
