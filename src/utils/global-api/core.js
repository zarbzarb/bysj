/* eslint-disable no-unused-expressions */
import { message } from 'antd';
import { isPlainObject } from 'lodash';
import { SAVEUECARD } from '@/services/apis/CardApi';
import { getCompListJSONSettings } from '@/Computed/Comp/ExportCompJson';
import { filterDataStore, filterRelatedApi } from '@/utils/common';
import { gisEventType } from '@/staticJson/AnimationComponentsList';
// const gisEventType = [
//   {
//     name: '定位',
//     value: 'mapLocationEvent',
//   },
//   {
//     name: '缩放',
//     value: 'mapZoomEvent',
//   },
//   {
//     name: '相机飞行',
//     value: 'mapFlyAnimate',
//   },
//   {
//     name: '切换底图',
//     value: 'mapCutEvent',
//   },
//   {
//     name: '查询',
//     value: 'mapQuery',
//   },
//   {
//     name: '全局查询',
//     value: 'mapEsQuery',
//   },
//   {
//     name: '周边查询',
//     value: 'mapCircleQuery',
//   },
//   {
//     name: '空间查询',
//     value: 'mapSpaceQuery',
//   },
//   {
//     name: '图层渲染',
//     value: 'mapRenderLayers',
//   },
//   {
//     name: '地图测量',
//     value: 'mapMeasure',
//   },
//   {
//     name: '绘制区域',
//     value: 'mapDraw',
//   },
//   {
//     name: '获取中心点位',
//     value: 'mapGetCenter',
//   },
//   {
//     name: '获取比例尺',
//     value: 'mapGetZoom',
//   },
//   {
//     name: '触发点击',
//     value: 'mapSetClick',
//   },

//   {
//     name: '轨迹播放',
//     value: 'mapTrackPlayback',
//   },
//   {
//     name: '轨迹飞线',
//     value: 'mapRoutePath',
//   },
//   {
//     name: '热力线渲染',
//     value: 'mapHeatLine',
//   },
//   {
//     name: '地图选点',
//     value: 'mapSetPoint',
//   },
//   {
//     name: '图层显隐',
//     value: 'mapShow',
//   },
//   {
//     name: '分屏对比',
//     value: 'mapSplitScreen',
//   },
//   {
//     name: '卷帘对比',
//     value: 'mapSwipCompare',
//   },
//   {
//     name: '粒子特效',
//     value: 'mapParticleEffects',
//   },
//   {
//     name: '水位升降',
//     value: 'mapDynamicWater',
//   },
//   // v6.19 新增绘制线
//   {
//     name: '绘制线',
//     value: 'mapDrawLine',
//   },
//   {
//     name: '雷达波',
//     value: 'mapAnimationPoint',
//   },
//   {
//     name: '图层数据设置',
//     value: 'mapDataSplitRender',
//   },
//   {
//     name: '绕点旋转',
//     value: 'mapLookAt',
//   },
// ];

const arr = [];
const { push } = arr;
const { slice } = arr;
const eventType = [
  { value: 'click', name: '单击' },
  { value: 'doubleClick', name: '双击' },
  { value: 'changeValue', name: '选中值' },
  { value: 'initialization', name: '初始化' },
  { value: 'monitoringEvent', name: '监听事件' },
  { value: 'listenVariable', name: '监听变量' },
  { value: 'enterHandler', name: '回车触发' },
  { value: 'tableRowClick', name: '单击表格行' },
  { value: 'tablePagination', name: '表格分页' },
  { value: 'listPagination', name: '列表分页' },
  { value: 'treeRowClick', name: '单击列表行' },
  { value: 'tableColumnClick', name: '单击操作项' },
  { value: 'blur', name: '失去焦点' },
  // v7.1 交互添加鼠标移入、鼠标移出事件
  { value: 'mouseenter', name: '鼠标移入' },
  { value: 'mouseleave', name: '鼠标移出' },
];
const actionType = [
  { name: '刷新数据源', value: 'refreshDataSource' },
  { name: '数据请求', value: 'dataQuery' },
  { name: '动画进入', value: 'animateIn' },
  { name: '动画退出', value: 'animateOut' },
  { name: '动画循环', value: 'animateLoop' },
  {
    name: '动画设置',
    value: 'animateSettings',
  },
  { name: '变量设置', value: 'variableSettings' },
  { name: '显示隐藏', value: 'visiableToggle' },
  { name: '事件发布', value: 'eventEmit' },
  { name: '地图交互', value: 'gisEventEmit' },
  { name: '场景互动', value: 'sceneInteraction' },
  { name: '视频操作', value: 'videoInteraction' },
  { name: '全屏显示', value: 'fullScreen' },
  { name: '跳转页面', value: 'jumpPage' },
];

const setDataSource = (item, dataSource, delKey, isDelete = true) => {
  const { key } = item; // 为了定位组件获取组件的key
  const name = item.name || item.compName; // antd组件初始用的compName
  if (item.classType === 'com') {
    if (item.instance === undefined) return;
    // 引用数据源
    const { config } = item.instance;
    if (config && config._source === 'variableRef' && config._variable != '') {
      const vKey = config._variable; // 获取绑定变量的key
      const data = { key, name, vKey, refType: '数据源引用' };
      if (isDelete) {
        dataSource.push(data);
        if (delKey === vKey) config._variable = ''; // 删除引用关系
      } else if (delKey === vKey) {
        dataSource.push(item);
      }
    }
    // 交互配置 拖动绑定变量
    const { eventSetings = [] } = item;
    if (eventSetings.length === 0) return;
    // 数据存储到
    const mouseDrag = eventSetings.filter((event) => {
      return event.eventType === 'mouseDrag';
    });
    mouseDrag.forEach((info) => {
      const { variable } = info;
      if (variable) {
        const vKey = variable; // 获取绑定变量的key
        const data = { key, name, vKey, refType: '拖动数据存到' };
        // dataSource.push(data);
        // if (delKey === vKey) info.variable = ''; // 删除引用关系
        if (isDelete) {
          dataSource.push(data);
          if (delKey === vKey) config._variable = ''; // 删除引用关系
        } else if (delKey === vKey) {
          dataSource.push(item);
        }
      }
    });
  } else if (item.classType === 'antd' || item.classType === 'customComp') {
    // 引用数据源
    const { dataset = {} } = item; // dataset可能不存在
    // const { isVariable, variable } = dataset;
    const { category, isVariable, variable } = dataset;
    if (variable != '' && (category === 'variableRef' || (category === undefined && isVariable))) {
      const vKey = variable; // 获取绑定变量的key
      const data = { key, name, vKey, refType: '数据源引用' };
      // dataSource.push(data);
      // if (delKey === vKey) {
      //   // 删除引用关系
      //   dataset.isVariable = false;
      //   dataset.category = 'json';
      //   dataset.variable = '';
      // }
      if (isDelete) {
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          dataset.isVariable = false;
          dataset.category = 'json';
          dataset.variable = '';
        }
      } else if (delKey === vKey) {
        dataSource.push(item);
      }
    }
    // if (isVariable && variable != '') {
    //   const vKey = variable; // 获取绑定变量的key
    //   const data = { key, name, vKey, refType: '数据源引用' };
    //   // dataSource.push(data);
    //   // if (delKey === vKey) {
    //   //   // 删除引用关系
    //   //   dataset.isVariable = false;
    //   //   dataset.variable = '';
    //   // }
    //   if (isDelete) {
    //     dataSource.push(data);
    //     if (delKey === vKey) {
    //       // 删除引用关系
    //       dataset.isVariable = false;
    //       dataset.variable = '';
    //     }
    //   } else {
    //     if (delKey === vKey) {
    //       dataSource.push(item);
    //     }
    //   }
    // }
    console.log('getVariableRefer****', delKey, item);
    // 选中值绑定变量(目前只有antd组件有这个配置,后续统一通过事件处理),兼容老大屏暂时保留
    const { props } = item;
    const { handleRowBindVariable, variable: newVariable } = props;
    if (handleRowBindVariable && newVariable != '') {
      const vKey = newVariable; // 获取绑定变量的key
      const data = { key, name, vKey, refType: '选中值绑定变量' };
      // dataSource.push(data);
      // if (delKey === vKey) {
      //   // 删除引用关系
      //   props.handleRowBindVariable = false;
      //   props.variable = '';
      // }
      if (isDelete) {
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          props.handleRowBindVariable = false;
          props.variable = '';
        }
      } else if (delKey === vKey) {
        dataSource.push(item);
      }
    }
    // 树形选择器选中值绑定变量,兼容老大屏暂时保留
    const { useVariable, variable: anotherVariable } = props;
    if (useVariable && anotherVariable != '') {
      const vKey = anotherVariable; // 获取绑定变量的key
      const data = { key, name, vKey, refType: '选中值绑定变量' };
      // dataSource.push(data);
      // if (delKey === vKey) {
      //   // 删除引用关系
      //   props.useVariable = false;
      //   props.variable = '';
      // }
      if (isDelete) {
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          props.useVariable = false;
          props.variable = '';
        }
      } else if (delKey === vKey) {
        dataSource.push(item);
      }
    }
  }
  // 交互配置
  const { eventSetings = [] } = item; // eventSetings可能不存在
  if (eventSetings.length === 0) return; // 没有配置一级交互事件直接返回
  // 数据存储到
  const changeValue = eventSetings.filter((event) => {
    return event.eventType === 'changeValue';
  });
  changeValue.forEach((info) => {
    // 选中值存到变量
    const { variable } = info;
    if (variable) {
      const vKey = variable; // 获取绑定变量的key
      const data = { key, name, vKey, refType: '数据存储到' };
      // dataSource.push(data);
      // if (delKey === vKey) info.variable = ''; // 删除引用关系
      if (isDelete) {
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          info.variable = '';
        }
      } else if (delKey === vKey) {
        dataSource.push(item);
      }
    }
  });
  // 单击表格行
  const tableRowClick = eventSetings.filter((event) => {
    return event.eventType === 'tableRowClick';
  });
  if (tableRowClick.variable) {
    const vKey = tableRowClick.variable; // 获取绑定变量的key
    const data = { key, name, vKey, refType: '单击表格行' };
    // dataSource.push(data);
    // if (delKey === vKey) tableRowClick.variable = ''; // 删除引用关系
    if (isDelete) {
      dataSource.push(data);
      if (delKey === vKey) {
        // 删除引用关系
        tableRowClick.variable = '';
      }
    } else if (delKey === vKey) {
      dataSource.push(item);
    }
  }
  // 表格分页
  const tablePagination = eventSetings.filter((event) => {
    return event.eventType === 'tablePagination';
  });
  if (tablePagination.variable) {
    const vKey = tablePagination.variable; // 获取绑定变量的key
    const data = { key, name, vKey, refType: '表格分页' };
    // dataSource.push(data);
    // if (delKey === vKey) tablePagination.variable = ''; // 删除引用关系
    if (isDelete) {
      dataSource.push(data);
      if (delKey === vKey) {
        // 删除引用关系
        tablePagination.variable = '';
      }
    } else if (delKey === vKey) {
      dataSource.push(item);
    }
  }
  // 监听事件
  const monitoringEvent = eventSetings.filter((event) => {
    return event.eventType === 'monitoringEvent';
  });
  monitoringEvent.forEach((event) => {
    if (event.eventListenWithDataInjectVariable) {
      const vKey = event.eventListenWithDataInjectVariable; // 获取绑定变量的key
      const data = { key, name, vKey, refType: '监听事件' };
      // dataSource.push(data);
      // if (delKey === vKey) event.eventListenWithDataInjectVariable = ''; // 删除引用关系
      if (isDelete) {
        dataSource.push(data);
        if (delKey === vKey) {
          // 删除引用关系
          event.eventListenWithDataInjectVariable = '';
        }
      } else if (delKey === vKey) {
        dataSource.push(item);
      }
    }
  });
  // 监听变量
  const listenVariable = eventSetings.filter((event) => {
    return event.eventType === 'listenVariable';
  });
  listenVariable.forEach((info) => {
    // 兼容性处理,容易白屏
    info?.variables?.forEach((variable) => {
      if (variable.variableKey != '') {
        const vKey = variable.variableKey; // 获取绑定变量的key
        const data = { key, name, vKey, refType: '监听变量' };
        // dataSource.push(data);
        // if (delKey === vKey) variable.variableKey = ''; // 删除引用关系
        if (isDelete) {
          dataSource.push(data);
          if (delKey === vKey) {
            // 删除引用关系
            variable.variableKey = '';
          }
        } else if (delKey === vKey) {
          dataSource.push(item);
        }
      }
    });
  });
  eventSetings.forEach((event) => {
    const { actions = [] } = event; // actions可能不存在
    if (actions.length === 0) return; // 没有配置二级交互事件直接返回
    actions.forEach((action) => {
      const { actionSettings = {} } = action; // actionSettings可能不存在
      if (action.actionType !== 'gisEventEmit') {
        // 非地图交互事件没有三级事件
        if (action.actionType === 'eventEmit') {
          // 事件发布
          if (actionSettings.variableKey) {
            const vKey = actionSettings.variableKey; // 获取绑定变量的key
            const data = { key, name, vKey, refType: '事件发布' };
            // dataSource.push(data);
            // if (delKey === vKey) actionSettings.variableKey = ''; // 删除引用关系
            if (isDelete) {
              dataSource.push(data);
              if (delKey === vKey) {
                // 删除引用关系
                actionSettings.variableKey = '';
              }
            } else if (delKey === vKey) {
              dataSource.push(item);
            }
          }
        } else if (action.actionType === 'variableSettings') {
          // 变量设置
          if (actionSettings.variable) {
            const vKey = actionSettings.variable; // 获取绑定变量的key
            const data = {
              key,
              name,
              vKey,
              refType: '变量设置',
            };
            // dataSource.push(data);
            // if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
            if (isDelete) {
              dataSource.push(data);
              if (delKey === vKey) {
                // 删除引用关系
                actionSettings.variable = '';
              }
            } else if (delKey === vKey) {
              dataSource.push(item);
            }
          }
        } else if (action.actionType === 'dataQuery') {
          // 数据请求
          if (actionSettings.variable) {
            // 存储结果
            const vKey = actionSettings.variable; // 获取绑定变量的key
            const data = {
              key,
              name,
              vKey,
              refType: '数据请求存储结果',
            };
            // dataSource.push(data);
            // if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
            if (isDelete) {
              dataSource.push(data);
              if (delKey === vKey) {
                // 删除引用关系
                actionSettings.variable = '';
              }
            } else if (delKey === vKey) {
              dataSource.push(item);
            }
          }
          if (Array.isArray(actionSettings.dataMapList) && actionSettings.dataMapList.length > 0) {
            // 数据映射
            actionSettings.dataMapList.forEach((dataMap) => {
              if (dataMap.variable) {
                const vKey = dataMap.variable; // 获取绑定变量的key
                const data = {
                  key,
                  name,
                  vKey,
                  refType: `数据请求数据映射-${dataMap.mapName}`,
                };
                // dataSource.push(data);
                // if (delKey === vKey) dataMap.variable = ''; // 删除引用关系
                if (isDelete) {
                  dataSource.push(data);
                  if (delKey === vKey) {
                    // 删除引用关系
                    dataMap.variable = '';
                  }
                } else if (delKey === vKey) {
                  dataSource.push(item);
                }
              }
            });
          }
          if (Array.isArray(actionSettings.paramList) && actionSettings.paramList.length > 0) {
            actionSettings.paramList.forEach((param) => {
              if (param.isRefer && param.exampleValue) {
                const vKey = param.exampleValue;
                const data = {
                  key,
                  name,
                  vKey,
                  refType: `数据请求参数-${param.name}`,
                };
                dataSource.push(data);
                if (delKey === vKey) param.exampleValue = ''; // 删除引用关系
              }
            });
          }
        }
      } else {
        // 地图交互事件
        const { mapAction } = actionSettings;
        mapAction.forEach((action) => {
          const { actionSettings = {} } = action; // actionSettings可能不存在
          if (action.actionType === 'mapLocationEvent') {
            // 地图定位
            if (actionSettings.variable) {
              // 经度
              const vKey = actionSettings.variable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图定位经度',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.variable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.latVariable) {
              // 纬度
              const vKey = actionSettings.latVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图定位纬度',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.latVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.latVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapZoomEvent') {
            // 地图缩放
            if (actionSettings.variable) {
              const vKey = actionSettings.variable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图缩放',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.variable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapQuery') {
            // 地图查询
            if (actionSettings.variable) {
              // 选择图层
              const vKey = actionSettings.variable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图查询选择图层',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.variable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.variable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.queryApiVariable) {
              // 存储结果
              const vKey = actionSettings.queryApiVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图查询存储结果',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.queryApiVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.queryApiVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapEsQuery') {
            // 地图全局查询
            if (actionSettings.layerCodeVariable) {
              // 图层代码
              const vKey = actionSettings.layerCodeVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图全局查询图层代码',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.layerCodeVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.layerCodeVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.searchKeyVariable) {
              // 关键字
              const vKey = actionSettings.searchKeyVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图全局查询关键字',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.searchKeyVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.searchKeyVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.pageNumVariable) {
              // 页码
              const vKey = actionSettings.pageNumVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图全局查询页码',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.pageNumVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.pageNumVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.pageSizeVariable) {
              // 每页个数
              const vKey = actionSettings.pageSizeVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图全局查询每页个数',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.pageSizeVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.pageSizeVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.queryApiVariable) {
              const vKey = actionSettings.queryApiVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图全局查询',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.queryApiVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.queryApiVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapRenderLayers') {
            // 地图图层渲染
            if (actionSettings.renderLayerVariable) {
              const vKey = actionSettings.renderLayerVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图图层渲染',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.renderLayerVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.renderLayerVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapGetCenter') {
            // 地图获取中心点
            if (actionSettings.centerVariable) {
              const vKey = actionSettings.centerVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图获取中心点',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.centerVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.centerVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapGetZoom') {
            // 地图获取比例尺
            if (actionSettings.zoomVariable) {
              const vKey = actionSettings.zoomVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图获取比例尺',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.zoomVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.zoomVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapSetClick') {
            // 地图触发点击
            if (actionSettings.clickLayerVariable) {
              const vKey = actionSettings.clickLayerVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图触发点击',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.clickLayerVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.clickLayerVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapCircleQuery') {
            // 地图周边查询
            if (actionSettings.circleQueryLayerVariable) {
              // 选择图层
              const vKey = actionSettings.circleQueryLayerVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图周边查询选择图层',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.circleQueryLayerVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.circleQueryLayerVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.circleQueryCenterVariable) {
              // 查询点位
              const vKey = actionSettings.circleQueryCenterVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图周边查询点位',
              };
              // dataSource.push(data);
              // if (delKey === vKey)
              //   actionSettings.circleQueryCenterVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.circleQueryCenterVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.circleQueryRadiusVariable) {
              // 查询半径
              const vKey = actionSettings.circleQueryRadiusVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图周边查询半径',
              };
              // dataSource.push(data);
              // if (delKey === vKey)
              //   actionSettings.circleQueryRadiusVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.circleQueryRadiusVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapTrackPlayback') {
            // 轨迹播放
            if (actionSettings.trackPlayPathVariable) {
              const vKey = actionSettings.trackPlayPathVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图轨迹播放',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.trackPlayPathVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.trackPlayPathVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapRoutePath') {
            // 轨迹飞线
            if (actionSettings.routePathVariable) {
              const vKey = actionSettings.routePathVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图轨迹飞线',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.routePathVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.routePathVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapHeatLine') {
            // 热力线
            if (actionSettings.heatLineVariable) {
              const vKey = actionSettings.heatLineVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图热力线',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.heatLineVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.heatLineVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapSetPoint') {
            // 地图选点
            if (actionSettings.imgSrcVariable) {
              const vKey = actionSettings.imgSrcVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图选点图片',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.imgSrcVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.imgSrcVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.imgSizeVariable) {
              const vKey = actionSettings.imgSizeVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图选点图片缩放比例',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.imgSizeVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.imgSizeVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.addressVariable) {
              const vKey = actionSettings.addressVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图选点选中值',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.addressVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.addressVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapShow') {
            // 地图显隐
            if (actionSettings.mapShowVariable) {
              const vKey = actionSettings.mapShowVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图显隐',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.mapShowVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.mapShowVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapSplitScreen') {
            // 分屏对比
            if (actionSettings.mainVariable) {
              const vKey = actionSettings.mainVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '分屏对比主屏图层',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.mainVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.mainVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.secondVariable) {
              const vKey = actionSettings.secondVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '分屏对比次屏图层',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.secondVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.secondVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapSwipCompare') {
            // 卷帘对比
            if (actionSettings.leftLayerVariable) {
              const vKey = actionSettings.leftLayerVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '卷帘对比左侧图层',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.leftLayerVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.leftLayerVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.rightLayerVariable) {
              const vKey = actionSettings.rightLayerVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '卷帘对比右侧图层',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.rightLayerVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.rightLayerVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapParticleEffects') {
            // 粒子特效
            if (actionSettings.positionVariable) {
              const vKey = actionSettings.positionVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '粒子特效',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.positionVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.positionVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapDynamicWater') {
            // 水位升降
            if (actionSettings.waterVariable) {
              const vKey = actionSettings.waterVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '水位升降区域数据',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.waterVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.waterVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.heightVariable) {
              const vKey = actionSettings.heightVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '水位升降水位高度',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.heightVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.heightVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          } else if (action.actionType === 'mapDrawLine') {
            // 绘制线
            if (actionSettings.borderColorVariable) {
              const vKey = actionSettings.borderColorVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图绘制线边框颜色',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.borderColorVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.borderColorVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
            if (actionSettings.borderWidthVariable) {
              const vKey = actionSettings.borderWidthVariable; // 获取绑定变量的key
              const data = {
                key,
                name,
                vKey,
                refType: '地图绘制线边框宽度',
              };
              // dataSource.push(data);
              // if (delKey === vKey) actionSettings.borderWidthVariable = ''; // 删除引用关系
              if (isDelete) {
                dataSource.push(data);
                if (delKey === vKey) {
                  // 删除引用关系
                  actionSettings.borderWidthVariable = '';
                }
              } else if (delKey === vKey) {
                dataSource.push(item);
              }
            }
          }
          // v8.6.0添加通用参数
          const currentAction = gisEventType.find((um) => um.value === action.actionType); // 获取当前交互的名称配置
          const dataParams = actionSettings.dataParams || [];
          if (dataParams.length > 0) {
            dataParams.forEach((dataParam) => {
              if (dataParam.updateType === 3 && dataParam.variableKey) {
                const vKey = dataParam.variableKey; // 获取绑定变量的key
                const data = { pageName, key, name, vKey, refType: `${currentAction.name}-${dataParam.paramName}` };
                if (isDelete) {
                  dataSource.push(data);
                  if (delKey === vKey) {
                    // 删除引用关系
                    dataParams.variableKey = '';
                  }
                } else if (delKey === vKey) {
                  dataSource.push(item);
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
                if (isDelete) {
                  dataSource.push(data);
                  if (delKey === vKey) {
                    // 删除引用关系
                    dataParams.variableKey = '';
                  }
                } else if (delKey === vKey) {
                  dataSource.push(item);
                }
              }
            });
          }
        });
      }
    });
  });
};

const getVariableRefer = (list, selector) => {
  // let dataSource = [];
  const compList = [];
  const loop = (list) => {
    list.forEach((item) => {
      if (item.classType === 'group') {
        setDataSource(item, compList, selector, false);
        loop(item.childComList);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        setDataSource(item, compList, selector, false);
        item.children.forEach((child) => {
          loop(child.AntdChildComponents);
        });
      } else {
        setDataSource(item, compList, selector, false);
      }
    });
  };
  loop(list);
  // console.table(dataSource);
  return compList;
};

const getComList = (selector, list = []) => {
  if (!selector || typeof selector !== 'string') return [];
  const array = [];
  const events = new Set(eventType.map((v) => v.value));
  const actions = new Set(actionType.map((v) => v.value));
  if (!Array.isArray(list)) {
    list = slice.call(list);
  }
  const deep = (list) => {
    if (typeof selector === 'string') {
      list.forEach((comp) => {
        // 传入的是事件key
        if (events.has(selector)) {
          if (comp.eventSetings && comp.eventSetings.length > 0) {
            comp.eventSetings.forEach((com) => {
              if (com.eventType === selector) {
                array.push(comp);
              }
            });
          }
        } else if (actions.has(selector) && comp.eventSetings && comp.eventSetings.length > 0) {
          // 传入的是动作名称
          comp.eventSetings.forEach((event) => {
            if (event.actions && event.actions.length > 0) {
              event.actions.forEach((action) => {
                if (action.actionType === selector) {
                  array.push(comp);
                }
              });
            }
          });
        } else if (comp.key === selector) {
          // 传入的是组件key
          array.push(comp);
        }

        if (comp.classType === 'group' || comp?.childComList) {
          deep(comp.childComList);
        }
        if (comp.type === 'DynamicPanel' || comp.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          comp.children.forEach((child) => {
            deep(child.AntdChildComponents);
          });
        }
      });
    } else {
      // 没传参
      array.push(...list);
    }
  };

  if (selector.startsWith('store_group')) {
    const compList = getVariableRefer(list, selector);
    array.push(...compList);
  } else {
    deep(list);
  }

  const hash = {};
  const newArray = array.reduce((item, next) => {
    !hash[next.key] && (hash[next.key] = true && item.push(next));
    return item;
  }, []);
  // console.log('newArray', newArray);
  return newArray;
};

const DataI = (selector) => {
  return new DataI.fn.init(selector);
};

DataI.prototype = {
  constructor: DataI,

  length: 0,

  init(selector) {
    if (!selector) {
      return this;
    }
    push.apply(this, DataI.getComList(selector));
    return this;
  },
  each(callback) {
    return DataI.each(this, callback);
  },
  map(callback) {
    return DataI.map(this, callback);
  },
  toArray() {
    return slice.call(this);
  },
  get(index) {
    return index === undefined ? this.toArray() : index < 0 ? this[this.length + index] : this[index];
  },
  pushStack(elems) {
    const ret = DataI.merge(this.constructor(), elems);
    ret.prevObject = this;
    return ret;
  },
  // 查找组件 事件名称、动作名称、组件key
  find(selector) {
    const ret = this.pushStack([]);
    push.apply(ret, getComList(selector, this));
    return ret;
  },
};

DataI.fn = DataI.prototype;

DataI.fn.init.prototype = DataI.fn;

DataI.isArrayLike = (array) => {
  const length = array && array.length > 0;

  return typeof length === 'number' && length >= 0;
};

DataI.isConfigPage = () => {
  let isConfigPage = false;
  if (window.componentList) {
    isConfigPage = true;
  }
  if (window.layerList) {
    isConfigPage = false;
  }
  return isConfigPage;
};

// DataI.each = (array, callback) => {
//   var i, k;
//   if (DataI.isArrayLike(array)) {
//     // 使用 for 循环
//     for (i = 0; i < array.length; i++) {
//       if (callback.call(array[i], i, array[i]) === false) break;
//     }
//   } else {
//     // 使用 for-in 循环
//     for (k in array) {
//       if (callback.call(array[i], k, array[k]) === false) break;
//     }
//   }
//   return array;
// };

DataI.map = (array, callback) => {
  let i;
  let k;
  const res = [];
  let tmp;
  if (DataI.isArrayLike(array)) {
    // 使用 for 循环
    for (i = 0; i < array.length; i++) {
      tmp = callback(array[i], i);
      if (tmp !== undefined) {
        res.push(tmp);
      }
    }
  } else {
    // 使用 for-in 循环
    for (k in array) {
      tmp = callback(array[k], k);
      if (tmp !== undefined) {
        res.push(tmp);
      }
    }
  }
  return res;
};

DataI.merge = (first, second) => {
  const len = +second.length;
  let j = 0;
  let i = first.length;

  for (; j < len; j++) {
    first[i++] = second[j];
  }

  first.length = i;

  return first;
};

// 根据组件key查找DOM
DataI.select = (compKey) => {
  const compatible = (key) => {
    let selector = `[data-key="${key}"]`;
    if ($(selector).length > 0) {
      return selector;
    }
    selector = `[data-key="@com_${key}"]`;
    if ($(selector).length > 0) {
      return selector;
    }
    return selector;
  };
  const selector = compatible(compKey);
  const el = $(selector);
  return el;
};

// 根据组件key、 事件名称、 动作名字查找组件
DataI.getComList = (selector, list) => {
  if (DataI.isConfigPage()) {
    !list && (list = window.componentList);
    // return getComList(window.componentList, selector);
  } else {
    !list && (list = window.layerList);
    // return getComList(layerList, selector);
  }
  return getComList(selector, list);
};

/**
 * 组件列表扁平化
 * @param {组件列表} componentList
 * @returns 扁平化的一维列表
 */
DataI.flatten = (componentList) => {
  const ret = [];

  const loop = (list) => {
    list.forEach((item) => {
      if (item.createFlag != false) {
        if (item.classType === 'group') {
          loop(item.childComList);
        } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          item.children.forEach((child) => {
            loop(child.AntdChildComponents);
          });
        } else {
          ret.push(item);
        }
      }
    });
  };

  loop(componentList);

  return ret;
};

/**
 * 递归遍历组件列表中每个组件
 * @param {any[]} array
 * @param {(item: any)=> void} callback (com,parent,index)
 */
DataI.each = (array, callback) => {
  const loop = (list, cb) => {
    list.forEach((item) => {
      cb(item);
      if (item.classType === 'group' || item.isDragContainer) {
        loop(item.childComList, cb);
      } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
        // v8.17 新增折叠面板
        item.children.forEach((child) => {
          loop(child.AntdChildComponents, cb);
        });
      }
    });
  };
  loop(array, callback);
};
// 存放预览态一些全局状态
DataI.previewGlobalState = {};
// 页面信息映射
DataI.PAGEINFOMAP = {};
// 设置组件映射
DataI.setPageInfoMap = (pageId, obj) => {
  DataI.PAGEINFOMAP[pageId] = obj;
};
// 组件映射 key:{component,parent,index}
DataI.COMINFOMAP = {};
// 设置组件映射
DataI.setComInfoMap = (info) => {
  DataI.COMINFOMAP[info.key] = info;
};
// 增加组件映射
DataI.addComKeyMap = (info) => {
  // 递归增加所有相关的key
  let coms = info;
  if (!Array.isArray(info)) {
    coms = [info];
  }
  DataI.each(coms, (com) => {
    DataI.setComInfoMap(com);
  });
};
// 删除组件映射
DataI.removeComKeyMap = (info) => {
  // 递归删除所有相关的key
  let coms = info;
  if (!Array.isArray(info)) {
    coms = [info];
  }
  DataI.each(coms, (com) => {
    if (DataI.COMINFOMAP[com.key]) {
      delete DataI.COMINFOMAP[com.key];
    }
  });
};

// 删除组件映射
DataI.removeCom = (com) => {
  // 删除相关的key
  if (DataI.COMINFOMAP[com.key]) {
    delete DataI.COMINFOMAP[com.key];
  }
};

// 通过key获取组件
DataI.getComponentByKey = (key) => {
  if (!key) return console.error('getComponentByKey方法需要传入参数key');
  const componentInfo = DataI.COMINFOMAP[key];
  if (!componentInfo) return console.error('获取组件信息失败!');
  return componentInfo;
};

/**
 * 通过组件key获取到url访问地址、在hook中调用DataI.getGroupComponentUrl获取url地址
 * 调用ue api展示组件弹窗功能
 * @param {组的key} key
 * @returns 卡片地址
 */

DataI.getGroupComponentUrl = async (key) => {
  const dynSrcIdVec = [];
  const groupComp = DataI.getComponentByKey(key);
  if (groupComp.englishName !== 'GroupBasic') {
    message.error('只能添加组作为标牌进行传递');
    return;
  }
  const keys = [key];
  window.DataI.each([groupComp], (i) => {
    if (i.dataset?.category === 'dynamic') dynSrcIdVec.push(i.dataset?.dynamic?.source?.id ?? null);
    if (i?.preAttr?._config?._source === 'dynamic') dynSrcIdVec.push(i?.preAttr?._config?.dynamic?.source?.id ?? null);
    if (i.dataset?.category === 'indicator') dynSrcIdVec.push(i.dataset?.indicator?.source?.id ?? null);
    if (i?.preAttr?._config?._source === 'indicator')
      dynSrcIdVec.push(i?.preAttr?._config?.indicator?.source?.id ?? null);
    return null;
  });
  const dynamicApis = dynSrcIdVec
    .map((id) => {
      const { dynamicApis: dynApis = [] } = screenConfig || {};
      const dynApi = dynApis.find((api) => api.id === id);
      return dynApi;
    })
    .filter((api) => isPlainObject(api));

  const comListStr = getCompListJSONSettings(keys);
  const cardDataStore = filterDataStore(window.dataStore, comListStr);
  const pureJson = {
    componentList: JSON.parse(comListStr),
    dataStore: cardDataStore,
    relatedApis: filterRelatedApi(JSON.parse(comListStr)),
    screenConfig: {
      baseUrl: screenConfig.baseUrl,
      environment: screenConfig.environment,
      favicon: screenConfig.favicon,
      dynamicApis,
      width: groupComp.initSize.width,
      height: groupComp.initSize.height,
      isCardShare: true,
    },
  };

  const datas = {
    componentKey: key,
    jsonConfig: JSON.stringify(pureJson), // 转义后倒序（防止防火墙拦截）
    jsonPureConfig: '11',
    // remarkVarInfo: JSON.stringify([]),
  };

  const data = await SAVEUECARD(datas);
  let ueUrl = '';
  if (Number(data.code) === 200) {
    ueUrl = window.location.origin + data.data.shareUrl;
  } else {
    message.error(data.message);
  }
  return ueUrl;
};

// 销毁储存的数据
DataI.destroy = () => {
  DataI.previewGlobalState = {};
  DataI.PAGEINFOMAP = {};
  DataI.COMINFOMAP = {};
};

DataI.eventType = eventType;
DataI.actionType = actionType;

DataI.extend = DataI.fn.extend = function (obj) {
  for (const k in obj) {
    this[k] = obj[k];
  }
};

window.DataI = DataI;
export default DataI;
