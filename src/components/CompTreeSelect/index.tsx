import _ from 'lodash';
import { TreeSelect } from 'antd';
import React, { ComponentProps, useMemo } from 'react';

import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import { useStore } from '@/hooks';

type TreeSelectProps = ComponentProps<typeof TreeSelect>;

const getPopupContainer = () => document.querySelector('.edit-container') as HTMLElement;

type TreeDataset = TreeSelectProps['treeData'];

const mapCompsToTreeData = (
  comps,
  options?: { filter?: (comp) => boolean; map?: (comp) => TreeDataset[number] },
): TreeDataset =>
  comps
    ?.filter((comp) => options?.filter?.(comp) ?? true)
    .map((comp) => ({
      title: comp.name || comp.compName,
      value: comp.key,
      children: mapCompsToTreeData(comp.childComList, options),
      ...options?.map?.(comp),
    }));

/** 选择组件的树形选择器
 *
 *  # Props
 *
 * - `selected`: 被选中的组件 `key`, 单选的时候为 `string`, 声明为多选的时候为 `string[]`
 *
 * - `onChange`: 通过 `treeSelectProps` 你可以设置选择器多选, 所以这个回调支持 `string | string[]`, 其他参数和 {@link ComponentProps<typeof TreeSelect>['onChange']} 一致
 *
 * - `compsFilter`: 针对组件的过滤, 过滤结果中的 `undefined | null` 会被视为 `true`, `false` 的结果会被过滤掉在选项中不会出现
 *
 * - `compsMap`: 针对组件到配置的映射, 映射结果会被递归合并到 {@link TreeSelect} 的 prop {@link ComponentProps<typeof TreeSelect>['treeData']} 项目中
 *
 * - `appPageId`: 如果不传入会从 {@link ReturnType<typeof useStore>['pageTabsStore']['selectedKey']} 获取
 *
 * - `treeSelectProps`: 这个对象内容被映射为 {@link TreeSelect} 的 props, 但是从中剔除了:
 *    - `treeNodeFilterProp`
 *    - `virtual`
 *    - `children`
 *    - `treeData`
 *    - `onChange`
 *
 * # Examples
 *
 * - 默认单选
 * @example
 * ```jsx
 * <CompTreeSelect selected={comp.key} onChange={(compKey) => set(compKey)} />
 * ```
 *
 * - 声明单选
 * @example
 * ```jsx
 * <CompTreeSelect<string> selected={comp.key} onChange={(compKey) => set(compKey)} />
 * ```
 *
 * - 声明多选
 * @example
 * ```jsx
 * <CompTreeSelect<string[]>
 *    selected={comp.key}
 *    onChange={(compKey) => set(compKey)}
 *    treeSelectProps={{ multiple: true }}
 * />
 * ```
 *
 * - 过滤文本组件和进度条组件
 * @example
 * ```jsx
 * const UNACCEPTED_COMP_TYPE = new Set(['Text', '@yl/datai-com-progress-bar']);
 * <CompTreeSelect
 *    selected={comp.key}
 *    onChange={(compKey) => set(compKey)}
 *    compsFilter={({ type }) => !UNACCEPTED_COMP_TYPE.has(type)}
 * />
 * ```
 *
 * - 禁用 antd 组件
 * @example
 * ```jsx
 * <CompTreeSelect
 *    selected={comp.key}
 *    onChange={(compKey) => set(compKey)}
 *    compsMap={({ classType }) => classType === 'antd' ? { disabled: true } : {}}
 * />
 * ```
 *
 * - 综合使用:
 *   - 提供自定义的 `appPageId`
 *   - 只显示包含 `ACCEPT_COMP_TYPE` 中的组件
 *   - 剔除 `CONTAINER_COMP` 中的组件的可选性
 * @example
 * ```jsx
 * const CONTAINER_COMP = new Set(['dataq-com-group-basic', 'CustomList']);
 * const ACCEPT_COMP_TYPE = new Set([...Object.keys(mappers), ...CONTAINER_COMP]);
 *
 * <CompTreeSelect
 *   appPageId = {appPageId}
 *   selected = {compKey}
 *   onChange = {changeRefComp}
 *   compsFilter = {({type}) => ACCEPT_COMP_TYPE.has(type?.replace('@yl/', ''))}
 *   compsMap = {({type}) => (CONTAINER_COMP.has(type?.replace('@yl/', '')) ? { selectable: false } : {})}
 * />
 * ```
 */
const CompTreeSelect = <V extends string | string[] = string>({
  selected,
  onChange,
  appPageId,
  compsMap,
  compsFilter,
  treeSelectProps: treeSelectPropsFromProps,
}: {
  appPageId?: string;
  selected: V;
  treeSelectProps?: Optional<
    Omit<ComponentProps<typeof TreeSelect>, 'treeNodeFilterProp' | 'virtual' | 'children' | 'treeData' | 'onChange'>
  >;
  onChange: (
    compKey: V,
    label: Parameters<TreeSelectProps['onChange']>['1'],
    extra: Parameters<TreeSelectProps['onChange']>['2'],
  ) => void;
  compsMap?: (comp) => Optional<TreeDataset[number]>;
  compsFilter?: (comp) => boolean;
}) => {
  const { className } = treeSelectPropsFromProps ?? {};

  const {
    layerStore,
    pageTreeStore: { pageInfoMap, actionPageInfoMap },
    pageTabsStore: { selectedKey },
  } = useStore();

  const { layers, comList } = useMemo(() => {
    if (!appPageId || appPageId === selectedKey) return { layers: layerStore.layers, comList: layerStore.comList };

    if (pageInfoMap[appPageId])
      return {
        layers: pageInfoMap[appPageId].pageConfig?.layerConfig?.layers ?? [],
        comList: pageInfoMap[appPageId].componentList ?? [],
      };

    if (actionPageInfoMap[appPageId])
      return {
        layers: actionPageInfoMap[appPageId].pageConfig?.layerConfig?.layers ?? [],
        comList: actionPageInfoMap[appPageId].componentList ?? [],
      };

    return { layers: [], comList: [] };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionPageInfoMap?.[appPageId], appPageId, layerStore.comList, layerStore.layers, pageInfoMap, selectedKey]);

  const treeData = useMemo(
    (): TreeDataset =>
      layers
        .map(({ layerName, key, layerId: layerIdForLayers }) => ({
          title: layerName,
          value: key,
          selectable: false,
          children: mapCompsToTreeData(
            comList.filter(({ layerId }) => layerId === layerIdForLayers),
            { map: compsMap, filter: compsFilter },
          ),
        }))
        .filter(({ children }) => children && children.length > 0),
    [comList, compsFilter, compsMap, layers],
  );

  return (
    <TreeSelect
      {..._.merge(
        {
          getPopupContainer,
          showArrow: true,
          showSearch: true,
          style: { width: '100%' },
          suffixIcon: <img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />,
          treeDefaultExpandAll: true,
        } satisfies TreeSelectProps,
        treeSelectPropsFromProps,
      )}
      value={selected}
      onChange={onChange}
      className={className}
      treeData={treeData}
      treeNodeFilterProp='title'
      virtual={false}
    />
  );
};

export default CompTreeSelect;
