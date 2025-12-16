<script setup lang="ts">
import {router} from '../router'
import {parseRole} from "../utils"
import {User, SwitchButton} from "@element-plus/icons-vue"   //图标

const role = sessionStorage.getItem('role')    //登录的时候插入的

//退出登录
function logout() {
  ElMessageBox.confirm(
      '是否要退出登录？',
      '提示',
      {
        customClass: "customDialog",
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: "warning",
        showClose: false,
        roundButton: true,
        center: true
      }
  ).then(() => {
    sessionStorage.setItem('token', '')
    router.push({path: "/login"})
  })
}
</script>


<template>
  <el-header class="custom-header" height="76">
    <div class="header-inner">
      <div class="brand" @click="router.push({ path: '/dashboard' })">
        <div class="brand-mark"><img class="brand-logo" src="/bluewhale.svg" alt="Bluewhale Logo" /></div>
        <div class="brand-text">
          <span class="brand-name">蓝鲸书城</span>
          <span class="brand-sub">Bluewhale Bookstore</span>
        </div>
      </div>

      <div class="header-actions">
        <el-tag class="role-tag" size="large">{{ parseRole(role) }}版</el-tag>
        <div class="icon-btn" @click="router.push({ path: '/dashboard' })">
          <el-icon><User /></el-icon>
        </div>
        <div class="icon-btn" @click="logout">
          <el-icon><SwitchButton /></el-icon>
        </div>
      </div>
    </div>
  </el-header>
</template>


<style scoped>
.custom-header {
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
  padding: 0 24px;
  display: flex;
  align-items: center;
}

.header-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  color: #fff;
}

.brand-mark {
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  width: 48px;
  height: 48px;
  display: block;
  object-fit: contain;
  background: #ffffff; /* 图标背景为白色 */
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-size: 18px;
  font-weight: 800;
}

.brand-sub {
  font-size: 12px;
  opacity: 0.86;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-tag {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-weight: 700;
  letter-spacing: 0.2px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
}

.icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.22);
}

.icon-btn:active {
  transform: translateY(0);
}
</style>
