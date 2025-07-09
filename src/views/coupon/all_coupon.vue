<!-- src/views/coupon/all_coupon.vue -->
<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { getAllCoupons, getFreeCoupon, CouponVO } from '../../api/coupon.ts';
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: "all_coupon",
  setup() {
    // 用户ID
    const userId = parseInt(localStorage.getItem('userId') || '0');

    // 优惠券列表
    const coupons = ref<CouponVO[]>([]);

    // 加载状态
    const loading = ref(true);
    const error = ref<string | null>(null);

    // 使用优惠券的状态
    const usingCoupon = ref(false);
    const useCouponId = ref<number | null>(null);

    // 获取所有优惠券
    const fetchCoupons = async () => {
      try {
        coupons.value = await getAllCoupons(userId);
        console.log(coupons.value);
      } catch (err) {
        error.value = "请求失败，请稍后再试";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    // 获取免费优惠券
    const fetchFreeCoupon = async () => {
      try {
        const freeCoupon = await getFreeCoupon(userId);
        console.log(freeCoupon);
        coupons.value.push(freeCoupon);
        ElMessage.success('免费优惠券获取成功！');
      } catch (err) {
        console.error('获取免费优惠券失败:', err);
        ElMessage.error('获取免费优惠券失败，请稍后再试');
      }
    };

    onMounted(() => {
      fetchCoupons();
    });

    return {
      coupons,
      loading,
      error,
      usingCoupon,
      useCouponId,
      fetchFreeCoupon,
    };
  },
});
</script>

<template>
  <div id="app">
    <div class="coupon-container">
      <div class="decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <div class="header">
        <h1>我的优惠券</h1>
        <p>专属优惠，尽在掌握。领取您的专属折扣，享受购物乐趣！</p>
      </div>

      <div class="action-bar">
        <button @click="fetchFreeCoupon" class="get-free-coupon-button">
          <i class="el-icon-gift"></i> 领取免费优惠券
        </button>
      </div>

      <!-- 修改为网格布局容器 -->
      <div class="coupon-grid-container">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
        </div>

        <div v-else-if="error" class="error-message">
          <i class="el-icon-error" style="font-size: 48px; margin-bottom: 15px;"></i>
          <p>{{ error }}</p>
          <p style="margin-top: 15px; font-size: 14px;">请稍后刷新页面重试</p>
        </div>

        <div v-else-if="coupons.length === 0" class="no-coupons">
          <i class="el-icon-shopping-bag-1" style="font-size: 80px; color: #a0a0a0; margin-bottom: 20px;"></i>
          <h3>您还没有优惠券</h3>
          <p>点击上方按钮领取您的专属优惠券，享受购物折扣！</p>
        </div>

        <!-- 使用网格布局 -->
        <div v-else class="coupon-grid">
          <div v-for="coupon in coupons" :key="coupon.id" class="coupon-card">
            <div class="coupon-ribbon" v-if="coupon.discount > 50">超值优惠</div>

            <div class="coupon-header">
              <div class="coupon-value">¥{{ coupon.discount }}</div>
              <div class="coupon-title">满{{ coupon.top }}减{{ coupon.discount }}优惠券</div>
            </div>

            <div class="coupon-body">
              <div class="coupon-detail">
                <i class="el-icon-shopping-cart-full"></i>
                <span><strong>适用：</strong> 全场通用</span>
              </div>

              <div class="coupon-detail">
                <i class="el-icon-timer"></i>
                <span><strong>有效期：</strong> 领取后1天内有效</span>
              </div>

              <div class="coupon-detail">
                <i class="el-icon-document"></i>
                <span><strong>券号：</strong> {{ coupon.id }}</span>
              </div>

              <div class="coupon-detail">
                <i class="el-icon-date"></i>
                <span><strong>领取时间：</strong> {{ new Date(coupon.getTime).toLocaleString() }}</span>
              </div>
            </div>
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
}

body {
  font-family: 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  min-height: 100vh;
  padding: 20px;
  color: #2c3e50;
}

.coupon-grid-container {
  width: 100%;
  margin-top: 30px;
}

.coupon-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  padding-top: 20px;
}

.header h1 {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
}

.header h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  border-radius: 2px;
}

.header p {
  font-size: 18px;
  color: #7f8c8d;
  max-width: 800px;
  margin: 20px auto 0;
  line-height: 1.6;
}

.action-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.get-free-coupon-button {
  padding: 15px 35px;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(110, 142, 251, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
}

.get-free-coupon-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(110, 142, 251, 0.6);
}

.get-free-coupon-button:active {
  transform: translateY(1px);
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 每行5个 */
  gap: 30px;
  width: 100%;
}

.coupon-card {
  width: 100%; /* 固定宽度由父容器控制 */
  height: 380px; /* 固定高度 */
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.coupon-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.coupon-ribbon {
  position: absolute;
  top: 15px;
  right: -30px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: white;
  padding: 6px 40px;
  transform: rotate(45deg);
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(255, 107, 107, 0.4);
  z-index: 2;
}

.coupon-header {
  background: linear-gradient(135deg, #3498db, #1abc9c);
  color: white;
  padding: 25px;
  text-align: center;
}

.coupon-value {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 5px;
}

.coupon-title {
  font-size: 20px;
  font-weight: 600;
  opacity: 0.9;
}

.coupon-body {
  padding: 25px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.coupon-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
}

.coupon-detail:last-child {
  border-bottom: none;
}

.coupon-detail i {
  color: #6e8efb;
  font-size: 18px;
  min-width: 24px;
}

.coupon-detail span {
  font-size: 16px;
}

.coupon-detail strong {
  color: #2c3e50;
  font-weight: 600;
}

.coupon-footer {
  padding: 0 25px 25px;
  text-align: center;
}

.use-button {
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.use-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.use-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(110, 142, 251, 0.2);
  border-top: 5px solid #6e8efb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-coupons {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.no-coupons img {
  width: 200px;
  opacity: 0.7;
  margin-bottom: 20px;
}

.no-coupons h3 {
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 15px;
}

.no-coupons p {
  font-size: 16px;
  color: #7f8c8d;
  max-width: 500px;
  margin: 0 auto;
}

.error-message {
  text-align: center;
  padding: 40px;
  background: #fff6f6;
  border: 1px solid #ffcccc;
  border-radius: 15px;
  color: #e74c3c;
  font-size: 18px;
}

.decoration {
  position: absolute;
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
  background: rgba(110, 142, 251, 0.05);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
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

@media (max-width: 1800px) {
  .coupon-grid {
    grid-template-columns: repeat(4, 1fr); /* 中大型屏幕显示4个 */
  }
}

@media (max-width: 1400px) {
  .coupon-grid {
    grid-template-columns: repeat(3, 1fr); /* 中型屏幕显示3个 */
  }
}

@media (max-width: 1024px) {
  .coupon-grid {
    grid-template-columns: repeat(2, 1fr); /* 平板显示2个 */
  }
}

@media (max-width: 768px) {
  .coupon-grid {
    grid-template-columns: 1fr; /* 手机显示1个 */
  }

  .header h1 {
    font-size: 28px;
  }

  .header p {
    font-size: 16px;
  }

  .get-free-coupon-button {
    padding: 12px 25px;
    font-size: 16px;
  }
}

/* 确保卡片内容不会溢出 */
.coupon-body {
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.coupon-detail {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  font-size: 14px;
  line-height: 1.4;
}

.coupon-detail:last-child {
  border-bottom: none;
}
</style>