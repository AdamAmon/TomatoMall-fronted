<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOrderDetails, payOrder } from '../../api/orders';
import { getOneProduct, ProductInfo } from "../../api/product";
import { CartItemInfo, deleteCartItem, getAllCartItems, getCart } from '../../api/cart';
import { useCoupon } from "../../api/coupon.ts";
import { updateVIP, getRecommendTicket } from "../../api/account.ts";
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: 'PaymentPage',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const orderId = parseInt(route.params.id as string, 10);
    const order = ref<any>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const isPaying = ref(false);
    const products = ref<{ [key: number]: ProductInfo }>({});
    const cartItems = ref<CartItemInfo[]>([]);
    const couponId = localStorage.getItem('couponId') || null;
    const intervalId = ref<number | null>(null);

    // 计算状态类名
    const statusClass = computed(() => {
      if (!order.value) return '';
      return order.value.status === '交易成功'
          ? 'status-success'
          : 'status-pending';
    });

    const fetchOrderDetails = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) throw new Error('用户ID未找到');

        const response = await getOrderDetails(parseInt(userId, 10));
        order.value = response;
        return true;
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        error.value = '获取订单详情失败，请稍后再试';
        ElMessage.error(error.value);
        return false;
      } finally {
        loading.value = false;
      }
    };

    const handlePay = async () => {
      if (!order.value || isPaying.value) return;

      try {
        isPaying.value = true;
        await payOrder(orderId);
        ElMessage.success('支付请求已发送！');
        await fetchOrderDetails();
      } catch (err) {
        console.error('Payment failed:', err);
        ElMessage.error('支付失败，请稍后再试');
      } finally {
        isPaying.value = false;
      }
    };

    const fetchCartItems = async () => {
      cartItems.value = [];
      products.value = {};
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) throw new Error('用户ID未找到');

        const cart = await getCart(parseInt(userId, 10));
        if (!cart) throw new Error('购物车未找到');

        const cartId = cart.data.cartId;
        const response = await getAllCartItems(cartId);
        if (!response?.data) return;

        cartItems.value = response.data;
        for (const item of cartItems.value) {
          const productRes = await getOneProduct(item.productId.toString());
          if (productRes.data) {
            products.value[item.productId] = productRes.data.data as ProductInfo;
          }
        }
      } catch (error) {
        console.error('Failed to fetch cart items:', error);
      }
    };

    const clearCart = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const validItems = cartItems.value.filter(item => products.value[item.productId]);
        for (const item of validItems) {
          await deleteCartItem(parseInt(userId, 10), item.itemId.toString());
        }
        await fetchCartItems();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    };

    const checkOrderStatus = async () => {
      intervalId.value = window.setInterval(async () => {
        try {
          await fetchOrderDetails();
          if (order.value?.status === '交易成功') {
            await clearCart();

            if (couponId) {
              await useCoupon(parseInt(couponId, 10));
              localStorage.removeItem('couponId');
            }

            const totalPrice = order.value.totalPrice;
            const userId = localStorage.getItem('userId');
            if (totalPrice > 0 && userId) {
              await updateVIP(totalPrice.toString(), userId);
              const viplevel = localStorage.getItem('vip') || '-1';
              console.log(viplevel);
              const ticketnum = Math.floor(totalPrice / 50) + 1 + Math.floor(parseInt(viplevel, 10) / 10);
              await getRecommendTicket(userId, ticketnum);
            }

            router.push({ path: "/dashboard" });
            if (intervalId.value) {
              clearInterval(intervalId.value);
              intervalId.value = null;
            }
          }
        } catch (err) {
          console.error('Failed to check order status:', err);
        }
      }, 5000) as any;
    };

    onUnmounted(() => {
      if (intervalId.value) clearInterval(intervalId.value);
    });

    const navigateToDashboard = () => {
      router.push({ path: "/dashboard" });
    };

    onMounted(async () => {
      await fetchOrderDetails();
      await fetchCartItems();
      checkOrderStatus();
    });

    return {
      order,
      loading,
      error,
      isPaying,
      couponId,
      statusClass,
      handlePay,
      navigateToDashboard,
      fetchOrderDetails // 添加缺失的导出
    };
  },
});
</script>

<template>
  <div class="payment-container">
    <div class="payment-header">
      <h1><i class="icon-credit-card"></i> 订单支付</h1>
      <p v-if="!loading && order" class="order-subtitle">订单号：{{ order.id }}</p>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>订单加载中...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="icon-alert"></i>
      <p>{{ error }}</p>
      <button @click="fetchOrderDetails" class="retry-btn">重新加载</button>
    </div>

    <div v-else class="payment-content">
      <!-- 订单信息卡片 -->
      <div class="payment-card">
        <div class="card-header">
          <div class="status-tag" :class="statusClass">
            {{ order.status }}
          </div>
          <div class="time-info">
            <i class="icon-clock"></i>
            <span>{{ new Date(order.createdAt).toLocaleString() }}</span>
          </div>
        </div>

        <div class="order-info">
          <div class="info-row">
            <i class="icon-user"></i>
            <div>
              <p class="info-label">用户ID</p>
              <p class="info-value">{{ order.userId }}</p>
            </div>
          </div>

          <div class="info-row">
            <i class="icon-payment"></i>
            <div>
              <p class="info-label">支付方式</p>
              <p class="info-value">{{ order.paymentMethod || '在线支付' }}</p>
            </div>
          </div>

          <div class="info-row">
            <i class="icon-tag"></i>
            <div>
              <p class="info-label">优惠券</p>
              <p class="info-value">{{ couponId ? '已使用优惠券' : '未使用优惠券' }}</p>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="price-summary">
          <div class="price-row">
            <p class="price-label">总金额</p>
            <p class="price-value">{{ order.totalPrice.toFixed(2) }} 元</p>
          </div>
        </div>

        <div v-if="order.cartItemIds && order.cartItemIds.length" class="cart-items">
          <h3><i class="icon-shopping-cart"></i> 购买商品</h3>
          <ul class="item-list">
            <li v-for="itemId in order.cartItemIds" :key="itemId">
              <span>商品ID: {{ itemId }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="payment-actions">
        <button
            @click="handlePay"
            :disabled="isPaying || order.status === '交易成功'"
            class="pay-btn"
        >
          <span v-if="isPaying">
            <i class="icon-spinner spin"></i> 支付处理中...
          </span>
          <span v-else-if="order.status !== '交易成功'">
            <i class="icon-check-circle"></i> 立即支付
          </span>
          <span v-else>
            <i class="icon-check-circle"></i> 支付已完成
          </span>
        </button>
        <button @click="navigateToDashboard" class="back-btn">
          <i class="icon-arrow-left"></i> 返回主页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础布局 */
.payment-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
  color: #333;
}

/* 头部样式 */
.payment-header {
  text-align: center;
  margin-bottom: 32px;
}

.payment-header h1 {
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #1a1a1a;
}

.icon-credit-card:before {
  content: '💳';
  font-size: 1.4em;
}

.order-subtitle {
  margin-top: 8px;
  color: #666;
  font-size: 15px;
}

/* 加载状态 */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 150, 255, 0.2);
  border-radius: 50%;
  border-top-color: #0066cc;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-message {
  background: #ffebee;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin: 30px 0;
}

.icon-alert:before {
  content: '⚠️';
  font-size: 48px;
}

.error-message p {
  margin: 16px 0;
  color: #c62828;
  font-size: 16px;
}

.retry-btn {
  background: #c62828;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
  margin-top: 12px;
}

.retry-btn:hover {
  background: #b71c1c;
  transform: translateY(-1px);
}

/* 支付卡片 */
.payment-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 24px;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.status-tag {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.status-success {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-pending {
  background: #fff8e1;
  color: #ff8f00;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.icon-clock:before {
  content: '🕒';
}

/* 订单信息 */
.order-info {
  padding: 20px;
}

.info-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.icon-user:before {
  content: '👤';
  font-size: 24px;
}

.icon-payment:before {
  content: '💳';
  font-size: 24px;
}

.icon-tag:before {
  content: '🏷️';
  font-size: 24px;
}

.info-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.info-value {
  font-weight: 500;
  font-size: 17px;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: #f0f0f0;
  margin: 10px 20px;
}

/* 价格区域 */
.price-summary {
  padding: 20px;
  background: #f9fafb;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  font-weight: 500;
  font-size: 18px;
}

.price-value {
  font-weight: 700;
  font-size: 28px;
  color: #e53935;
}

/* 购物商品 */
.cart-items {
  padding: 0 20px 20px;
}

.icon-shopping-cart:before {
  content: '🛒';
  font-size: 1.2em;
}

.cart-items h3 {
  font-size: 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
}

.item-list li {
  padding: 10px 8px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 15px;
  display: flex;
  align-items: center;
}

.item-list li:last-child {
  border-bottom: none;
}

/* 支付按钮 */
.payment-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pay-btn {
  background: linear-gradient(135deg, #0066cc, #003d99);
  color: white;
  border: none;
  padding: 18px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 102, 204, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.pay-btn:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.pay-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
}

.back-btn {
  background: white;
  color: #666;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

/* 图标 */
[class^="icon-"] {
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
}

.icon-spinner {
  display: inline-flex;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.icon-check-circle:before {
  content: '✓';
}

.icon-arrow-left:before {
  content: '←';
}

/* 响应式调整 */
@media (max-width: 600px) {
  .payment-container {
    padding: 16px;
  }

  .payment-header h1 {
    font-size: 24px;
  }

  .price-value {
    font-size: 24px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .pay-btn, .back-btn {
    font-size: 16px;
    padding: 16px;
  }
}
</style>