<!-- src/views/cart/cart.vue -->
<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { getCart, getAllCartItems, deleteCartItem, changeCartItemQuantity, CartItemInfo } from '../../api/cart.ts';
import { getOneProduct, ProductInfo, updateAmount, getOneProductAmount } from '../../api/product';
import { createOrder, getOrderDetails } from '../../api/orders';
import { getAllCoupons, CouponVO } from '../../api/coupon.ts';
import { ElMessage, ElTable, ElTableColumn, ElTag, ElScrollbar } from 'element-plus';
import { useRouter } from 'vue-router';
import { userInfo } from "../../api/account.ts";

export default defineComponent({
  name: 'CartView',
  components: {
    ElTable,
    ElTableColumn,
    ElTag,
    ElScrollbar
  },
  setup() {
    const cartItems = ref<CartItemInfo[]>([]);
    const products = ref<{ [key: number]: ProductInfo }>({});
    const loading = ref(true);
    const router = useRouter();
    const selectedPaymentMethod = ref<string>('ALIPAY');
    const paymentMethods = ['WECHATPAY', 'CREDITCARD', 'ALIPAY'];
    const error = ref<string | null>(null);

    // 优惠券相关
    const coupons = ref<CouponVO[]>([]);
    const selectedCoupon = ref<CouponVO | null>(null);
    const loadingCoupons = ref(true);
    const errorCoupons = ref<string | null>(null);

    // vip相关内容
    const vip = ref('')
    function fetchvVip() {
      userInfo("123456").then(res => {
        vip.value = res.data.data.vip
      })
    }

    // 支付方式映射对象
    const paymentMethodMap: { [key: string]: string } = {
      'WECHATPAY': '微信支付',
      'CREDITCARD': '信用卡支付',
      'ALIPAY': '支付宝支付'
    };

    // 获取购物车商品
    const fetchCartItems = async () => {
      cartItems.value = [];
      products.value = {};
      try {
        const userId = localStorage.getItem('userId');
        if (userId === null) {
          throw new Error('用户ID未找到');
        }
        const cart = await getCart(parseInt(userId, 10));
        if (!cart) {
          throw new Error('购物车未找到');
        }
        const cartId = cart.data.cartId;
        const response = await getAllCartItems(cartId);
        if (!response || !response.data) {
          return;
        }
        cartItems.value = response.data;
        for (const item of cartItems.value) {
          const response = await getOneProduct(item.productId.toString());
          if (response.data) {
            products.value[item.productId] = response.data.data as ProductInfo;
          } else {
            console.error(`商品ID ${item.productId} 的详情获取失败`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cart items:', error);
      } finally {
        loading.value = false;
      }
    };

    // 获取优惠券列表
    const fetchCoupons = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId === null) {
          throw new Error('用户ID未找到');
        }
        coupons.value = await getAllCoupons(parseInt(userId, 10));
      } catch (err) {
        errorCoupons.value = "请求失败，请稍后再试";
        console.error(err);
      } finally {
        loadingCoupons.value = false;
      }
    };

    // 获取商品库存信息
    const fetchProductStockpile = async (productId: string) => {
      try {
        const response = await getOneProductAmount(productId);
        if (response.data.code == 200) {
          products.value[parseInt(productId, 10)].stockpile = response.data.data;
        } else {
          error.value = response.data.message || "获取商品库存失败";
        }
      } catch (err) {
        error.value = "请求失败，请稍后再试";
        console.error(err);
      }
    };

    // 删除商品
    const deleteItem = async (itemId: string) => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('用户ID未找到');
        return;
      }
      try {
        await deleteCartItem(parseInt(userId, 10), itemId);
        await fetchCartItems();
        ElMessage.success('商品已成功删除');
      } catch (error) {
        console.error('Failed to delete item:', error);
        ElMessage.error('删除商品失败，请稍后再试');
      }
    };

    // 处理数量变更（适配 Element Plus 事件形参可为 undefined 的情况）
    const onQtyChange = (itemId: string, val: number | undefined) => {
      if (typeof val !== 'number') return;
      updateQuantity(itemId, val);
    };

    // 修改商品数量
    const updateQuantity = async (itemId: string, quantity: number) => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('用户ID未找到');
        return;
      }
      try {
        const item = cartItems.value.find(item => item.itemId.toString() === itemId);
        if (!item) {
          throw new Error('商品未找到');
        }
        const productId = item.productId.toString();
        const oldQuantity = item.quantity;
        const quantityDiff = quantity - oldQuantity;

        const product = products.value[item.productId];
        if (!product?.stockpile) {
          throw new Error('商品库存信息未找到');
        }

        const availableStock = product.stockpile.amount - product.stockpile.frozen - 1;
        if (quantity > availableStock + oldQuantity) {
          ElMessage.error('商品数量超出可用库存');
          return;
        }

        if (quantity === 0) {
          await deleteItem(itemId);
        } else {
          await changeCartItemQuantity(parseInt(userId, 10), itemId, quantity);
          item.quantity = quantity;
          ElMessage.success('商品数量已更新');

          const newFrozen = product.stockpile.frozen + quantityDiff;
          await updateAmount(productId, {
            id: parseInt(userId, 10),
            amount: product.stockpile.amount,
            frozen: newFrozen,
            productId: parseInt(productId, 10)
          });
          await fetchProductStockpile(productId);
        }
      } catch (error) {
        console.error('Failed to update quantity:', error);
        ElMessage.error('更新商品数量失败，请稍后再试');
      }
    };

    // 计算总价
    const totalPrice = computed(() => {
      return cartItems.value.reduce((total, item) => {
        const product = products.value[item.productId];
        return total + (product?.price || 0) * item.quantity;
      }, 0);
    });

    // 计算总价并应用 VIP 折扣
    const totalPriceWithVIPDiscount = computed(() => {
      const baseTotal = cartItems.value.reduce((total, item) => {
        const product = products.value[item.productId];
        return total + (product?.price || 0) * item.quantity;
      }, 0);

      let discountPercentage = parseInt(vip.value, 10);
      if (isNaN(discountPercentage)) {
        discountPercentage = 0;
      }
      discountPercentage = Math.min(discountPercentage, 20);

      const discountedPrice = baseTotal * (1 - discountPercentage / 100);
      return Math.floor(discountedPrice);
    });

    // 计算优惠后的总价（包括 VIP 折扣和优惠券）
    const discountedTotalPrice = computed(() => {
      let price = totalPriceWithVIPDiscount.value;
      if (selectedCoupon.value && price >= selectedCoupon.value.top) {
        price -= selectedCoupon.value.discount;
      }
      return price;
    });

    const selectPaymentMethod = (method: string) => {
      selectedPaymentMethod.value = method;
    };

    // 选择优惠券
    const selectCoupon = (coupon: CouponVO | null) => {
      //取消选择
      if (selectedCoupon.value && coupon && selectedCoupon.value.id === coupon.id) {
        selectedCoupon.value = null;
        return;
      }

      if (coupon && totalPrice.value >= coupon.top) {
        selectedCoupon.value = coupon;
      } else if (coupon) {
        ElMessage.warning('总价未达到使用该优惠券的条件');
        selectedCoupon.value = null;
      } else {
        selectedCoupon.value = null;
      }
    };

    // 去支付
    const handlePay = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('用户ID未找到');
        }
        if(selectedCoupon.value){
          localStorage.setItem('couponId', selectedCoupon.value.id.toString());
        }else {
          localStorage.removeItem('couponId');
        }

        const cartItemIds: number[] = cartItems.value
            .filter(item => products.value[item.productId])
            .map(item => item.itemId);

        if (cartItemIds.length === 0) {
          ElMessage.warning('购物车为空或商品不存在，无法创建订单');
          return;
        }

        const paymentMethod = selectedPaymentMethod.value || 'ALIPAY';
        if (selectedCoupon){
          await createOrder(
              parseInt(userId, 10),
              cartItemIds,
              paymentMethod,
              discountedTotalPrice.value,
          );
        }else {
          await createOrder(
              parseInt(userId, 10),
              cartItemIds,
              paymentMethod,
              totalPriceWithVIPDiscount.value,
          );
        }
        const orderResponse = await getOrderDetails(parseInt(userId, 10));

        const orderId = orderResponse.id;

        ElMessage.success('订单创建成功，请尽快支付');

        await router.push({ name: "Order", params: { id: orderId } });
      } catch (error) {
        console.error('Failed to create order:', error);
        if (error instanceof Error) {
          ElMessage.error(error.message || '创建订单失败，请稍后再试');
        } else {
          ElMessage.error('创建订单失败，请稍后再试');
        }
      }
    };

    // 清空购物车
    const clearCart = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('用户ID未找到');
        return;
      }
      try {
        for (const item of cartItems.value.filter(item => products.value[item.productId])) {
          await deleteCartItem(parseInt(userId, 10), item.itemId.toString());
        }
        await fetchCartItems();
        ElMessage.success('购物车已清空');
      } catch (error) {
        console.error('Failed to clear cart:', error);
        ElMessage.error('清空购物车失败，请稍后再试');
      }
    };

    onMounted(() => {
      fetchCartItems();
      fetchCoupons();
      fetchvVip();
    });

    return {
      cartItems,
      loading,
      products,
      deleteItem,
      updateQuantity,
      onQtyChange,
      totalPrice,
      totalPriceWithVIPDiscount,
      discountedTotalPrice,
      handlePay,
      clearCart,
      paymentMethods,
      selectedPaymentMethod,
      selectPaymentMethod,
      paymentMethodMap,
      error,
      coupons,
      loadingCoupons,
      errorCoupons,
      selectedCoupon,
      selectCoupon,
      vip
    };
  },
});
</script>


<template>
  <div class="cart-container">
    <h1 class="cart-title">购物车</h1>

    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-cart">
      <p>您的购物车为空</p>
      <el-button type="primary" @click="$router.push('/product/all_product')">去逛逛</el-button>
    </div>

    <div v-else class="cart-layout">
      <!-- 左侧自适应商品卡片区域 -->
      <div class="products-container">
        <div class="product-grid">
          <div
              v-for="item in cartItems.filter(item => products[item.productId])"
              :key="item.itemId"
              class="product-card"
          >
            <!-- 图片区域，沿用商品列表样式 -->
            <div class="product-image-container">
              <el-image
                  :src="products[item.productId]?.cover"
                  fit="cover"
                  class="product-image"
              >
                <template #error>
                  <div class="image-error-placeholder">
                    <el-icon><picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-if="products[item.productId]?.stockpile" class="stock-badge">
                库存: {{ (products[item.productId]?.stockpile?.amount || 0) - (products[item.productId]?.stockpile?.frozen || 0) - 1 }}
              </div>
            </div>

            <div class="product-info">
              <h3 class="product-title">{{ products[item.productId]?.title || '未知商品' }}</h3>

              <p class="product-description">{{ products[item.productId]?.description || '暂无描述' }}</p>

              <div class="price-section">
                <p class="price">单价: ¥{{ (products[item.productId]?.price || 0).toFixed(2) }}</p>
                <p class="subtotal">小计: ¥{{ ((products[item.productId]?.price || 0) * item.quantity).toFixed(2) }}</p>
              </div>

            </div>

            <div class="cart-controls">
              <el-input-number
                  v-model="item.quantity"
                  :min="0"
                  :max="((products[item.productId]?.stockpile?.amount || 1) - (products[item.productId]?.stockpile?.frozen || 0) + (item.quantity) || 1) - 1"
                  label="数量"
                  @update:modelValue="(val) => onQtyChange(item.itemId.toString(), val)"
                  @click.stop
              ></el-input-number>
              <el-button type="danger" @click.stop="deleteItem(item.itemId.toString())">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧固定结算模块 -->
      <div class="checkout-container">
        <div class="checkout-card">
          <div class="checkout-header">
            <h3>订单结算</h3>
          </div>

          <div class="price-summary">
            <div class="price-item">
              <span>商品总价:</span>
              <span>¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="price-item">
              <span>VIP等级 ({{ vip }}):</span>
              <span>-¥{{ (totalPrice - totalPriceWithVIPDiscount).toFixed(2) }}</span>
            </div>
            <div v-if="selectedCoupon" class="price-item">
              <span>优惠券:</span>
              <span>-¥{{ selectedCoupon.discount.toFixed(2) }}</span>
            </div>

            <el-divider />

            <div class="price-item total-price">
              <span>应付总额:</span>
              <span class="amount">¥{{ discountedTotalPrice.toFixed(2) }}</span>
            </div>
          </div>

          <div class="coupon-section">
            <h4>优惠券</h4>
            <el-scrollbar>
              <div class="coupon-scroll-container">
                <div class="coupon-list">
                  <div
                      v-for="coupon in coupons"
                      :key="coupon.id"
                      :class="['coupon-item', { 'active': selectedCoupon?.id === coupon.id }]"
                      @click="selectCoupon(coupon)"
                  >
                    <div class="coupon-value">
                      <span class="discount">¥{{ coupon.discount }}</span>
                      <span class="coupon-condition">满{{ coupon.top }}元可用</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </div>

          <div class="payment-section">
            <h4>支付方式</h4>
            <el-scrollbar>
              <div class="payment-scroll-container">
                <div class="payment-methods">
                  <el-button
                      v-for="method in paymentMethods"
                      :key="method"
                      :type="selectedPaymentMethod === method ? 'primary' : ''"
                      @click="selectPaymentMethod(method)"
                      class="payment-method"
                  >
                    {{ paymentMethodMap[method] }}
                  </el-button>
                </div>
              </div>
            </el-scrollbar>
          </div>

          <div class="checkout-buttons">
            <el-button type="warning" @click="clearCart">清空购物车</el-button>
            <el-button type="primary" @click="handlePay">去支付</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-container {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.cart-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
  color: #333;
  position: relative;
}

.cart-title:after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #ff5000, #ff7b00);
  margin: 10px auto 0;
  border-radius: 3px;
}

/* 布局区域 */
.cart-layout {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 左侧商品区域 */
.products-container {
  flex: 1;
  min-width: 0;
}

/* 对齐商品列表的图片与信息样式 */
.product-image-container {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.product-image {
  transition: transform 0.5s;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.image-error-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
}

.stock-badge {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

/* 右侧结算区域 */
.checkout-container {
  width: 360px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  align-self: flex-start;
}

/* 商品网格布局 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  column-gap: 24px;
  row-gap: 54px; /* 纵向间距与横向一致 */
}

/* 商品卡片样式 */
.product-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 15px;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* 标题与描述对齐列表页样式 */
.product-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 10px 0 6px;
}

.product-info {
  flex: 1;
}

.product-description {
  color: #666;
  font-size: 13px;
  line-height: 1.4;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: -30px; /* 减少与下方控件的间距 */
  font-weight: bold;
}

.price {
  color: #ff5000;
  font-size: 16px;
}

.subtotal {
  color: #e74c3c;
  font-size: 16px;
}

.cart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}


/* 结算卡片样式 */
.checkout-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.checkout-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.checkout-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.price-summary {
  margin-bottom: 24px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
}

.price-item span:last-child {
  font-weight: 500;
}


.total-price {
  padding-top: 15px;
  border-top: 1px dashed #eee;
  margin-top: 15px;
}

.total-price span:first-child {
  font-weight: 600;
  font-size: 16px;
}

.amount {
  color: #ff5000;
  font-size: 22px;
  font-weight: bold;
}

.coupon-section {
  margin-bottom: 24px;
}

.coupon-section h4 {
  margin-bottom: 12px;
  font-size: 15px;
  color: #555;
}

.coupon-list {
  display: flex;
  gap: 12px;
  padding-bottom: 10px;
  overflow-x: auto; /* 允许水平滚动 */
  scrollbar-width: none; /* 隐藏滚动条（Firefox） */
}

.coupon-list::-webkit-scrollbar {
  display: none; /* 隐藏滚动条（Chrome/Safari） */
}

/* 优惠券样式 */
.coupon-item {
  min-width: 100px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: all 0.3s;
  flex-shrink: 0;

}

.coupon-item:hover {
  background-color: #f0f8ff;
}

.coupon-item.active {
  border-color: #3498db;
  background-color: #e8f4ff;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.2);
}


.coupon-value {
  display: flex;
  flex-direction: column;
}

.discount {
  font-size: 18px;
  color: #e74c3c;
  font-weight: bold;
  line-height: 1.3;
}

.coupon-condition {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.payment-section {
  margin-bottom: 24px;
}

.payment-section h4 {
  margin-bottom: 12px;
  font-size: 15px;
  color: #555;
}

.payment-methods {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
}

.payment-methods::-webkit-scrollbar {
  display: none;
}

.payment-method {
  flex: 1;
  min-width: 100px;
}

.checkout-buttons {
  display: flex;
  gap: 15px;
}

.checkout-buttons .el-button {
  flex: 1;
  height: 40px;
  font-size: 14px;
  padding: 10px 20px;
}

/* 空购物车样式 */
.empty-cart {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.empty-cart p {
  font-size: 18px;
  color: #666;
  margin-bottom: 25px;
}

/* 优惠券滚动容器 */
.coupon-scroll-container {
  min-width: max-content; /* 确保内容足够宽 */
  padding-bottom: 8px; /* 添加底部内边距 */
}

/* 支付方式滚动容器 */
.payment-scroll-container {
  min-width: max-content; /* 确保内容足够宽 */
  padding-bottom: 8px; /* 添加底部内边距 */
}

/* 优惠券列表样式 */
.coupon-list {
  display: flex;
  gap: 12px;
  min-width: max-content; /* 确保内容足够宽 */
}

/* 优惠券项样式 */
.coupon-item {
  min-width: 120px; /* 增加最小宽度 */
  padding: 12px 16px; /* 增加内边距 */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: all 0.3s;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 支付方式列表样式 */
.payment-methods {
  display: flex;
  gap: 10px;
  min-width: max-content;
}

/* 支付方式按钮样式 */
.payment-method {
  min-width: 110px; /* 增加最小宽度 */
  flex-shrink: 0; /* 防止按钮被压缩 */
  padding: 10px 15px; /* 增加内边距 */
}


/* 响应式布局调整 */
@media (max-width: 1200px) {
  .cart-layout {
    flex-direction: column;
  }

  .checkout-container {
    width: 100%;
    position: relative;
    top: 0;
    margin-top: 30px;
  }
}

@media (max-width: 768px) {
  .coupon-item {
    min-width: 100px;
    padding: 10px 12px;
  }

  .payment-method {
    min-width: 90px;
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 576px) {
  .coupon-item {
    min-width: 85px;
    padding: 8px 10px;
  }

  .payment-method {
    min-width: 80px;
    padding: 6px 10px;
    font-size: 12px;
  }
}

</style>
