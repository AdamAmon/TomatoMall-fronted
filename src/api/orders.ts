import axios from 'axios';
import { ORDERS_MODULE } from './_prefix';

type OrdersInfo = {
    id: number;
    userId: number;
    paymentMethod: string; // 后端返回可能是枚举值，需映射为字符串
    status: string;        // 后端返回可能是枚举值，需映射为字符串
    totalPrice: number;    // 对应后端的 total_amount
    createdAt: Date;       // 对应后端的 create_time
    cartItemIds: number[]; // 对应后端的 itemsId
};

// 创建订单
export const createOrder = async (
    userId: number,
    cartItemIds: number[],
    paymentMethod: string,
    totalPrice: number

): Promise<{ code: string; msg?: string; data?: OrdersInfo }> => {
    try {
        const response = await axios.post(`${ORDERS_MODULE}/create`, {
            userId,
            itemsId: cartItemIds, // 后端字段名为 itemsId
            payment_method: paymentMethod, // 后端字段名为 payment_method
            total_amount: totalPrice,
        });
        return response.data as { code: string; msg?: string; data?: OrdersInfo };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

// 支付订单
export const payOrder = async (orderId: number) => {
    try {
        const response = await axios.post(`${ORDERS_MODULE}/pay`, null, {
            params: { orderId },
            responseType: 'text', // 确保返回类型为文本
        });

        // 获取返回的 HTML 表单
        const formHtml = response.data;

        // 动态创建一个表单并提交
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(formHtml);
            newWindow.document.close();
            // 提交表单
            const form = newWindow.document.querySelector('form');
            if (form) {
                form.submit();
            } else {
                console.error('Form not found in the response');
                newWindow.close();
            }
        } else {
            console.error('Failed to open a new window');
        }
    } catch (error) {
        console.error('Error paying order:', error);
        throw error;
    }
};

// 处理支付宝回调
export const handleAlipayNotify = async (params: any) => {
    try {
        const response = await axios.post(`${ORDERS_MODULE}/notify`, params);
        return response.data;
    } catch (error) {
        console.error('Error handling Alipay notify:', error);
        throw error;
    }
};

// 获取订单详情
export const getOrderDetails = async (userId: number): Promise<OrdersInfo> => {
    try {
        // 调用后端接口获取订单详情
        const response = await axios.get(`${ORDERS_MODULE}/showOrder`, {
            params: { userId }
        });

        // 提取后端返回的 data 字段
        const backendData = response.data.data;

        if (!backendData) {
            throw new Error('No order details found for the given user ID.');
        }

        // 将后端返回的数据映射为前端类型
        const orderInfo: OrdersInfo = {
            id: backendData.id,
            userId: backendData.userId,
            paymentMethod: mapPaymentMethod(backendData.payment_method), // 映射支付方式
            status: mapPayStatus(backendData.status),                    // 映射支付状态
            totalPrice: backendData.total_amount,                        // 映射总金额
            createdAt: new Date(backendData.create_time),                // 转换为 Date 类型
            cartItemIds: backendData.itemsId,                            // 映射购物项 ID 列表
        };

        return orderInfo;
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

// 辅助函数：将后端支付方式枚举映射为字符串
const mapPaymentMethod = (paymentMethod: string): string => {
    switch (paymentMethod) {
        case 'WECHATPAY':
            return '微信支付';
        case 'CREDITCARD':
            return '信用卡支付';
        case 'ALIPAY':
            return '支付宝支付';
        default:
            return '未知支付方式';
    }
};

// 辅助函数：将后端支付状态枚举映射为字符串
const mapPayStatus = (status: string): string => {
    switch (status) {
        case 'WAIT_BUYER_PAY':
            return '等待买家付款';
        case 'TRADE_SUCCESS':
            return '交易成功';
        case 'TRADE_CLOSED':
            return '交易关闭';
        default:
            return '未知状态';
    }
};
