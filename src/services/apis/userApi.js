import { post, get } from '@/services/xhr/fetch';
const LOGIN_URL = '/api/sys/data/userInfo/login'; // 用户登录
const REGISTER_URL = '/api/sys/data/userInfo/register'; // 用户注册
const USER_LIST_URL = '/api/sys/data/userInfo/list'; // 获取用户列表
const USER_INFO_URL = '/api/sys/data/userInfo/info'; // 获取用户信息
const UPDATE_USER_URL = '/api/sys/data/userInfo/update'; // 更新用户信息
const CHANGE_PASSWORD_URL = '/api/sys/data/userInfo/changePassword'; // 修改密码
const LOGOUT_URL = '/api/sys/data/userInfo/logout'; // 退出登录
const DELETE_USER_URL = '/api/sys/data/userInfo/delete'; // 删除用户
const RESET_PASSWORD_URL = '/api/sys/data/userInfo/resetPassword'; // 重置用户密码

export const LOGIN = (data) => {
    return post(LOGIN_URL, data);
};

export const REGISTER = (data) => {
    return post(REGISTER_URL, data);
};

export const GET_USER_LIST = (data) => {
    return get(USER_LIST_URL, data);
};

export const GET_USER_INFO = (data) => {
    return get(USER_INFO_URL, data);
};

export const UPDATE_USER = (data) => {
    return post(UPDATE_USER_URL, data);
};

export const CHANGE_PASSWORD = (data) => {
    return post(CHANGE_PASSWORD_URL, data);
};

export const LOGOUT = () => {
    return post(LOGOUT_URL);
};

export const DELETE_USER = (data) => {
    return post(DELETE_USER_URL, data);
};

export const RESET_PASSWORD = (data) => {
    return post(RESET_PASSWORD_URL, data);
};
