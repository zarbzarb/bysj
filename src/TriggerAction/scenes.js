import { getComponent } from '@/utils/componentUtils.js';
export default (action) => {
  console.warn(action);
  // 调用高性能渲染SDK
  const compKey = action.actionSettings.scenekey;
  const actionKey = action.actionSettings.actionKey;
  let comp;
  if (window.comList && compKey) {
    comp = window.comList.get(compKey);
  } else {
    comp = getComponent(compKey, window.layerList);
  }

  if (!comp) return;
  // 暂停旋转
  const PauseRotation = { ApiType: 'PauseRotation' };
  // 隐藏逃生路线
  const HideEscapeRodes = { ApiType: 'HideEscapeRodes' };
  // 消防车归位
  const RecoverFireCarTransform = { ApiType: 'RecoverFireCarTransform' };
  // 火情消失
  const FireDisappear = { ApiType: 'FireDisappear' };
  // 结束巡游
  const EndParade = { ApiType: 'EndParade' };

  let type = { ApiType: 'ToMoon' };
  switch (actionKey) {
    case '0': // 清晨
      type = { ApiType: 'ToMorning' };
      break;
    case '1': // 中午
      type = { ApiType: 'ToMoon' };
      break;
    case '2': // 傍晚
      type = { ApiType: 'ToEvening' };
      break;
    case '3': // 夜晚
      type = { ApiType: 'ToNight' };
      break;
    case '4': // 晴
      type = { ApiType: 'ToSunny' };
      break;
    case '5': // 雨
      type = { ApiType: 'ToRain' };
      break;
    case '6': // 雪
      type = { ApiType: 'ToSnow' };
      break;
    case '7': // 开始漫游
      type = { ApiType: 'StartParade' };
      break;
    case '8': // 停止漫游
      type = { ApiType: 'EndParade' };
      break;
    case '9': // 火情出现
      type = { ApiType: 'FireAppears' };
      break;
    case '10': // 逃生路线
      type = { ApiType: 'ShowEscapeRoute' };
      break;
    case '11': // 火警
      type = { ApiType: 'FireTruck' };
      break;
    case '12':
      // 重置
      type = { ApiType: 'ResetToInitialState' };
      break;
    case '13':
      // 停止旋转
      type = { ApiType: 'PauseRotation' };
      break;
    case '14':
      // 火情消失
      type = { ApiType: 'FireDisappear' };
      break;
    case '15':
      // 隐藏逃生路线
      type = { ApiType: 'HideEscapeRodes' };
      break;
    case '16':
      // 消防车归位
      type = { ApiType: 'RecoverFireCarTransform' };
      break;
    default:
      type = { ApiType: 'ToMoon' };
      break;
  }
  console.warn(type, '场景动作============');

  // 根据不同效果重置状态
  if (type.ApiType == 'StartParade') {
    /*
      1. 停止旋转
      2. 隐藏逃生路线
      3. 消防车归位
      4. 火情消失
    */
    comp.player?.emit(PauseRotation);
    comp.player?.emit(HideEscapeRodes);
    comp.player?.emit(RecoverFireCarTransform);
    comp.player?.emit(FireDisappear);
  } else if (type.ApiType == 'EndParade') {
    /*
      1. 停止旋转
      2. 隐藏逃生路线
      3. 消防车归位
      4. 火情消失
    */
    comp.player?.emit(PauseRotation);
    comp.player?.emit(HideEscapeRodes);
    comp.player?.emit(RecoverFireCarTransform);
    comp.player?.emit(FireDisappear);
  } else if (type.ApiType == 'FireAppears') {
    /*
      1. 结束巡游
      2. 停止旋转
      3. 消防车归位
    */
    comp.player?.emit(EndParade);
    comp.player?.emit(PauseRotation);
    comp.player?.emit(RecoverFireCarTransform);
  } else if (type.ApiType == 'ShowEscapeRoute') {
    /*
      1. 停止旋转
    */
    comp.player?.emit(PauseRotation);
  } else if (type.ApiType == 'FireTruck') {
    /*
      1. 停止旋转
      2. 隐藏逃生路线
    */
    comp.player?.emit(PauseRotation);
    comp.player?.emit(HideEscapeRodes);
  }

  comp.player?.emit(type);
};
