<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="brand-mark">
          <img v-if="showLogo" :src="brandLogo" alt="火宝短剧" class="brand-logo" @error="showLogo = false" />
          <span v-else class="brand-fallback">火</span>
        </div>
        <h1 class="auth-title">火宝短剧</h1>
        <p class="auth-sub">AI 驱动的短剧制作平台</p>
      </div>

      <div class="auth-tabs">
        <button :class="['tab', { active: mode === 'login' }]" @click="mode = 'login'">登录</button>
        <button :class="['tab', { active: mode === 'register' }]" @click="mode = 'register'">注册</button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div v-if="mode === 'register'" class="field">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required />
        </div>
        <div class="field">
          <label>邮箱</label>
          <input v-model="form.email" type="email" placeholder="请输入邮箱" required />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码（至少6位）" required minlength="6" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary submit-btn" :disabled="submitting">
          {{ submitting ? '请稍候...' : (mode === 'login' ? '登录' : '注册') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import brandLogo from '~/assets/huobao-logo.png'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: false })

const { login, register, isLoggedIn } = useAuth()
const showLogo = ref(true)
const mode = ref<'login' | 'register'>('login')
const submitting = ref(false)
const error = ref('')
const form = reactive({ email: '', username: '', password: '' })

if (isLoggedIn.value) {
  navigateTo('/')
}

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    if (mode.value === 'login') {
      await login(form.email, form.password)
    } else {
      await register(form.email, form.username, form.password)
    }
    navigateTo('/')
  } catch (e: any) {
    error.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-base);
  padding: 20px;
}

.auth-card {
  width: 100%; max-width: 400px;
  background: var(--bg-0);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: var(--shadow-panel);
}

.auth-header {
  text-align: center; margin-bottom: 28px;
}
.brand-mark {
  width: 52px; height: 52px; margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); border-radius: 14px;
  border: 1px solid var(--border);
  overflow: hidden;
}
.brand-logo { width: 34px; height: 34px; object-fit: contain; }
.brand-fallback {
  font-family: var(--font-display); font-size: 24px; font-weight: 700;
  color: var(--accent-text);
}
.auth-title {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 700; color: var(--text-0);
}
.auth-sub {
  font-size: 13px; color: var(--text-3); margin-top: 4px;
}

.auth-tabs {
  display: flex; gap: 0; margin-bottom: 24px;
  background: var(--bg-2); border-radius: var(--radius);
  padding: 3px;
}
.tab {
  flex: 1; padding: 8px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--text-2);
  background: transparent; border-radius: calc(var(--radius) - 2px);
  transition: all 0.2s;
}
.tab.active {
  background: var(--bg-0); color: var(--text-0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  font-weight: 600;
}

.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: 13px; font-weight: 500;
  color: var(--text-1); margin-bottom: 6px;
}
.field input {
  width: 100%; padding: 10px 14px;
  font-size: 14px; color: var(--text-0);
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  outline: none; transition: border-color 0.2s;
}
.field input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.error-msg {
  padding: 10px 14px; margin-bottom: 16px;
  background: var(--error-bg); color: var(--error);
  border-radius: var(--radius); font-size: 13px;
}

.submit-btn {
  width: 100%; padding: 11px; font-size: 14px; font-weight: 600;
  margin-top: 4px;
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
