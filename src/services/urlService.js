const API_BASE = import.meta.env.VITE_API_URL || '';

export const getUrls = async (token) => {
  const res = await fetch(`${API_BASE}/api/urls`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch URLs');
  }
  return res.json();
};

export const createUrl = async (token, payload) => {
  const res = await fetch(`${API_BASE}/api/urls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create short link');
  }
  return res.json();
};

export const updateUrl = async (token, urlId, payload) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update link');
  }
  return res.json();
};

export const deleteUrl = async (token, urlId) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete link');
  }
  return res.json();
};

export const getAnalytics = async (token, urlId) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch analytics');
  }
  return res.json();
};

export const getExportCsvUrl = (urlId) => {
  return `${API_BASE}/api/urls/${urlId}/analytics/export`;
};
