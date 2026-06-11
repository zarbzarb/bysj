import ShortUuid from 'short-uuid';
import _ from 'lodash';
import { Store } from '@/store';

const createKey = () => {
  return ShortUuid.generate();
};

const BasicComp = {
  classType: 'customMap',
  compType: 'customMap',
  compName: '',
  name: '',
  fileName: '',
  key: '',
  type: '',
  // mockState: true,
  state: {
    // 用于管理一些状态
    drag: true,
  },
  styles: {
    transform: 'translate(0px, 0px)', // 位置
    width: '200px', // 默认宽度
    height: '200px', // 默认高度
    opacity: 100, // 默认透明度
  },
  dataSource: [], // 数据源
  dataSourceRef: {
    isRef: false, // 是否引用变量
    variable: '', // 变量
    variableType: 'Array Object', // 变量类型
    variableFields: [],
    variableDescription: '', // 变量描述
  },
  params: {},
  fields: {},
  attr: {},
  props: {},
  layout: {},
};

function initCompProps(obj, item) {
  obj.compName = item.componentName; // 组件名称
  obj.name = item.componentName; // 是否存在重复？
  obj.styles.position = 'absolute'; // 定位
  obj.styles.width = '300px'; // 宽度
  obj.styles.height = '170px'; // 高度
  return obj;
}

export const addMapComp = (item, activeLayerId, pageType) => {
  const {
    pageTabsStore: { selectedKey },
  } = Store;
  const key = createKey();
  let comp = _.cloneDeep(BasicComp);
  comp.type = 'customMap';
  comp.mapCode = item.englishName;
  if (item.key === '' || item.key === undefined) {
    comp.key = key;
    // if (pageType !== 'card') {
    //   comp.layerId = activeLayerId;
    // }
    comp.layerId = activeLayerId;
    // 新增组件添加页面id
    if (selectedKey) {
      comp.appPageId = selectedKey;
    }
    comp = initCompProps(comp, item);
  } else {
    comp = item;
  }
  item.eventSetings = [];
  return comp;
};
