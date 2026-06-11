import { produce } from 'immer';
import { isArray, isObject } from 'lodash';
import { useCallback, useState } from 'react';
import { allContainer, Container, Controls } from './defaultControlsConfig';

export const useImmerState = <T>(value: T): [T, (fn: (v: T) => void) => void] => {
  const [v, set] = useState(value);
  return [v, useCallback((fn) => set(produce(v, fn)), [v])];
};

export const init = <const ConfigType extends CustomStylePanelConfigItem<CtrlKey>>(
  config: ConfigType,
): InsureCustomStyleGetValueItem<ConfigType> => {
  if ((allContainer as CtrlKey[]).includes(config.type) && isArray(config.value))
    return (config.value as CustomStylePanelConfigItem<UsualKey>[]).map((c) =>
      init(c),
    ) as InsureCustomStyleGetValueItem<ConfigType>;

  if ((allContainer as CtrlKey[]).includes(config.type) && isObject(config.value))
    return Object.fromEntries(
      Object.entries(config.value).map(([key, ctrl]) => [key, init(ctrl)]),
    ) as InsureCustomStyleGetValueItem<ConfigType>;

  return config.value as InsureCustomStyleGetValueItem<ConfigType>;
};

export function newControls<
  const T extends Readonly<{
    [K: string]: { label: string; value: unknown; config?: { [CK: string]: unknown }; __container__?: true };
  }>,
>(v: T): Readonly<T> {
  return Object.freeze(v);
}

type CtrlKey = keyof typeof Controls;
type UsualKey = Exclude<CtrlKey, Container['type']>;

export interface CustomStylePanelConfigBaseForUsual<T extends UsualKey> {
  label: string;
  type: T;
  value?: (typeof Controls)[T]['value'];
  config?: (typeof Controls)[T] extends { [K: string]: unknown; config: unknown }
    ? Partial<(typeof Controls)[T]['config']>
    : never;
}

type ContainerWithType<T extends Container['type']> = Exclude<
  Container,
  { [K: Exclude<string, 'type'>]: unknown } & { type: Exclude<Container['type'], T> }
>;

export type CustomStylePanelConfigItem<T extends CtrlKey> = T extends UsualKey
  ? MayReadonly<CustomStylePanelConfigBaseForUsual<T>>
  : T extends Container['type']
  ? MayReadonly<ContainerWithType<T>>
  : never;

export type CustomStylePanelConfig = Readonly<{
  [K: string]: Readonly<CustomStylePanelConfigItem<CtrlKey>>;
}>;

type InsureCustomStyleGetValueItem<Ctrl extends CustomStylePanelConfigItem<CtrlKey>> =
  Ctrl extends CustomStylePanelConfigItem<infer C> ? CustomStyleGetValueItem<C, Ctrl> : never;

type CustomStyleGetValueItem<T extends CtrlKey, Ctrl extends CustomStylePanelConfigItem<T>> = T extends UsualKey
  ? (typeof Controls)[T]['value']
  : T extends Container['type']
  ? Ctrl['value'] extends ReadonlyArray<CustomStylePanelConfigItem<CtrlKey>>
    ? Ctrl['value'][number]['value']
    : Ctrl['value'] extends { [K: string]: CustomStylePanelConfigItem<CtrlKey> }
    ? {
        [K in keyof Ctrl['value']]: Ctrl['value'][K] extends CustomStylePanelConfigItem<
          infer KType extends Ctrl['value'][K]['type']
        >
          ? CustomStyleGetValueItem<KType, Ctrl['value'][K]>
          : CustomStyleGetValueItem<any, any>;
      }
    : never
  : never;

export type CustomStyleGetValue<ConfigType extends CustomStylePanelConfig> = Readonly<{
  [K in keyof ConfigType]: InsureCustomStyleGetValueItem<ConfigType[K]>;
}>;
