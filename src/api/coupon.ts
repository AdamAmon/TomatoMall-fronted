// src/api/coupon.ts
import axios from 'axios';
import { COUPON_MODULE } from './_prefix';

// 定义 CouponVO 类型
export interface CouponVO {
    id: number;
    userId: number;
    discount: number;
    top: number;
    getTime: number;
    account: {
        id: number;
        username: string;
        name: string;
        phone: string;
        role: string;
        password: string;
        email: string;
        avatar: string;
        address: string;
        vip: number;
        expe: number;
        recommendTicket: number;
        moneyProgress: number;
    };
}

// 获取免费优惠券
export const getFreeCoupon = async (userId: number): Promise<CouponVO> => {
    try {
        const response = await axios.post(`${COUPON_MODULE}/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('获取免费优惠券失败:', error);
        throw error;
    }
};

// 获取所有优惠券
export const getAllCoupons = async (userId: number): Promise<CouponVO[]> => {
    try {
        const response = await axios.get(`${COUPON_MODULE}/all/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('获取所有优惠券失败:', error);
        throw error;
    }
};

// 使用优惠券
export const useCoupon = async (couponId: number): Promise<boolean> => {
    try {
        const response = await axios.post(`${COUPON_MODULE}/use`, { id: couponId },{
            params: {
                id: couponId
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('使用优惠券失败:', error);
        throw error;
    }
};
