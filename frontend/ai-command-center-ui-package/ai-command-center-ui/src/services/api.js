const API_BASE = "https://sap-guru-assistant.onrender.com";

export async function getDashboardData() {
  const response = await fetch(`${API_BASE}/dashboard-data`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export async function getConversation(senderId) {
  const response = await fetch(`${API_BASE}/conversation/${senderId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }

  return response.json();
}