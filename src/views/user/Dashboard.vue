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
function navigateToOrders() {
  router.push({ path: "/order/latest" });
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
            <p>欢迎使用蓝鲸书城</p>
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
                <p>探索蓝鲸书城最新图书</p>
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

            <div class="action-card" @click="navigateToOrders">
              <div class="action-icon">
                <el-icon><Goods /></el-icon>
              </div>
              <div class="action-content">
                <h3>我的订单</h3>
                <p>查看最近完成的订单</p>
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

            <div class="action-card" v-if="role === 'MANAGER'" @click="navigateToAdvertisements">
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
            <h2><i class="fas fa-user-circle"></i> {{ displayInfoCard ? '个人信息' : '编辑个人信息' }}</h2>
            <template v-if="displayInfoCard">
              <el-button
                  @click="displayInfoCard = false"
                  type="primary"
                  :icon="Edit"
                  class="edit-btn"
              >
                编辑信息
              </el-button>
            </template>
            <template v-else>
              <div class="edit-actions">
                <el-button class="ghost-btn" :icon="ArrowLeft" @click="displayInfoCard = true">
                  返回
                </el-button>
                <el-button
                    type="primary"
                    class="header-save"
                    :disabled="updateDisabled"
                    @click="updateInfo"
                >
                  确认
                </el-button>
              </div>
            </template>
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
              <el-form-item label="真实姓名">
                <el-input
                    v-model="newName"
                    :prefix-icon="User"
                    placeholder="请输入新姓名"
                    clearable
                    size="large"
                />
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
  <div class="page-footer">Copyright © 2023-2027 502小组 版权所有</div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:root {
  --primary: #2563eb;
  --secondary: #1d4ed8;
  --accent: #38bdf8;
  --danger: #e74c3c;
  --warning: #f59e0b;
  --success: #10b981;
  --dark: #0f172a;
  --light: #f8fafc;
  --gray: #64748b;
  --card-bg: rgba(255, 255, 255, 0.96);
  --shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
  --font-large: 16px;
  --font-xlarge: 18px;
  --font-xxlarge: 22px;
}

body {
  background: linear-gradient(135deg, #e5e7eb 0%, #f8fafc 35%, #e0e7ff 100%);
  min-height: 100vh;
  padding: 16px;
  color: var(--dark);
  overflow-x: hidden;
}

.dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 18px;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 22px 30px;
  margin-bottom: 26px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(6px);
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
  font-size: 28px;
  margin: 0;
  color: var(--dark);
  font-weight: 700;
  margin-bottom: 5px;
}

.user-meta p {
  margin: 0;
  color: var(--gray);
  font-size: 16px;
}

.vip-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
}

.vip-badge {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  padding: 10px 25px;
  border-radius: 50px;
  font-weight: bold;
  color: #1e3a8a;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticket-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: var(--primary);
  font-weight: 600;
  background: rgba(37, 99, 235, 0.08);
  padding: 10px 18px;
  border-radius: 50px;
}

/* 修改布局：左侧1/3，右侧2/3 */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 22px;
  align-items: stretch;
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
  padding: 22px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(6px);
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
  margin-bottom: 18px;
  padding-bottom: 14px;
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
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 18px;
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.04);
  transition: all 0.24s ease;
  cursor: pointer;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  background: rgba(37, 99, 235, 0.08);
}

.action-icon {
  width: 50px;
  height: 50px;
  background: rgba(37, 99, 235, 0.12);
  border-radius: 14px;
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
  padding: 26px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(6px);
  position: relative;
  overflow: hidden;
  border: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to right, var(--primary), var(--accent));
}

.user-info { padding: 12px 0; flex: 1; display: flex; }

/* 增大描述列表的尺寸 */
.el-descriptions {
  border-radius: 15px;
  overflow: hidden;
  font-size: var(--font-large);
  width: 100%;
  height: 100%;
}

.el-descriptions-item__label {
  font-weight: 600;
  font-size: var(--font-large);
  padding: 18px 18px !important;
  min-height: 72px;
}

.el-descriptions-item__content {
  font-size: var(--font-large);
  padding: 18px 18px !important;
  min-height: 72px;
}

.edit-form { padding: 12px 0; }

.form-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 18px;
}

.form-header h3 {
  margin: 0;
  color: var(--dark);
  font-size: 22px;
  font-weight: 600;
}

/* 增大表单标签 */
.el-form-item__label {
  font-size: var(--font-large) !important;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

/* 增大输入框 */
.el-input { font-size: var(--font-large); }

.el-input__inner {
  height: 52px !important;
  padding: 0 16px 0 44px !important;
  font-size: var(--font-large) !important;
  border-radius: 12px !important;
}

.el-input__prefix { left: 16px; }

.el-input__suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0;
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
  box-shadow: 0 5px 15px rgba(37, 99, 235, 0.25);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 24px;
}

.save-btn {
  background: linear-gradient(to right, var(--primary), var(--secondary));
  border: none;
  padding: 0 26px;
  font-weight: 700;
  transition: all 0.24s ease;
  color: #fff;
  border-radius: 12px;
  font-size: 15px;
  height: 52px;
}

.save-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.32);
}

.edit-btn {
  height: 42px;
  border-radius: 12px;
  padding: 0 18px;
  font-weight: 700;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.1);
  transition: all 0.22s ease;
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.16);
}

.edit-btn:active {
  transform: translateY(-1px);
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ghost-btn {
  height: 42px;
  border-radius: 12px;
  padding: 0 16px;
  font-weight: 700;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
}

.ghost-btn:hover { box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12); }

.header-save {
  height: 42px;
  border-radius: 12px;
  padding: 0 18px;
  font-weight: 700;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.1);
  transition: all 0.22s ease;
}

.header-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.16);
}

.header-save:active { transform: translateY(-1px); }

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
  background: rgba(37, 99, 235, 0.06);
  animation: float 25s infinite ease-in-out;
}

.circle-1 {
  width: 320px;
  height: 320px;
  top: -160px;
  left: -160px;
  animation-delay: 0s;
}

.circle-2 {
  width: 240px;
  height: 240px;
  bottom: -120px;
  right: -120px;
  animation-delay: 5s;
}

.circle-3 {
  width: 220px;
  height: 220px;
  top: 50%;
  right: 8%;
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