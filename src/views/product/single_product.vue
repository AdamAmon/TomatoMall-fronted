<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getOneProduct,
  updateAmount,
  updateProduct,
  StockpileVO,
  getOneProductAmount,
  deleteProduct,
  getProductComments,
  CommentVO,
} from "../../api/product.ts";
import { addProductToCart, changeCartItemQuantity, getAllCartItems, getCart } from '../../api/cart.ts';
import { ElMessage,} from 'element-plus';
import { makeComment, deleteComment,useRecommendTicket } from "../../api/account.ts";
import { Star, InfoFilled, Loading, Warning } from '@element-plus/icons-vue'
const route = useRoute();
const router = useRouter();
const role = sessionStorage.getItem("role");

// 商品基本信息
const product = ref<any | null>(null);
const stockpile = ref<StockpileVO | null>(null);
type CommentDisplay = CommentVO & { username?: string; name?: string; avatar?: string };
const comments = ref<CommentDisplay[]>([]);
const defaultAvatar = 'https://avatars.githubusercontent.com/u/9919?s=200&v=4';
const isEditingStockpile = ref(false);
const newStockpileAmount = ref<number | null>(null);
const isEditing = ref(false);
const newItem = ref("");
const newValue = ref("");
const selectedQuantity = ref<{ [key: number]: number }>({});
const loading = ref(true);
const error = ref<string | null>(null);
const commentContent = ref("");
const commentRate = ref(5);

// 计算属性
const availableStock = computed(() => {
  const amt = stockpile.value?.amount ?? 0;
  const frozen = stockpile.value?.frozen ?? 0;
  return Math.max(0, amt - frozen - 1);
});

const formattedRate = computed(() => Number(product.value?.rate ?? 0).toFixed(2));

// 获取商品基本信息
const fetchProductDetails = async () => {
  try {
    const productId = route.params.id as string;
    const response = await getOneProduct(productId);
    if (response.data.code == 200) {
      product.value = response.data.data;
    } else {
      error.value = response.data.message || "获取商品详情失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
    console.error(err);
  }
};

// 获取商品评论
const fetchProductComments = async () => {
  try {
    const productId = route.params.id as string;
    const response = await getProductComments(productId);
    if (response.code == 200) {
      comments.value = response.data;
    } else {
      error.value = response.message || "获取评论失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
    console.error(err);
  }
};

// 删除规格项
const removeSpecification = (index: number) => {
  if (product.value.specifications) {
    product.value.specifications.splice(index, 1);
  }
};

// 添加新规格
const addNewSpecification = () => {
  if (!newItem.value || !newValue.value) {
    ElMessage.warning("请输入规格名称和规格值");
    return;
  }

  if (!product.value.specifications) {
    product.value.specifications = [];
  }

  product.value.specifications.push({ item: newItem.value, value: newValue.value });
  newItem.value = "";
  newValue.value = "";
};

// 获取商品库存信息
const fetchProductStockpile = async () => {
  try {
    const productId = route.params.id as string;
    const response = await getOneProductAmount(productId);
    if (response.data.code == 200) {
      stockpile.value = response.data.data;
    } else {
      error.value = response.data.message || "获取商品库存失败";
    }
  } catch (err) {
    error.value = "请求失败，请稍后再试";
    console.error(err);
  }
};

// 切换编辑模式
const toggleEditMode = () => {
  isEditing.value = !isEditing.value;
};

// 更新商品信息
const saveProductInfo = async () => {
  try {
    if (!product.value) return;

    const productId = route.params.id as string;
    const updatedProduct = {
      id: Number(productId),
      title: product.value.title,
      price: product.value.price,
      rate: product.value.rate,
      description: product.value.description,
      cover: product.value.cover,
      detail: product.value.detail,
      specifications: product.value.specifications,
      stockpile: product.value.stockpile,
      recommend: product.value.recommendTicket,
    };

    await updateProduct(updatedProduct);
    ElMessage.success("商品信息更新成功！");
    isEditing.value = false;
    await fetchProductDetails();
  } catch (err) {
    console.error("更新商品信息失败:", err);
    ElMessage.error("更新商品信息失败，请稍后再试");
  }
};

// 删除商品
const deletepro = async () => {
  try {
    const productId = route.params.id as string;
    await deleteProduct(productId);
    ElMessage.success("商品删除成功！");
    router.push({ path: "/product/all_product" });
  } catch (err) {
    console.error("删除商品失败:", err);
    ElMessage.error("删除商品失败，请稍后再试");
  }
};

// 更新库存数量
const saveStockpileAmount = async () => {
  if (newStockpileAmount.value == null || newStockpileAmount.value < 0) {
    ElMessage.warning("请输入有效的库存数量");
    return;
  }

  try {
    const productId = route.params.id as string;
    const pid = parseInt(productId, 10);
    const frozen = stockpile.value?.frozen || 0;

    await updateAmount(productId, {
      id: stockpile.value?.id || 0,
      amount: newStockpileAmount.value,
      frozen: frozen,
      productId: pid,
    });

    if (stockpile.value) {
      stockpile.value.amount = newStockpileAmount.value;
    }

    isEditingStockpile.value = false;
    ElMessage.success("库存更新成功");
  } catch (err) {
    console.error("更新库存失败:", err);
    ElMessage.error("更新库存失败");
  }
};

const toggleEditStockpile = () => {
  isEditingStockpile.value = !isEditingStockpile.value;
  if (isEditingStockpile.value && stockpile.value) {
    newStockpileAmount.value = stockpile.value.amount;
  }
};

// 添加商品到购物车
const addToCart = async (productId: number, quantity: number) => {
  try {
    const userId = parseInt(localStorage.getItem('userId') || '0');
    if (userId <= 0) {
      throw new Error('用户未登录或用户ID无效');
    }

    if (!checkQuantity(quantity)) {
      return;
    }

    const cartResponse = await getCart(userId);
    const cartId = cartResponse.data.cartId;
    const cartItemsResponse = await getAllCartItems(cartId);
    const cartItems = cartItemsResponse.data;

    const existingCartItem = cartItems.find((item: any) => item.productId === productId);

    if (existingCartItem) {
      await changeCartItemQuantity(userId, existingCartItem.itemId.toString(), existingCartItem.quantity + quantity);
      await fetchProductStockpile();
      ElMessage.success('商品数量已更新');
    } else {
      await addProductToCart(userId, productId.toString(), quantity);
      await fetchProductStockpile();
      ElMessage.success('商品已成功加入购物车');
    }
  } catch (error) {
    console.error('加入购物车失败:', error);
    ElMessage.error('加入购物车失败，请稍后再试');
  }
};

// 检查数量是否超过可用库存
const checkQuantity = (quantity: number): boolean => {
  const availableStock = (stockpile.value?.amount || 1) - (stockpile.value?.frozen || 0) - 1;
  if (quantity > availableStock) {
    ElMessage.error('选择的数量超过可用库存');
    return false;
  }
  return true;
};

// 返回列表
const goBack = () => {
  router.push({ path: "/product/all_product" });
};

// 发表评论
const postComment = async () => {
  try {
    const userId = localStorage.getItem('userId') || '';
    if (!userId) {
      ElMessage.error('请先登录再发表评论');
      return;
    }
    const productId = route.params.id as string;
    if (!commentContent.value.trim()) {
      ElMessage.warning('请输入评论内容');
      return;
    }
    await makeComment(userId.toString(), productId, commentContent.value, commentRate.value);
    ElMessage.success('评论已提交');
    commentContent.value = '';
    commentRate.value = 5;
    await fetchProductComments();
  } catch (err) {
    console.error('发表评论失败:', err);
    ElMessage.error('发表评论失败，请稍后再试');
  }
};

const handleDeleteComment = async (id: string) => {
  try {
    await deleteComment(id);
    ElMessage.success('评论已删除');
    await fetchProductComments();
  } catch (err) {
    console.error('删除评论失败:', err);
    ElMessage.error('删除评论失败，请稍后再试');
  }
};

const recommend = async (pid?: number | string) => {
  try {
    const userId = localStorage.getItem('userId') || '';
    if (!userId) {
      ElMessage.error('请先登录再操作');
      return;
    }
    if (pid == null) return;
    await useRecommendTicket(userId.toString(), String(pid));
    ElMessage.success('已打赏推荐票');
    await fetchProductDetails();
  } catch (err) {
    console.error('推荐失败:', err);
    ElMessage.error('推荐失败，请稍后再试');
  }
};

const formatTag = (tag: any): string => {
  if (tag == null) return '未分类';
  if (typeof tag === 'string') return tag;
  if (Array.isArray(tag)) return tag.filter(Boolean).join('、');
  if (typeof tag === 'number') return `分类${tag}`;
  try { return String(tag); } catch { return '未分类'; }
};

onMounted(async () => {
  try {
    loading.value = true;
    await Promise.all([
      fetchProductDetails(),
      fetchProductStockpile(),
      fetchProductComments(),
    ]);
    if (product.value?.id && selectedQuantity.value[product.value.id] == null) {
      selectedQuantity.value[product.value.id] = 1;
    }
  } finally {
    loading.value = false;
  }
});
</script>

  <template>
    <div class="product-detail-container">
      <!-- 背景层 -->
      <div class="background-layer"></div>

      <!-- 主要内容 -->
      <div v-if="!loading && !error" class="elegant-product-detail">
        <!-- 顶部：标题与返回 -->
        <div class="pd-header">
          <div class="pd-header-left">
            <h1 v-if="!isEditing" class="pd-title">{{ product?.title }}</h1>
            <el-input v-else v-model="product.title" placeholder="请输入商品标题" class="pd-title-input" />
          </div>
          <div class="pd-header-right">
            <el-button class="btn ghost" @click="goBack" icon="el-icon-back">返回列表</el-button>
          </div>
        </div>

        <!-- 主体：两列布局 -->
        <div class="detail-layout">
          <!-- 左侧：图片预览 -->
          <div class="gallery">
            <el-image
              v-if="product"
              class="main-photo"
              :src="product?.cover"
              fit="cover"
            />

            <div class="recommend">
              <div class="recommend-row">
                <el-icon><Star /></el-icon>
                <span>推荐票</span>
                <strong>{{ product?.recommendTicket || 0 }}</strong>
                <el-button class="btn primary small" @click="recommend(product?.id)" icon="el-icon-star-on">打赏</el-button>
              </div>
              <div class="recommend-hint">
                <el-icon><InfoFilled /></el-icon>
                <span>推荐票越多，商品曝光率越高</span>
              </div>
            </div>
          </div>

          <!-- 右侧：商品信息与购买 -->
          <div class="info-panel">
            <div class="price-block">
              <div class="price">¥{{ product?.price?.toFixed(2) }}</div>
              <div class="stock">库存：{{ availableStock }} 件</div>
            </div>

            <div class="meta-block">
              <div class="rating">
                <el-rate :model-value="product?.rate || 0" disabled :max="5" />
                <span class="rating-text">{{ formattedRate }}</span>
              </div>
              <div class="tag">分类：{{ formatTag(product?.tag) }}</div>
            </div>

            <!-- 商品介绍：移到右侧 -->
            <div class="desc">
              <template v-if="product?.description && product.description.trim()">
                {{ product.description }}
              </template>
              <template v-else>
                暂无商品介绍
              </template>
            </div>

            <div class="buy-block">
              <div class="qty">
                <span>数量</span>
                <el-input-number
                  v-model="selectedQuantity[product?.id]"
                  :min="1"
                  :max="availableStock || 1"
                  size="large"
                  controls-position="right"
                />
              </div>
              <div class="actions">
                <el-button class="btn primary" @click="addToCart(product?.id, selectedQuantity[product?.id] || 1)" icon="el-icon-shopping-cart-full">加入购物车</el-button>
                <el-button class="btn" v-if="role === 'MANAGER'" @click="toggleEditMode" icon="el-icon-edit">编辑商品信息</el-button>
              </div>
            </div>

            <div class="admin-block" v-if="role === 'MANAGER'">
              <div class="admin-row">
                <el-button class="btn warn" @click="toggleEditStockpile" :icon="isEditingStockpile ? 'el-icon-close' : 'el-icon-edit'">{{ isEditingStockpile ? '取消编辑库存' : '编辑库存' }}</el-button>
                <el-button class="btn danger" @click="deletepro" icon="el-icon-delete">删除商品</el-button>
                <el-button class="btn success" v-if="isEditing" @click="saveProductInfo" icon="el-icon-check">保存商品信息</el-button>
                <el-button class="btn" v-if="isEditing" @click="toggleEditMode" icon="el-icon-close">取消编辑</el-button>
              </div>
              <div class="stock-edit" v-if="isEditingStockpile">
                <el-input-number v-model="newStockpileAmount" :min="0" controls-position="right" />
                <el-button class="btn primary" @click="saveStockpileAmount" icon="el-icon-check">保存库存</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 下方：详情/规格/评价 -->
        <el-card class="tabs-card">
          <el-tabs type="border-card">
            
            <el-tab-pane label="规格参数">
              <!-- 规格编辑区域 -->
              <div v-if="isEditing" class="spec-edit">
                <div class="spec-grid">
                  <div v-for="(spec, index) in product.specifications" :key="index" class="spec-item">
                    <el-input v-model="spec.item" placeholder="规格名称" size="small" />
                    <el-input v-model="spec.value" placeholder="规格值" size="small" />
                    <el-button class="btn danger small" @click="removeSpecification(index)" icon="el-icon-delete">删除</el-button>
                  </div>
                </div>
                <div class="add-spec">
                  <el-input v-model="newItem" placeholder="规格名称" size="small" />
                  <el-input v-model="newValue" placeholder="规格值" size="small" />
                  <el-button class="btn primary" @click="addNewSpecification" icon="el-icon-plus">添加规格</el-button>
                </div>
              </div>
              <!-- 规格显示区域 -->
              <div v-else>
                <div v-if="product?.specifications && product.specifications.length" class="spec-grid">
                  <div v-for="(spec, index) in product.specifications" :key="index" class="spec-item">
                    <div class="spec-name">{{ spec.item }}</div>
                    <div class="spec-value">{{ spec.value }}</div>
                  </div>
                </div>
                <div v-else class="no-spec">暂无规格信息</div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="用户评价">
              <div v-if="comments.length === 0" class="no-comments">还没有评论，快来发表第一个评论吧！</div>

              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <div class="user-info">
                    <el-avatar :size="40" :src="comment.avatar || defaultAvatar"></el-avatar>
                    <strong class="username">{{ comment.username || comment.name || '用户'}}</strong>
                  </div>
                  <el-button class="btn danger small" v-if="role === 'MANAGER'" @click="handleDeleteComment(comment.id.toString())" icon="el-icon-delete">删除</el-button>
                </div>
                <div class="comment-rating">
                  <el-rate v-model="comment.rate" disabled :max="5" />
                  <span class="rating-text">{{ Number(comment.rate ?? 0).toFixed(2) }}</span>
                </div>
                <div class="comment-content"><p>{{ comment.content }}</p></div>
              </div>

              <div class="post-comment">
                <h3 class="section-subtitle">发表评论</h3>
                <el-rate v-model="commentRate" :max="5" class="comment-rate"></el-rate>
                <el-input type="textarea" v-model="commentContent" placeholder="请分享您的使用体验..." :rows="4" class="comment-textarea"></el-input>
                <el-button class="btn primary" @click="postComment" icon="el-icon-chat-line-round">提交评论</el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="50" color="#409EFF"><Loading /></el-icon>
        <div class="loading-text">加载中，请稍候...</div>
      </div>

      <div v-else-if="error" class="error-message">
        <el-icon :size="30" color="#F56C6C"><Warning /></el-icon>
        <div class="error-text">{{ error }}</div>
        <el-button @click="fetchProductDetails" type="primary" size="default">重新加载</el-button>
      </div>
    </div>
  </template>
<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.product-detail-container {
  min-height: 100vh;
  padding: 20px;
  position: relative;
  color: #333;
}

/* 背景层 */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  filter: blur(3px) brightness(0.7);
  z-index: -1;
}

.elegant-product-detail {
  position: relative;
  z-index: 1;
}

/* 顶部区域 */
.pd-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.pd-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.pd-title-input {
  max-width: 520px;
  font-size: 24px;
  font-weight: bold;
}

/* 按钮样式 */
.btn {
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn.primary {
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  color: #fff;
}

.btn.ghost {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.btn.warn {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff;
}

.btn.success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}

.btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}

.btn.small {
  padding: 6px 10px;
  font-size: 13px;
}

/* 主体布局 */
.detail-layout {
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* 图片展示区 */
.gallery {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-photo {
  width: 100%;
  height: 480px;
  border-radius: 10px;
  overflow: hidden;
  object-fit: cover;
}

.thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.thumb {
  width: 100%;
  height: 90px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.thumb:hover {
  transform: scale(1.05);
}

.recommend {
  margin-top: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.recommend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.recommend-row strong {
  color: #ef4444;
  font-size: 18px;
}

.recommend-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 13px;
}

/* 信息面板 */
.info-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.price-block {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 12px;
}

.price {
  font-size: 32px;
  font-weight: 800;
  color: #ef4444;
  background: linear-gradient(135deg, #ef4444, #f59e0b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stock {
  color: #6b7280;
  font-size: 16px;
}

.meta-block {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  color: #f59e0b;
  font-weight: 700;
  font-size: 16px;
}

.tag {
  color: #374151;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.buy-block {
  padding-top: 12px;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  align-items: center;
}

.qty {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #374151;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 管理功能 */
.admin-block {
  margin-top: 16px;
  border-top: 1px dashed #e5e7eb;
  padding-top: 16px;
}

.admin-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.stock-edit {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
}

/* 标签页 */
.tabs-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  padding: 0;
  overflow: hidden;
}

.tabs-card :deep(.el-tabs__header) {
  margin: 0;
}

.tabs-card :deep(.el-tabs__content) {
  padding: 20px;
}

.desc {
  color: #4b5563;
  line-height: 1.8;
  font-size: 16px;
  padding: 10px 0;
}

/* 规格相关 */
.spec-edit {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.spec-edit .spec-grid {
  display: grid;
  gap: 12px;
}

.spec-edit .spec-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.spec-edit .spec-item .el-input {
  flex: 1;
}

.add-spec {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
}

.add-spec .el-input {
  flex: 1;
}

/* 规格显示 */
.spec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 16px 0;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.spec-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spec-name,
.spec-value {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.spec-name {
  font-weight: 600;
  color: #1f2937;
}

.no-spec {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-style: italic;
  font-size: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin: 10px 0;
}

/* 评论区域 */
.no-comments {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-style: italic;
  font-size: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin: 10px 0;
}

.comment-item {
  padding: 20px;
  margin-bottom: 20px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.comment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #1f2937;
  font-size: 16px;
}

.comment-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-content p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  font-size: 15px;
}

.post-comment {
  margin-top: 30px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.comment-rate {
  margin-bottom: 16px;
}

.comment-textarea {
  margin-bottom: 16px;
}

.comment-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.comment-textarea :deep(.el-textarea__inner:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-overlay .is-loading {
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 18px;
  color: #374151;
  font-weight: 500;
}

/* 错误状态 */
.error-message {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  gap: 20px;
  text-align: center;
  padding: 20px;
}

.error-text {
  font-size: 18px;
  color: #dc2626;
  font-weight: 500;
  max-width: 500px;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  
  .gallery {
    max-width: 600px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .product-detail-container {
    padding: 10px;
  }
  
  .pd-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .pd-header-left,
  .pd-header-right {
    width: 100%;
  }
  
  .pd-title {
    font-size: 24px;
  }
  
  .detail-layout {
    gap: 16px;
  }
  
  .main-photo {
    height: 350px;
  }
  
  .buy-block {
    grid-template-columns: 1fr;
  }
  
  .admin-row,
  .actions {
    flex-direction: column;
  }
  
  .admin-row .btn,
  .actions .btn {
    width: 100%;
  }
  
  .spec-grid {
    grid-template-columns: 1fr;
  }
  
  .add-spec {
    flex-direction: column;
  }
  
  .add-spec .el-input {
    width: 100%;
  }
  
  .thumb {
    height: 60px;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stock-edit {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stock-edit .el-input-number {
    width: 100%;
  }
}
</style>