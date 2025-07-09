import { axios } from '../utils/request'
import { ACCOUNT_MODULE } from './_prefix'

type LoginInfo = {
    role?: string,
    username: string,
    name?: string,
    phone?: string,
    password: string,
    address?: string,
    avatar?: string,
    email?: string,
}

type RegisterInfo = {
    role: string,
    username: string,
    name: string,
    phone?: string,
    password: string,
    address?: string,
    avatar?: string,
    email?: string,
    vip: number,
    recommendTicket: number;
}

type UpdateInfo = {
    name?: string,
    phone?: string,
    address?: string,
    avatar?: string,
    email?: string,
}

// 如果有“Vue: This may be converted to an async function”警告，可以不管
// 用户登录
export const userLogin = (loginInfo: LoginInfo) => {
    return axios.post(`${ACCOUNT_MODULE}/login`, loginInfo) // 将 loginInfo 放入请求体
        .then(res => {
            return res;
        })
}

// 用户注册
export const userRegister = (registerInfo: RegisterInfo) => {
    return axios.post(`${ACCOUNT_MODULE}`, registerInfo, { headers: { 'Content-Type': 'application/json' } })
        .then(res => {
            return res;
        })
}

// 获取用户信息
export const userInfo = (username: string) => {
    return axios.get(`${ACCOUNT_MODULE}/${username}`)
        .then(res => {
            return res;
        })
}

// 更新用户信息
export const userInfoUpdate = (updateInfo: UpdateInfo) => {
    return axios.put(`${ACCOUNT_MODULE}`, updateInfo, { headers: { 'Content-Type': 'application/json' } })
        .then(res => {
            return res;
        })
}

//获取推荐票
export const getRecommendTicket = (userId: string, num: number) => {
    return axios.post(`${ACCOUNT_MODULE}/ticket/get`, null, {
        params: { userId, num }
    }).then(res => {
        return res;
    })
}

// 使用推荐票
export const useRecommendTicket = (userId: string, productId: string) => {
    return axios.post(`${ACCOUNT_MODULE}/ticket/use`, null, {
        params: { userId, productId }
    }).then(res => {
        return res;
    })
}

// 发表评论
export const makeComment = (userId: string, productId: string, content: string, rate: number) => {
    return axios.post(`${ACCOUNT_MODULE}/comment/make`, null, {
        params: { userId, productId, content, rate }
    }).then(res => {
        return res;
    })
}

// 删除评论
export const deleteComment = (id: string) => {
    return axios.post(`${ACCOUNT_MODULE}/comment/delete`, null, {
        params: { id }
    }).then(res => {
        return res;
    })
}

// 获取所有评论
export const getAllComments = (userId: string) => {
    return axios.get(`${ACCOUNT_MODULE}/comment`, {
        params: { userId }
    }).then(res => {
        return res;
    })
}

// 更新评论
export const updateComment = (id: string, content: string, rate: number) => {
    return axios.get(`${ACCOUNT_MODULE}/comment/update`, {
        params: { id, content, rate }
    }).then(res => {
        return res;
    })
}

// 更新VIP
export const updateVIP = (amount: string,  userId: string) => {
    return axios.post(`${ACCOUNT_MODULE}/vip`, null, {
        params: { amount, userId }
    }).then(res => {
        return res;
    })
}
