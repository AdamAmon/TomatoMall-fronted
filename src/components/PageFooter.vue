<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const dialogVisible = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const copyrightContent = ref('')
const fallbackText = 'Copyright © 2023-2027 502小组 版权所有。所有内容仅供学习与演示使用。'

const fetchCopyright = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await axios.get('https://search.xhsd.com/search?frontCategoryId=41', {
      responseType: 'text',
    })
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    // 截取一段可读内容作为弹窗展示
    const snippet = text.replace(/\s+/g, ' ').slice(0, 600)
    copyrightContent.value = snippet || fallbackText
  } catch (err) {
    console.error('加载版权信息失败', err)
    error.value = '在线获取版权信息失败，已显示本地版权说明。'
    copyrightContent.value = fallbackText
  } finally {
    loading.value = false
  }
}

onMounted(fetchCopyright)
</script>

<template>
  <footer class="page-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-badge">
          <span class="badge">正版图书，华丽生活</span>
          <span class="badge">专业全面，轻松找书</span>
          <span class="badge">12000+门店服务</span>
        </div>
        <div class="footer-grid">
          <div class="footer-col">
            <h4>购物指南</h4>
            <ul>
              <li>购物保障</li>
              <li>购物流程</li>
              <li>促销说明</li>
              <li>联系客服</li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>支付方式</h4>
            <ul>
              <li>网上支付</li>
              <li>优惠券支付</li>
              <li>扫码付款</li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>配送方式</h4>
            <ul>
              <li>配送运费</li>
              <li>商品验收</li>
              <li>订单说明</li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>售后服务</h4>
            <ul>
              <li>退换货制度</li>
              <li>申请退换货</li>
              <li>退款时效</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="copyright-line">
          <span class="copyright-text">Copyright © 2023-2027 502小组 版权所有</span>
          <span class="divider">|</span>
          <span>蓝鲸书城 · 仅供学习与演示</span>
        </div>
        <el-button type="primary" link @click="dialogVisible = true">查看版权声明</el-button>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="版权与声明" width="540px" :close-on-click-modal="true">
      <div class="dialog-body">
        <div v-if="loading" class="dialog-loading">正在从网上获取版权信息...</div>
        <div v-else>
          <div v-if="error" class="dialog-error">{{ error }}</div>
          <p class="dialog-text">{{ copyrightContent }}</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="dialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </footer>
</template>

<style scoped>
.page-footer {
  width: 100%;
  margin-top: 40px;
  background: #f7f8fb;
  border-top: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 14px;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.footer-top {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-badge {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center; /* 居中这三个徽标 */
  align-items: center;
}

.badge {
  background: #1d4ed8;
  color: #fff;
  padding: 8px 14px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(29, 78, 216, 0.18);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.footer-col h4 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #1f2937;
  font-weight: 700;
}

.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-col li {
  color: #4b5563;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  border-top: 1px solid #e5e7eb;
  padding-top: 14px;
}

.copyright-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
}

.divider {
  color: #9ca3af;
}

.dialog-body {
  max-height: 320px;
  overflow-y: auto;
}

.dialog-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #374151;
}

.dialog-error {
  color: #b91c1c;
  margin-bottom: 10px;
}

.dialog-loading {
  color: #2563eb;
}

@media (max-width: 640px) {
  .footer-inner {
    padding: 24px 16px 22px;
  }

  .footer-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>
