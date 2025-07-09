<script setup lang="ts">
import { ref, onMounted } from "vue";
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
import { Star, InfoFilled } from '@element-plus/icons-vue'
const route = useRoute();
const router = useRouter();
const role = sessionStorage.getItem("role");

// 商品基本信息
const product = ref<any | null>(null);
const stockpile = ref<StockpileVO | null>(null);
const comments = ref<CommentVO[]>([]);
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

// 返回商品列表
const goBack = () => {
  router.push({ path: "/product/all_product" });
};

// 发表评论
const postComment = async () => {
  try {
    const userId = parseInt(localStorage.getItem('userId') || '0');
    if (userId <= 0) {
      throw new Error('用户未登录或用户ID无效');
    }

    const productId = route.params.id as string;
    await makeComment(userId.toString(), productId, commentContent.value, commentRate.value);
    ElMessage.success('评论成功');
    commentContent.value = "";
    commentRate.value = 5;
    await fetchProductComments();
  } catch (error) {
    console.error('发表评论失败:', error);
    ElMessage.error('发表评论失败，请稍后再试');
  }
  await saveProductInfo();
};

// 删除评论
const handleDeleteComment = async (commentId: string) => {
  try {

    await deleteComment(commentId);
    ElMessage.success('评论删除成功');
    await fetchProductComments();
  } catch (error) {
    console.error('删除评论失败:', error);
    ElMessage.error('删除评论失败，请稍后再试');
  }
};
const recommend = async (productId: string) => {
  try {
    const userId = parseInt(localStorage.getItem('userId') || '0');
    await useRecommendTicket(userId.toString(),productId);
    await fetchProductDetails();
  } catch (error) {

    ElMessage.error('推荐失败，请稍后再试');
  }
};
onMounted(async () => {
  loading.value = true;
  await fetchProductDetails();
  await fetchProductStockpile();
  await fetchProductComments();
  loading.value = false;
});

const formatTag = (tag: string): string => {
  const tagMap: Record<string, string> = {
    NOVEL: '小说',
    LITERATURE: '文学',
    ART: '艺术',
    HISTORY: '历史',
    PHILOSOPHY: '哲学',
    PSYCHOLOGY: '心理',
    CULTURE: '文化',
    TEXTBOOK: '教辅',
    OTHER: '其他'
  };
  return tagMap[tag] || '未知';
};
</script>

<template>
  <div class="background-layer"></div>
  <div class="product-detail-container">
    <!-- 头部区域 -->
    <div class="product-header">
      <div class="header-content">
        <h1 v-if="!isEditing" class="product-title">{{ product?.title }}</h1>
        <el-input
            v-else
            v-model="product.title"
            placeholder="请输入商品标题"
            class="title-input"
            size="large"
        />

        <el-button class="unified-button warning-button"
                   @click="goBack"

                   icon="el-icon-back"
                   type="primary"
                   plain
        >
          返回列表
        </el-button>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="product-main">
      <!-- 图片区域 -->
      <div class="product-gallery">
        <div class="main-image">
          <img v-if="product" :src="product?.cover" alt="商品主图" class="product-cover" />
        </div>
        <div class="recommendation-section">
          <div class="recommendation-info">
            <div class="ticket-count">
              <el-icon class="ticket-icon"><Star /></el-icon>
              <span class="count-label">推荐票:</span>
              <span class="count-value">{{ product?.recommendTicket || 0 }}</span>
            </div>
            <el-button
                class="unified-button warning-button"
                @click="recommend(product?.id)"
                icon="el-icon-star-on"
            >
              打赏推荐票
            </el-button>
          </div>
          <div class="recommendation-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>推荐票越多，商品曝光率越高</span>
          </div>
        </div>
      </div>

      <!-- 商品信息区域 -->
      <div class="product-info">
        <!-- 基本信息卡片 -->
        <el-card class="info-card">
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">价格：</span>
              <span v-if="!isEditing" class="price-value">¥{{ product?.price.toFixed(2) }}</span>
              <el-input-number
                  v-else
                  v-model="product.price"
                  :min="0"
                  :step="0.01"
                  controls-position="right"
                  size="medium"
              />
            </div>

            <div class="info-row">
              <span class="info-label">评分：</span>
              <span v-if="!isEditing" class="rating-value">{{ product?.rate }}</span>
              <el-input-number
                  v-else
                  v-model="product.rate"
                  :min="0"
                  :max="5"
                  :step="0.1"
                  controls-position="right"
                  size="medium"
              />
            </div>

            <div class="info-row">
              <span class="info-label">标签：</span>
              <span v-if="!isEditing" class="tag-value">{{ formatTag(product?.tag) }}</span>
              <el-select v-else v-model="product.tag" placeholder="请选择标签" size="medium">
                <el-option label="神话" value="MYTH" />
                <el-option label="纪实" value="DOCUMENTARY" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </div>

            <div class="info-row">
              <span class="info-label">描述：</span>
              <span v-if="!isEditing" class="description-text">{{ product?.description }}</span>
              <el-input
                  v-else
                  v-model="product.description"
                  type="textarea"
                  placeholder="请输入商品描述"
                  :rows="3"
                  class="description-input"
              />
            </div>
          </div>
        </el-card>

        <!-- 规格信息卡片 -->
        <el-card class="spec-card">
          <div class="card-header">
            <h3 class="section-title">规格信息</h3>
            <el-button class="unified-button warning-button"
                       v-if="!isEditing && role === 'MANAGER'"
                       @click="toggleEditMode"
                       type="primary"
                       size="small"
                       icon="el-icon-edit"
            >
              编辑商品信息
            </el-button>
          </div>

          <div v-if="product?.specifications && product.specifications.length > 0" class="spec-grid">
            <div v-for="(spec, index) in product.specifications" :key="index" class="spec-item">
              <div class="spec-name">
                <el-input
                    v-if="isEditing"
                    v-model="spec.item"
                    placeholder="规格名称"
                    size="small"
                />
                <span v-else>{{ spec.item }}</span>
              </div>
              <div class="spec-value">
                <el-input
                    v-if="isEditing"
                    v-model="spec.value"
                    placeholder="规格值"
                    size="small"
                />
                <span v-else>{{ spec.value }}</span>
              </div>
              <div class="spec-actions" v-if="isEditing">
                <el-button class="unified-button warning-button"
                           @click="removeSpecification(index)"
                           type="danger"
                           icon="el-icon-delete"
                           circle
                           size="small"
                >
                  删除规格
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="no-spec">
            暂无规格信息
          </div>

          <div v-if="isEditing" class="add-specification">
            <div class="spec-inputs">
              <el-input
                  v-model="newItem"
                  placeholder="请输入规格名称"
                  size="small"
                  class="spec-input"
              />
              <el-input
                  v-model="newValue"
                  placeholder="请输入规格值"
                  size="small"
                  class="spec-input"
              />
            </div>
            <el-button class="unified-button warning-button"
                       @click="addNewSpecification"
                       type="success"
                       icon="el-icon-plus"
                       size="small"
            >
              添加规格
            </el-button>
          </div>
        </el-card>

        <!-- 库存和操作区域 -->
        <el-card class="action-card">
          <div class="stock-info">
            <div class="stock-item">
              <span class="info-label">总库存：</span>
              <span v-if="stockpile" class="stock-value">{{ stockpile.amount - 1 }}</span>
            </div>
            <div class="stock-item">
              <span class="info-label">冻结库存：</span>
              <span v-if="stockpile" class="stock-value">{{ stockpile.frozen }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <el-button-group class="admin-buttons">
              <el-button class="unified-button warning-button"
                         v-if="role === 'MANAGER'"
                         @click="toggleEditStockpile"
                         type="warning"
                         :icon="isEditingStockpile ? 'el-icon-close' : 'el-icon-edit'"
              >
                {{ isEditingStockpile ? "取消编辑" : "编辑库存" }}
              </el-button>
              <el-button class="unified-button warning-button"
                         v-if="role === 'MANAGER'"
                         @click="deletepro"
                         type="danger"
                         icon="el-icon-delete"
              >
                删除商品
              </el-button>
              <el-button class="unified-button warning-button"
                         v-if="isEditing"
                         @click="saveProductInfo"
                         type="success"
                         icon="el-icon-check"
              >
                保存商品信息
              </el-button>
              <el-button class="unified-button warning-button"
                         v-if="isEditing"
                         @click="toggleEditMode"
                         type="info"
                         icon="el-icon-close"
              >
                取消编辑
              </el-button>
            </el-button-group>
          </div>

          <div v-if="isEditingStockpile" class="stock-edit">
            <el-input-number
                v-model="newStockpileAmount"
                placeholder="输入新的库存数量"
                :min="0"
                controls-position="right"
                size="medium"
                class="stock-input"
            />
            <el-button class="unified-button warning-button"
                       @click="saveStockpileAmount"
                       type="primary"
                       icon="el-icon-check"
            >
              保存库存
            </el-button>
          </div>

          <div class="cart-section">
            <div class="cart-controls">
              <span class="info-label">购买数量：</span>
              <el-input-number
                  v-model="selectedQuantity[product?.id]"
                  :min="1"
                  :max="((stockpile?.amount || 1) - (stockpile?.frozen || 0) - 1) || 1"
                  size="medium"
                  controls-position="right"
              />
              <el-button class="unified-button warning-button"
                         type="primary"
                         @click="addToCart(product?.id, selectedQuantity[product?.id] || 1)"
                         icon="el-icon-shopping-cart-full"
                         c
              >
                加入购物车
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 评论区域 -->
    <div class="comments-section">
      <el-card class="comments-card">
        <div class="section-header">
          <h2 class="section-title">商品评论</h2>
          <div v-if="comments.length === 0" class="no-comments">
            还没有评论，快来发表第一个评论吧！
          </div>
        </div>

        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <div class="user-info">
              <el-avatar :size="50" icon="el-icon-user-solid" class="user-avatar"></el-avatar>
              <div class="user-details">
                <strong class="username">用户{{ comment.userId }}</strong>

              </div>
            </div>
            <el-button class="unified-button warning-button"
                       v-if="role === 'MANAGER'"
                       @click="handleDeleteComment(comment.id.toString())"
                       type="danger"
                       icon="el-icon-delete"
                       circle
                       size="small"

            >
              删除评论
            </el-button>
          </div>
          <div class="comment-rating">
            <el-rate
                v-model="comment.rate"
                show-score
                disabled
                :max="5"
                text-color="#ff9900"/>
          </div>
          <div class="comment-content">
            <p>{{ comment.content }}</p>
          </div>
        </div>

        <div class="post-comment">
          <h3 class="section-subtitle">发表评论</h3>
          <el-rate v-model="commentRate" :max="5" show-score text-color="#ff9900" class="comment-rate"></el-rate>
          <el-input
              type="textarea"
              v-model="commentContent"
              placeholder="请分享您的使用体验..."
              :rows="4"
              class="comment-textarea"
          ></el-input>
          <el-button class="unified-button warning-button"
                     @click="postComment"
                     type="primary"
                     icon="el-icon-chat-line-round"

          >
            提交评论
          </el-button>
        </div>
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
      <el-button @click="fetchProductDetails" type="primary" size="medium">重新加载</el-button>
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

body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
  color: #333;
  overflow-x: hidden;
}

/* 背景层样式 */
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



/* 头部样式 */
.product-header {
  margin-bottom: 30px;
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center; /* 修改为居中 */
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative; /* 为按钮定位做准备 */
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative; /* 确保按钮可以绝对定位 */
}

.product-title {
  font-size: 50px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  -webkit-background-clip: text;
  background-clip: text;

  text-align: center; /* 标题文本居中 */
  flex-grow: 1; /* 允许标题占据可用空间 */
}




/* 主体内容 */
.product-main {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
}

.product-gallery {
  flex: 0 0 45%;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  height: 550px;
}
.product-gallery, .recommendation-section {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 25px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.main-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.product-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 关键属性 - 确保图片覆盖整个区域 */
  transition: transform 0.5s ease;
}

/* 添加悬停放大效果 */
.main-image:hover .product-cover {
  transform: scale(1.05);
}

/* 添加图片遮罩层增强效果 */
.main-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.1) 0%,
      rgba(0,0,0,0.3) 100%
  );
  pointer-events: none;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.05));
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* 卡片样式 */
.info-card, .spec-card, .action-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 25px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.info-card:hover, .spec-card:hover, .action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

/* 信息行样式 */
.info-row {
  display: flex;
  margin-bottom: 20px;
  padding: 15px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.info-label {
  width: 125px;
  font-weight: 600;
  color: #5e6d82;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 25px;
}

.info-label i {
  font-size: 20px;
  color: #6a11cb;
}

.info-value {
  flex: 1;
  font-size: 17px;
}

.price-value {
  font-size: 40px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.rating-value {
  font-size: 35px;
  color: #f39c12;
  font-weight: 700;
}

.tag-value {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  color: white;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 15px;
  display: inline-block;
  font-weight: 500;
}

.description-text {
  color: #5e6d82;
  line-height: 1.8;
  font-size: 35px;
}

/* 规格区域 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px;
  background: rgba(245, 247, 250, 0.7);
  border-radius: 15px;
  transition: all 0.3s ease;
  border: 1px solid rgba(224, 230, 237, 0.5);
}

.spec-item:hover {
  background: rgba(236, 245, 255, 0.7);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(106, 17, 203, 0.1);
}

.spec-name, .spec-value {
  flex: 1;
  font-size: 15px;
}

.no-spec {
  text-align: center;
  color: #909399;
  padding: 30px 0;
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.no-spec i {
  font-size: 28px;
  color: #c0c4cc;
}

.add-specification {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.spec-inputs {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.spec-input {
  flex: 1;
  border-radius: 12px;
}

.add-spec-btn {
  width: 100%;
  border-radius: 12px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  font-weight: 500;
}

/* 库存和操作区域 */
.stock-info {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.stock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.stock-value {
  font-weight: 700;
  font-size: 40px;
  background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.action-buttons {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-buttons .el-button {
  border-radius: 12px;
  font-weight: 500;
  padding: 12px 20px;
}

.stock-edit {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  padding: 18px;
  background: rgba(245, 247, 250, 0.7);
  border-radius: 15px;
}

.stock-input {
  flex: 1;
  border-radius: 12px;
}

.cart-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.cart-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}


/* 评论区域 */
.comments-section {
  margin-top: 40px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.section-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.comments-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.comment-item {
  padding: 25px;
  margin-bottom: 25px;
  border-radius: 16px;
  background: rgba(250, 250, 252, 0.8);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border: 1px solid rgba(224, 230, 237, 0.5);
}

.comment-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  width: 60px;
  height: 60px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  font-size: 18px;
  color: #2c3e50;
}

.comment-date {
  font-size: 15px;
  color: #909399;
}

.comment-rating {
  margin: 15px 0;
  display: flex;
  align-items: center;
}
.el-rate {
  --el-rate-icon-size: 22px;
  --el-rate-icon-margin: 4px;
}
.comment-content {
  color: #606266;
  line-height: 1.8;
  font-size: 16px;
}

.post-comment {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.section-subtitle {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-rate {
  margin-bottom: 20px;
}

.comment-textarea {
  border-radius: 15px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 20px;
  font-size: 16px;
}

.comment-textarea:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
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
}



@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 25px;
  font-size: 20px;
  color: #606266;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .product-main {
    flex-direction: column;
  }

  .product-gallery {
    flex: none;
    height: 500px;
  }
}

@media (max-width: 768px) {
  .elegant-product-detail {
    padding: 20px 15px;
  }

  .product-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
  }

  .main-image {
    height: 400px;
  }

  .spec-grid {
    grid-template-columns: 1fr;
  }

  .cart-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .stock-info {
    flex-direction: column;
    gap: 15px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
.unified-button {
  display: inline-flex;
  align-items: center;   /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  border-radius: 24px;
  padding: 12px 24px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;    /* 后备居中 */
  font-size: 14px;
  min-width: 120px;
}

.unified-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.unified-button i {
  margin-right: 8px;
}
.unified-button .el-icon {
  position: static !important; /* 移除Element UI定位 */
  transform: none !important; /* 清除图标偏移 */
  margin-top: 0 !important;
}

/* 确保文字元素正确显示 */
.unified-button span {
  display: inline-block;
  width: 100%;
}
.primary-button {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.warning-button {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  color: white;
}
.product-gallery {
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
}

.recommendation-section {
  background: rgba(255, 255, 255, 0.9);
  padding: 15px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: 30px;
}

.recommendation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.ticket-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.ticket-icon {
  color: #ffc107;
  font-size: 20px;
}

.count-label {
  color: #5e6d82;
}

.count-value {
  font-weight: bold;
  color: #e91e63;
  font-size: 18px;
}

.recommendation-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
  background: rgba(245, 247, 250, 0.7);
  padding: 8px 12px;
  border-radius: 12px;
}

.recommendation-hint .el-icon {
  color: #409eff;
}

@media (max-width: 480px) {


  .product-title {
    font-size: 26px;
  }

  .main-image {
    height: 350px;
  }

  .info-card, .spec-card, .action-card {
    padding: 20px 15px;
  }

  .info-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style>