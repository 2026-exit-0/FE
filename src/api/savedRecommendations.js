export async function loadSavedRecommendations(client, sessionId) {
  const path = `/scans/${encodeURIComponent(sessionId)}/recommend`;
  try {
    return await client.get(path);
  } catch (error) {
    if (error.response?.status !== 404) throw error;
    return client.post(path);
  }
}
