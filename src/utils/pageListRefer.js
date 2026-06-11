import { mapBasePlanType } from '@/staticJson/MapBasic';
import { gisEventType } from '@/staticJson/AnimationComponentsList';

/**
 * v8.6.0 生成引用关系页面列表
 */
/**
 * 遍历树查找key并进行操作
 * @param data
 * @param key
 * @param callback
 * @returns
 */
const loopTree = (data, callback) => {
  for (const datum of data) {
    callback(datum);
    if (datum.children) {
      loopTree(datum.children, callback);
    }
  }
};

/**
 * 地图名称-子图层名称
 * @param {*} layers 地图子图层
 * @param {*} dataSource
 * @param {*} delKey
 * @param {*} pageName
 * @param {*} mapName
 * @param {*} key
 */
export const setMapLayersVarReferInfo = (layers, dataSource, delKey, pageName, mapName, key) => {
  layers.forEach((layer) => {
    const { type } = layer;
    const layerName = layer.name || layer.compName; // 获取子图层的名称
    const name = `${mapName}-${layerName}`;
    const attr = layer.instance ? layer.instance.compAttr : layer._attr;
    const config = layer.instance ? layer.instance.config : layer.preAttr ? layer.preAttr._config : layer._config;
    if (attr?.bindVariable) {
      const vKey = attr.bindVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '数据源绑定' };
      dataSource.push(data);
      if (delKey === vKey) attr.bindVariable = ''; // 删除引用关系
    }
    if (attr?.apiParamVar && attr?.apiParamVar?.type === 'variableRef' && attr?.apiParamVar?.dataVariable !== '') {
      const vKey = attr.apiParamVar.dataVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: 'api入参引用' };
      dataSource.push(data);
      if (delKey === vKey) attr.apiParamVar.dataVariable = ''; // 删除引用关系
    }
    if (attr?.pidParamVar && attr?.pidParamVar?.type === 'variableRef' && attr?.pidParamVar?.dataVariable !== '') {
      const vKey = attr.pidParamVar.dataVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '过滤图层数据引用' };
      dataSource.push(data);
      if (delKey === vKey) attr.pidParamVar.dataVariable = ''; // 删除引用关系
    }
    //
    if (attr && attr.dataType === 'variableRef' && attr.dataVariable !== '') {
      const vKey = attr.dataVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '插值/样本数据引用' };
      dataSource.push(data);
      if (delKey === vKey) attr.dataVariable = ''; // 删除引用关系
    }
    if (attr?.click?.variable) {
      const vKey = attr.click.variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '鼠标点击绑定' };
      dataSource.push(data);
      if (delKey === vKey) attr.click.variable = ''; // 删除引用关系
    }
    if (attr?.hover?.variable) {
      const vKey = attr.hover.variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '鼠标悬浮绑定' };
      dataSource.push(data);
      if (delKey === vKey) attr.hover.variable = ''; // 删除引用关系
    }
    if (attr?.clickVariable) {
      const vKey = attr.clickVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '绑定数据引用' };
      dataSource.push(data);
      if (delKey === vKey) attr.clickVariable = ''; // 删除引用关系
    }

    if (config && config._source === 'variableRef') {
      let vKey = config._variable; // 获取绑定变量的key
      if (vKey) {
        const data = { pageName, key, name, vKey, refType: '数据源引用' };
        dataSource.push(data);
        if (delKey === vKey) config._variable = ''; // 删除引用关系
      } else {
        vKey = attr.boundingVariable; // 获取绑定变量的key
        if (vKey) {
          const data = { pageName, key, name, vKey, refType: '数据源引用' };
          dataSource.push(data);
          if (delKey === vKey) attr.boundingVariable = ''; // 删除引用关系
        }
      }
    }
  });
};

export const setVarReferInfo = (item, dataSource, delKey, pageName) => {
  const { key } = item; // 为了定位组件获取组件的key
  const name = item.name || item.compName; // antd组件初始用的compName
  if (item.classType === 'com') {
    // 引用数据源
    const config = item.instance ? item.instance.config : item.preAttr ? item.preAttr._config : item._config;
    if (config && config._source === 'variableRef' && config._variable !== '') {
      const vKey = config._variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '数据源引用' };
      dataSource.push(data);
      if (delKey === vKey) {
        config._variable = ''; // 删除引用关系
        item.instance?.setData([]);
      }
    }
    if (mapBasePlanType.includes(item.type)) {
      const { layers = [] } = item;
      setMapLayersVarReferInfo(layers, dataSource, delKey, pageName, name, key);
    }
  } else if (item.classType === 'antd' || item.classType === 'customComp') {
    // 引用数据源
    const { props, type } = item; // dataset可能不存在

    if (type === 'LayerTree') {
      if (props.relateDataType === '3' && props.layerVariable !== '') {
        const vKey = props.layerVariable; // 获取绑定变量的key
        const data = { pageName, key, name, vKey, refType: '数据源引用' };
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          props.layerVariable = '';
        }
      }
    } else if (type === 'RegionSelect') {
      if (props.data_sources_layer === 'useVariable' && props.useVariable !== '') {
        const vKey = props.useVariable; // 获取绑定变量的key
        const data = { pageName, key, name, vKey, refType: '数据源引用' };
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          props.useVariable = '';
        }
      }
    } else if (type === 'TreeSelect' && props.treeVariable !== '') {
      const vKey = props.treeVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '异步加载树数据源引用' };
      dataSource.push(data);
      if (delKey === vKey) {
        // 删除引用关系
        props.treeVariable = '';
      }
    } else if (type === 'Descriptions' && props.dataSourceType === 'multiple') {
      const keys = Object.keys(item.dataset.multiDataset);
      keys.forEach((idKey) => {
        const keyDataset = item.dataset.multiDataset[idKey];
        if (keyDataset.isVariable && keyDataset.variable !== '') {
          const vKey = keyDataset.variable; // 获取绑定变量的key
          const data = { pageName, key, name, vKey, refType: `${idKey}-数据源引用` };
          dataSource.push(data);
          if (delKey === vKey) {
            // 删除引用关系
            keyDataset.variable = '';
          }
        }
      });
    }
    const dataset = type === 'LayerLegend' ? props.dataSourceSet : item.dataset;
    if (dataset) {
      const { category, isVariable, variable } = dataset;
      if (variable !== '' && (category === 'variableRef' || (category === undefined && isVariable))) {
        const vKey = variable; // 获取绑定变量的key
        const data = { pageName, key, name, vKey, refType: '数据源引用' };
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除组件绑定的变量key，不改变组件绑定的数据源类型
          // dataset.isVariable = false;
          // dataset.category = 'json';
          dataset.variable = '';
          if (typeof item.refresh === 'function') {
            item.refresh();
          }
        }
      }
    }
    // console.log('getVariableRefer****', delKey, item);
    // 选中值绑定变量(目前只有antd组件有这个配置,后续统一通过事件处理),兼容老大屏暂时保留
    const { handleRowBindVariable, variable: newVariable } = props;
    if (handleRowBindVariable && newVariable !== '') {
      const vKey = newVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '选中值绑定变量' };
      dataSource.push(data);
      if (delKey === vKey) {
        // 删除引用关系
        props.handleRowBindVariable = false;
        props.variable = '';
      }
    }
    // 树形选择器选中值绑定变量,兼容老大屏暂时保留
    const { useVariable, variable: anotherVariable } = props;
    if (useVariable && anotherVariable !== '') {
      const vKey = anotherVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '选中值绑定变量' };
      dataSource.push(data);
      if (delKey === vKey) {
        // 删除引用关系
        props.useVariable = false;
        props.variable = '';
      }
    }
  }
  // 交互配置
  const { eventSetings = [] } = item; // eventSetings可能不存在
  if (eventSetings.length === 0) return; // 没有配置一级交互事件直接返回
  // 鼠标拖拽
  const mouseDrag = eventSetings.filter((event) => {
    return event.eventType === 'mouseDrag';
  });
  mouseDrag.forEach((info) => {
    const { variable } = info;
    if (variable) {
      const vKey = variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '拖动数据存到' };
      dataSource.push(data);
      if (delKey === vKey) info.variable = ''; // 删除引用关系
    }
  });
  // 数据存储到
  const changeValue = eventSetings.filter((event) => {
    return event.eventType === 'changeValue';
  });
  changeValue.forEach((info) => {
    // 选中值存到变量
    const { variable } = info;
    if (variable) {
      const vKey = variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '数据存储到' };
      dataSource.push(data);
      if (delKey === vKey) info.variable = ''; // 删除引用关系
    }
  });
  // 单击表格行
  const tableRowClick = eventSetings.filter((event) => {
    return event.eventType === 'tableRowClick';
  });
  tableRowClick.forEach((info) => {
    // 单击表格行存到变量
    const { variable } = info;
    if (variable) {
      const vKey = variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '单击表格行' };
      dataSource.push(data);
      if (delKey === vKey) info.variable = ''; // 删除引用关系
    }
  });

  // 表格分页
  const tablePagination = eventSetings.filter((event) => {
    return event.eventType === 'tablePagination';
  });
  tablePagination.forEach((info) => {
    // 表格分页存到变量
    const { variable } = info;
    if (variable) {
      const vKey = variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '表格分页' };
      dataSource.push(data);
      if (delKey === vKey) info.variable = ''; // 删除引用关系
    }
  });
  // 表格单击操作项
  const tableColumnClick = eventSetings.filter((event) => {
    return event.eventType === 'tableColumnClick';
  });
  tableColumnClick.forEach((info) => {
    // 表格单击操作项存到变量
    const { variable } = info;
    if (variable) {
      const vKey = variable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '表格单击操作项' };
      dataSource.push(data);
      if (delKey === vKey) info.variable = ''; // 删除引用关系
    }
  });
  // 监听事件
  const monitoringEvent = eventSetings.filter((event) => {
    return event.eventType === 'monitoringEvent';
  });
  monitoringEvent.forEach((event) => {
    if (event.eventListenWithDataInjectVariable) {
      const vKey = event.eventListenWithDataInjectVariable; // 获取绑定变量的key
      const data = { pageName, key, name, vKey, refType: '监听事件' };
      dataSource.push(data);
      if (delKey === vKey) event.eventListenWithDataInjectVariable = ''; // 删除引用关系
    }
  });
  // 监听变量
  const listenVariable = eventSetings.filter((event) => {
    return event.eventType === 'listenVariable';
  });
  listenVariable.forEach((info) => {
    // 兼容性处理,容易白屏
    info?.variables?.forEach((variable) => {
      if (variable.variableKey !== '') {
        const vKey = variable.variableKey; // 获取绑定变量的key
        const data = { pageName, key, name, vKey, refType: '监听变量' };
        dataSource.push(data);
        if (delKey === vKey) variable.variableKey = ''; // 删除引用关系
      }
    });
  });
  eventSetings.forEach((event) => {
    const { groups = [] } = event; // actions可能不存在
    if (groups.length === 0) return; // 没有配置二级交互事件直接返回
    groups.forEach((ag) => {
      const actions = ag.actions || [];
      actions.forEach((action) => {
        const { actionSettings = {} } = action; // actionSettings可能不存在
        if (action.actionType === 'gisEventEmit') {
          // 地图交互事件
          const { mapAction } = actionSettings;
          mapAction.forEach((maction) => {
            const { actionSettings = {} } = maction; // actionSettings可能不存在
            switch (maction.actionType) {
              case 'mapLocationEvent': {
                // 地图定位
                if (actionSettings.variable) {
                  // 经度
                  const vKey = actionSettings.variable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图定位经度',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
                }
                if (actionSettings.latVariable) {
                  // 纬度
                  const vKey = actionSettings.latVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图定位纬度',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.latVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapZoomEvent': {
                // 地图缩放
                if (actionSettings.variable) {
                  const vKey = actionSettings.variable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图缩放',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapQuery': {
                // 地图查询
                if (actionSettings.variable) {
                  // 选择图层
                  const vKey = actionSettings.variable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图查询选择图层',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
                }
                if (actionSettings.queryApiVariable) {
                  // 存储结果
                  const vKey = actionSettings.queryApiVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图查询存储结果',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.queryApiVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapEsQuery': {
                // 地图全局查询
                if (actionSettings.layerCodeVariable) {
                  // 图层代码
                  const vKey = actionSettings.layerCodeVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图全局查询图层代码',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.layerCodeVariable = ''; // 删除引用关系
                }
                if (actionSettings.searchKeyVariable) {
                  // 关键字
                  const vKey = actionSettings.searchKeyVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图全局查询关键字',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.searchKeyVariable = ''; // 删除引用关系
                }
                if (actionSettings.pageNumVariable) {
                  // 页码
                  const vKey = actionSettings.pageNumVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图全局查询页码',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.pageNumVariable = ''; // 删除引用关系
                }
                if (actionSettings.pageSizeVariable) {
                  // 每页个数
                  const vKey = actionSettings.pageSizeVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图全局查询每页个数',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.pageSizeVariable = ''; // 删除引用关系
                }
                if (actionSettings.queryApiVariable) {
                  const vKey = actionSettings.queryApiVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图全局查询',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.queryApiVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapRenderLayers': {
                // 地图图层渲染
                if (actionSettings.renderLayerVariable) {
                  const vKey = actionSettings.renderLayerVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图图层渲染',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.renderLayerVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapGetCenter': {
                // 地图获取中心点
                if (actionSettings.centerVariable) {
                  const vKey = actionSettings.centerVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图获取中心点',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.centerVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapGetZoom': {
                // 地图获取比例尺
                if (actionSettings.zoomVariable) {
                  const vKey = actionSettings.zoomVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图获取比例尺',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.zoomVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapSetClick': {
                // 地图触发点击
                if (actionSettings.clickLayerVariable) {
                  const vKey = actionSettings.clickLayerVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图触发点击',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.clickLayerVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapCircleQuery': {
                // 地图周边查询
                if (actionSettings.circleQueryLayerVariable) {
                  // 选择图层
                  const vKey = actionSettings.circleQueryLayerVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图周边查询选择图层',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.circleQueryLayerVariable = ''; // 删除引用关系
                }
                if (actionSettings.circleQueryCenterVariable) {
                  // 查询点位
                  const vKey = actionSettings.circleQueryCenterVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图周边查询点位',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.circleQueryCenterVariable = ''; // 删除引用关系
                }
                if (actionSettings.circleQueryRadiusVariable) {
                  // 查询半径
                  const vKey = actionSettings.circleQueryRadiusVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图周边查询半径',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.circleQueryRadiusVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapTrackPlayback': {
                // 轨迹播放
                if (actionSettings.trackPlayPathVariable) {
                  const vKey = actionSettings.trackPlayPathVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图轨迹播放',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.trackPlayPathVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapRoutePath': {
                // 轨迹飞线
                if (actionSettings.routePathVariable) {
                  const vKey = actionSettings.routePathVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图轨迹飞线',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.routePathVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapHeatLine': {
                // 热力线
                if (actionSettings.heatLineVariable) {
                  const vKey = actionSettings.heatLineVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图热力线',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.heatLineVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapSetPoint': {
                // 地图选点
                if (actionSettings.imgSrcVariable) {
                  const vKey = actionSettings.imgSrcVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图选点图片',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.imgSrcVariable = ''; // 删除引用关系
                }
                if (actionSettings.imgSizeVariable) {
                  const vKey = actionSettings.imgSizeVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图选点图片缩放比例',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.imgSizeVariable = ''; // 删除引用关系
                }
                if (actionSettings.addressVariable) {
                  const vKey = actionSettings.addressVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图选点选中值',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.addressVariable = ''; // 删除引用关系
                }
                if (actionSettings.deleteVariable) {
                  const vKey = actionSettings.deleteVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图选点清除变量',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.deleteVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapShow': {
                // 地图显隐
                if (actionSettings.mapShowVariable) {
                  const vKey = actionSettings.mapShowVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图显隐',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.mapShowVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapSplitScreen': {
                // 分屏对比
                if (actionSettings.mainVariable) {
                  const vKey = actionSettings.mainVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '分屏对比主屏图层',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.mainVariable = ''; // 删除引用关系
                }
                if (actionSettings.secondVariable) {
                  const vKey = actionSettings.secondVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '分屏对比次屏图层',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.secondVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapSwipCompare': {
                // 卷帘对比
                if (actionSettings.leftLayerVariable) {
                  const vKey = actionSettings.leftLayerVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '卷帘对比左侧图层',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.leftLayerVariable = ''; // 删除引用关系
                }
                if (actionSettings.rightLayerVariable) {
                  const vKey = actionSettings.rightLayerVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '卷帘对比右侧图层',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.rightLayerVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapParticleEffects': {
                // 粒子特效
                if (actionSettings.positionVariable) {
                  const vKey = actionSettings.positionVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '粒子特效',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.positionVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapDynamicWater': {
                // 水位升降
                if (actionSettings.waterVariable) {
                  const vKey = actionSettings.waterVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '水位升降区域数据',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.waterVariable = ''; // 删除引用关系
                }
                if (actionSettings.heightVariable) {
                  const vKey = actionSettings.heightVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '水位升降水位高度',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.heightVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapDrawLine': {
                // 绘制线
                if (actionSettings.borderColorVariable) {
                  const vKey = actionSettings.borderColorVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图绘制线边框颜色',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.borderColorVariable = ''; // 删除引用关系
                }
                if (actionSettings.borderWidthVariable) {
                  const vKey = actionSettings.borderWidthVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图绘制线边框宽度',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.borderWidthVariable = ''; // 删除引用关系
                }
                if (actionSettings.deleteLineVariable) {
                  const vKey = actionSettings.deleteLineVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图绘制线清除变量',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.deleteLineVariable = ''; // 删除引用关系
                }

                break;
              }
              case 'mapFlyAnimate': {
                // 相机飞行
                if (actionSettings.longVariable) {
                  const vKey = actionSettings.longVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图相机飞行经度',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.longVariable = ''; // 删除引用关系
                }
                if (actionSettings.latVariable) {
                  const vKey = actionSettings.latVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图相机飞行纬度',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.latVariable = ''; // 删除引用关系
                }
                if (actionSettings.zoomVariable) {
                  const vKey = actionSettings.zoomVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图相机飞行缩放级别',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.zoomVariable = ''; // 删除引用关系
                }

                break;
              }
              default: {
                if (maction.actionType === 'mapDraw' && actionSettings.deleteDrawVariable) {
                  const vKey = actionSettings.deleteDrawVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图绘制区域清除变量',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.deleteDrawVariable = ''; // 删除引用关系
                } else if (maction.actionType === 'mapSpaceQuery' && actionSettings.deleteSpaceVariable) {
                  const vKey = actionSettings.deleteSpaceVariable; // 获取绑定变量的key
                  const data = {
                    pageName,
                    key,
                    name,
                    vKey,
                    refType: '地图空间查询清除变量',
                  };
                  dataSource.push(data);
                  if (delKey === vKey) actionSettings.deleteSpaceVariable = ''; // 删除引用关系
                }
              }
            }
            // v8.6.0添加通用参数
            const currentAction = gisEventType.find((um) => um.value === maction.actionType); // 获取当前交互的名称配置
            const dataParams = actionSettings.dataParams || [];
            if (dataParams.length > 0) {
              dataParams.forEach((dataParam) => {
                if (dataParam.updateType === 3 && dataParam.variableKey) {
                  const vKey = dataParam.variableKey; // 获取绑定变量的key
                  const data = { pageName, key, name, vKey, refType: `${currentAction.name}-${dataParam.paramName}` };
                  dataSource.push(data);
                  if (delKey === vKey) {
                    dataParams.variableKey = '';
                  }
                }
              });
            }
            const saveParams = actionSettings.saveParams || [];
            if (saveParams.length > 0) {
              saveParams.forEach((dataParam) => {
                if (dataParam.updateType === 3 && dataParam.variableKey) {
                  const vKey = dataParam.variableKey; // 获取绑定变量的key
                  const data = { pageName, key, name, vKey, refType: `${currentAction.name}-${dataParam.paramName}` };
                  dataSource.push(data);
                  if (delKey === vKey) {
                    saveParams.variableKey = '';
                  }
                }
              });
            }
          });
        } else {
          // 非地图交互事件没有三级事件
          switch (action.actionType) {
            case 'eventEmit': {
              // 事件发布
              const dataParams = actionSettings.dataParams || [];
              const variableKey =
                actionSettings.variableKey ||
                (dataParams[0] && dataParams[0].updateType === 3 && dataParams[0].variableKey);
              if (variableKey) {
                const vKey = variableKey; // 获取绑定变量的key
                const data = { pageName, key, name, vKey, refType: '事件发布' };
                dataSource.push(data);
                if (delKey === vKey) {
                  actionSettings.variableKey = ''; // 删除引用关系
                  dataParams[0] ? (dataParams[0].variableKey = '') : null;
                }
              }

              break;
            }
            case 'variableSettings': {
              // 变量设置
              if (actionSettings.variable) {
                const vKey = actionSettings.variable; // 获取绑定变量的key
                const data = {
                  pageName,
                  key,
                  name,
                  vKey,
                  refType: '变量设置',
                };
                dataSource.push(data);
                if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
              }

              break;
            }
            case 'dataQuery': {
              // 数据请求
              const { apiInfo = {} } = actionSettings; // apiInfo可能不存在
              // v8.6.0新增接口信息
              const { id, interfaceCode, interfaceName } = apiInfo;
              if (actionSettings.variable) {
                // 存储结果
                const vKey = actionSettings.variable; // 获取绑定变量的key
                const data = {
                  pageName,
                  key,
                  name,
                  vKey,
                  interfaceCode,
                  interfaceName,
                  refType: '数据请求存储结果',
                };
                dataSource.push(data);
                if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
              }
              if (Array.isArray(actionSettings.dataMapList) && actionSettings.dataMapList.length > 0) {
                // 数据映射
                actionSettings.dataMapList.forEach((dataMap) => {
                  if (dataMap.variable) {
                    const vKey = dataMap.variable; // 获取绑定变量的key
                    const data = {
                      pageName,
                      key,
                      name,
                      vKey,
                      interfaceCode,
                      interfaceName,
                      refType: `数据请求数据映射-${dataMap.mapName}`,
                    };
                    dataSource.push(data);
                    if (delKey === vKey) dataMap.variable = ''; // 删除引用关系
                  }
                });
              }

              if (Array.isArray(actionSettings.paramList) && actionSettings.paramList.length > 0) {
                actionSettings.paramList.forEach((param) => {
                  if (param.isRefer && param.exampleValue) {
                    const vKey = param.exampleValue;
                    const data = {
                      pageName,
                      key,
                      name,
                      vKey,
                      interfaceCode,
                      interfaceName,
                      refType: `数据请求参数-${param.name}`,
                    };
                    dataSource.push(data);
                    if (delKey === vKey) param.exampleValue = ''; // 删除引用关系
                  }
                });
              }

              break;
            }
            case 'updateData': {
              // 更新数据
              const dataParams = actionSettings.dataParams || [];
              dataParams.forEach((dataParam) => {
                if (dataParam.updateType === 3 && dataParam.variableKey) {
                  const vKey = dataParam.variableKey; // 获取绑定变量的key
                  const data = { pageName, key, name, vKey, refType: '更新数据' };
                  dataSource.push(data);
                  if (delKey === vKey) {
                    dataParams.variableKey = '';
                  }
                }
              });

              break;
            }
            case 'refreshDataSource': {
              // 刷新数据源
              const dataParams = actionSettings.dataParams || [];
              dataParams.forEach((dataParam) => {
                if (dataParam.updateType === 3 && dataParam.variableKey) {
                  const vKey = dataParam.variableKey; // 获取绑定变量的key
                  const data = { pageName, key, name, vKey, refType: '刷新数据源' };
                  dataSource.push(data);
                  if (delKey === vKey) {
                    dataParams.variableKey = '';
                  }
                }
              });

              break;
            }
            default: {
              break;
            }
          }
        }
      });
    });
  });
};

export const setApiReferInfo = (item, dataSource, dynamicApis, pageName) => {
  const { key, eventSetings = [] } = item; // 为了定位组件获取组件的key
  const name = item.name || item.compName; // antd组件初始用的compName
  eventSetings.forEach((event) => {
    const { groups = [] } = event; // actions可能不存在
    if (groups.length === 0) return; // 没有配置二级交互事件直接返回
    groups.forEach((ag) => {
      const actions = ag.actions || [];
      actions.forEach((action) => {
        if (action.actionType === 'dataQuery') {
          // 数据请求
          const { actionSettings = {} } = action; // actionSettings可能不存在
          // console.log('setApiReferInfo actionSettings', actionSettings);
          const { apiInfo = {} } = actionSettings; // apiInfo可能不存在
          // console.log('setApiReferInfo apiInfo', apiInfo);
          const { id, interfaceCode, interfaceName } = apiInfo;
          const data = {
            pageName,
            key,
            name,
            interfaceCode,
            interfaceName,
            refType: '数据请求',
          };
          dataSource.push(data);
        }
      });
    });
  });

  // 关联接口只和动态相关，和指标无关
  let source;
  if (item.classType === 'com') {
    const config = item.instance ? item.instance.config : item.preAttr ? item.preAttr._config : item._config;
    if (config && config._source === 'dynamic') {
      source = config.dynamic.source;
    }
  } else if (item.classType === 'antd') {
    const { dataset } = item;
    if (dataset && dataset?.category === 'dynamic') {
      source = dataset.dynamic.source;
    }
  }
  // 使用id获取api // info
  // console.log('refer source', source);
  if (source && source.id) {
    // console.log('refer dynamicApis', dynamicApis);
    const curApi = dynamicApis.find((v) => v.id === source.id);
    if (curApi && curApi.apiInfo) {
      const { interfaceCode, interfaceName } = curApi.apiInfo;
      const data = {
        pageName,
        key,
        name,
        interfaceCode,
        interfaceName,
        refType: '数据源',
      };
      dataSource.push(data);
    }
  }
};
/**
 * 依据页面树生成对应的引用关系对象
 * @param pageTree
 */
export const initAllPageReferSet = (pageTree) => {
  const allPageRefer = {};
  // console.log('refer pageTree', pageTree);
  loopTree(pageTree, (node) => {
    if (node.type === 1) {
      allPageRefer[node.appPageId] = {
        appPageId: node.appPageId,
        pageName: node.name,
      };
    }
  });
  return allPageRefer;
};

/**
 * 更新pageSet
 * @param {*} pageTree
 * @param {*} oldPageReferSet
 */
export const refreshPageTreeRefer = (pageTree, oldPageReferSet) => {
  const newAllPageRefer = initAllPageReferSet(pageTree);
  // console.log('refer newAllPageRefer', newAllPageRefer);
  Object.keys(newAllPageRefer).forEach((key) => {
    const curPageRefer = oldPageReferSet[key];
    if (curPageRefer) {
      newAllPageRefer[key].varRefer = curPageRefer.varRefer || [];
      newAllPageRefer[key].apiRefer = curPageRefer.apiRefer || [];
    }
  });
  return newAllPageRefer;
};

/**
 * 获取当前页变量和接口引用关系
 * @param {*} pageName 当前页名称
 * @param {*} componentList 当前页组件列表
 * @param {*} dynamicApis 当前页接口列表
 * @returns
 */
export const getCurPageRefer = (pageName, componentList, dynamicApis) => {
  const varRefer = [];
  const apiRefer = [];
  const delKey = '';
  const loop = (list) => {
    list.forEach((item) => {
      if (item.classType === 'group' || item?.isDragContainer) {
        setVarReferInfo(item, varRefer, delKey, pageName);
        setApiReferInfo(item, apiRefer, dynamicApis, pageName);
        loop(item.childComList);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        setVarReferInfo(item, varRefer, delKey, pageName);
        setApiReferInfo(item, apiRefer, dynamicApis, pageName);
        item.children.forEach((child) => {
          loop(child.AntdChildComponents);
        });
      } else {
        setVarReferInfo(item, varRefer, delKey, pageName);
        setApiReferInfo(item, apiRefer, dynamicApis, pageName);
      }
    });
  };
  loop(componentList);
  return {
    varRefer,
    apiRefer,
  };
};

/**
 * 获取当前组件列表的变量和接口引用关系
 * @param {*} compList
 * @param {*} delKey
 * @param {*} pageName
 */
export const getVarRefer = (compList, delKey, pageName) => {
  const varRefer = [];
  const loop = (componentList) => {
    componentList.forEach((item) => {
      if (item.classType === 'group' || item?.isDragContainer) {
        setVarReferInfo(item, varRefer, delKey, pageName);
        loop(item.childComList);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        setVarReferInfo(item, varRefer, delKey, pageName);
        item.children.forEach((child) => {
          loop(child.AntdChildComponents);
        });
      } else {
        setVarReferInfo(item, varRefer, delKey, pageName);
      }
    });
  };
  loop(compList);
  return varRefer;
};

/**
 * 获取当前页组件列表的接口引用关系
 * @param {*} compList
 * @param {*} dynamicApis
 * @param {*} pageName
 */
export const getApiRefer = (compList, dynamicApis, pageName) => {
  const apiRefer = [];
  const loop = (componentList) => {
    componentList.forEach((item) => {
      if (item.classType === 'group' || item?.isDragContainer) {
        setApiReferInfo(item, apiRefer, dynamicApis, pageName);
        loop(item.childComList);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        setApiReferInfo(item, apiRefer, dynamicApis, pageName);
        item.children.forEach((child) => {
          loop(child.AntdChildComponents);
        });
      } else {
        setApiReferInfo(item, apiRefer, dynamicApis, pageName);
      }
    });
  };
  loop(compList);
  return apiRefer;
};
