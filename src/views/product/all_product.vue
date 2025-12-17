<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { updateInfo, getAllProducts, getOneProductAmount, searchName,searchByTag,TagEnum } from '../../api/product.ts';
import { addProductToCart, changeCartItemQuantity, getAllCartItems, getCart } from '../../api/cart.ts';
import { ElMessage } from 'element-plus'; // 确保导入 ElMessage
import { getAllAdvertisements } from "../../api/advertisement"; // 新增广告API导入
import { Search } from "@element-plus/icons-vue";

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
const isCollapsedSearch = ref(false);
const isSearchFocus = ref(false);
const isPastNav = ref(false);
const currentPage = ref(1);
const pageSize = ref(8);// 每页显示8个商品

// 独立滚动阈值：搜索与侧边栏互不影响
// 搜索栏采用折叠/展开双阈值以避免临界点闪烁
const COLLAPSE_THRESHOLD_SEARCH = 140; // 超过则折叠
const EXPAND_THRESHOLD_SEARCH = 120;   // 回到此以下才展开
const SCROLL_THRESHOLD_SIDEBAR = 72;   // 侧边栏贴顶阈值

const handleScroll = () => {
  const y = window.scrollY;
  const scrolledSidebar = y > SCROLL_THRESHOLD_SIDEBAR;

  // 侧边栏：仅根据自己的阈值决定是否贴顶
  isPastNav.value = scrolledSidebar;

  // 搜索栏：双阈值避免闪烁；聚焦时在未超过折叠阈值保持展开
  if (isSearchFocus.value && y < COLLAPSE_THRESHOLD_SEARCH) {
    isCollapsedSearch.value = false;
    return;
  }

  if (!isCollapsedSearch.value && y > COLLAPSE_THRESHOLD_SEARCH) {
    isCollapsedSearch.value = true;
  } else if (isCollapsedSearch.value && y < EXPAND_THRESHOLD_SEARCH) {
    isCollapsedSearch.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const expandSearch = () => {
  isCollapsedSearch.value = false;
  isSearchFocus.value = true;
};

const handleSearchBlur = () => {
  isSearchFocus.value = false;
  handleScroll();
};

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
    currentPage.value = 1;
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
    currentPage.value = 1;
  }
};

// 选择“全部”标签：重置筛选并加载所有商品
const handleAllSelect = async () => {
  selectedTag.value = null;
  loading.value = true;
  await fetchProducts();
  currentPage.value = 1;
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
    isSearchFocus.value = false;
    handleScroll();
    currentPage.value = 1;
  }
};

const pagedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return products.value.slice(start, start + pageSize.value);
});

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

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>


<template>
  <div class="product-page-container">
    <div class="content-layout">
      <!-- 左侧边栏：分类标签 -->
      <aside class="sidebar">
        <div class="sidebar-card" :class="{ 'sidebar-top-flush': isPastNav }">
          <div
              class="category-grid"
          >
            <!-- 全部 标签 -->
            <div
                class="category-cell"
                :class="{ active: selectedTag === null }"
                @click="handleAllSelect"
            >
              <span class="cell-text">全部</span>
            </div>

            <!-- 其他标签 -->
            <div
                v-for="tag in tags"
                :key="tag"
                class="category-cell"
                :class="{ active: selectedTag === tag }"
                @click="handleTagSelect(tag as TagEnum)"
            >
              <span class="cell-text">{{ tag }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容 -->
      <section class="main-content">
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

        <!-- 顶部仅保留搜索区域 -->
        <div class="search-filter-section" :class="{ collapsed: isCollapsedSearch && !isSearchFocus }">
          <transition name="fade-scale">
            <div
                v-if="!isCollapsedSearch || isSearchFocus"
                class="search-container"
            >
              <el-input
                  v-model="searchQuery"
                  placeholder="搜索商品名称..."
                  class="search-input"
                  clearable
                  @focus="isSearchFocus = true"
                  @blur="handleSearchBlur"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button
                  type="primary"
                  class="search-button icon-only"
                  @click="performSearch"
              >
                <el-icon><Search /></el-icon>
              </el-button>
            </div>
          </transition>

          <transition name="fade-scale">
            <button
                v-if="isCollapsedSearch && !isSearchFocus"
                class="search-fab"
                @click="expandSearch"
                aria-label="展开搜索"
                title="展开搜索"
            >
              <el-icon><Search /></el-icon>
            </button>
          </transition>

          <!-- 移动端备用：横向标签条 -->
          <div class="mobile-categories">
            <div class="mobile-tags">
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
                  v-for="product in pagedProducts"
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
                      <span class="price-value">¥{{ product.price.toFixed(2) }}</span>
                    </div>

                    <div class="product-rating">
                      <el-rate
                          v-model="product.rate"
                          disabled
                          :max="5"
                          text-color="#ff9900"
                      />
                      <span class="score-text">{{ Number(product.rate ?? 0).toFixed(2) }}</span>
                    </div>
                  </div>

                  <p class="product-description">{{ product.description }}</p>
                </div>

              </div>
            </div>

            <div class="pagination-wrapper" v-if="products.length > pageSize">
              <el-pagination
                  background
                  layout="prev, pager, next"
                  :current-page="currentPage"
                  :page-size="pageSize"
                  :total="products.length"
                  @current-change="handlePageChange"
                  hide-on-single-page
              />
            </div>

            <!-- 无商品提示 -->
            <div v-if="products.length === 0" class="empty-state">
              <el-empty description="没有找到相关商品">
                <el-button type="primary" @click="fetchProducts">重新加载</el-button>
              </el-empty>
            </div>
          </div>
        </div>
      </section>
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
  --nav-offset: 72px; /* 与导航栏间距保持一致，方便统一调节 */
}

/* 布局：左侧边栏 + 右侧内容 */
.content-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  align-items: start;
}

.sidebar { position: relative; }
.sidebar-card {
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  padding: 0;
  position: fixed; /* 固定在视口左侧，随滚动保持位置 */
  left: 20px;
  top: var(--nav-offset);
  width: 260px; /* 与左侧列宽一致 */
  height: calc(100vh - var(--nav-offset) - 20px); /* 根据导航间距调整可视高度 */
  display: flex;
  flex-direction: column;
  z-index: 9;
}
.sidebar-card.sidebar-top-flush {
  top: 0;
  height: calc(100vh - 20px);
}
.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
}
.category-grid {
  margin-top: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr; /* 单列 */
  grid-auto-rows: 76px; /* 缩小矩形高度为 82px，保持一致 */
  gap: 8px;
  overflow-y: auto;
}

.category-cell {
  border: 1px solid #eef2f7;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(15,23,42,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.category-cell:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(15,23,42,0.1);
  background: #ffffff;
}
.category-cell.active {
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 12px 26px rgba(37,99,235,0.24);
}
.cell-text {
  font-size: 15px;
  font-weight: 600;
}
.main-content { min-width: 0; }

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  width: calc(100% - 60px);
  max-width: 1160px;
  padding-left: 36px;
}

.search-filter-section {
  position: sticky;
  top: var(--nav-offset);
  z-index: 10;
  background: transparent;
  padding: 6px 0 12px;
  box-shadow: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
.search-filter-section.collapsed {
  justify-content: flex-end;
}

.search-input {
  flex: 1;
  margin-right: 10px;
}
.search-input :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 #f8fafc, 0 1px 2px rgba(15,23,42,0.08);
}
.search-input :deep(.el-input__inner) {
  font-size: 14px;
  color: #0f172a;
}
.search-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.search-button {
  width: 52px;
  min-width: 52px;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 22px rgba(37,99,235,0.28);
  font-weight: 700;
  padding: 0;
}
.search-button:hover {
  filter: brightness(1.03);
  box-shadow: 0 14px 26px rgba(37,99,235,0.32);
}
.search-button:active {
  filter: brightness(0.97);
  box-shadow: 0 8px 18px rgba(37,99,235,0.28);
}

.search-button.icon-only :deep(.el-icon) {
  font-size: 18px;
}

.search-fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 22px rgba(37,99,235,0.28);
  color: #fff;
  cursor: pointer;
}
.search-fab:hover {
  filter: brightness(1.03);
  box-shadow: 0 14px 26px rgba(37,99,235,0.32);
}
.search-fab:active {
  filter: brightness(0.97);
  box-shadow: 0 8px 18px rgba(37,99,235,0.28);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.18s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.mobile-categories { display: none; }
.mobile-tags {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0 2px;
}
.category-tag {
  border-radius: 16px;
  padding: 6px 15px;
  transition: all 0.2s ease;
}

.product-list-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 95vw;
  margin: 0 auto;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 20px 0 0;
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
    grid-template-columns: repeat(4, minmax(220px, 1fr));
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

.product-info {
  padding: 12px 14px 14px;
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
  margin-bottom: 6px;
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
  margin-top: 6px;
}

.product-rating {
  display: flex;
  align-items: center;
}

.product-rating .score-text {
  margin-left: 8px;
  color: #ff9900;
  font-weight: 600;
  font-size: 14px;
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
  .content-layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .mobile-categories { display: block; }
  .search-filter-section {
    flex-direction: column;
    gap: 10px;
  }

  .mobile-tags { gap: 6px; }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>