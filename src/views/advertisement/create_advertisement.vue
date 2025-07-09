<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createAdvertisement } from "../../api/advertisement";

const router = useRouter();

// 广告信息
const newAdvertisement = ref({
  title: "",
  content: "",
  advUrl: "",
  productId: 0,
});

// 加载状态
const loading = ref(false);
const error = ref<string | null>(null);

// 创建广告
const createAdv = async () => {
  try {
    loading.value = true;
    await createAdvertisement(newAdvertisement.value);
    ElMessage.success("广告创建成功");
    await router.push({name: "AllAdvertisements"}); // 返回广告列表页
  } catch (err) {
    console.error("创建广告失败:", err);
    error.value = "创建广告失败，请稍后再试";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <body>
  <div id="app" class="ad-container">
    <div class="decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="header-card">
      <h1>创建新广告</h1>
      <p>设计引人注目的广告内容，提升您的产品曝光度</p>
    </div>

    <div class="form-card">
      <div class="form-header">
        <i class="fas fa-bullhorn"></i>
        <h2>广告信息表单</h2>
      </div>

      <div class="form-content">
        <div class="form-row">
          <label><i class="fas fa-heading"></i> 广告标题</label>
          <input type="text" v-model="newAdvertisement.title" placeholder="输入吸引人的广告标题">
          <i class="fas fa-pen input-icon"></i>
        </div>

        <div class="form-row">
          <label><i class="fas fa-align-left"></i> 广告内容</label>
          <textarea v-model="newAdvertisement.content" placeholder="输入详细广告内容"></textarea>
        </div>

        <div class="form-row">
          <label><i class="fas fa-link"></i> 广告链接</label>
          <input type="url" v-model="newAdvertisement.advUrl" placeholder="输入广告图像链接">
          <i class="fas fa-globe input-icon"></i>
        </div>

        <div class="form-row">
          <label><i class="fas fa-tag"></i> 关联商品ID</label>
          <input type="number" v-model="newAdvertisement.productId" placeholder="输入关联的商品ID">
          <i class="fas fa-shopping-bag input-icon"></i>
        </div>

      </div>

      <div class="form-footer">
        <div class="error-message" v-if="error">
          <i class="fas fa-exclamation-triangle"></i> {{ error }}
        </div>
        <div class="action-buttons">
          <button class="submit-btn" :disabled="loading" @click="createAdv">
            <i class="fas fa-plus"></i>
            {{ loading ? "提交中..." : "创建广告" }}
          </button>
        </div>
      </div>
    </div>
  </div>
  </body>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
  min-height: 100vh;
  padding: 20px;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ad-container {
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
}

.header-card {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.6s ease-out;
}

.header-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(30deg);
}

.header-card h1 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}

.header-card p {
  font-size: 18px;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  position: relative;
  z-index: 2;
}

.form-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideUp 0.8s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-header {
  padding: 25px 30px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
}

.form-header i {
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
}

.form-header h2 {
  font-size: 24px;
  color: #fff;
  font-weight: 600;
}

.form-content {
  padding: 30px;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 25px;
  position: relative;
}

.form-row label {
  font-weight: 500;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  font-size: 16px;
}

.form-row label i {
  margin-right: 10px;
  color: #6e8efb;
}

.form-row input,
.form-row textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  transition: all 0.3s ease;
}

.form-row input:focus,
.form-row textarea:focus {
  border-color: #6e8efb;
  box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.3);
  outline: none;
  background: rgba(0, 0, 0, 0.3);
}

.form-row textarea {
  min-height: 150px;
  resize: vertical;
}

.form-footer {
  padding: 25px 30px;
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.submit-btn {
  padding: 14px 35px;
  background: linear-gradient(to right, #10b981, #34d399);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.submit-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  padding: 14px 30px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.error-message {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  font-weight: 500;
  border: 1px solid rgba(255, 107, 107, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
}

.decoration {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(110, 142, 251, 0.1) 0%, rgba(110, 142, 251, 0) 70%);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -100px;
  right: -100px;
  animation-delay: 5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -15px) rotate(10deg); }
  50% { transform: translate(-15px, 15px) rotate(-10deg); }
  75% { transform: translate(-20px, -10px) rotate(5deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.input-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
}

.preview-section {
  margin-top: 30px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.preview-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.preview-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-card h3 {
  color: #6e8efb;
  margin-bottom: 10px;
  font-size: 20px;
}

.preview-card p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15px;
  line-height: 1.6;
}

.preview-card a {
  color: #34d399;
  text-decoration: none;
  display: inline-block;
  margin-top: 10px;
  font-weight: 500;
}

.preview-card a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .header-card h1 {
    font-size: 28px;
  }

  .header-card p {
    font-size: 16px;
  }

  .form-header h2 {
    font-size: 20px;
  }

  .form-content {
    padding: 20px;
  }

  .form-footer {
    flex-direction: column;
    gap: 20px;
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
  }

  .submit-btn, .cancel-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
