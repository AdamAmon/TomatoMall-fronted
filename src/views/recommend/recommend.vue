<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ProductInfo } from "../../api/product";
import { getEverydayRecommend} from "../../api/recommend";

const router = useRouter();
const isActive = ref(false);
const isHovering = ref(false);
const products = ref<ProductInfo[]>([]);
// 面板固定展开方向（右下角固定，向左上展开）
const panelDirection = ref({
  horizontal: 'left',
  vertical: 'top'
});

// 获取推荐商品
const fetchRecommendProducts = async () => {
  try {
    const response = await getEverydayRecommend();
    console.log('获取推荐商品成功:', response);
    if (response.data.code == 200) {
      products.value = response.data.data as ProductInfo[] || [];
    }
  } catch (error) {
    console.error('获取推荐商品失败:', error);
    products.value = [];
  }
};

// 切换面板显示
const togglePanel = () => {
  isActive.value = !isActive.value;
  if (isActive.value && products.value.length === 0) {
    fetchRecommendProducts();
  }
};

// 固定位置时无需动态计算展开方向

// 面板悬停事件
const onPanelEnter = () => isHovering.value = true;
const onPanelLeave = () => isHovering.value = false;

// 跳转到商品详情
const viewProduct = (productId: number) => {
  router.push({ name: "SingleProduct", params: { id: productId } });
};

// 固定位置：不再支持拖动，保留面板开关逻辑

// 固定位置无需初始化或卸载拖动事件
</script>

<template>
  <div class="recommend-container">
    <!-- 推荐悬浮球 -->
    <div
        class="recommend-ball"
        @click="togglePanel"
        role="button"
        aria-label="每日推荐"
        title="每日推荐"
        :class="{
        'active': isActive,
        'shake': !isActive && !isHovering
      }"
    >
      <i class="fas fa-thumbs-up"></i>
      <span class="tag">推荐榜</span>
    </div>

    <!-- 推荐面板 - 根据方向动态设置类名 -->
    <div
        v-show="isActive"
        class="recommend-panel"
        :class="[
        `horizontal-${panelDirection.horizontal}`,
        `vertical-${panelDirection.vertical}`,
        { open: isActive }
      ]"
        @mouseenter="onPanelEnter"
        @mouseleave="onPanelLeave"
    >
      <div class="panel-header">
        <h3>推荐</h3>
        <i class="fas fa-times close-btn" @click.stop="togglePanel"></i>
      </div>

      <!-- 推荐列表 -->
      <div class="recommend-list">
        <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
            @click="viewProduct(product.id)"
        >
          <!-- 商品图片 -->
          <div class="product-image-container">
            <img :src="product.cover" alt="商品图片" class="product-image">
          </div>

          <!-- 商品信息 -->
          <div class="product-info">
            <h3 class="product-title">{{ product.title }}</h3>
            <div class="price-section">
              <p class="price">¥{{ product.price.toFixed(2) }}</p>
              <div class="rate-wrapper">
                <el-rate v-model="product.rate" disabled text-color="#ff9900" />
                <span class="rate-score">{{ Number(product.rate).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 无推荐提示 -->
        <div v-if="products.length === 0" class="empty-recommend">
          <i class="fas fa-box-open"></i>
          <p>暂无推荐商品</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式表整合 */
:root {
  --recommend-ball-left: 40px;
  --recommend-ball-top: 120px;
}

.recommend-container {
  position: fixed;
  right: 40px;
  bottom: 90px;
  z-index: 1000;
  transition: all 0.3s ease;
}

/* 推荐悬浮球 */
.recommend-ball {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  animation: pulse 2s infinite;
  position: relative;
  cursor: grab;
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.35);
  transition: all 0.3s ease, box-shadow 0.2s;
}

.recommend-ball:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.45);
}

.recommend-ball.active {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.5);
}

/* 推荐面板 - 基础样式 */
.recommend-panel {
  position: absolute;
  width: 320px;
  height: 600px;
  background: #ffffff;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
  padding: 20px;
  overflow-y: auto;
  transition: transform 0.25s ease, opacity 0.25s ease, box-shadow 0.25s ease;
  z-index: 1001;
  opacity: 0;
}

/* 水平方向：右侧展开 */
.recommend-panel.horizontal-right {
  right: 0;
  left: auto;
}

/* 水平方向：左侧展开 */
.recommend-panel.horizontal-left {
  left: auto;
  right: calc(100% + 10px); /* 完全在容器左侧，留出间距 */
}

/* 垂直方向：底部展开 */
.recommend-panel.vertical-bottom {
  top: 100%;
  bottom: auto;
  transform: translateY(8px);
}

/* 垂直方向：顶部展开 */
.recommend-panel.vertical-top {
  bottom: 100%;
  top: auto;
  transform: translateY(-8px);
}

/* 为不同方向添加间距 */
.recommend-panel.vertical-bottom {
  margin-top: 10px;
}

.recommend-panel.vertical-top {
  margin-bottom: 10px;
}

.recommend-panel.horizontal-right { margin-left: 10px; }

.recommend-panel.horizontal-left { /* 间距已通过 right: calc(100% + 10px) 设置，无需额外 margin */ }

.recommend-panel.open {
  opacity: 1;
  transform: translate(0, 0);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}

.product-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 26px rgba(15,23,42,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  margin-bottom: 15px;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 32px rgba(15,23,42,0.14);
}

.product-image-container {
  height: 180px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-info {
  padding: 15px;
}

.product-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #e02d2d;
  font-size: 18px;
  font-weight: 700;
}

.rate-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-score {
  color: #ff9900;
  font-size: 14px;
  font-weight: 600;
}

.empty-recommend {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.empty-recommend i {
  font-size: 48px;
  opacity: 0.3;
}

.close-btn {
  font-size: 18px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #e74c3c;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* 滚动条样式 */
.recommend-list {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.recommend-list::-webkit-scrollbar {
  width: 8px;
}

.recommend-list::-webkit-scrollbar-track {
  background: #f8fafc;
}

.recommend-list::-webkit-scrollbar-thumb {
  background: #d6dae0;
  border-radius: 4px;
}

.recommend-list::-webkit-scrollbar-thumb:hover {
  background: #b8bec6;
}

.recommend-ball .tag {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(37, 99, 235, 0.8);
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s, bottom 0.3s;
}

.recommend-ball:hover .tag {
  opacity: 1;
  bottom: -30px;
}

.shake {
  animation: shake 2s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  2% { transform: translate(-2px, -2px) rotate(-1deg); }
  4% { transform: translate(2px, -2px) rotate(1deg); }
  6% { transform: translate(-2px, 2px) rotate(-1deg); }
  8% { transform: translate(2px, 2px) rotate(1deg); }
  10% { transform: translate(-2px, -2px) rotate(-1deg); }
  12% { transform: translate(0, 0) rotate(0); }
}

/* 拖动状态样式 */
.recommend-ball.dragging {
  cursor: grabbing;
  transform: scale(1.15) !important;
  box-shadow:
      0 15px 35px rgba(255, 107, 107, 0.6),
      0 0 0 3px rgba(255, 255, 255, 0.8);
  z-index: 1002;
}

/* 优化面板位置 */
.recommend-panel {
  max-height: 80vh;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recommend-ball {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .recommend-ball .tag {
    font-size: 10px;
    padding: 2px 6px;
    bottom: -22px;
  }

  .recommend-container {
    right: 20px;
    bottom: 90px;
    left: initial;
    top: initial;
    transform: none;
  }

  .recommend-panel {
    right: 0;
    left: 0;
    width: 95vw;
    height: auto;
    max-height: 70vh;
    margin: 0 auto;
  }

  /* 移动端固定展开方向 */
  .recommend-panel {
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    bottom: 100% !important;
    top: auto !important;
    margin-bottom: 10px;
  }
}
</style>