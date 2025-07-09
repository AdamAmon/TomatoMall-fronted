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
        <p>加入我们，开始您的管理之旅</p>
      </div>

      <el-form label-position="top" class="custom-form">
        <el-row :gutter="20">
          <el-col :md="12" :sm="24">
            <el-form-item label="真实姓名" :error="!hasInput(name) ? '请输入姓名' : undefined">
              <el-input
                  v-model="name"
                  placeholder="请输入真实姓名"
                  :prefix-icon="User"
                  clearable
              />
            </el-form-item>
          </el-col>

          <el-col :md="12" :sm="24">
            <el-form-item label="用户名" :error="!hasInput(username) ? '请输入用户名' : undefined">
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
            <el-form-item label="密码" :error="!hasInput(password) ? '请输入密码' : undefined">
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
                label="确认密码"
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
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');

.main-frame {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  position: relative;
  overflow: hidden;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('../../assets/shopping-1s-1084px.svg') center/cover no-repeat;
  opacity: 0.1;
  z-index: 0;
}

.login-card {
  width: 90%;
  max-width: 800px;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1;
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.card-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.card-header p {
  font-size: 16px;
  color: #7f8c8d;
}

.custom-form {
  padding: 0 15px;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-form-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: #34495e;
  padding-bottom: 6px;
}

.avatar-preview {
  margin-top: 10px;
  text-align: center;
}

.avatar-preview img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.register-btn {
  width: 100%;
  max-width: 300px;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(110, 142, 251, 0.4);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(110, 142, 251, 0.6);
}

.register-btn:disabled {
  background: #cccccc;
  transform: none;
  box-shadow: none;
}

.login-link {
  margin-top: 20px;
  font-size: 14px;
  color: #7f8c8d;
}

.login-link a {
  color: #6e8efb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.login-link a:hover {
  color: #a777e3;
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-card {
    width: 95%;
    padding: 20px;
  }

  .card-header h1 {
    font-size: 24px;
  }

  .register-btn {
    height: 50px;
  }
}
</style>