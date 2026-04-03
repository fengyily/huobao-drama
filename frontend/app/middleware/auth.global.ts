export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const token = localStorage.getItem('huobao_token')
  const isAuthPage = to.path === '/login'

  if (!token && !isAuthPage) {
    return navigateTo('/login')
  }

  if (token && isAuthPage) {
    return navigateTo('/')
  }
})
