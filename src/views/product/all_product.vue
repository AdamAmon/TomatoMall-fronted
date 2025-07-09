<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { updateInfo, getAllProducts, getOneProductAmount, searchName,searchByTag,TagEnum } from '../../api/product.ts';
import { addProductToCart, changeCartItemQuantity, getAllCartItems, getCart } from '../../api/cart.ts';
import { ElMessage } from 'element-plus'; // 确保导入 ElMessage
import { getAllAdvertisements } from "../../api/advertisement"; // 新增广告API导入

// 在类型定义部分添加
interface AdvertisementInfo {
  advId: number;
  title: string;
  content: string;
  advUrl: string;
  productId: number;
}


// 广告轮播相关
const advertisements = ref<AdvertisementInfo[]>([]);

const products = ref<updateInfo[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();
const searchQuery = ref<string>('');
const tagEnumMapping: { [key in TagEnum]: string } = {
  [TagEnum.NOVEL]: 'NOVEL',
  [TagEnum.ART]: 'ART',
  [TagEnum.HISTORY]: 'HISTORY',
  [TagEnum.LITERATURE]: 'LITERATURE',
  [TagEnum.PHILOSOPHY]: 'PHILOSOPHY',
  [TagEnum.PSYCHOLOGY]: 'PSYCHOLOGY',
  [TagEnum.TEXTBOOK]: 'TEXTBOOK',
  [TagEnum.CULTURE]: 'CULTURE',
  [TagEnum.OTHER]: 'OTHER',
};
const tags = Object.values(TagEnum);
const selectedQuantity = ref<{ [key: number]: number }>({});
const selectedTag = ref<TagEnum | null>(null); // 新增这一行

const fetchProducts = async () => {
  try {
    const response = await getAllProducts();
    if (response.data.code == 200) {
      products.value = response.data.data;
      // 获取每个商品的库存
      for (const product of products.value) {
        const stockResponse = await getOneProductAmount(product.id.toString());
        if (stockResponse.data.code == 200) {
          product.stockpile = stockResponse.data.data; // 将库存信息添加到商品对象中
        }
      }
    } else {
      error.value = "获取商品列表失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取广告数据
const fetchAdvertisements = async () => {
  try {
    const response = await getAllAdvertisements();
    if (response.code == 200) {
      advertisements.value = response.data;
    } else {
      console.error("获取广告列表失败");
    }
  } catch (err) {
    console.error("请求广告失败:", err);
  }
};

// 跳转到单个商品页面
const viewProduct = (productId: number) => {
  router.push({ name: "SingleProduct", params: { id: productId } });
};
const handleTagSelect = async (tag: TagEnum) => {
  selectedTag.value = tag; // 设置当前选中的标签
  const enumName = tagEnumMapping[tag];
  try {
    const response = await searchByTag(enumName as TagEnum); // 调用API获取数据
    if (response.data.code == 200) {
      products.value = response.data.data;
      for (const product of products.value) {
        const stockResponse = await getOneProductAmount(product.id.toString());
        if (stockResponse.data.code == 200) {
          product.stockpile = stockResponse.data.data;
        }
      }
    } else {
      error.value = "获取商品列表失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
  } finally {
    loading.value = false;
  }
};

const performSearch = async () => {
  try {
    const response = await searchName(searchQuery.value);
    if (response.data.code == 200) {
      products.value = response.data.data;
      // 获取每个商品的库存
      for (const product of products.value) {
        const stockResponse = await getOneProductAmount(product.id.toString());
        if (stockResponse.data.code == 200) {
          product.stockpile = stockResponse.data.data; // 将库存信息添加到商品对象中
        }
      }
    } else {
      error.value = "获取商品列表失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
  } finally {
    loading.value = false;
  }
};

// 添加商品到购物车
const addToCart = async (productId: number, quantity: number) => {
  try {
    const userId = parseInt(localStorage.getItem('userId') || '0');
    if (userId <= 0) {
      throw new Error('用户未登录或用户ID无效');
    }

    // 检查数量是否超过可用库存
    if (!checkQuantity(productId, quantity)) {
      return;
    }

    // 获取当前用户的购物车中的所有商品
    const cartResponse = await getCart(userId);
    const cartId = cartResponse.data.cartId; // 假设返回的购物车信息中包含 cartId
    const cartItemsResponse = await getAllCartItems(cartId);
    const cartItems = cartItemsResponse.data;

    // 检查商品是否已经在购物车中
    const existingCartItem = cartItems.find((item: any) => item.productId === productId);

    if (existingCartItem) {
      // 如果商品已存在，更新商品数量
      await changeCartItemQuantity(userId, existingCartItem.itemId.toString(), existingCartItem.quantity + quantity);
      ElMessage.success('商品数量已更新');
    } else {
      // 如果商品不存在，添加新商品
      await addProductToCart(userId, productId.toString(), quantity);
      ElMessage.success('商品已成功加入购物车');
    }

    // 刷新商品列表以更新库存信息
    await fetchProducts();
  } catch (error) {
    console.error('加入购物车失败:', error);
    ElMessage.error('加入购物车失败，请稍后再试');
  }
};

// 检查数量是否超过可用库存
const checkQuantity = (productId: number, quantity: number): boolean => {
  const product = products.value.find(p => p.id === productId);
  if (product && product.stockpile) {
    const availableStock = (product.stockpile.amount || 0) - (product.stockpile.frozen || 0) - 1;
    if (quantity > availableStock) {
      ElMessage.error('选择的数量超过可用库存');
      return false;
    }
  }
  return true;
};

fetchProducts();
fetchAdvertisements();
</script>


<template>
  <div class="product-page-container">
    <div v-if="advertisements.length > 0" class="advertisement-carousel">
      <el-carousel :interval="5000" arrow="always" height="300px">
        <el-carousel-item
            v-for="(adv, index) in advertisements"
            :key="index"
            @click="viewProduct(adv.productId)"          style="cursor: pointer"
        >
          <img
              :src="adv.advUrl"
              alt="广告图片"
              class="carousel-image"
          />
        </el-carousel-item>
      </el-carousel>
    </div>
    <!-- 顶部搜索和筛选区域 -->
    <div class="search-filter-section">
      <div class="search-container">
        <el-input
            v-model="searchQuery"
            placeholder="搜索商品名称..."
            class="search-input"
            clearable
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
        </el-input>
        <el-button
            type="primary"
            icon="el-icon-search"
            @click="performSearch"
            class="search-button"
        >
          搜索
        </el-button>
      </div>

      <!-- 标签分类 -->
      <div class="category-tags">
        <el-button
            v-for="tag in tags"
            :key="tag"
            :type="selectedTag === tag ? 'primary' : ''"
            @click="handleTagSelect(tag as TagEnum)"
            class="category-tag"
        >
          {{ tag }}
        </el-button>
      </div>
    </div>

    <!-- 商品列表区域 -->
    <div class="product-list-container">
      <h1 class="section-title">商品列表</h1>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <el-icon><warning /></el-icon>
        <span>{{ error }}</span>
      </div>

      <div v-else>
        <!-- 商品网格布局 -->
        <div class="product-grid">
          <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
              @click="viewProduct(product.id)"
          >
            <!-- 商品图片 -->
            <div class="product-image-container">
              <el-image
                  :src="product.cover"
                  fit="cover"
                  class="product-image"
              >
                <template #error>
                  <div class="image-error-placeholder">
                    <el-icon><picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-if="product.stockpile" class="stock-badge">
                库存: {{ product.stockpile.amount - (product.stockpile.frozen || 0) - 1 }}
              </div>
            </div>

            <!-- 商品信息 -->
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>

              <div class="product-meta">
                <div class="product-price">
                  <span class="price-label">价格:</span>
                  <span class="price-value">¥{{ product.price.toFixed(2) }}</span>
                </div>

                <div class="product-rating">
                  <el-rate
                      v-model="product.rate"
                      disabled
                      :max="5"
                      show-score
                      text-color="#ff9900"
                      score-template="{value}"
                  />
                </div>
              </div>

              <p class="product-description">{{ product.description }}</p>
            </div>

            <!-- 购物车操作 -->
            <div class="cart-actions" @click.stop>
              <el-input-number
                  v-model="selectedQuantity[product.id]"
                  :min="0"
                  :max="(product.stockpile?.amount || 0) - (product.stockpile?.frozen || 0) - 1"
                  size="small"
                  controls-position="right"
                  class="quantity-input"
              />
              <el-button
                  type="primary"
                  size="small"
                  icon="el-icon-shopping-cart-full"
                  @click.stop="addToCart(product.id, selectedQuantity[product.id] || 1)"
                  :disabled="!selectedQuantity[product.id] || selectedQuantity[product.id] === 0"
                  class="add-cart-btn"
              >
                加入购物车
              </el-button>
            </div>
          </div>
        </div>

        <!-- 无商品提示 -->
        <div v-if="products.length === 0" class="empty-state">
          <el-empty description="没有找到相关商品">
            <el-button type="primary" @click="fetchProducts">重新加载</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.advertisement-carousel {
  margin: -10px -0px 20px -0px;
  position: relative;
  overflow: visible;
}

.el-carousel {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}

.el-carousel {
  --slide-width: 60%; /* 主广告宽度 */
  --slide-overlap: 40%; /* 相邻广告显示部分 */
}

.el-carousel__item {
  position: absolute;
  width: 60%; /* 主广告宽度 */
  height: 300px;
  transition: all 0.5s ease;
  transform-origin: center center;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: none;
  z-index: 1;
  opacity: 0.7;
  transform: scale(0.85);

  left: 20%;
  transform: translateX(-50%) scale(0.85);
}

/* 当前活动广告样式 */
.el-carousel__item.is-active {
  transform: translateX(-50%) scale(1);
  opacity: 1;
  z-index: 3;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

/* 相邻广告的位置调整 */
.el-carousel__item.prev-item {
  transform: translateX(calc(-150% - 20px)) scale(0.85);
}
.el-carousel__item.next-item {
  transform: translateX(50%) scale(0.85);
}

/* 隐藏所有边框和阴影 */
.el-carousel__item {
  border: none !important;
  box-shadow: none !important;
}


.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}


.carousel-image:hover {
  transform: scale(1.05);
}

.el-carousel__arrow {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 4;
}
.el-carousel__arrow:hover {
  background: white;
}

.product-page-container {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-filter-section {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.search-container {
  display: flex;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  margin-right: 10px;
}

.search-button {
  width: 120px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 5px 0;
}

.category-tag {
  border-radius: 16px;
  padding: 6px 15px;
  transition: all 0.3s;
}

.product-list-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 95vw;
  margin: 0 auto;
}

.section-title {
  font-size: 22px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* === 新增自适应网格布局 === */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

/* 响应式断点 */
@media (min-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(5, minmax(220px, 1fr));
  }
}

@media (min-width: 992px) and (max-width: 1199px) {
  .product-grid {
    grid-template-columns: repeat(4, minmax(200px, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(180px, 1fr));
  }
}

@media (max-width: 767px) and (min-width: 481px) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.product-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  background: #fff;
  flex-direction: column;
  display: flex;
  height: 100%;
  justify-content: space-between;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.product-image-container {
  height: 220px;
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

.product-price {
  display: flex;
  align-items: center;
}

.price-value {
  color: #e02d2d;
  font-size: 18px;
  font-weight: 700;
}

.product-rating {
  margin: 5px 0;
}

.product-description {
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.product-rating {
  display: flex;
  align-items: center;
}

.cart-actions {
  padding: 0 15px 15px;
  display: flex;
  gap: 10px;
}

.quantity-input {
  width: 100px;
}

.add-cart-btn {
  flex: 1;
}

.loading-state {
  padding: 50px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #888;
}
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-state,
.error-state {
  font-size: 40px;
  margin-bottom: 20px;
}

.loading-state{
  animation: rotating 2s linear infinite;
}

.empty-state {
  padding: 40px 0;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .search-filter-section {
    flex-direction: column;
    gap: 10px;
  }

  .category-tags {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>