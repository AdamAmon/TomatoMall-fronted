<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { createProduct, createInfo } from "../../api/product";

const router = useRouter();

// 商品信息
const productInfo = ref<createInfo>({
  title: "",
  price: 0,
  rate: 0,
  description: "",
  cover: "",
  detail: "",
  specifications: [],
  tag:undefined,
});

// 新规格输入
const newItem = ref(""); // 新规格名称
const newValue = ref(""); // 新规格值

// 添加新规格项
const addNewSpecification = () => {
  if (!newItem.value || !newValue.value) {
    alert("请输入规格名称和规格值");
    return;
  }
  if (!productInfo.value.specifications) {
    productInfo.value.specifications = [];
  }
  productInfo.value.specifications.push({ item: newItem.value, value: newValue.value });
};
function navigateToproductList() {
  router.push({path:"/product/all_product"});
}
// 删除指定索引的规格项
const removeSpecification = (index: number) => {
  if (productInfo.value.specifications) {
    productInfo.value.specifications.splice(index, 1);
  }
};

// 加载状态
const loading = ref(false);
const error = ref<string | null>(null);

// 计算属性：检查表单是否有效
const isFormValid = computed(() => {
  return (
      !!productInfo.value.title && // 标题不能为空
      productInfo.value.price > 0 && // 价格必须大于 0
      productInfo.value.rate >= 0 // 评分不能小于 0
  );
});

// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = null;

    // 调用 API 创建商品
    const response = await createProduct(productInfo.value);

    if (response.status === 200 || response.status === 201) {
      alert("商品创建成功！");

    } else {
      error.value = response.data.message || "商品创建失败";
    }
  } catch (err) {
    console.error("创建商品失败:", err);
    error.value = "创建商品失败，请稍后再试";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <body>
  <div id="app" class="create-product-container">
    <div class="decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="header-card">
      <h1>创建新商品</h1>
      <p>完善商品信息，为您的店铺添加新商品</p>
    </div>

    <div class="form-card">
      <div class="form-header">
        <i class="fas fa-cube"></i>
        <h2>商品信息表单</h2>
      </div>

      <div class="form-content">
        <!-- 基本信息区域 -->
        <div class="form-section">
          <div class="form-section-title">
            <i class="fas fa-info-circle"></i>
            <h3>基本信息</h3>
          </div>

          <div class="form-row">
            <label><i class="fas fa-heading"></i> 商品标题</label>
            <input type="text" v-model="productInfo.title" placeholder="请输入商品标题">
          </div>

          <div class="form-row">
            <label><i class="fas fa-tag"></i> 商品价格 (¥)</label>
            <input type="number" v-model.number="productInfo.price" placeholder="请输入商品价格" step="0.01">
          </div>

          <div class="form-row">
            <label><i class="fas fa-star"></i> 商品评分</label>
            <input type="number" v-model.number="productInfo.rate" placeholder="请输入商品评分" step="0.1">
          </div>

          <div class="form-row">
            <label><i class="fas fa-tags"></i> 商品标签</label>
            <select v-model="productInfo.tag">
              <option value="NOVEL">小说</option>
              <option value="LITERATURE">文学</option>
              <option value="ART">艺术</option>
              <option value="HISTORY">历史</option>
              <option value="PHILOSOPHY">哲学</option>
              <option value="PSYCHOLOGY">心理</option>
              <option value="CULTURE">文化</option>
              <option value="TEXTBOOK">教辅</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
        </div>

        <!-- 描述信息区域 -->
        <div class="form-section">
          <div class="form-section-title">
            <i class="fas fa-align-left"></i>
            <h3>描述信息</h3>
          </div>

          <div class="form-row">
            <label><i class="fas fa-comment"></i> 商品描述</label>
            <textarea v-model="productInfo.description" placeholder="请输入商品描述"></textarea>
          </div>

          <div class="form-row">
            <label><i class="fas fa-link"></i> 封面图片 URL</label>
            <input type="url" v-model="productInfo.cover" placeholder="请输入商品封面图片 URL">
          </div>

          <div class="form-row">
            <label><i class="fas fa-file-alt"></i> 商品详情</label>
            <textarea v-model="productInfo.detail" placeholder="请输入商品详情"></textarea>
          </div>
        </div>

        <!-- 规格信息区域 -->
        <div class="form-section spec-section">
          <div class="form-section-title">
            <i class="fas fa-list"></i>
            <h3>规格信息</h3>
          </div>

          <div class="spec-form">
            <div class="form-row">
              <input type="text" v-model="newItem" placeholder="规格名称">
            </div>

            <div class="form-row">
              <input type="text" v-model="newValue" placeholder="规格值">
            </div>

            <button class="add-spec-btn" @click.prevent="addNewSpecification">
              <i class="fas fa-plus"></i> 添加
            </button>
          </div>

          <div class="spec-list" v-if="productInfo.specifications && productInfo.specifications.length > 0">
            <div class="spec-list-header">
              <div>规格名称</div>
              <div>规格值</div>
              <div>操作</div>
            </div>

            <div class="spec-item" v-for="(spec, index) in productInfo.specifications" :key="index">
              <div>{{ spec.item }}</div>
              <div>{{ spec.value }}</div>
              <div>
                <button class="delete-btn" @click="removeSpecification(index)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-specs">
            <p style="text-align: center; padding: 20px; color: #718096; background: #f8fafc; border-radius: 0 0 10px 10px;">
              尚未添加任何规格
            </p>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <div class="form-status" :class="isFormValid ? 'valid' : 'invalid'">
          <i class="fas" :class="isFormValid ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
          <span v-if="isFormValid">表单验证通过，可以提交</span>
          <span v-else>请填写必填项并确保数据有效</span>
        </div>

        <div class="action-buttons">
          <button class="cancel-btn" @click="navigateToproductList">
            <i class="fas fa-arrow-left"></i>
            返回列表
          </button>
          <button class="submit-btn" :disabled="loading || !isFormValid" @click="handleSubmit">
            <i class="fas fa-plus-circle"></i>
            {{ loading ? "提交中..." : "创建商品" }}
          </button>
        </div>
      </div>
    </div>

    <div class="error-message" v-if="error">
      <i class="fas fa-exclamation-triangle"></i> {{ error }}
    </div>
  </div>
  </body>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  min-height: 100vh;
  padding: 0; /* 移除 body 的 padding */
  color: #2c3e50;
  display: flex;
  justify-content: center;
  align-items: center;
}

.create-product-container {
  max-width: 1000px;
  padding: 20px; /* 将 padding 移到容器内部 */
  width: 100%; /* 确保容器占满父元素宽度 */
}

.header-card, .form-card {
  width: 100%;
}

.header-card {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  margin-bottom: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(110, 142, 251, 0.4);
  position: relative;
  overflow: hidden;
}

.header-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(30deg);
}

.header-card h1 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}

.header-card p {
  font-size: 18px;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  position: relative;
  z-index: 2;
}

.form-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.form-header {
  padding: 25px 30px;
  background: #f8fafc;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  align-items: center;
}

.form-header i {
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
}

.form-header h2 {
  font-size: 24px;
  color: #2c3e50;
  font-weight: 600;
}

.form-content {
  padding: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 768px) {
  .form-content {
    grid-template-columns: 1fr;
  }
}

.form-section {
  margin-bottom: 25px;
}

.form-section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f4f8;
  color: #4a5568;
}

.form-section-title i {
  margin-right: 10px;
  color: #6e8efb;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-row label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #4a5568;
  display: flex;
  align-items: center;
}

.form-row label i {
  margin-right: 8px;
  color: #718096;
  font-size: 14px;
}

.form-row input,
.form-row select,
.form-row textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
  background-color: #f8fafc;
  transition: all 0.3s ease;
}

.form-row input:focus,
.form-row select:focus,
.form-row textarea:focus {
  border-color: #6e8efb;
  box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.2);
  outline: none;
  background-color: white;
}

.form-row textarea {
  min-height: 120px;
  resize: vertical;
}

.spec-section {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .spec-section {
    grid-column: span 1;
  }
}

.spec-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 15px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .spec-form {
    grid-template-columns: 1fr;
  }
}

.add-spec-btn {
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-spec-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
}

.spec-list {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 20px;
}

.spec-list-header {
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  background-color: #f8fafc;
  padding: 15px 20px;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
}

.spec-item {
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  padding: 15px 20px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.spec-item:last-child {
  border-bottom: none;
}

.spec-item:hover {
  background-color: #f8fafc;
}

.delete-btn {
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.delete-btn:hover {
  background-color: #fff5f5;
  transform: scale(1.1);
}

.form-footer {
  padding: 25px 30px;
  background: #f8fafc;
  border-top: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.form-status.valid {
  color: #10b981;
}

.form-status.invalid {
  color: #e53e3e;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.submit-btn {
  padding: 14px 35px;
  background: linear-gradient(to right, #10b981, #34d399);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.submit-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  padding: 14px 30px;
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cancel-btn:hover {
  background-color: #f8fafc;
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.error-message {
  color: #e53e3e;
  background: #fff5f5;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  font-weight: 500;
  border: 1px solid #fed7d7;
  display: flex;
  align-items: center;
  gap: 10px;
}

.decoration {
  position: fixed;
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
  background: radial-gradient(circle, rgba(110, 142, 251, 0.1) 0%, rgba(110, 142, 251, 0) 70%);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
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
</style>