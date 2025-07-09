// src/router/index.ts
import { createRouter, createWebHashHistory } from "vue-router"

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{
    path: '/',
    redirect: '/login',
  }, {
    path: '/login',
    component: () => import('../views/user/Login.vue'),
    meta: { title: '用户登录' }
  }, {
    path: '/register',
    component: () => import('../views/user/Register.vue'),
    meta: { title: '用户注册' }
  },
    {
    path: '/home',
    redirect: '/dashboard',
    component: () => import('../views/Home.vue'),
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/user/Dashboard.vue'),
        meta: { title: '个人信息' }
      }, {
        path: '/product/all_product',
        component: () => import('../views/product/all_product.vue'),
        meta: { title: '商品总览' }
      },{
        path: '/advertisement/all_advertisement',
        name: 'AllAdvertisements',
        component: () => import('../views/advertisement/all_advertisement.vue'),
        meta: { title: '广告列表' }
      },{
        path: '/cart',
        component: () => import('../views/cart/cart.vue'),
        meta: { title: '购物车' }
      },{
        path: '/coupon/all_coupon',
        component: () => import('../views/coupon/all_coupon.vue'),
        meta: { title: '优惠券列表' }
      }, {
        path: "/product/:id",
        name: "SingleProduct",
        component: () => import('../views/product/single_product.vue'),
        meta: { title: '商品详情' }
      }, {
        path: "/product/create_product",
        name: "createProduct",
        component: () => import('../views/product/create_product.vue'),
        meta: { title: '创建商品' }
      }, {
        path: '/advertisement/create_advertisement',
        name: 'CreateAdvertisement',
        component: () => import('../views/advertisement/create_advertisement.vue'),
        meta: { title: '创建广告', permission: ['MANAGER'] }
      },{
        path: "/advertisement/:advId",
        name: "SingleAdvertisement",
        component: () => import('../views/advertisement/single_advertisement.vue'),
        meta: { title: '广告详情' }
      }
    ]
  }, {
    path: '/order/:id',
    name: 'Order',
    component: () => import('../views/order/orders.vue'),
    meta: { title: '订单详情' }
  },{
    path: '/404',
    name: '404',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '404' }
  }, {
    path: '/:catchAll(.*)',
    redirect: '/404'
  }]
})

router.beforeEach((to, _, next) => {
  const token: string | null = sessionStorage.getItem('token');
  const role: string | null = sessionStorage.getItem('role');

  if (to.meta.title) {
    document.title = to.meta.title;
  }

  if (token) {
    if (to.meta.permission) {
      if (to.meta.permission.includes(role!)) {
        next();
      } else {
        next('/404');
      }
    } else {
      next();
    }
  } else {
    if (to.path === '/login') {
      next();
    } else if (to.path === '/register') {
      next();
    } else {
      next('/login');
    }
  }
})

export { router }
