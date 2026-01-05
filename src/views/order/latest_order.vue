<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getOrderDetails } from '../../api/orders';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(true);
const error = ref<string>('');
const order = ref<any>(null);

const statusClass = computed(() => {
  if (!order.value) return '';
  return order.value.status === '交易成功' ? 'status-success' : 'status-pending';
});

const fetchLatestOrder = async () => {
  loading.value = true;
  error.value = '';
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('未找到用户');
    }
    const res = await getOrderDetails(parseInt(userId, 10));
    order.value = res;
  } catch (err: any) {
    console.error(err);
    error.value = err?.message || '获取订单失败';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const goProducts = () => {
  router.push({ path: '/product/all_product' });
};

const goDashboard = () => {
  router.push({ path: '/dashboard' });
};

onMounted(fetchLatestOrder);
</script>

<template>
  <div class="latest-order-container">
    <div class="page-title">我的订单</div>

    <div v-if="loading" class="state-card loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="state-card error">
      <p>{{ error }}</p>
      <button class="primary-btn" @click="fetchLatestOrder">重新加载</button>
    </div>

    <div v-else-if="!order" class="state-card empty">
      <p>暂无订单数据</p>
      <button class="primary-btn" @click="goProducts">去逛逛</button>
    </div>

    <div v-else class="order-card">
      <div class="order-line unified" :class="statusClass">
        <span class="method">{{ order.paymentMethod }}</span>
        <span class="amount">实付金额 ¥{{ order.totalPrice.toFixed(2) }}</span>
        <span class="status">{{ order.status }}</span>
      </div>

      <div class="actions">
        <button class="ghost-btn" @click="goDashboard">返回个人界面</button>
        <button class="primary-btn" @click="goProducts">继续购物</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.latest-order-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
  padding: 24px;
  box-sizing: border-box;
  color: #1a1a1a;
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
}

.page-title {
  position: absolute;
  top: 92px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  font-weight: 800;
  color: #1f2937;
}

.order-card,
.state-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  padding: 18px 24px;
}

.state-card {
  text-align: center;
}

.state-card.loading .spinner {
  width: 42px;
  height: 42px;
  border: 4px solid rgba(0, 102, 204, 0.2);
  border-top-color: #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 14px;
}

.state-card.error p {
  color: #c62828;
}

.state-card.empty p {
  color: #555;
}


.order-card {
  min-width: 520px;
  max-width: 680px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-line {
  padding: 18px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  background: #fdfefe;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.order-line.unified .method {
  color: #1f2937;
}

.order-line.unified .amount {
  color: #ff5000;
  font-size: 20px;
}

.order-line.unified .status {
  color: #2e7d32;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn {
  background: linear-gradient(135deg, #0066cc, #003d99);
  color: #fff;
  border: none;
  padding: 12px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.28);
  transition: all 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 102, 204, 0.32);
}

.ghost-btn {
  background: #fff;
  color: #555;
  border: 1px solid #ddd;
  padding: 12px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  background: #f7f7f7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
