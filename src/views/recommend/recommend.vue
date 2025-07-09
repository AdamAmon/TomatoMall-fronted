<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ProductInfo } from "../../api/product";
import { getEverydayRecommend} from "../../api/recommend";

const router = useRouter();
const isActive = ref(false);
const isHovering = ref(false);
const products = ref<ProductInfo[]>([]);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const startLeft = ref(40);
const startTop = ref(120);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);
const panelDirection = ref({
  horizontal: 'right', // 水平方向: left/right
  vertical: 'bottom'   // 垂直方向: top/bottom
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
  if (isDragging.value) {
    isDragging.value = false;
    return;
  }

  const wasActive = isActive.value;
  isActive.value = !isActive.value;

  if (isActive.value && products.value.length === 0) {
    fetchRecommendProducts();
  }

  // 当面板从关闭状态变为打开状态时，计算位置
  if (isActive.value && !wasActive) {
    nextTick(() => {
      calculatePanelDirection();
    });
  }
};

// 计算面板展开方向
const calculatePanelDirection = () => {
  // 获取小球在视口中的位置
  const ballEl = document.querySelector('.recommend-ball');
  if (!ballEl) return;

  const ballRect = ballEl.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 计算小球中心点
  const ballCenterX = ballRect.left + ballRect.width / 2;
  const ballCenterY = ballRect.top + ballRect.height / 2;

  // 确定水平方向
  // 小球在窗口右侧1/3区域时向左展开，否则向右展开
  if (ballCenterX < windowWidth * 2 / 3) {
    panelDirection.value.horizontal = 'left';
  } else {
    panelDirection.value.horizontal = 'right';
  }

  // 确定垂直方向
  // 小球在窗口底部1/3区域时向上展开，否则向下展开
  if (ballCenterY > windowHeight * 2 / 3) {
    panelDirection.value.vertical = 'top';
  } else {
    panelDirection.value.vertical = 'bottom';
  }
};

// 面板悬停事件
const onPanelEnter = () => isHovering.value = true;
const onPanelLeave = () => isHovering.value = false;

// 跳转到商品详情
const viewProduct = (productId: number) => {
  router.push({ name: "SingleProduct", params: { id: productId } });
};

// 开始拖动
const startDrag = (e: MouseEvent) => {
  e.preventDefault();
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  startLeft.value = parseInt(document.documentElement.style.getPropertyValue('--recommend-ball-left') || "40");
  startTop.value = parseInt(document.documentElement.style.getPropertyValue('--recommend-ball-top') || "120");

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

// 拖动中
const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  dragOffsetX.value = e.clientX - startX.value;
  dragOffsetY.value = e.clientY - startY.value;

  const left = startLeft.value + dragOffsetX.value;
  const top = startTop.value + dragOffsetY.value;

  // 限制在视窗范围内
  const maxLeft = window.innerWidth - 40; // 调整安全边距
  const maxTop = window.innerHeight - 40;


  document.documentElement.style.setProperty(
      '--recommend-ball-left',
      `${Math.max(10, Math.min(maxLeft, left))}px`
  );
  document.documentElement.style.setProperty(
      '--recommend-ball-top',
      `${Math.max(10, Math.min(maxTop, top))}px`
  );
};

// 停止拖动
const stopDrag = () => {
  isDragging.value = false;
  dragOffsetX.value = 0;
  dragOffsetY.value = 0;

  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 初始化位置变量
onMounted(() => {
  // 计算右下角位置
  const ballSize = 60; // 小球尺寸
  const margin = 50;   // 与窗口边距
  const left = window.innerWidth - ballSize - margin;
  const top = window.innerHeight - ballSize - margin * 2;

  document.documentElement.style.setProperty('--recommend-ball-left', `${left}px`);
  document.documentElement.style.setProperty('--recommend-ball-top', `${top}px`);
});


// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div
      class="recommend-container"
      :style="{
      left: 'var(--recommend-ball-left)',
      top: 'var(--recommend-ball-top)',
    }"
  >
    <!-- 推荐悬浮球 -->
    <div
        class="recommend-ball"
        @click="togglePanel"
        @mousedown="startDrag"
        :class="{
        'active': isActive,
        'dragging': isDragging,
        'shake': !isActive && !isDragging
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
        `vertical-${panelDirection.vertical}`
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
              <el-rate v-model="product.rate" disabled show-score text-color="#ff9900"/>
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
  right: initial;
  bottom: initial;
  left: var(--recommend-ball-left);
  top: var(--recommend-ball-top);
  z-index: 1000;
  transform: translate(-50%, 50%);
  transition: all 0.3s ease;
  cursor: move;
}

/* 推荐悬浮球 */
.recommend-ball {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  animation: pulse 2s infinite;
  position: relative;
  cursor: grab;
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.5);
  transition: all 0.3s ease, box-shadow 0.2s;
}

.recommend-ball:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.6);
}

.recommend-ball.active {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.6);
}

/* 推荐面板 - 基础样式 */
.recommend-panel {
  position: absolute;
  width: 320px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 20px;
  overflow-y: auto;
  transition: all 0.3s ease;
  z-index: 1001;
}

/* 水平方向：右侧展开 */
.recommend-panel.horizontal-right {
  right: 0;
  left: auto;
}

/* 水平方向：左侧展开 */
.recommend-panel.horizontal-left {
  left: 0;
  right: auto;
}

/* 垂直方向：底部展开 */
.recommend-panel.vertical-bottom {
  top: 100%;
  bottom: auto;
}

/* 垂直方向：顶部展开 */
.recommend-panel.vertical-top {
  bottom: 100%;
  top: auto;
}

/* 为不同方向添加间距 */
.recommend-panel.vertical-bottom {
  margin-top: 10px;
}

.recommend-panel.vertical-top {
  margin-bottom: 10px;
}

.recommend-panel.horizontal-right {
  margin-left: 10px;
}

.recommend-panel.horizontal-left {
  margin-right: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.product-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  margin-bottom: 15px;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
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
  background: #f1f1f1;
}

.recommend-list::-webkit-scrollbar-thumb {
  background: #d3d3d3;
  border-radius: 4px;
}

.recommend-list::-webkit-scrollbar-thumb:hover {
  background: #b3b3b3;
}

.recommend-ball .tag {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.7);
  color: white;
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