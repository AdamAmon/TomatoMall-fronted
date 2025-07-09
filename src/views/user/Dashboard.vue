<!-- src/views/user/Dashboard.vue -->
<script setup lang="ts">
import { computed, Ref, ref} from 'vue'
import { userInfo, userInfoUpdate } from '../../api/account.ts'
import { parseRole } from "../../utils"
import { router } from '../../router'
import { ArrowRight , ChatLineSquare} from '@element-plus/icons-vue'
import {
  User,
  Iphone,
  Location,
  Picture,
  ShoppingCart,
  Goods,
  Plus,
  Tickets,
  Edit,
  ArrowLeft,
  Message,
} from '@element-plus/icons-vue'

const role = sessionStorage.getItem("role")
const username = sessionStorage.getItem("username")
const name = ref('')
const tel = ref('')
const address = ref('')
const avatar = ref('')
const email = ref('')
const vip = ref('')
const recommendTicket = ref('')
const newName: Ref<string | null> = ref(null);
const newemail: Ref<string | null> = ref(null);
const newtel: Ref<string | null> = ref(null);
const newavatar: Ref<string | null> = ref(null);
const newaddress: Ref<string | null> = ref(null);
const displayInfoCard = ref(true)
const emaillike = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const chinaMobileRegex = /^1\d{10}$/

const hasTelInput = computed(() => newtel.value != '')
const hasEmailInput = computed(() => newemail.value != '')
const emaillegal = computed(() => {
  if (newemail.value === null) return true;
  return emaillike.test(newemail.value);
});
const telLegal = computed(() => {
  if (newtel.value === null) return true;
  return chinaMobileRegex.test(newtel.value);
})
const updateDisabled = computed(() => {
  return !(telLegal.value && emaillegal.value)
})

const originalUserInfo: UpdateInfo = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  address: ''
};

// 导航功能
function navigateToproductList() {
  router.push({ path: "/product/all_product" });
}
function navigateToCart() {
  router.push({ path: "/cart" });
}
function create() {
  router.push({ path: "/product/create_product" });
}
function navigateToAdvertisements() {
  router.push({ name: "AllAdvertisements" });
}
function navigateToCreateAdvertisement() {
  router.push({ name: "CreateAdvertisement" });
}
function navigateToAllCoupons() {
  router.push({ path: "/coupon/all_coupon" });
}

// 获取用户信息
function getUserInfo() {
  userInfo("123456").then(res => {
    name.value = res.data.data.name
    originalUserInfo.name = res.data.data.name
    tel.value = res.data.data.phone
    originalUserInfo.phone = res.data.data.phone
    avatar.value = res.data.data.avatar
    originalUserInfo.avatar = res.data.data.avatar
    address.value = res.data.data.address
    originalUserInfo.address = res.data.data.address
    email.value = res.data.data.email
    originalUserInfo.email = res.data.data.email
    vip.value = res.data.data.vip
    localStorage.setItem("vip", res.data.data.vip.toString());
    recommendTicket.value = res.data.data.recommendTicket
  })
}

interface UpdateInfo {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
}

// 更新用户信息
function updateInfo() {
  const updateFields: Partial<UpdateInfo> = {};
  if (newName.value !== null && newName.value !== originalUserInfo.name) updateFields.name = newName.value || originalUserInfo.name;
  if (newemail.value !== null && newemail.value !== originalUserInfo.email) updateFields.email = newemail.value || originalUserInfo.email;
  if (newtel.value !== null && newtel.value !== originalUserInfo.phone) updateFields.phone = newtel.value || originalUserInfo.phone;
  if (newavatar.value !== null && newavatar.value !== originalUserInfo.avatar) updateFields.avatar = newavatar.value || originalUserInfo.avatar;
  if (newaddress.value !== null && newaddress.value !== originalUserInfo.address) updateFields.address = newaddress.value || originalUserInfo.address;

  userInfoUpdate(updateFields).then(res => {
    if (res.data.code === '200') {
      ElMessage({
        customClass: 'customMessage',
        type: 'success',
        message: '个人信息更新成功！',
      })
      getUserInfo()
      displayInfoCard.value = true
    } else if (res.data.code === '400') {
      ElMessage({
        customClass: 'customMessage',
        type: 'error',
        message: res.data.msg,
      })
    }
  })
}

// 初始化获取用户信息
getUserInfo();
</script>

<template>
  <div id="app">
    <div class="dashboard-container">
      <div class="decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>

      <!-- 顶部用户信息栏 -->
      <div class="user-header">
        <div class="user-avatar">
          <el-avatar :src="avatar" :size="80"></el-avatar>
          <div class="user-meta">
            <h1>您好，{{ username }}！</h1>
            <p>欢迎使用番茄书城</p>
          </div>
        </div>
        <div class="vip-info">
          <div class="vip-badge">
            <i class="fas fa-crown"></i>
            <span>VIP {{ vip }}级</span>
          </div>
          <div class="ticket-info">
            <el-icon><Tickets /></el-icon>
            <span>推荐票: {{ recommendTicket }}</span>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="dashboard-content">
        <!-- 左侧快捷操作区域 -->
        <div class="quick-actions-section">
          <div class="section-header">
            <h2><i class="fas fa-rocket"></i> 快捷操作</h2>
          </div>

          <div class="quick-actions-grid">
            <div class="action-card" @click="navigateToproductList">
              <div class="action-icon">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="action-content">
                <h3>浏览商品</h3>
                <p>探索番茄书城最新图书</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>

            <div class="action-card" @click="navigateToCart">
              <div class="action-icon">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="action-content">
                <h3>我的购物车</h3>
                <p>查看和管理购物车</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>

            <div class="action-card" v-if="role === 'MANAGER'" @click="create">
              <div class="action-icon">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="action-content">
                <h3>添加商品</h3>
                <p>添加新商品到书城</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>

            <div class="action-card" @click="navigateToAdvertisements">
              <div class="action-icon">
                <el-icon><ChatLineSquare /></el-icon>
              </div>
              <div class="action-content">
                <h3>查看广告</h3>
                <p>浏览最新广告活动</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>

            <div class="action-card" v-if="role === 'MANAGER'" @click="navigateToCreateAdvertisement">
              <div class="action-icon">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="action-content">
                <h3>创建广告</h3>
                <p>创建新广告活动</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>

            <div class="action-card" @click="navigateToAllCoupons">
              <div class="action-icon">
                <el-icon><Goods /></el-icon>
              </div>
              <div class="action-content">
                <h3>我的优惠券</h3>
                <p>查看和管理优惠券</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <!-- 右侧个人信息区域 -->
        <div class="info-section">
          <div class="section-header">
            <h2><i class="fas fa-user-circle"></i> 个人信息</h2>
            <el-button
                v-if="displayInfoCard"
                @click="displayInfoCard = false"
                type="primary"
                :icon="Edit"
                plain
                size="large"
            >
              编辑信息
            </el-button>
          </div>

          <div v-if="displayInfoCard" class="user-info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="身份">
                <el-tag type="success" size="large">{{ parseRole(role) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="真实姓名">
                {{ name }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ email }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">
                {{ tel }}
              </el-descriptions-item>
              <el-descriptions-item label="地址">
                {{ address }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 编辑表单 -->
          <div v-else class="edit-form">
            <el-form label-position="top">
              <div class="form-header">
                <el-button @click="displayInfoCard = true" :icon="ArrowLeft" text size="large" >
                  返回
                </el-button>
                <h3>编辑个人信息</h3>
              </div>

              <el-form-item label="真实姓名">
                <el-input
                    v-model="newName"
                    :prefix-icon="User"
                    placeholder="请输入新姓名"
                    clearable
                    size="large"
                />
              </el-form-item>

              <el-form-item label="头像地址">
                <el-input
                    v-model="newavatar"
                    :prefix-icon="Picture"
                    placeholder="请输入新头像URL"
                    clearable
                    size="large"
                />
                <div class="avatar-preview" v-if="newavatar">
                  <img :src="newavatar" alt="头像预览" />
                </div>
              </el-form-item>

              <el-form-item
                  label="邮箱"
                  :error="hasEmailInput && !emaillegal ? '请输入有效的邮箱地址' : ''"
              >
                <el-input
                    v-model="newemail"
                    :prefix-icon="Message"
                    placeholder="请输入新邮箱"
                    :class="{'error-input': hasEmailInput && !emaillegal}"
                    clearable
                    size="large"
                />
              </el-form-item>

              <el-form-item label="地址">
                <el-input
                    v-model="newaddress"
                    :prefix-icon="Location"
                    placeholder="请输入新地址"
                    clearable
                    size="large"
                />
              </el-form-item>

              <el-form-item
                  label="手机号"
                  :error="hasTelInput && !telLegal ? '请输入有效的手机号码' : ''"
              >
                <el-input
                    v-model="newtel"
                    :prefix-icon="Iphone"
                    placeholder="请输入新手机号"
                    :class="{'error-input': hasTelInput && !telLegal}"
                    clearable
                    size="large"
                />
              </el-form-item>

              <div class="form-actions">
                <el-button
                    @click="updateInfo"
                    :disabled="updateDisabled"
                    type="primary"
                    class="save-btn"
                >
                  保存更改
                </el-button>
                <el-button @click="displayInfoCard = true" size="large" type="primary" class="save-btn">
                  取消
                </el-button>
              </div>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:root {
  --primary: #3498db;
  --secondary: #1abc9c;
  --accent: #9b59b6;
  --danger: #e74c3c;
  --warning: #f39c12;
  --success: #2ecc71;
  --dark: #2c3e50;
  --light: #f5f7fa;
  --gray: #7f8c8d;
  --card-bg: rgba(255, 255, 255, 0.95);
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  --font-large: 18px;
  --font-xlarge: 20px;
  --font-xxlarge: 24px;
}

body {
  background: linear-gradient(135deg, #e0e7ff 0%, #d1e0fd 100%);
  min-height: 100vh;
  padding: 20px;
  color: var(--dark);
  overflow-x: hidden;
}

.dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 25px 40px;
  margin-bottom: 30px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.user-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 100%;
  background: linear-gradient(to bottom, var(--primary), var(--secondary));
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 25px;
}

.user-avatar .el-avatar {
  border: 3px solid var(--primary);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.user-meta h1 {
  font-size: 32px; /* 增大字号 */
  margin: 0;
  color: var(--dark);
  font-weight: 700;
  margin-bottom: 5px;
}

.user-meta p {
  margin: 0;
  color: var(--gray);
  font-size: 18px; /* 增大字号 */
}

.vip-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
}

.vip-badge {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  padding: 10px 25px;
  border-radius: 50px;
  font-weight: bold;
  color: #8b4513;
  box-shadow: 0 5px 15px rgba(255, 165, 0, 0.3);
  font-size: 18px; /* 增大字号 */
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticket-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px; /* 增大字号 */
  color: var(--primary);
  font-weight: 600;
  background: rgba(52, 152, 219, 0.1);
  padding: 10px 20px;
  border-radius: 50px;
}

/* 修改布局：左侧1/3，右侧2/3 */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

/* 左侧快捷操作区域 */
.quick-actions-section {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 30px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  border: none;
  height: fit-content;
}

.quick-actions-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to right, var(--primary), var(--secondary));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.section-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--dark);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 15px;
  background: rgba(52, 152, 219, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  background: rgba(52, 152, 219, 0.1);
}

.action-icon {
  width: 50px;
  height: 50px;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: var(--primary);
}

.action-content {
  flex-grow: 1;
}

.action-content h3 {
  font-size: 18px;
  margin-bottom: 5px;
  color: var(--dark);
}

.action-content p {
  color: var(--gray);
  font-size: 14px;
  line-height: 1.4;
}

/* 右侧个人信息区域 - 增大尺寸 */
.info-section {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 35px; /* 增大内边距 */
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  border: none;
  min-height: 650px; /* 设置最小高度 */
}

.info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to right, var(--secondary), var(--accent));
}

.user-info {
  padding: 15px 0; /* 增大内边距 */
}

/* 增大描述列表的尺寸 */
.el-descriptions {
  border-radius: 15px;
  overflow: hidden;
  font-size: var(--font-large); /* 增大字号 */
}

.el-descriptions-item__label {
  font-weight: 600;
  font-size: var(--font-large); /* 增大字号 */
  padding: 16px 20px !important; /* 增大内边距 */
}

.el-descriptions-item__content {
  font-size: var(--font-large); /* 增大字号 */
  padding: 16px 20px !important; /* 增大内边距 */
}

.edit-form {
  padding: 15px 0; /* 增大内边距 */
}

.form-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.form-header h3 {
  margin: 0;
  color: var(--dark);
  font-size: 26px; /* 增大字号 */
  font-weight: 600;
}

/* 增大表单标签 */
.el-form-item__label {
  font-size: var(--font-large) !important;
  font-weight: 600;
  margin-bottom: 10px;
  display: block;
}

/* 增大输入框 */
.el-input {
  font-size: var(--font-large);
}

.el-input__inner {
  height: 50px !important;
  padding: 0 15px !important;
  font-size: var(--font-large) !important;
  border-radius: 12px !important;
}

.el-input__prefix {
  left: 15px;
}

.avatar-preview {
  margin-top: 15px;
  text-align: center;
}

.avatar-preview img {
  width: 120px; /* 增大尺寸 */
  height: 120px; /* 增大尺寸 */
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 35px; /* 增大间距 */
}

.save-btn {
  background: linear-gradient(to right, var(--primary), var(--secondary));
  border: none;
  padding: 16px 40px; /* 增大尺寸 */
  font-weight: bold;
  transition: all 0.3s ease;
  color: black;
  border-radius: 12px;
  font-size: 18px; /* 增大字号 */
  height: auto;
}

.save-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.error-input {
  --el-input-focus-border-color: var(--danger);
}

.error-input:focus {
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}

.decoration {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: -1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(155, 89, 182, 0.05);
  animation: float 25s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  right: -150px;
  animation-delay: 5s;
}

.circle-3 {
  width: 250px;
  height: 250px;
  top: 50%;
  right: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -15px) rotate(10deg); }
  50% { transform: translate(-15px, 15px) rotate(-10deg); }
  75% { transform: translate(-20px, -10px) rotate(5deg); }
}

@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .user-avatar {
    flex-direction: column;
  }

  .vip-info {
    align-items: center;
  }

  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .section-header h2 {
    font-size: 20px;
  }

  /* 移动端调整字体大小 */
  .user-meta h1 {
    font-size: 24px;
  }

  .el-descriptions-item__label,
  .el-descriptions-item__content {
    font-size: 16px !important;
    padding: 12px 15px !important;
  }
}
</style>