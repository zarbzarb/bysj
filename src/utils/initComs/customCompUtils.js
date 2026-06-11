import ShortUuid from 'short-uuid';
import { message } from 'antd';
import { cloneDeep } from 'lodash';

const createKey = () => {
  return ShortUuid.generate();
};

const BasicComp = {
  classType: 'customComp',
  compType: 'customComp',
  compName: '',
  name: '',
  key: '',
  type: '',
  styles: {
    transform: 'translate(0px, 0px)', // 位置
    position: 'absolute', // 定位
    width: '200px', // 宽度
    height: '200px', // 高度
    opacity: 100, // 透明度
  },
  props: {},
  comInvisible: false, // 控制编辑态显隐属性
  comCreated: true, // 编辑态组件是否创建
  createFlag: true, // 预览态是否创建
  showFlag: true, // 预览态是否显示
};

function initCompProps(obj, item) {
  // console.log(obj);
  try {
    // obj = window[obj.customCode].Initial(obj); // 自定义组件的初始化
    obj.compName = item.componentName; // 组件名称
    obj.name = item.componentName; // 是否存在重复？
  } catch {
    message.error('自定义组件不存在!');
  }

  return obj;
}

export const addCustomComp = (item, activeLayerId, pageType, selectedKey) => {
  const randomKey = createKey();
  let comp = cloneDeep(BasicComp);
  comp.type = 'customComp';
  comp.customCode = item.englishName;
  if (item.key === '' || item.key === undefined) {
    comp.key = randomKey;
    comp.releaseUrl = item.releaseUrl; // 自定义组件js代码路径
    comp.layerId = activeLayerId;
    // 新增组件添加页面id
    if (selectedKey) {
      comp.appPageId = selectedKey;
    }
    comp = initCompProps(comp, item);
    comp.initial = true;
  } else {
    comp = item;
    comp.initial = false;
  }
  if (Array.isArray(comp.eventSetings)) {
    comp.eventSetings = item.eventSetings;
  } else {
    comp.eventSetings = [];
  }
  return comp;
};

export const formatCustomCompDataMap = (item) => {
  try {
    const custom = window[item.customCode];
    if (!custom) return;
    const dataset = custom.Initial?.dataset;
    if (!dataset) return;
    if (item.dataset.category) return;
    const dataMap = dataset.fields.map((obj) => ({ key: obj.field, name: obj.name }));
    const dimensionMap = dataset.fields.map((obj) => ({ dataMapKey: obj.field, col: obj.mapField, row: [] }));
    const staticDataMap = dataset.fields.map((obj) => ({ ...obj, row: [] }));
    const config = {
      apis: [], // 选择过的api列表
      dataMap,
      dimensionMap,
      reserved: [],
      source: {
        id: '',
        params: [],
        repeat: {
          on: false,
          intervalTime: 60,
        },
      },
    };
    item.dataset.category = 'json';
    item.dataset.defaultValue = dataset.data;
    item.dataset.dynamic = cloneDeep(config);
    item.dataset.indicator = cloneDeep(config);
    item.dataset._api = cloneDeep(staticDataMap);
    item.dataset.variableDataMap = cloneDeep(staticDataMap);
  } catch (error) {
    console.error(error);
  }
};
