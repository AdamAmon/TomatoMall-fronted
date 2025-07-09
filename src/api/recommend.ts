import { axios } from '../utils/request';
import { RECOMMEND_MODULE } from './_prefix';

// 获取每日推荐
export const getEverydayRecommend = () => {
    return axios.get(`${RECOMMEND_MODULE}`)
        .then(res => {
            return res;
        });
}