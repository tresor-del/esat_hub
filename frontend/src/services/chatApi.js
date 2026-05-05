import api, { API_BASE_URL } from "../utils/axiosConfig";

export const getChatHistory = async (recipientId) => {
    const response = await api.get(`/chat/history/${recipientId}`)
    return response.data
}

export const getRecentChat = async () => {
    const response = await api.get(`/chat/recent`)
    return response.data
}