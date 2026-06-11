/**
 * 指标相关 Api
 */

import Cookies from 'js-cookie';
import { get, post } from '@/services/xhr/fetch';
import { HOST_INDICATOR } from '@/utils/constant';

const config = {
  headers: { 'x-token': Cookies.get('aksk-token') },
};

// 通过 AKSK 获取 x-token 的接口
export const authorization = (data) => post(`${HOST_INDICATOR}/x-authorization-service/authorizations/logins`, data);

// 获取指标目录树
export const getIndicatorCatalogs = (data) => get(`${HOST_INDICATOR}/x-indicator-service/catalogs`, data, config);

// 获取指标详情
export const getIndicatorInfo = (id) => get(`${HOST_INDICATOR}/x-indicator-service/indicators/${id}`, null, config);

// 获取指标的值
export const getIndicatorValues = (data) =>
  get(`${HOST_INDICATOR}/x-indicator-service/indicators/values`, data, config);

// 获取指标维度详情
export const getDimensionInfo = (id) => get(`${HOST_INDICATOR}/x-indicator-service/dimensions/${id}`, null, config);

// 获取指标维度的值
export const getDimensionValues = (data) =>
  get(`${HOST_INDICATOR}/x-indicator-service/dimensions/values`, data, config);
