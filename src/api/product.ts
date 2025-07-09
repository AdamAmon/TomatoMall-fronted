import { axios } from '../utils/request';
import { PRODUCT_MODULE } from './_prefix';

export type ProductInfo = {
    id: number; // 商品 ID
    title: string; // 商品标题
    price: number; // 商品价格
    rate: number; // 商品评分
    commentNum: number; // 评论数量
    description?: string; // 商品描述
    cover?: string; // 商品封面图片 URL
    detail?: string; // 商品详情
    specifications?: InfoVO[]; // 商品规格（数组）
    stockpile?: StockpileVO; // 商品库存信息
    recommendTicket?: number; // 推荐票数量
    tag?: TagEnum; // 商品标签
    comments?: CommentVO[]; // 商品评论
};

export type updateInfo = {
    id: number; // 商品 ID（可选，通常由后端生成）
    title: string; // 商品标题
    price: number; // 商品价格
    rate: number; // 商品评分（可选）
    description?: string; // 商品描述
    cover?: string; // 商品封面图片 URL
    detail?: string; // 商品详情
    specifications?: InfoVO[]; // 商品规格（数组，可选）
    stockpile?: StockpileVO; // 商品库存信息
    tag?: TagEnum;
};


export interface createInfo {
    title: string;
    price: number;
    rate: number;
    description: string;
    cover: string;
    detail: string;
    specifications: Info1VO[]; // 明确数组元素类型
    tag?: TagEnum;
}

export type Info1VO = {
    item: string;
    value: string;
};

export type InfoVO = {
    id: number;
    item: string;
    value: string;
    productId: number;
};

export type StockpileVO = {
    id: number;
    amount: number; // 库存数量
    frozen: number; // 冻结库存
    productId: number;
};

export type CommentVO = {
    id: number;
    content: string;
    rate: number;
    productId: number;
    userId: number;
};

export enum TagEnum {
    NOVEL="小说",
    LITERATURE="文学",
    ART="艺术",
    HISTORY="历史",
    PHILOSOPHY="哲学",
    PSYCHOLOGY="心理",
    CULTURE="文化",
    TEXTBOOK="教辅",
    OTHER="其他",
}

export const createProduct = (productInfo: createInfo) => {
    return axios.post(`${PRODUCT_MODULE}/`, productInfo, {
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => {
            return res;
        });
};

export const updateProduct = (productVO: updateInfo) => {
    return axios.put(`${PRODUCT_MODULE}/`, productVO, {
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.data)
        .catch(error => {
            console.error('更新商品失败:', error);
            throw error;
        });
};

export const getAllProducts = () => {
    return axios.get(`${PRODUCT_MODULE}`)
        .then(res => {
            return res;
        });
};

export const getOneProduct = (id: string) => {
    return axios.get(`${PRODUCT_MODULE}/${id}`)
        .then(res => {
            return res;
        });
};

export const updateAmount = (id: string, stockpile: StockpileVO) => {
    return axios.patch(`${PRODUCT_MODULE}/stockpile/${id}`, stockpile, {
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => {
            return res;
        });
};

export const getOneProductAmount = (id: string) => {
    return axios.get(`${PRODUCT_MODULE}/stockpile/${id}`)
        .then(res => {
            return res;
        });
};

export const deleteProduct = (id: string) => {
    return axios.delete(`${PRODUCT_MODULE}/${id}`)
        .then(res => {
            return res;
        });
};

export const searchName = (name: string) => {
    return axios.get(`${PRODUCT_MODULE}/search`, {
        params: { name },
    })
        .then(res => {
            return res;
        });
};

export const searchByTag = (tag: TagEnum) => {
    return axios.get(`${PRODUCT_MODULE}/tag`, {
        params: { tag },
    })
        .then(res => {
            return res;
        });
};

// 获取商品评论
export const getProductComments = (productId: string) => {
    return axios.get(`${PRODUCT_MODULE}/comment`, {
        params: { productId },
    })
        .then(res => {
            return res.data;
        });
};
