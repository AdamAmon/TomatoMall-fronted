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
  <div class="login-container">
    <div class="background-overlay"></div>

    <div class="login-card">
      <div class="card-header">
        <h1>欢迎回来</h1>
        <p>请登录您的账户</p>
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
                placeholder="请输入用户名"
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
                placeholder="••••••••"
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
            登入账户
          </el-button>

          <div class="register-link">
            还没有账户？<router-link to="/register">立即注册</router-link>
          </div>
        </div>
      </el-form>
    </div>

    <div class="decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
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
  background: url("../../assets/shopping-1s-1084px.svg") center/cover no-repeat;
  opacity: 0.08;
  z-index: 0;
}

.login-card {
  width: 90%;
  max-width: 450px;
  padding: 40px 30px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  z-index: 2;
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.card-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.card-header p {
  font-size: 16px;
  color: #7f8c8d;
}

.login-form {
  margin-top: 20px;
}

.input-group {
  position: relative;
}

.icon-wrapper {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  color: #6e8efb;
}

.custom-input {
  padding-left: 45px;
  height: 50px;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s;
}

.custom-input:focus {
  border-color: #6e8efb;
  box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
}

.form-footer {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(110, 142, 251, 0.4);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(110, 142, 251, 0.6);
}

.login-btn:disabled {
  background: #cccccc;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

.register-link {
  margin-top: 20px;
  font-size: 14px;
  color: #7f8c8d;
}

.register-link a {
  color: #6e8efb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.register-link a:hover {
  color: #a777e3;
  text-decoration: underline;
}

.decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 15s infinite ease-in-out;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  right: 10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  right: 25%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  25% { transform: translateY(-20px) translateX(10px) rotate(5deg); }
  50% { transform: translateY(15px) translateX(-15px) rotate(-5deg); }
  75% { transform: translateY(-10px) translateX(20px) rotate(8deg); }
}

@media (max-width: 768px) {
  .login-card {
    padding: 30px 20px;
    width: 95%;
  }

  .card-header h1 {
    font-size: 26px;
  }

  .login-btn {
    height: 50px;
  }
}
</style>