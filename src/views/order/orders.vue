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
    const username = ref(localStorage.getItem('username') || '用户');
    const currentPage = ref(1);
    const pageSize = 6;

    // 计算状态类名
    const statusClass = computed(() => {
      if (!order.value) return '';
      return order.value.status === '交易成功'
          ? 'status-success'
          : 'status-pending';
    });

    const filteredItems = computed(() => cartItems.value.filter(item => products.value[item.productId]));

    const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize)));

    const pagedItems = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      return filteredItems.value.slice(start, start + pageSize);
    });

    const handlePageChange = (page: number) => {
      currentPage.value = page;
    };

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
      fetchOrderDetails, // 添加缺失的导出
      username,
      cartItems,
      products,
      pagedItems,
      totalPages,
      handlePageChange,
      currentPage,
      pageSize,
      filteredItems
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
      <div class="payment-layout">
        <div class="products-panel">
          <div class="panel-header">
            <h3>购买商品</h3>
            <p class="panel-subtitle">下单商品列表</p>
          </div>
          <div v-if="pagedItems.length" class="product-grid">
            <div
                v-for="item in pagedItems"
                :key="item.itemId"
                class="product-card"
            >
              <div class="product-image-container">
                <img
                    :src="products[item.productId]?.cover"
                    class="product-image"
                    alt="商品封面"
                />
              </div>
              <div class="product-info">
                <h4 class="product-title">{{ products[item.productId]?.title || '未知商品' }}</h4>
                <p class="product-desc">{{ products[item.productId]?.description || '暂无描述' }}</p>
                <div class="product-meta">
                  <span class="price-group">
                    <span class="price">¥{{ (products[item.productId]?.price || 0).toFixed(2) }}</span>
                    <span class="qty">x{{ item.quantity }}</span>
                  </span>
                  <span class="subtotal">小计 ¥{{ ((products[item.productId]?.price || 0) * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-products">
            <p>暂无商品信息</p>
          </div>

          <div v-if="totalPages > 1" class="product-pagination">
            <el-pagination
                background
                layout="prev, pager, next"
                :page-size="pageSize"
                :current-page="currentPage"
                :total="filteredItems.length"
                @current-change="handlePageChange"
            />
          </div>
        </div>

        <div class="info-panel">
          <div class="summary-card">
            <div class="summary-header">
              <div class="status-tag" :class="statusClass">
                {{ order.status }}
              </div>
              <div class="order-id">订单号：{{ order.id }}</div>
            </div>
            <div class="summary-row">
              <span>创建时间</span>
              <span>{{ new Date(order.createdAt).toLocaleString() }}</span>
            </div>
            <div class="summary-row total-row">
              <span>应付总额</span>
              <span class="amount">¥{{ order.totalPrice.toFixed(2) }}</span>
            </div>
          </div>

          <div class="user-card">
            <div class="user-row">
              <span>用户名</span>
              <span class="user-value">{{ username }}</span>
            </div>
            <div class="user-row">
              <span>支付方式</span>
              <span class="user-value pay-method">
                <img
                    class="alipay-icon"
                    src="https://ts1.tc.mm.bing.net/th/id/OIP-C.14ZKRBuz2xiirpUkw9ReDgHaFZ?w=291&h=211&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2"
                    alt="Alipay"
                />
                支付宝支付
              </span>
            </div>
            <div class="user-row">
              <span>优惠券</span>
              <span class="user-value">{{ couponId ? '已使用优惠券' : '未使用优惠券' }}</span>
            </div>
          </div>

          <div class="actions-card">
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
    </div>
  </div>
</template>

<style scoped>
/* 基础布局 */
.payment-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
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

/* 布局与卡片 */
.payment-content {
  width: 100%;
}

.payment-layout {
  display: grid;
  grid-template-columns: 1fr 340px; /* 固定右侧列宽，左侧自适应 */
  column-gap: 24px;
  align-items: start;
}

.products-panel {
  flex: 1;
  min-width: 0;
  width: 100%; /* 避免与右侧列互动导致宽度变化 */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.panel-subtitle {
  margin: 0;
  color: #888;
  font-size: 13px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(260px, 1fr)); /* 固定三列，卡片宽度稳定 */
  gap: 24px;
}

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-image-container {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
  background: #f7f7f7;
}

.product-card:hover .product-image {
  transform: scale(1.04);
}

.product-info {
  padding: 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.product-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-desc {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.price-group {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.price {
  color: #ff5000;
  font-weight: 700;
}

.qty {
  color: #555;
}

.subtotal {
  color: #e74c3c;
  font-weight: 700;
}

.empty-products {
  background: white;
  border: 1px dashed #e0e0e0;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: #888;
}

.product-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.info-panel {
  width: 100%;
  max-width: 340px;
  position: sticky;
  top: 0; /* 贴住视口顶部 */
  height: 100vh; /* 占满视口高度，避免随左侧高度变化漂移 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中内部卡片 */
  transform: translateY(-100px); /* 略微上移，位置更贴近视觉中心 */
  gap: 16px;
  margin-left: auto; /* 锁定在右侧列 */
}

.summary-card,
.user-card,
.actions-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 18px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
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

.order-id {
  color: #666;
  font-size: 13px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  color: #555;
  margin: 8px 0;
  font-size: 14px;
}

.total-row .amount {
  color: #ff5000;
  font-size: 22px;
  font-weight: 800;
}

.user-card .user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #444;
}

.user-row:last-child {
  margin-bottom: 0;
}

.user-value {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pay-method img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.actions-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 支付按钮 */
.pay-btn {
  background: linear-gradient(135deg, #0066cc, #003d99);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 10px;
  font-size: 17px;
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
  padding: 14px;
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
@media (max-width: 1100px) {
  .payment-layout {
    display: flex;
    flex-direction: column;
  }

  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); /* 窄屏自适应列数 */
  }

  .info-panel {
    position: static;
    width: 100%;
    transform: none;
    height: auto; /* 移动端还原高度 */
    justify-content: flex-start; /* 移动端不强制居中 */
  }
}

@media (max-width: 600px) {
  .payment-container {
    padding: 16px;
  }

  .payment-header h1 {
    font-size: 24px;
  }

  .panel-header h3 {
    font-size: 17px;
  }

  .pay-btn, .back-btn {
    font-size: 16px;
    padding: 16px;
  }
}
</style>