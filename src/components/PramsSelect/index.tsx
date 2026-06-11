import React, { ComponentProps } from 'react';
import { TreeSelect } from 'antd';
import _ from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';

import mappers, { ExtendsFn, FilterFn } from './mappers';
import styles from './styles.less';

type TreeSelectProps = ComponentProps<typeof TreeSelect>;

const getPopupContainer = () => document.querySelector('.edit-container') as HTMLElement;

/** 选择要修改属性的选择器
 *
 * # Props
 *
 * - `value`: 要修改的属性的路径
 *
 * - `onChange`: 修改事件, 返回修改后的要修改的属性路径
 *
 * - `comp`: 待修改的组件
 *
 * - `treeSelectProps`: 这个对象内容被映射为 {@link TreeSelect} 的 props, 但是从中剔除了:
 *    - `children`
 *    - `treeData`
 *    - `onChange`
 *
 * # Register
 *
 * 这个组件并不会自动获取组件可修改结构, 你需要登记你想要修改的组件展示的属性结构和每个属性的修改方式, 在 {@link mappers} 文件夹中进行注册.
 *
 * ## 第一步: 在 `./mapper` 文件夹中创建对应组件的文件
 *
 * - 文件名称为组件的 type 名.
 *
 * - 文件需要默认暴露配置文件如下结构:
 *
 * @example
 * ```ts
 * import { Mapper } from '.';
 *
 * export default {
 *   // selectable 用于定义组件的属性结构
 *   // 注意: 这是一个接受组件实例对象的函数
 *   selectable: (comp) => [
 *     { title: '字体颜色', key: 'fontColor' },
 *     ...
 *   ],
 *
 *   // parser 将在事件执行的时候执行
 *   // path: 将被修改的属性路径 (这个路径取决于 selectable 的结构, 并非实际路径)
 *   // data: 要修改为的属性
 *   // comp: 组件实例对象
 *   parser: (path, data, comp) => {
 *     if (path[0] === 'fontColor') {
 *       comp.props.style.color.gradient = data;
 *       return;
 *     }
 *     ...
 *   },
 *
 * // typescript 格式校验
 * } satisfies Mapper;
 * ```
 *
 * ## 第二步: 在 `./mappers/index.ts` 中完成注册
 * @example
 * ```ts
 * import UrCompNameToRegister from './UrCompNameToRegister';
 * ...
 * const EXPORT_CONFIG = {
 *   UrCompNameToRegister,
 * };
 * ```
 *
 * # Examples
 * @example
 * ```ts
 * <PramsSelect
 *   treeSelectProps={{
 *     dropdownStyle: { maxHeight: 250, overflow: 'auto' },
 *     style: { width: '100%' },
 *   }}
 *   onChange={(val) => set(val)}
 *   comp={targetComp}
 *   value={pramsPath}
 * />
 * ```
 */
const PramsSelect: React.FC<{
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  comp: any;
  treeSelectProps?: Optional<Omit<ComponentProps<typeof TreeSelect>, 'children' | 'treeData' | 'onChange'>>;
  pramFilterFn?: FilterFn;
  pramExtendsFn?: ExtendsFn;
}> = ({ value, comp, onChange, treeSelectProps: treeSelectPropsFromProps, pramFilterFn, pramExtendsFn }) => {
  return (
    <TreeSelect
      {..._.merge(
        {
          getPopupContainer,
          placeholder: '选择修改的属性',
          showArrow: true,
          showSearch: true,
          style: { width: '100%', ...treeSelectPropsFromProps.style },
          dropdownStyle: { padding: 0, ...treeSelectPropsFromProps.dropdownStyle },
          suffixIcon: <img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />,
          treeDefaultExpandAll: true,
        } satisfies TreeSelectProps,
        _.omit(treeSelectPropsFromProps, ['style', 'dropdownStyle']),
      )}
      value={JSON.stringify(value)}
      onChange={(val: string) => onChange(JSON.parse(val))}
      treeData={mappers?.[comp?.type?.replace('@yl/', '')]?.selectable(comp, pramFilterFn, pramExtendsFn)}
    />
  );
};

export default PramsSelect;
