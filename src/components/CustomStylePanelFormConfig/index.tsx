import React, { useEffect } from 'react';
import { useImmer } from 'use-immer';
import { CustomStylePanelConfig, CustomStyleGetValue, init, CustomStylePanelConfigItem } from './utils';
import styles from './styles.less';
import CompMatch from './MatchCtrl';

/** 这个组件接受一个面板配置渲染面板, 通过回调函数返回面板取值
 * ## TL;DR
 * 1. 可以通过 `defaultValue` 参数传入初始值
 * 2. 传入和传出内容均为不可变
 *
 * ## Props
 * - `readonly defaultValue?`: 用于初始化的数值, 仅与组件创建有关, 如果没有会根据 `defaultControlsConfig` 下的 `Controls` 进行初始化.
 * - `onChange`: 该函数会在每次面板更新时调用, 参数 `data` 为面板取值
 *
 * ## Custom
 * 添加组件在 `src/components/CustomStylePanelFormConfig/defaultControlsConfig` 中根据说明添加配置项
 *
 * ## Errors
 *
 * 接受不符合规范的配置
 * - 一个组件中的所有 'config' 下的内容以及 `config`本身均为可选属性, 缺失不会导致崩溃
 * - 不接受数组 + `field`的格式, 确保面板取值结构唯一性
 *
 * 冻结的面板取值被修改
 * - 反向操作面板取值不会引起刷新和内容改变, 所有取值内容经过代理与冻结
 *
 * ## Examples
 * @example
 * const default = {
 *     abc: "12",
 *     bcd: 12,
 *     color: "RGB(1, 2, 3)",
 *     select: 1,
 *     switch: true,
 *     cde: {
 *         a: "123",
 *         b: "2"
 *     }
 * }
 *
 * <CustomStylePanelFormConfig
 *   defaultValue={default}
 *   config={{
 *     abc: { type: 'input', label: '输入aaa', value: '12', config: {} },
 *     bcd: { type: 'number', label: 'input', value: 12, config: {} },
 *     color: { type: 'color', label: '颜色', value: 'RGB(1, 2, 3)' },
 *     select: {
 *       type: 'select',
 *       label: 'pick one',
 *       value: 1,
 *       config: {
 *         options: [
 *           { value: 1, label: 'first' },
 *           { value: 2, label: 'second' },
 *         ],
 *       },
 *     },
 *     switch: {
 *       type: 'switch',
 *       label: '开关',
 *       value: true,
 *     },
 *     cde: {
 *       type: 'collapse',
 *       label: '折叠面板',
 *       value: {
 *         a: { type: 'input', label: 'input', config: { placeholder: 'input here' } },
 *       },
 *     },
 *   }}
 *   onChange={console.log}
 * />
 *
 * // 结果:
 * {
 *     "abc": "12",
 *     "bcd": 12,
 *     "color": "RGB(1, 2, 3)",
 *     "select": 1,
 *     "switch": true,
 *     "cde": {
 *         "a": "123",
 *         "b": "2"
 *     }
 * }
 *
 */
export const Comp = <const ConfigType extends CustomStylePanelConfig>({
  defaultValue,
  config,
  onChange,
}: {
  config: ConfigType;
  defaultValue?: CustomStyleGetValue<ConfigType>;
  onChange: (data: CustomStyleGetValue<ConfigType>) => void;
}): JSX.Element => {
  const [value, setGetValue] = useImmer(
    defaultValue ??
      (Object.fromEntries(
        Object.entries(config).map(([key, ctrl]) => [key, init(ctrl)]),
      ) as CustomStyleGetValue<ConfigType>),
  );

  useEffect(() => onChange(value), [value, onChange]);

  return (
    <div className={styles.formWarp}>
      {(
        Object.entries(config) as [keyof ConfigType, CustomStylePanelConfigItem<ConfigType[keyof ConfigType]['type']>][]
      ).map(([key, ctrl]) => (
        <CompMatch
          ctrl={ctrl}
          defaultValue={defaultValue?.[key]}
          config={config}
          key={key.toString()}
          ctrlKey={key}
          setGetValue={setGetValue}
        />
      ))}
    </div>
  );
};

export default Comp;
