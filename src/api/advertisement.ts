import axios from 'axios';
import { ADVERTISEMENT_MODULE } from './_prefix';

// 定义广告信息类型
export type AdvertisementInfo = {
    advId: number;
    title: string;
    content: string;
    advUrl: string;
    productId: number;
};

// 获取所有广告
export const getAllAdvertisements = async () => {
    try {
        const response = await axios.get(`${ADVERTISEMENT_MODULE}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching advertisements:', error);
        throw error;
    }
};

// 查找单个广告
export const getSingleAdvertisement = async (advId: number) => {
    try {
        const response = await axios.get(`${ADVERTISEMENT_MODULE}/single`, {
            params: { advId },
        });
        return response.data; // 返回广告数据
    } catch (error) {
        console.error('Error fetching single advertisement:', error);
        throw error;
    }
};


// 更新广告
export const updateAdvertisement = async (advInfo: AdvertisementInfo) => {
    try {
        const response = await axios.put(`${ADVERTISEMENT_MODULE}`, advInfo, {
            headers: {
                'Content-Type': 'application/json', // 设置正确的 Content-Type
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating advertisement:', error);
        throw error;
    }
};

// 创建广告
export const createAdvertisement = async (advInfo: Omit<AdvertisementInfo, 'advId'>) => {
    try {
        const response = await axios.post(`${ADVERTISEMENT_MODULE}`, advInfo, {
            headers: {
                'Content-Type': 'application/json', // 设置正确的 Content-Type
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating advertisement:', error);
        throw error;
    }
};

// 删除广告
export const deleteAdvertisement = async (advId: number) => {
    try {
        const response = await axios.delete(`${ADVERTISEMENT_MODULE}`, {
            params: { advId },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting advertisement:', error);
        throw error;
    }
};
