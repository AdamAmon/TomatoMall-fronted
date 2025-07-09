import axios from 'axios';
import { CART_MODULE } from './_prefix';

export type CartInfo = {
    cartId: number;
    userId: number;
};

export type CartItemInfo = {
    itemId: number;
    productId: number;
    quantity: number;
    cartId: number;
};

// 获取购物车信息
export const getCart = async (userId: number) => {
    try {
        const response = await axios.get(`${CART_MODULE}`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching cart:', error);
        throw error;
    }
};

// 添加商品到购物车
export const addProductToCart = async (userId: number, productId: string, quantity: number) => {
    try {
        const response = await axios.post(`${CART_MODULE}`, null, {
            params: { userId, productId, quantity }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding product to cart:', error);
        throw error;
    }
};

// 删除购物车中的商品
export const deleteCartItem = async (userId: number, cartItemId: string) => {
    try {
        const response = await axios.delete(`${CART_MODULE}`, {
            params: { userId, cart_item_id: cartItemId }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting cart item:', error);
        throw error;
    }
};

// 修改购物车中商品的数量
export const changeCartItemQuantity = async (userId: number, cartItemId: string, quantity: number) => {
    try {
        const response = await axios.patch(`${CART_MODULE}/quantity`, null, {
            params: { userId, cart_item_id: cartItemId, quantity }
        });
        return response.data;
    } catch (error) {
        console.error('Error changing cart item quantity:', error);
        throw error;
    }
};

// 获取购物车中的所有商品
export const getAllCartItems = async (cartId: number) => {
    try {
        console.log('传入的cartId:', cartId); // 输出cartId到控制台
        const response = await axios.get(`${CART_MODULE}/getAll`, {
            params: { cartId }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all cart items:', error);
        throw error;
    }
};

