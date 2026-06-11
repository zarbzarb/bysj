import { readCacheFromSessionStorage } from '@/utils/utils';
import type { ActionGroup } from '@/staticJson/PageEvent';
// eslint-disable-next-line import/no-cycle
import Animate from './animate';
import Event from './event';
import GisEvent from './gisevent';
import VariableSettings from './variableSettings';
import DataQueray from './DataQueray';
import CreateToggle from './CreateToggle';
import VisiableToggle from './visiableToggle';
import Scenes from './scenes';
import Videos from './videos';
// v6.18新增动画配置处理
import Animation from './animation';
// v6.19 新增全屏显示处理
import FullScreen from './FullScreen';
// v6.19 新增跳转页面处理
import JumpPage from './JumpPage';
// v7.9 新增刷新数据源
import RefreshDataSource from './refreshDataSource';
// v8.3.0 新增更新数据
import UpdateData from './updateData';
// v8.5.0新增触发组件特定动作
import ComSpecialAction from './comSpecialAction';
import CrossOriginMessage from './crossOriginMessage';
import SetPramsAction from './SetPramsAction';
// v8.16.0新增触发远程事件
import RemoteEvent from './remoteEvent';

/**
 * settings 当前配置属性信息 目前包含{item, expressionValue, config}
 */
export default (action, settings, from?: 'cache') => {
  if (from !== 'cache' && settings && settings.actions) {
    // v8.3: 为了支持交互跨页面选择组件，切换页面后配置的交互执行时机需要放在请求页面信息后执行
    const jumpPage = settings.actions.find((a) => a.actionType === 'jumpPage');

    if (jumpPage && jumpPage.actionSettings.target === '_router' && jumpPage.actionSettings.appPageId) {
      const key = `appPageId_${jumpPage.actionSettings.appPageId}_router`;
      const cacheData = readCacheFromSessionStorage(key);

      if (cacheData) {
        const { remainderActionGroups } = cacheData; // 获取切换页面后的交互列表
        const exist = (remainderActionGroups as ActionGroup[])
          .flatMap(({ actions }) => actions)
          .flat()
          .find(({ actionKey }) => actionKey === action.actionKey);
        if (exist) return; // 切换页面后的交互不在当前执行，会在切换页面后请求到组件再执行（见 HomePage.tsx）
      }
    }
  }

  try {
    switch (action.actionType) {
      case 'dataQuery': {
        DataQueray(action, settings);
        break;
      }
      case 'animateIn': {
        Animate(action, settings);
        break;
      }
      case 'animateOut': {
        Animate(action, settings);
        break;
      }
      case 'animateLoop': {
        Animate(action, settings);
        break;
      }
      case 'variableSettings': {
        VariableSettings(action, settings);
        break;
      }
      case 'createToggle': {
        CreateToggle(action, settings);
        break;
      }
      case 'visiableToggle': {
        VisiableToggle(action, settings);
        break;
      }
      case 'eventEmit': {
        Event(action, settings);
        break;
      }
      case 'gisEventEmit': {
        GisEvent(action);
        break;
      }
      case 'sceneInteraction': {
        Scenes(action);
        break;
      }
      case 'videoInteraction': {
        Videos(action);
        break;
      }
      // v6.18 新增动画设置测试效果
      case 'animateSettings': {
        Animation(action, settings);
        break;
      }
      // v6.19 新增全屏显示
      case 'fullScreen': {
        FullScreen(action);
        break;
      }
      // v6.19 新增跳转页面
      case 'jumpPage': {
        JumpPage(action, settings);
        break;
      }
      case 'refreshDataSource': {
        RefreshDataSource(action, settings);
        break;
      }
      case 'updateData': {
        UpdateData(action, settings);
        break;
      }
      case 'SetPramsAction': {
        SetPramsAction(action, settings);
        break;
      }
      case 'comSpecialAction': {
        ComSpecialAction(action, settings);
        break;
      }
      case 'crossOriginMessage': {
        CrossOriginMessage(action, settings);
        break;
      }
      case 'remoteEvent': {
        RemoteEvent(action, settings);
        break;
      }
      default: {
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
};
