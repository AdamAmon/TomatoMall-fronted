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
            <div class="coupon-main">
              <div class="coupon-value-block">
                <div class="coupon-currency">¥</div>
                <div class="coupon-value">{{ coupon.discount }}</div>
              </div>

              <div class="coupon-info">
                <div class="coupon-title">满{{ coupon.top }}减{{ coupon.discount }}优惠券</div>
                <div class="coupon-meta">全场通用 · 24小时内有效</div>
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
  background: linear-gradient(135deg, #e5e7eb 0%, #f8fafc 35%, #e0e7ff 100%);
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
  height: 52px;
  padding: 0 28px;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.24s ease;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.28);
  display: flex;
  align-items: center;
  gap: 10px;
}

.get-free-coupon-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.34);
}

.get-free-coupon-button:active { transform: translateY(-1px); }

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 每行5个 */
  gap: 24px;
  width: 100%;
}

.coupon-card {
  width: 100%; /* 固定宽度由父容器控制 */
  height: 180px;
  background: linear-gradient(145deg, #ffffff 0%, #f7fbff 40%, #eef5ff 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  transition: all 0.24s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.coupon-card::before,
.coupon-card::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  z-index: 2;
}

.coupon-card::before { left: -8px; }
.coupon-card::after { right: -8px; }

.coupon-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.coupon-ribbon {
  position: absolute;
  top: 12px;
  right: -30px;
  background: linear-gradient(45deg, #f59e0b, #f97316);
  color: white;
  padding: 6px 40px;
  transform: rotate(45deg);
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(249, 115, 22, 0.35);
  z-index: 2;
}

.coupon-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  gap: 18px;
  padding: 26px 28px;
  height: 100%;
  position: relative;
}

.coupon-value-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
  justify-content: flex-start;
}

.coupon-currency {
  font-size: 22px;
  font-weight: 700;
  color: #1d4ed8;
}

.coupon-value {
  font-size: 50px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.5px;
  line-height: 1;
}

.coupon-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 22px;
  border-left: 1px dashed #d5dce5;
  position: relative;
}

.coupon-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.coupon-meta {
  font-size: 14px;
  color: #475569;
  background: rgba(37, 99, 235, 0.08);
  padding: 8px 12px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
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
</style>