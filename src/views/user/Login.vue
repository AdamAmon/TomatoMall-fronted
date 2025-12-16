<script setup lang="ts">
import { ref, computed } from 'vue'
import { router } from '../../router'
import { userInfo, userLogin } from "../../api/account.ts"
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const username = ref('')
const password = ref('')

const hasusernameInput = computed(() => username.value.trim() !== '')
const hasPasswordInput = computed(() => password.value.trim() !== '')
const loginDisabled = computed(() => !(hasusernameInput.value && hasPasswordInput.value))

function handleLogin() {
  userLogin({
    username: username.value,
    password: password.value
  }).then(res => {
    if (res.data.code === '200') {
      ElMessage({
        message: "登录成功！",
        type: 'success',
      })
      const token = res.data.data
      sessionStorage.setItem('token', token)
      localStorage.setItem('token', token)

      userInfo("123456").then(res => {
        sessionStorage.setItem('username', res.data.data.username)
        sessionStorage.setItem('role', res.data.data.role)
        sessionStorage.setItem('userId', res.data.data.id.toString())

        localStorage.setItem('username', res.data.data.username)
        localStorage.setItem('role', res.data.data.role)
        localStorage.setItem('userId', res.data.data.id.toString())
        router.push({ path: "/dashboard" })
      })
    } else if (res.data.code == '400') {
      ElMessage({
        message: res.data.msg,
        type: 'error',
      })
      password.value = ''
    }
  })
}
</script>

<template>
  <div class="login-shell">
    <div class="background-hero">
      <div class="hero-overlay"></div>
      <div class="hero-rotator">
        <div class="hero-slide slide-1">
          <div class="hero-badge">图书管理</div>
          <h2>书海万卷，登录即享</h2>
          <p>精选图书、便捷配送、畅快结算，多端同步阅读记录，随时开启你的阅读旅程。</p>
        </div>
        <div class="hero-slide slide-2">
          <div class="hero-badge">书单精选</div>
          <h2>编辑精选，品质首推</h2>
          <p>每周更新编辑推荐与榜单好书，帮你快速锁定下一本心仪读物。</p>
        </div>
        <div class="hero-slide slide-3">
          <div class="hero-badge">安心体验</div>
          <h2>下单便捷，售后省心</h2>
          <p>清晰的订单流程与客服支持，让购买与收货一样顺畅。</p>
        </div>
      </div>
    </div>

    <div class="login-card">
      <div class="card-header">
        <h1>欢迎回来</h1>
        <p>请输入账号和密码</p>
      </div>

      <el-form class="login-form">
        <el-form-item>
          <div class="input-group">
            <div class="icon-wrapper">
              <el-icon><User /></el-icon>
            </div>
            <el-input
                id="username"
                v-model="username"
                placeholder="手机号 / 用户名"
                class="custom-input"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <div class="input-group">
            <div class="icon-wrapper">
              <el-icon><Lock /></el-icon>
            </div>
            <el-input
                id="password"
                type="password"
                v-model="password"
                placeholder="输入密码"
                class="custom-input"
                show-password
            />
          </div>
        </el-form-item>

        <div class="form-footer">
          <el-button
              @click.prevent="handleLogin"
              :disabled="loginDisabled"
              type="primary"
              class="login-btn"
          >
            立即登录
          </el-button>

          <div class="register-link">
            还没有账户？<router-link to="/register">免费注册</router-link>
          </div>
        </div>
      </el-form>
    </div>
  </div>
  <div class="page-footer">Copyright © 2023-2027 502小组 版权所有</div>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: #f6f7fb;
  position: relative;
  overflow: hidden;
  padding: 24px;
  color: #1f2937;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}

.background-hero {
  flex: 1.2;
  min-height: 540px;
  max-width: 720px;
  background: linear-gradient(135deg, #e5e7eb 0%, #f8fafc 35%, #e0e7ff 100%);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
  display: flex;
  align-items: flex-end;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: url('../../assets/shopping-1s-1084px.svg') center/75% no-repeat;
  opacity: 0.12;
}

.hero-rotator {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 28px;
  max-width: 640px;
  min-height: 180px;
}

.hero-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: slideSwap 12s infinite;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  text-align: left;
}

.slide-1 { animation-delay: 0s; }
.slide-2 { animation-delay: 4s; }
.slide-3 { animation-delay: 8s; }

@keyframes slideSwap {
  0% { opacity: 0; transform: translateY(10px); }
  5% { opacity: 1; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(0); }
  40% { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 0; transform: translateY(10px); }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 700;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
  width: fit-content;
}

.hero-slide h2 {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
}

.hero-slide p {
  font-size: 15px;
  color: #475569;
  line-height: 1.7;
  margin: 0;
  max-width: 520px;
  word-break: keep-all;
}

.login-card {
  width: 440px;
  padding: 24px 22px 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 16px 45px rgba(15, 23, 42, 0.14);
  border: 1px solid #eef2f7;
  animation: fadeIn 0.7s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header {
  text-align: center;
  margin-bottom: 16px;
}

.card-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.2px;
  margin-bottom: 6px;
}

.card-header p {
  font-size: 14px;
  color: #4b5563;
}

.login-form {
  margin-top: 12px;
  width: 100%;
  padding: 0;
}

.el-form-item {
  width: 100%;
  margin-bottom: 14px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  height: 52px;
  width: 100%;
}

.icon-wrapper {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  color: #2563eb;
}


.custom-input {
  width: 100%;
}

.custom-input :deep(.el-input__wrapper) {
  height: 52px;
  padding-left: 44px;
  padding-right: 44px; /* 为右侧眼睛预留空间，避免挤压宽度 */
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  transition: all 0.24s ease;
}

.custom-input :deep(.el-input__inner) {
  height: 52px;
  line-height: 52px;
  font-size: 15px;
}

/* 控制密码显示按钮在框内悬停，不改变整体宽度 */
.custom-input :deep(.el-input__suffix) {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  display: flex;
  align-items: center;
  height: 52px;
}

.custom-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.form-footer {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 52px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  border: none;
  transition: all 0.25s ease;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.34);
}

.login-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.register-link {
  margin-top: 4px;
  font-size: 14px;
  color: #4b5563;
  text-align: center;
}

.register-link a {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.register-link a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}


@media (max-width: 900px) {
  .login-shell {
    flex-direction: column;
    padding: 18px;
  }

  .background-hero {
    width: 100%;
    min-height: 260px;
    max-width: none;
    align-items: flex-end;
  }

  .login-card {
    width: 100%;
    max-width: 460px;
  }
}

@media (max-width: 768px) {
  .login-shell {
    padding: 18px;
  }

  .login-card {
    padding: 20px 18px 18px;
  }

  .card-header h1 {
    font-size: 26px;
  }
}

.page-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  opacity: 0.95;
  pointer-events: none;
}
</style>