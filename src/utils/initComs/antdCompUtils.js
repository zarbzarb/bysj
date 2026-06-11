import ShortUuid from 'short-uuid';
import _ from 'lodash';
import CompInitialFn from '@/components/AntdLibs/CompInitial';
import { toJS } from 'mobx';
import { Store } from '@/store';

const createKey = () => {
  return ShortUuid.generate();
};

export const BasicComp = {
  classType: 'antd',
  compType: 'antd',
  compName: '',
  name: '',
  fileName: '',
  key: '',
  type: '',
  mockState: true,
  state: {
    // 用于管理一些状态
    drag: true,
  },
  styles: {
    transform: 'translate(0px, 0px)', // 位置
    position: 'absolute', // 定位
    display: 'inline-block', // 显示
    width: '200px', // 默认宽度
    height: '200px', // 默认高度
    opacity: 100, // 默认透明度
    xPercent: false,
    alignCenter: false, // 是否居中
    compPos: 'left', // 对齐
    verticalPos: 'top', // 垂直位置
    background: 'rgba(255,255,255,0)', // 背景
    overflow: 'visible', // 内容溢出
    color: 'rgba(255,255,255,1)', // 颜色
    border: {
      borderWidth: 0, // 边框宽度
      borderTop: true, // 是否有上边框
      borderBottom: true, // 是否有下边框
      borderLeft: true, // 是否有左边框
      borderRight: true, // 是否有右边框
      borderColor: 'rgba(61,73,102,1)', // 边框颜色
      borderStyle: 'solid', // 边框样式
    },
    font: {
      fontSize: '12px', // 字体大小
      color: 'rgba(255,255,255,1)', // 字体颜色
    },
    borderRadius: {
      borderRadius: 1, // 圆角
      borderTopLeftRadius: true, // 左上角
      borderTopRightRadius: true, // 右上角
      borderBottomLeftRadius: true, // 左下角
      borderBottomRightRadius: true, // 右下角
    },
    margin: {
      marginTop: 0, // 上边距
      marginRight: 0, // 右边距
      marginBottom: 0, // 下边距
      marginLeft: 0, // 左边距
    },
    textAlign: 'left', // 字体对齐
    padding: {
      paddingTop: 0, // 上填充
      paddingRight: 0, // 右填充
      paddingBottom: 0, // 下填充
      paddingLeft: 0, // 左填充
    },
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
  children: [
    {
      key: 0,
      AntdChildComponents: [],
    },
  ],
  attr: {},
  props: {},
  layout: {},
  comInvisible: false, // 控制编辑态显隐属性
  comCreated: true, // 控制编辑态组件是否创建
};

function initCompProps(obj) {
  const { type, styles } = obj;
  /**
   * hasChildren 是否允许可以嵌套子节点
   * edit 是否允许打开新页签，编辑当前节点下的子节点或者嵌套容器
   */
  switch (type) {
    case 'page': {
      styles.width = '1920px';
      styles.height = '1080px';
      styles.background = '#0d1117';
      break;
    }
    case 'text': {
      obj = CompInitialFn(obj);
      break;
    }
    case 'image': {
      obj = CompInitialFn(obj);
      break;
    }
    case 'tabs': {
      obj = CompInitialFn(obj);
      break;
    }
    case 'radioTabs': {
      obj = CompInitialFn(obj);
      break;
    }
    case 'table': {
      obj = CompInitialFn(obj);
      break;
    }
    case 'chart': {
      obj = CompInitialFn(obj);
      break;
    }
    case 'layout': {
      obj.hasChildren = true;
      obj.compName = '容器';
      styles.width = '300px';
      styles.height = '170px';
      obj.edit = true;
      styles.border.borderWidth = 1;
      break;
    }
    case 'map': {
      obj.hasChildren = false;
      obj.compName = '平面地图';
      styles.width = '800px';
      styles.height = '600px';
      break;
    }
    default: {
      obj = CompInitialFn(obj);
      break;
    }
  }
  return obj;
}

// refType ： card 卡片，page页面
export const addComp = (item, activeLayerId, templateKey) => {
  const {
    pageTabsStore: { selectedKey },
  } = Store;

  const randomKey = createKey();

  let comp = _.cloneDeep(BasicComp);

  comp.type = item.englishName || item.type;

  comp.templateKey = templateKey;

  if (item.key === '' || item.key === undefined) {
    comp.key = randomKey;

    comp.layerId = activeLayerId;

    comp = initCompProps(comp);
    // 新增antd组件添加页面id
    if (selectedKey) {
      comp.appPageId = selectedKey;
      if (comp.childComList && comp.childComList.length > 0) {
        // 1.1 组内组件添加页面 id
        for (const child of comp.childComList) {
          child.appPageId = comp.appPageId;
        }
      }
      // v8.17增加折叠面板
      if (comp.children && comp.children.length > 0) {
        for (const child of comp.children) {
          for (const um of child.AntdChildComponents) {
            um.appPageId = comp.appPageId;
            um.layerId = activeLayerId;
          }
        }
      }
    }
  } else {
    comp = item;
  }

  if (Array.isArray(comp.eventSetings)) {
    comp.eventSetings = item.eventSetings;
  } else {
    item.eventSetings = [];
  }

  return comp;
};

export const addChild = (type, refType, item, el) => {
  const key = createKey();
  let comp = _.cloneDeep(BasicComp);
  comp.type = type;
  comp.key = key;
  if (type === 'chart') {
    comp.chartConfig = toJS(item);
  }
  comp = initCompProps(comp);
  el.children.push(comp); // 添加子组件
  return key;
};

export const createChild = (type, item) => {
  const key = createKey();
  let comp = _.cloneDeep(BasicComp);
  comp.type = type;
  comp.key = key;
  if (type === 'chart') {
    comp.chartConfig = toJS(item);
  }
  comp = initCompProps(comp);

  return comp;
};
