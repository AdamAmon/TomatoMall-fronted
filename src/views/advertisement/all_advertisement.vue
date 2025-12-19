<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAllAdvertisements, deleteAdvertisement } from "../../api/advertisement";

const router = useRouter();
const role = localStorage.getItem('role');

// 广告列表
const advertisements = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// 获取所有广告
const fetchAdvertisements = async () => {
  try {
    const response = await getAllAdvertisements();
    console.log(response);
    if (response.code == 200) {
      advertisements.value = response.data;
    } else {
      error.value = "获取广告列表失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 删除广告
const deleteAdv = async (advId: number) => {
  try {
    await deleteAdvertisement(advId);
    alert("广告删除成功");
    await fetchAdvertisements(); // 刷新广告列表
  } catch (err) {
    console.error("删除广告失败:", err);
    alert("删除广告失败，请稍后再试");
  }
};

// 处理图片加载失败
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = "https://p1.ssl.qhimg.com/t01a8725fdfc8b703a4.jpg"; // 设置默认占位图
  target.alt = "图片加载失败";
};

//查看详情
const viewAdvertisementDetails = (advId: number) => {
  router.push({ name: 'SingleAdvertisement', params: { advId } });
};


// 跳转到单个商品页面
const viewProduct = (productId: number) => {
  router.push({ name: "SingleProduct", params: { id: productId } });
};

onMounted(() => {
  fetchAdvertisements();
});
</script>

<template>
  <body>
  <div id="app">
    <div class="app-container">
      <div class="header">
        <h1><i class="fas fa-ad"></i> 广告管理系统</h1>
        <div class="header-controls">
          <button class="btn btn-outline" @click="fetchAdvertisements">
            <i class="fas fa-sync-alt"></i> 刷新列表
          </button>
        </div>
      </div>

      <div class="advertisement-list">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div v-else-if="error" class="error">
          <i class="fas fa-exclamation-triangle"></i> {{ error }}
        </div>

        <div v-else-if="advertisements.length === 0" class="empty-state">
          <i class="fas fa-ad"></i>
          <h3>暂无广告数据</h3>
          <p>您还没有创建任何广告，点击下方按钮开始创建</p>
        </div>

        <div v-else>
          <div class="advertisement-grid">
            <div v-for="adv in advertisements" :key="adv.advId" class="advertisement-card">
              <span class="status-badge status-active">
                <i class="fas fa-check-circle"></i> 活跃中
              </span>
              <div class="card-header">
                <h2>{{ adv.title }}</h2>
              </div>
              <div class="card-content">
                <p><strong>内容:</strong> {{ adv.content }}</p>
                <div class="image-container">
                  <img
                      :src="adv.advUrl"
                      alt="广告图片"
                      class="advertisement-image"
                      @error="handleImageError($event)"
                      @click="viewProduct(adv.productId)"
                  >
                  <div class="image-overlay">
                    <p>点击查看商品详情</p>
                  </div>
                </div>
                <p><strong>关联商品ID:</strong> <span class="product-id">{{ adv.productId }}</span></p>
              </div>
              <div class="card-footer" v-if="role === 'MANAGER'">
                <button class="btn btn-outline" @click="viewAdvertisementDetails(adv.advId)">
                  <i class="fas fa-eye"></i> 查看详情
                </button>
                <button class="btn btn-danger" @click="deleteAdv(adv.advId)">
                  <i class="fas fa-trash-alt"></i> 删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
            @click="router.push({ name: 'CreateAdvertisement' })"
            class="btn create-button"
            v-if="role === 'MANAGER'"
        >
          <i class="fas fa-plus-circle"></i> 创建新广告
        </button>
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
  --secondary: #3f37c9;
  --accent: #4895ef;
  --success: #4cc9f0;
  --danger: #f72585;
  --light: #f8f9fa;
  --dark: #212529;
  --gray: #6c757d;
  --card-bg: rgba(255, 255, 255, 0.85);
  --header-gradient: linear-gradient(135deg, #4361ee, #3a0ca3);
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  --transition: all 0.3s ease;
}

body {
  background: linear-gradient(135deg, #f5f7fa, #e4edf9);
  min-height: 100vh;
  padding: 20px;
  color: var(--dark);
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(67, 97, 238, 0.2);
}

.header h1 {
  font-size: 2.5rem;
  background: var(--header-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.header-controls {
  display: flex;
  gap: 15px;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--secondary);
  transform: translateY(-2px);
  box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
}

.btn-danger {
  background: var(--danger);
  color: darkred;
}

.btn-danger:hover {
  background: #d11464;
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
}

.create-button {
  background: linear-gradient(135deg, var(--success), var(--accent));
  color: black;
  padding: 12px 25px;
  border-radius: 50px;
  font-size: 1.1rem;
  margin-top: 20px;
}

/* 网格布局 */
.advertisement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

/* 卡片样式 */
.advertisement-card {
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: var(--transition);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.advertisement-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.card-header {
  padding: 20px 20px 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header h2 {
  font-size: 1.4rem;
  color: var(--secondary);
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-content {
  padding: 15px 20px;
  flex-grow: 1;
}

.card-content p {
  margin-bottom: 12px;
  line-height: 1.6;
  color: var(--gray);
}

.product-id {
  display: inline-block;
  background: rgba(67, 97, 238, 0.1);
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 600;
  color: var(--primary);
}

/* 图片样式 */
.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin: 15px 0;
  height: 200px;
  cursor: pointer;
}

.advertisement-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.image-container:hover .advertisement-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: white;
  padding: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

/* 卡片底部 */
.card-footer {
  padding: 15px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(67, 97, 238, 0.2);
  border-top: 5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error {
  background: #ffebee;
  border-left: 4px solid var(--danger);
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  color: var(--danger);
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  margin: 20px 0;
}

.empty-state i {
  font-size: 4rem;
  color: var(--accent);
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: var(--secondary);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .header-controls {
    justify-content: center;
  }

  .advertisement-grid {
    grid-template-columns: 1fr;
  }
}

/* 状态标签 */
.status-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 10;
}

.status-active {
  background: rgba(76, 201, 240, 0.2);
  color: #0a9396;
}

.status-pending {
  background: rgba(255, 183, 77, 0.2);
  color: #ff9800;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.advertisement-card {
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
}

.advertisement-card:nth-child(1) { animation-delay: 0.1s; }
.advertisement-card:nth-child(2) { animation-delay: 0.2s; }
.advertisement-card:nth-child(3) { animation-delay: 0.3s; }
.advertisement-card:nth-child(4) { animation-delay: 0.4s; }
.advertisement-card:nth-child(5) { animation-delay: 0.5s; }
.advertisement-card:nth-child(6) { animation-delay: 0.6s; }

.advertisement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
}

/* 大屏幕：5列固定 */
@media (min-width: 1200px) {
  .advertisement-grid {
    grid-template-columns: repeat(5, 220px);
  }
}

/* 中屏幕：3列 */
@media (min-width: 900px) and (max-width: 1199px) {
  .advertisement-grid {
    grid-template-columns: repeat(3, 220px);
  }
}

/* 小屏幕：1列 */
@media (max-width: 899px) {
  .advertisement-grid {
    grid-template-columns: 1fr;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* 卡片固定尺寸 */
.advertisement-card {
  width: 100%;
  max-width: 220px;
  min-height: 380px;
  margin: 0 auto;
}

/* 内容区域高度约束 */
.card-content {
  min-height: 300px;
  max-height: 150px;
  overflow: hidden;
}

/* 标题高度限制 */
.card-header h2 {
  height: 2em; /* 限制两行高度 */
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 内容文本省略 */
.card-content p {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3; /* 最多显示3行 */
  -webkit-line-clamp: 3; /* 最多显示3行 */
  -webkit-box-orient: vertical;
}
</style>
