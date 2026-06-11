import React, { useState, useEffect } from 'react';
import { Table, Select, Button } from 'antd';
import { inject, observer } from 'mobx-react';
import Text from 'antd/lib/typography/Text';
import { useStore } from '@/hooks';

const { Option } = Select;

const InitRelated = (props) => {
  const {
    editorStore: { getCompList },
  } = useStore();

  const componentList = getCompList();

  const [dataSource, setDataSource] = useState([]); // 初始化事件列表
  const [actionTypeList, setActionTypeList] = useState([]); // 初始化事件类型列表
  const [selectedActionType, setSelectedActionType] = useState(); // 选中的事件类型

  const columns = [
    {
      title: '序号',
      render: (text, record, index) => `${index + 1}`,
    },
    {
      title: '组件名称',
      dataIndex: 'name',
    },
    {
      title: '事件操作',
      key: 'eventType',
      render: () => '组件初始化',
    },
    {
      title: '互动类型',
      dataIndex: 'actionType',
      render: (text) => getActionTypeName(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record, index) => {
        return (
          <Text copyable={{ text: record.key }} style={{ color: '#3fb5d2' }}>
            复制组件key
          </Text>
        );
      },
    },
  ];

  const getActionTypeName = (actionType) => {
    let ret = '-';
    switch (actionType) {
      case 'dataQuery': {
        ret = '数据请求';
        break;
      }
      case 'animateIn': {
        ret = '动画进入';
        break;
      }
      case 'animateOut': {
        ret = '动画退出';
        break;
      }
      case 'animateLoop': {
        ret = '动画循环';
        break;
      }
      case 'animateSettings': {
        ret = '动画设置';
        break;
      }
      case 'variableSettings': {
        ret = '变量设置';
        break;
      }
      case 'visiableToggle': {
        ret = '显示隐藏';
        break;
      }
      case 'eventEmit': {
        ret = '事件发布';
        break;
      }
      case 'sceneInteraction': {
        ret = '场景互动';
        break;
      }
      case 'videoInteraction': {
        ret = '视频操作';
        break;
      }
      case 'fullScreen': {
        ret = '全屏显示';
        break;
      }
      case 'jumpPage': {
        ret = '跳转页面';
        break;
      }
      case 'refreshDataSource': {
        ret = '刷新数据源';
        break;
      }
      // 地图互动的事件
      case 'mapLocationEvent': {
        ret = '地图定位';
        break;
      }
      case 'mapZoomEvent': {
        ret = '地图缩放';
        break;
      }
      case 'mapCutEvent': {
        ret = '地图切换底图';
        break;
      }
      case 'mapQuery': {
        ret = '地图查询';
        break;
      }
      case 'mapEsQuery': {
        ret = '地图全局查询';
        break;
      }
      case 'mapRenderLayers': {
        ret = '地图图层渲染';
        break;
      }
      case 'mapGetCenter': {
        ret = '地图获取中心点位';
        break;
      }
      case 'mapGetZoom': {
        ret = '地图获取比例尺';
        break;
      }
      case 'mapSetClick': {
        ret = '地图触发点击';
        break;
      }
      case 'mapCircleQuery': {
        ret = '地图周边查询';
        break;
      }
      case 'mapTrackPlayback': {
        ret = '地图轨迹播放';
        break;
      }
      case 'mapRoutePath': {
        ret = '地图轨迹飞线';
        break;
      }
      case 'mapHeatLine': {
        ret = '地图热力线渲染';
        break;
      }
      case 'mapSetPoint': {
        ret = '地图选点';
        break;
      }
      case 'mapShow': {
        ret = '地图图层显隐';
        break;
      }
      case 'mapSplitScreen': {
        ret = '地图分屏对比';
        break;
      }
      case 'mapSwipCompare': {
        ret = '地图卷帘对比';
        break;
      }
      case 'mapParticleEffects': {
        ret = '地图粒子特效';
        break;
      }
      case 'mapDynamicWater': {
        ret = '地图水位升降';
        break;
      }
      case 'mapDrawLine': {
        ret = '绘制线';
        break;
      }
      case 'mapAnimationPoint': {
        ret = '雷达波';
        break;
      }
      case 'mapDataSplitRender': {
        ret = '图层数据设置';
        break;
      }
      case 'MapLookAt': {
        ret = '绕点旋转';
        break;
      }
    }
    return ret;
  };

  const getDataFun = (item, dataSource) => {
    const { key } = item; // 为了定位组件获取组件的key
    const name = item.name || item.compName; // antd组件初始用的compName
    // 交互配置
    const { eventSetings = [] } = item; // eventSetings可能不存在
    if (eventSetings.length === 0) return; // 没有配置一级交互事件直接返回
    // 初始化
    const initialization = eventSetings.filter((event) => {
      return event.eventType == 'initialization';
    });
    initialization.forEach((event) => {
      const { actions = [] } = event; // actions可能不存在
      if (actions.length === 0) return; // 没有配置二级交互事件直接返回
      actions.forEach((action) => {
        const { actionSettings = {} } = action; // actionSettings可能不存在
        if (Object.keys(actionSettings).length === 0) return;
        if (action.actionType === 'gisEventEmit') {
          // 地图交互事件
          const { mapAction } = actionSettings;
          mapAction.forEach((action) => {
            const { actionSettings = {} } = action; // actionSettings可能不存在
            if (Object.keys(actionSettings).length === 0) return;
            const { actionType } = action;
            const data = { key, name, actionType };
            dataSource.push(data);
          });
        } else {
          const { actionType } = action;
          const data = { key, name, actionType };
          dataSource.push(data);
        }
      });
    });
  };

  const getDataSource = () => {
    const dataSource = [];
    const loop = (componentList) => {
      componentList.forEach((item) => {
        if (item.classType === 'group') {
          getDataFun(item, dataSource);
          loop(item.childComList);
        } else if (item.type === 'DynamicPanel' || item.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          getDataFun(item, dataSource);
          item.children.forEach((child) => {
            loop(child.AntdChildComponents);
          });
        } else {
          getDataFun(item, dataSource);
        }
      });
    };

    loop(componentList);
    return dataSource;
  };

  const dataOrigin = getDataSource(); // 原始的数据源不能动,用来过滤数据

  useEffect(() => {
    const actionTypeList = [];
    dataOrigin.forEach((item) => {
      const { actionType } = item;
      if (!actionTypeList.includes(actionType)) {
        actionTypeList.push(actionType);
      }
    });
    setDataSource(dataOrigin);
    setActionTypeList(actionTypeList);
  }, []);

  const changeActionType = (value) => {
    setSelectedActionType(value);
  };

  const onSearch = () => {
    let dataSource = [];
    if (selectedActionType) {
      dataSource = dataOrigin.filter((item) => item.actionType === selectedActionType);
    } else {
      dataSource = dataOrigin; // 清除选择不过滤
    }
    setDataSource(dataSource);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 8 }}>
        <Select
          allowClear
          style={{ width: 120 }}
          placeholder='全部类型'
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          onChange={changeActionType}
        >
          {actionTypeList.map((actionType) => (
            <Option value={actionType}>{getActionTypeName(actionType)}</Option>
          ))}
        </Select>
        <Button type='primary' style={{ marginLeft: 16 }} onClick={onSearch}>
          查询
        </Button>
      </div>
      <Table style={{ width: '100%' }} columns={columns} dataSource={dataSource} rowKey='id' />
    </div>
  );
};

export default observer(InitRelated);
