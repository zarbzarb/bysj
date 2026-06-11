import DataI from '@/utils/global-api';
import { CompEvent } from '@/staticJson/PageEvent';
import type { TriggerAnimationSettings } from './TriggerAnimationSettings';

type AnimationSettings = {
  isClearBeforeAnimation: boolean;
  associatComponents: string[];
  sizeCompKey?: string;
  compKey?: string;
};

let clearableTargets: {
  [k: string]: { isCanBeCleared: boolean; triggerAnimationSettings: TriggerAnimationSettings[] };
} = {};

export default ({ isClearBeforeAnimation, associatComponents, sizeCompKey, compKey }: AnimationSettings) => {
  if (!isClearBeforeAnimation) return;

  clearableTargets = Object.fromEntries(
    Object.entries(clearableTargets).map(([key, { isCanBeCleared, triggerAnimationSettings: animas }]) => [
      key,
      { isCanBeCleared, triggerAnimationSettings: animas?.filter((anima) => !anima?.isAllAnimationFinishedYet()) },
    ]),
  );

  associatComponents.forEach((key) =>
    clearableTargets[key]?.triggerAnimationSettings.forEach((anima) => anima.fastForwardToEnd()),
  );

  clearableTargets[sizeCompKey]?.triggerAnimationSettings.forEach((anima) => anima.fastForwardToEnd());

  clearableTargets?.[compKey]?.triggerAnimationSettings.forEach((anima) => anima.fastForwardToEnd());

  if (clearableTargets?.[compKey]?.triggerAnimationSettings) clearableTargets[compKey].triggerAnimationSettings = [];
};

export const pushAnimationToCanBeClearedTargetsMap = (
  { associatComponents, sizeCompKey, compKey }: AnimationSettings,
  triggerAnimationSettings: TriggerAnimationSettings,
) => {
  associatComponents.forEach((key) => clearableTargets?.[key]?.triggerAnimationSettings.push(triggerAnimationSettings));

  clearableTargets?.[sizeCompKey]?.triggerAnimationSettings.push(triggerAnimationSettings);

  clearableTargets?.[compKey]?.triggerAnimationSettings.push(triggerAnimationSettings);
};

export const initCanBeClearedTargets = (): void =>
  window.DataI.each(window.layerList, (comp) =>
    (comp?.eventSetings as CompEvent[])
      ?.flatMap?.(({ groups }) => groups)
      ?.flatMap?.(({ actions }) => actions)
      ?.flatMap?.(({ actionSettings }): AnimationSettings => actionSettings?.animationSettings)
      ?.filter?.(Boolean)
      ?.forEach?.(({ isClearBeforeAnimation, associatComponents, sizeCompKey, compKey }) => {
        if (!isClearBeforeAnimation) return;

        if (compKey)
          clearableTargets[compKey] = {
            isCanBeCleared: true,
            triggerAnimationSettings: [],
          };

        if (sizeCompKey)
          clearableTargets[sizeCompKey] = {
            isCanBeCleared: true,
            triggerAnimationSettings: [],
          };

        if (associatComponents.length > 0)
          associatComponents.forEach((keys) => {
            clearableTargets[keys] = {
              isCanBeCleared: true,
              triggerAnimationSettings: [],
            };
          });
      }),
  );
