<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { router } from '../../router'
import { userRegister } from "../../api/account.ts"
import { ElMessage } from 'element-plus'
import { User, Message, Iphone, Location, Lock, Picture } from '@element-plus/icons-vue'

// 输入框值
const name = ref('')
const email = ref('')
const avatar = ref('')
const username = ref('')
const tel = ref('')
const address = ref('')
const password = ref('')
const confirmPassword = ref('')

// 表单验证
const emaillike = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const chinaMobileRegex = /^1\d{10}$/

const hasInput = (val: string) => val.trim() !== ''
const emaillegal = computed(() => !email.value || emaillike.test(email.value))
const telLegal = computed(() => !tel.value || chinaMobileRegex.test(tel.value))
const isPasswordIdentical = computed(() => password.value === confirmPassword.value)

// 注册按钮可用性
const registerDisabled = computed(() => {
  return !(
      hasInput(name.value) &&
      hasInput(username.value) &&
      hasInput(password.value) &&
      hasInput(confirmPassword.value) &&
      telLegal.value &&
      emaillegal.value &&
      isPasswordIdentical.value
  )
})

// 注册按钮触发
function handleRegister() {
  userRegister({
    role: "CUSTOMER",
    name: name.value,
    phone: tel.value,
    password: password.value,
    address: address.value,
    avatar: avatar.value,
    username: username.value,
    email: email.value,
    vip: 0,
    recommendTicket: 0,
  }).then(res => {
    if (res.data.code === '200') {
      ElMessage({
        message: "注册成功！请登录账号",
        type: 'success',
      })
      router.push({ path: "/login" })
    } else if (res.data.code === '400') {
      ElMessage({
        message: res.data.msg,
        type: 'error',
      })
    }
  })
}

// 添加动态效果
onMounted(() => {
  const card = document.querySelector('.login-card')
  if (card) {
    card.classList.add('animate__animated', 'animate__fadeInUp')
  }
})
</script>

<template>
  <el-main class="main-frame">
    <div class="background-overlay"></div>
    <el-card class="login-card">
      <div class="card-header">
        <h1>创建新账户</h1>
        <p>加入我们，开始您的阅读之旅</p>
      </div>

      <el-form label-position="top" class="custom-form">
        <el-row :gutter="20">
          <el-col :md="12" :sm="24">
            <el-form-item label="真实姓名*" :error="!hasInput(name) ? '请输入姓名' : undefined">
              <el-input
                  v-model="name"
                  placeholder="请输入真实姓名"
                  :prefix-icon="User"
                  clearable
              />
            </el-form-item>
          </el-col>

          <el-col :md="12" :sm="24">
            <el-form-item label="用户名*" :error="!hasInput(username) ? '请输入用户名' : undefined">
              <el-input
                  v-model="username"
                  placeholder="请输入用户名"
                  :prefix-icon="User"
                  clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :md="12" :sm="24">
            <el-form-item label="注册邮箱" :error="hasInput(email) && !emaillegal ? '邮箱格式不正确' : undefined">
              <el-input
                  v-model="email"
                  placeholder="请输入邮箱"
                  :prefix-icon="Message"
                  clearable
              />
            </el-form-item>
          </el-col>

          <el-col :md="12" :sm="24">
            <el-form-item label="手机号" :error="hasInput(tel) && !telLegal ? '请输入有效的手机号' : undefined">
              <el-input
                  v-model="tel"
                  placeholder="请输入手机号"
                  :prefix-icon="Iphone"
                  clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址">
          <el-input
              v-model="address"
              placeholder="请输入地址"
              :prefix-icon="Location"
              clearable
          />
        </el-form-item>

        <el-form-item label="头像地址">
          <el-input
              v-model="avatar"
              placeholder="请输入头像URL"
              :prefix-icon="Picture"
              clearable
          />
          <div class="avatar-preview" v-if="avatar">
            <img :src="avatar" alt="头像预览" />
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :md="12" :sm="24">
            <el-form-item label="密码*" :error="!hasInput(password) ? '请输入密码' : undefined">
              <el-input
                  type="password"
                  v-model="password"
                  placeholder="••••••••"
                  :prefix-icon="Lock"
                  show-password
              />
            </el-form-item>
          </el-col>

          <el-col :md="12" :sm="24">
            <el-form-item
                label="确认密码*"
                :error="hasInput(confirmPassword) && !isPasswordIdentical ? '两次密码不一致' : undefined"
            >
              <el-input
                  type="password"
                  v-model="confirmPassword"
                  placeholder="••••••••"
                  :prefix-icon="Lock"
                  show-password
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-footer">
          <el-button
              @click.prevent="handleRegister"
              :disabled="registerDisabled"
              type="primary"
              class="register-btn"
          >
            创建账户
          </el-button>

          <div class="login-link">
            已有账户？<router-link to="/login">立即登录</router-link>
          </div>
        </div>
      </el-form>
    </el-card>
  </el-main>
  <div class="page-footer">Copyright © 2023-2027 502小组 版权所有</div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');
.main-frame {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e5e7eb 0%, #f8fafc 35%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  color: #1f2937;
}

.background-overlay {
  position: absolute;
  inset: 0;
  background: url('../../assets/shopping-1s-1084px.svg') center/55% no-repeat;
  opacity: 0.08;
  z-index: 0;
  filter: grayscale(1);
}

.login-card {
  width: 100%;
  max-width: 880px;
  padding: 24px 22px 20px;
  border-radius: 16px;
  box-shadow: 0 16px 45px rgba(15, 23, 42, 0.14);
  background: #ffffff;
  z-index: 1;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border: 1px solid #eef2f7;
}

.login-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
}

.card-header {
  text-align: center;
  margin-bottom: 26px;
}

.card-header h1 {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}

.card-header p {
  font-size: 15px;
  color: #4b5563;
}

.custom-form { padding: 0 8px; }

.el-form-item {
  margin-bottom: 16px;
}

.el-form-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  padding-bottom: 6px;
}

.avatar-preview {
  margin-top: 10px;
  text-align: center;
}

.avatar-preview img {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.form-footer { display: flex; flex-direction: column; align-items: stretch; margin-top: 14px; gap: 12px; }

.register-btn {
  width: 100%;
  height: 52px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  border: none;
  border-radius: 12px;
  transition: all 0.25s ease;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
  color: #fff;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.34);
}

.register-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  box-shadow: none;
  transform: none;
}

.login-link {
  margin-top: 6px;
  font-size: 14px;
  color: #4b5563;
  text-align: center;
}

.login-link a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.login-link a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* 统一输入框高度与风格，保留密码眼睛且不影响宽度 */
.custom-form :deep(.el-input__wrapper) {
  height: 52px;
  padding-right: 44px; /* 为右侧眼睛预留空间，确保各输入宽度一致 */
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  transition: all 0.24s ease;
}

.custom-form :deep(.el-input__inner) {
  height: 52px;
  line-height: 52px;
  font-size: 15px;
}

.custom-form :deep(.el-input__suffix) {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 0;
  display: flex;
  align-items: center;
  height: 52px;
}

.custom-form :deep(.el-input__prefix) {
  color: #2563eb;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-card {
    width: 96%;
    padding: 20px 18px 18px;
  }

  .card-header h1 {
    font-size: 26px;
  }

  .register-btn { height: 52px; }
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