/**
 * 事件发布
 */
import { getDataByKey } from '@/utils/dataStoreUtils';
import { getParamValue } from './utils';

export default (action, settings) => {
  const EventEmitter = window.globalEventEmitter;
  const { eventKey, eventType, eventValue, variableKey, dataParams } = action.actionSettings;

  if (!eventKey) console.error('请完善事件发布中的事件key参数');

  // v8.3 新增
  if (dataParams && dataParams.length > 0)
    EventEmitter.emit(eventKey, getParamValue(dataParams[0], settings.el ?? settings.item, action));
  // v8.3 兼容旧屏
  else if (eventType === 2) EventEmitter.emit(eventKey, variableKey ? getDataByKey(variableKey) : null);
  else EventEmitter.emit(eventKey, eventValue);
};
