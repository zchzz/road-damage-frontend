import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const client = axios.create({
  baseURL,
  timeout: 300000
})

client.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      '请求失败'

    return Promise.reject(new Error(message))
  }
)

export function getApiBaseUrl() {
  return baseURL
}

export default client