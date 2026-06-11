/**
 * 一些公共数据和方法
 */
import shortId from 'short-uuid';
import { cloneDeep } from 'lodash';
import { categoryListTree } from '@/staticJson/DataICompList';
import { getDataset } from '@/utils/common';

//  datai 组件无动态数据源或暂不兼容动态数据源
// 象形柱图、文字轮播列表、tab切换组、选择面板
export const unDynamicComps = new Set(['ChartPictograph', 'TextCarouseltextlist', 'TextTabsGroup', 'TextTabsSelect']);

// 需要特殊处理的显示自定义数据项的组件
export const customOptinsComps = {
  RadioTabs: [
    { label: '名称', value: 'label' },
    { label: '值', value: 'value' },
  ],
  Input: [{ label: '选中值', value: 'value' }],
  NewInput: [{ label: '选中值', value: 'value' }],
  TreeList: [{ label: '选中值', value: 'value' }],
  TreeSelect: [{ label: '选中值', value: 'value' }],
  DatePicker: [
    [{ label: '选中时间', value: 'value' }],
    [
      { label: '开始时间', value: 'startTime' },
      { label: '结束时间', value: 'endTime' },
    ],
  ],
};

// 无数据源配置的组件
export const noDataSourceConfigComps = new Set([
  // datai
  '@yl/datai-com-media-background-border',
  '@yl/datai-com-map-foundationPlan',
  // antd
  'CardTemplate',
  'DatePicker', // 虽然界面上有，其实并没用到
  'SceneFrame',
]);

export const hasVariableEvents = [
  'changeValue',
  'tableRowClick',
  'tablePagination',
  'listPagination',
  'treeRowClick',
  'tableColumnClick',
  'clickSeries',
  'clickLegend',
];

/**
 * 生成编辑参数的默认结构
 * @returns
 */
export const getInitParam = () => {
  const initParam = {
    key: shortId.generate(),
    // 参数项
    paramItemId: undefined,
    paramName: '',
    // 更新方式, 1-手动输入, 2-组件数据, 3-变量, 4-交互传入值
    updateType: undefined,
    // 手动输入的值
    inputVal: undefined,
    // 选择的组件
    compKey: undefined,
    // 组件选中的数据项
    compDataItem: undefined,
    // 组件数据项列表
    compDataItemOptions: [],
    // 交互传入值
    interactDataItem: undefined,
    // 交互传入值选项列表
    interactDataItemOptions: [],
    // 变量
    variableKey: undefined,
    // 是否数据格式转换 0：不需要转，1：旧格式需要转，2： 转后正确
    dataSwitch: 0,
    dataSwitchContent: {
      code: `//请将返回值以retun方式返回
   return ""`,
      dimensionMap: [],
    },
    // 变量表达式
    expression: 'data',
    mapValName: '',
    // v8.5.1 是否选中值 0:默认数据， 1：当前选中值
    isSelected: 1,
  };

  return cloneDeep(initParam);
};

/**
 * 交互传入值
 * @param {*} cb 回调函数
 */
export const interactivelyPassInValue = (comp, eventType, cb) => {
  const dateset = getDataset(comp);
  const arr = new Set(['form', 'chart', 'controls']); // 表格、控件类、图表类才有交互传入值
  if ((eventType !== 'click' && eventType !== 'doubleClick') || comp.type === 'Button') {
    categoryListTree.forEach((i) => {
      if (arr.has(i.categoryCode)) {
        for (let a = 0; a < i.children.length; a++) {
          for (let b = 0; b < i.children[a].versions.length; b++) {
            const version = i.children[a].versions[b];
            if (
              comp.type === version.englishName ||
              ('componentCode' in version && comp.type === version.componentCode)
            ) {
              cb && cb();
            }
          }
        }
      }
    });
  }

  // v8.5 自动列表的子组件，支持交互传入值
  if (comp.isCustomListChild && dateset.dynamic?.dataFromParent) {
    cb && cb();
  }
};
