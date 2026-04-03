import { ref, computed, readonly } from 'vue'
import { api } from './useApi'

interface User {
  id: number
  email: string
  username: string
  avatar?: string
  role: string
}

const TOKEN_KEY = 'huobao_token'
const user = ref<User | null>(null)
const loading = ref(true)

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    setToken(data.token)
    user.value = data.user
    return data
  }

  async function register(email: string, username: string, password: string) {
    const data = await api.post<{ token: string; user: User }>('/auth/register', { email, username, password })
    setToken(data.token)
    user.value = data.user
    return data
  }

  async function fetchUser() {
    const token = getToken()
    if (!token) {
      user.value = null
      loading.value = false
      return
    }
    try {
      const data = await api.get<User>('/auth/me')
      user.value = data
    } catch {
      clearToken()
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearToken()
    user.value = null
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    isLoggedIn,
    login,
    register,
    fetchUser,
    logout,
    getToken,
  }
}
