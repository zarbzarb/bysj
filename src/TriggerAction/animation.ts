/* eslint-disable no-throw-literal */
import _ from 'lodash';
import Queue from '@/utils/Queue';
import { CompEvent, PageEvent } from '@/staticJson/PageEvent';
// eslint-disable-next-line import/no-cycle
import { verifyAnimationSettings, TriggerAnimationSettings } from './TriggerAnimationSettings';
import clearBeforeAnimation, { pushAnimationToCanBeClearedTargetsMap } from './clearBeforeAnimation';

/**
 * action: 当前交互
 * settings: {
 *    item: 组件对象 或 undefined
 *    events: 事件列表
 *    config: screenConfig 或 {}
 *    actions: 当前动作组下的动作列表
 * }
 */
export default (action, settings) => {
  // 动作拷贝
  const currentAction = _.cloneDeep(action);
  // 获取动作设置
  const { actionSettings } = currentAction;
  // 获取全局配置
  const screenConfig = settings.config;
  // 获取动画配置列表
  const { animationSettings } = actionSettings;

  const { events, item = {} } = settings;

  if (
    // 校验动画配置列表是否配置完整，完整返回true，不完整返回false
    verifyAnimationSettings(animationSettings, screenConfig) &&
    // 非编辑页面不支持动画
    !window.DataI.isConfigPage()
  ) {
    const eventSettings: (CompEvent | PageEvent)[] = events ?? item?.eventSetings ?? [];

    const agWithThisAct = eventSettings
      ?.flatMap((evt) => evt.groups)
      ?.find(({ actions: acts }) => acts.some(({ actionKey }) => action.actionKey === actionKey));

    if (!agWithThisAct) return;

    const animationSettingsQueue =
      agWithThisAct?.animationSettingsQueue ??
      (() => {
        agWithThisAct.animationSettingsQueue = new Queue();
        return agWithThisAct?.animationSettingsQueue;
      })();

    // 生成动画操作
    const promise = () => {
      return new Promise((resolve, reject) => {
        try {
          const animationObjectTemp = new TriggerAnimationSettings(animationSettings, screenConfig);

          // 动画开始执行
          setTimeout(() => {
            animationSettings.forEach((animationSetting) => clearBeforeAnimation(animationSetting));

            animationObjectTemp.play(false, resolve, reject);

            animationSettings.forEach((animationSetting) =>
              pushAnimationToCanBeClearedTargetsMap(animationSetting, animationObjectTemp),
            );
          }, 1);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    };

    // 添加进队列
    animationSettingsQueue.enqueue(promise);
  }
};
