<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getSingleAdvertisement, updateAdvertisement, AdvertisementInfo } from "../../api/advertisement";
import { ElMessage } from "element-plus";

const route = useRoute();
const router = useRouter();

// 广告信息
const advertisement = ref<AdvertisementInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isEditing = ref(false);

// 获取广告详情
const fetchAdvertisement = async () => {
  try {
    const advId = parseInt(route.params.advId as string, 10);
    const response = await getSingleAdvertisement(advId);
    console.log("获取广告详情:", response);

    if (response.code == 200) {
      advertisement.value = response.data;
      console.log("广告信息:", advertisement.value);
    } else {
      error.value = "获取广告详情失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 更新广告信息
const saveAdvertisement = async () => {
  try {
    if (!advertisement.value) return;

    console.log("更新广告请求数据:", advertisement.value);
    const response = await updateAdvertisement(advertisement.value);
    console.log("更新广告响应:", response);

    if (response.code == 200) {
      ElMessage.success("广告更新成功");
      isEditing.value = false; // 切换回只读模式
      advertisement.value = response.data; // 更新广告信息
      await fetchAdvertisement();
    } else {
      ElMessage.error(`广告更新失败: ${response.msg}`);
    }
  } catch (err) {
    console.error("更新广告失败:", err);
    ElMessage.error("更新广告失败，请稍后再试");
  }
};

// // 删除广告
// const deleteAdv = async () => {
//   try {
//     const advId = parseInt(route.params.advId as string, 10);
//     const response = await deleteAdvertisement(advId);
//     console.log("删除广告响应:", response);
//
//     if (response.code === 200) {
//       ElMessage.success("广告删除成功");
//       await router.push({ name: "AllAdvertisements" }); // 返回广告列表页
//     } else {
//       ElMessage.error(`广告删除失败: ${response.msg}`);
//     }
//   } catch (err) {
//     console.error("删除广告失败:", err);
//     ElMessage.error("删除广告失败，请稍后再试");
//   }
// };

const cancelEdit = () => {
  isEditing.value = false;
};

// 跳转到单个商品页面
const viewProduct = (productId: number) => {
  router.push({ name: "SingleProduct", params: { id: productId } });
};

onMounted(() => {
  fetchAdvertisement();
});
</script>

<template>
  <body>
  <div id="app">
    <div class="app-container">
      <!-- 浮动气泡背景 -->
      <div class="floating-bubbles">
        <div class="bubble" style="width: 40px; height: 40px; top: 10%; left: 5%; animation-delay: 0s;"></div>
        <div class="bubble" style="width: 60px; height: 60px; top: 20%; left: 80%; animation-delay: 2s;"></div>
        <div class="bubble" style="width: 30px; height: 30px; top: 40%; left: 40%; animation-delay: 4s;"></div>
        <div class="bubble" style="width: 50px; height: 50px; top: 70%; left: 20%; animation-delay: 6s;"></div>
        <div class="bubble" style="width: 25px; height: 25px; top: 85%; left: 70%; animation-delay: 8s;"></div>
      </div>

      <div class="header">
        <h1>广告详情管理</h1>
        <div class="header-controls">
          <button class="btn btn-success" v-if="isEditing" @click="saveAdvertisement">
            <i class="fas fa-save"></i> 保存更改
          </button>
          <button class="btn btn-outline" v-if="isEditing" @click="cancelEdit">
            <i class="fas fa-times"></i> 取消编辑
          </button>
          <button class="btn btn-primary" v-if="!isEditing" @click="isEditing = true">
            <i class="fas fa-edit"></i> 编辑广告
          </button>
        </div>
      </div>

      <div class="content-container">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div v-else-if="error" class="error-message">
          <i class="fas fa-exclamation-triangle"></i> {{ error }}
        </div>

        <template v-else>
          <!-- 图片区域 -->
          <div class="image-section card-hover">
            <div class="image-container">
              <img :src="advertisement?.advUrl" alt="广告图片" class="ad-image">
              <div class="image-overlay">
                <h3 class="neon-text">{{ advertisement?.title }}</h3>
                <p>点击图片查看商品详情</p>
              </div>
            </div>
            <button class="btn btn-primary view-product-btn" @click="viewProduct(advertisement?.productId || 0)">
              <i class="fas fa-shopping-cart"></i> 查看商品
            </button>
          </div>

          <!-- 信息区域 -->
          <div class="info-section card-hover">
            <div class="info-grid">
              <!-- 全宽信息项 -->
              <div class="info-item full-width">
                <label class="info-label">广告标题</label>
                <template v-if="isEditing">
                  <input v-if="advertisement" v-model="advertisement.title" type="text">
                  <input v-else type="text" disabled placeholder="广告信息不存在">
                </template>
                <div v-else class="info-value">{{ advertisement?.title || '无' }}</div>
              </div>

              <!-- 半宽信息项 -->
              <div class="info-item">
                <label class="info-label">状态</label>
                <div class="info-value">
                  <span class="status-indicator active">
                    <i class="fas fa-check-circle"></i> 活跃中
                  </span>
                </div>
              </div>

              <div class="info-item">
                <label class="info-label">创建时间</label>
                <div class="info-value">2023-10-15 14:30:25</div>
              </div>

              <!-- 全宽信息项 -->
              <div class="info-item full-width">
                <label class="info-label">关联商品ID</label>
                <template v-if="isEditing">
                  <input v-if="advertisement" v-model.number="advertisement.productId" type="number" min="1">
                  <input v-else type="number" disabled placeholder="广告信息不存在">
                </template>
                <div v-else class="info-value">{{ advertisement?.productId }}</div>
              </div>

              <!-- 全宽信息项 -->
              <div class="info-item full-width">
                <label class="info-label">广告图片URL</label>
                <template v-if="isEditing">
                  <input
                      v-if="advertisement"
                      v-model="advertisement.advUrl"
                      type="text"
                      placeholder="输入图片URL"
                  >
                  <input
                      v-else
                      type="text"
                      disabled
                      placeholder="广告信息不存在"
                  >
                </template>
                <div v-else class="info-value url-preview">
                  {{ advertisement?.advUrl || '无' }}
                </div>
              </div>

              <!-- 半宽信息项 -->
              <div class="info-item">
                <label class="info-label">广告ID</label>
                <div class="info-value">{{ advertisement?.advId }}</div>
              </div>

              <!-- 全宽信息项 -->
              <div class="info-item full-width">
                <label class="info-label">广告内容</label>
                <template v-if="isEditing">
                  <textarea
                      v-if="advertisement"
                      v-model="advertisement.content"
                  ></textarea>
                  <textarea
                      v-else
                      disabled
                      placeholder="广告信息不存在"
                  ></textarea>
                </template>
                <div v-else class="info-value">
                  {{ advertisement?.content || '无' }}
                </div>
              </div>
            </div>
          </div>
        </template>
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:root {
  --primary: #4361ee;
  --primary-dark: #3a0ca3;
  --secondary: #7209b7;
  --accent: #f72585;
  --light: #f8f9fa;
  --dark: #1a1a2e;
  --darker: #16213e;
  --success: #4cc9f0;
  --warning: #fca311;
  --danger: #e63946;
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-border: rgba(255, 255, 255, 0.1);
  --text-light: #e6e6e6;
  --text-lighter: #ffffff;
  --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --gradient-bg: linear-gradient(135deg, var(--darker), var(--dark));
}

body {
  background: var(--gradient-bg);
  min-height: 100vh;
  padding: 20px;
  color: var(--text-light);
  background-attachment: fixed;
  background-size: cover;
  overflow-x: hidden;
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 30px;
  position: relative;
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
}

.header h1 {
  font-size: 2.8rem;
  font-weight: 800;
  background: linear-gradient(to right, var(--accent), var(--success));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.5px;
  position: relative;
}

.header h1::after {
  content: '详情页面';
  position: absolute;
  bottom: -10px;
  left: 0;
  font-size: 1rem;
  background: var(--accent);
  padding: 2px 10px;
  border-radius: 20px;
  color: white;
  font-weight: 500;
}

.header-controls {
  display: flex;
  gap: 15px;
}

.btn {
  padding: 12px 25px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: var(--transition);
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: black;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 20px rgba(67, 97, 238, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, var(--success), #2a9d8f);
  color: blue;
}

.btn-success:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 20px rgba(76, 201, 240, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger), #d00000);
  color: red;
}

.btn-danger:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 20px rgba(230, 57, 70, 0.4);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
}

.content-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 20px;
}

@media (max-width: 900px) {
  .content-container {
    grid-template-columns: 1fr;
  }
}

.image-section {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--card-border);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.image-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(76,201,240,0.1) 0%, transparent 70%);
  z-index: 0;
  animation: rotate 15s linear infinite;
}

.image-container {
  width: 100%;
  height: 350px;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  margin-bottom: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.image-container:hover .ad-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: white;
  padding: 20px;
  text-align: center;
  z-index: 2;
}

.view-product-btn {
  width: 100%;
  padding: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 10px;
  z-index: 1;
}

.info-section {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--card-border);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}

.info-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(247,37,133,0.1) 0%, transparent 70%);
  z-index: 0;
  animation: rotate 20s linear infinite reverse;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  position: relative;
  z-index: 1;
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-item {
  margin-bottom: 25px;
}

.info-label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: var(--success);
  font-weight: 600;
}

.info-value {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 1.1rem;
  color: var(--text-lighter);
  min-height: 52px;
  display: flex;
  align-items: center;
}

/* 确保所有全宽项目具有相同的宽度 */
.info-item.full-width {
  grid-column: span 2;
  width: 100%;
}

/* URL预览样式 */
.url-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 600px) {
  .info-item.full-width {
    grid-column: span 1;
  }
}

input, textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--primary);
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 1.1rem;
  color: var(--text-lighter);
  outline: none;
  transition: all 0.3s ease;
}

input:focus, textarea:focus {
  border-color: var(--success);
  box-shadow: 0 0 0 3px rgba(76, 201, 240, 0.3);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 15px;
  border-radius: 20px;
  font-weight: 600;
  background: rgba(76, 201, 240, 0.15);
  color: var(--success);
}

.status-indicator.active {
  background: rgba(76, 201, 240, 0.15);
  color: var(--success);
}

.status-indicator.inactive {
  background: rgba(252, 163, 17, 0.15);
  color: var(--warning);
}

.action-buttons {
  display: flex;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--card-border);
  flex-wrap: wrap;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  grid-column: span 2;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(67, 97, 238, 0.2);
  border-top: 5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: rgba(230, 57, 70, 0.15);
  border: 1px solid var(--danger);
  border-radius: 12px;
  padding: 20px;
  color: #ff6b6b;
  font-weight: 500;
  grid-column: span 2;
  text-align: center;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.image-section, .info-section {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

.image-section {
  animation-delay: 0.2s;
}

.info-section {
  animation-delay: 0.4s;
}

.neon-text {
  text-shadow: 0 0 5px var(--success), 0 0 10px var(--success), 0 0 20px var(--success);
}

.card-hover {
  transition: var(--transition);
}

.card-hover:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.floating-bubbles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background: rgba(76, 201, 240, 0.1);
  animation: float 15s infinite linear;
}

@keyframes float {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .header-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 10px 15px;
    font-size: 0.9rem;
  }

  .header h1 {
    font-size: 2.2rem;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  border: 1px solid var(--card-border);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(to right, var(--accent), var(--success));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 10px 0;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-light);
}
</style>
