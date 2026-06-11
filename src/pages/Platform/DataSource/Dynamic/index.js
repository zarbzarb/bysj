import React, { useState } from 'react';
import { Select, Row, Col, Checkbox, InputNumber, message, Tooltip, Switch } from 'antd';
import { useMount } from 'ahooks';
import add from '@/assets/newIcon/add.png';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styles from '@/pages/Platform/Attribute/AntdAttr.less';
import { TriggerRequest } from '@/TriggerAction/DataQueray';
import { addApiRelated } from '@/services/apis/dataManage';
import { cloneDeep, isPlainObject } from 'lodash';
import { useStore } from '@/hooks';
import DynamicApi from './components/dynamicApi';

const { Option } = Select;

// const { dynamicApiStore: DynamicApiStore } = Store;

const newData = {}; // 缓存每一个组件的动态数据

// 支持“系列动态生成”的组件列表
const customComps = new Set([
  'ChartLineBasic',
  'ChartColumnBasic',
  'ChartColumnStack',
  'ChartMixedLineBar',
  'ChartBarBasic',
  'ChartBarStack',
  'ChartLineDoubleYaxis', // 双轴折线图
  'ChartLineMoreYaxis', // 多轴折线图
  'ChartBarGroup', // 分组条形图
  'ChartColumnCapsule', // 胶囊柱状图
  'ChartColumnVerticalGroup', // 垂直分组柱状图
  'ChartColumnLargeareaHistogram', // 大面积柱状图
  'ChartColumnContrastHistogram', // 单色对比柱状图
  'ChartBarCapsule', // 胶囊条形图
  'ChartBarStackTwoWay', // 双向条形图
  'ChartLine24h', // 24小时折线图

  // 'ChartAreaBroken', // 区域折线图， 写法跟前面的完全不一样，没有ychart，数据格式也不一样，暂时不实现
  // 'ChartBarDoubleYCapsule', // 双Y轴条形图，只有一个系列，不实现动态系列功能
]);

const Dynamic = (props) => {
  const {
    versionStore: { apiVersion },
    globalStore: { bigScreenId, bigScreenType },
  } = useStore();
  const {
    config: { dynamic = { id: '', source: { id: '' } } },
    updateDynamicData,
    dataset,
    firstDynamic,
    isDynamic,
    elKey,
    englishName,
    compInstance,
  } = props;

  const [modalVisible, setModalVisible] = useState(false); // 是否打开弹窗

  useMount(() => {
    // TODO 8.0 dynamicApis
    const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
    const currentApi = dynamicApis.find((api) => api.id === dynamic.source.id);
    if (!currentApi) {
      updateDynamicData([], { ...dynamic }, 'dynamic', true);
      return;
    }

    TriggerRequest(
      {
        apiInfo: currentApi.apiInfo,
        headers: currentApi.headers,
        contentType: currentApi.contentType, // v7-10-0 添加参数contentType
        paramList: dynamic.source.params, // 使用组件自己配置过的参数
        newData: newData[elKey] ? newData[elKey] : null,
        firstDynamic,
        isDynamic,
      },
      (data) => {
        if (data?.code === '403') {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}接口已被禁用`);
          }
          return;
        }

        if (!Array.isArray(data)) {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}接口数据不符合规范!`);
          }
          return;
        }

        newData[elKey] = JSON.parse(JSON.stringify(data));

        updateDynamicData(data, { ...dynamic }, 'dynamic', true);
      },
    );
  });

  const changeHandler = (val) => {
    const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
    const currentApi = dynamicApis.find((api) => api.id === val);
    if (!currentApi || !currentApi?.apiInfo) {
      message.warning('接口数据不符合规范!');
      return;
    }
    TriggerRequest(
      {
        apiInfo: currentApi.apiInfo,
        headers: currentApi.headers,
        contentType: currentApi.contentType, // v7-10-0 添加参数contentType
        paramList: currentApi.params, // 切换选择接口时使用接口的默认参数
      },
      (data) => {
        if (!Array.isArray(data)) {
          if (window.DataI.isConfigPage()) {
            message.warning(`${currentApi.interfaceName}接口数据不符合规范!`);
          }
          return;
        }
        const setting = {
          ...dynamic,
          source: {
            ...dynamic.source,
            id: val,
            params: currentApi.params,
          },
          dimensionMap: dynamic.dimensionMap.map((dims) => {
            dims.row = [];
            return dims;
          }),
        };
        updateDynamicData(data, setting);
      },
    );
    // v8.6.0 动态 接口选择自动添加关联关系
    addApiRelated({
      interfaceCode: currentApi.apiInfo.interfaceCode, // 换成不变的code
      // pageId: pageId, // 保存引用关系都用不变的id
      pageId: bigScreenType === 'card' ? window.screenConfig.pageId : bigScreenId, // 卡片用的短id存的接口引用关系
      apiId: currentApi.apiInfo.id, // 通过id保存引用关系兼容项目现场没有升级大屏
      ver: apiVersion,
    })
      .then(({ success, data, message: msg }) => {
        // if (!success) return;
        // message.success('关联成功');
        // getRApiList();
      })
      .catch((error) => error);
  };

  // TODO 8.0 dynamicApis
  const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
  const currentApi = dynamicApis.find((api) => api.id === dynamic.source.id);
  let apis = cloneDeep(dynamicApis);
  if (currentApi) {
    apis.unshift(currentApi);
  }
  // 去重
  const res = new Map();
  apis = apis.filter((item) => {
    const apiCode = item?.apiInfo?.interfaceCode || item?.interfaceCode;
    let apiItem = null;
    if (!res.has(apiCode)) {
      apiItem = res.set(apiCode, 1);
    }
    return apiItem;
  });
  apis = apis.filter((v) => !v.isIndicator).splice(0, 6);

  console.log(dynamic.source);

  return (
    <>
      <Row className={styles.field} style={{ marginBottom: '12px' }} align='middle'>
        <Col
          flex='auto'
          className={styles.fieldLabel}
          style={{ lineHeight: '24px', fontSize: '12px', paddingLeft: '12px' }}
        >
          接口
        </Col>
        <Col
          flex='234px'
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: '16px',
          }}
          className={`${styles.fieldInput} ${styles.antdFieldInput}`}
        >
          <Select
            style={{ width: '100%' }}
            placeholder='请选择接口'
            value={dynamic.source.id}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            onChange={(val) => {
              changeHandler(val);
            }}
          >
            {apis?.map((item) => {
              return (
                <Option key={item.id} value={item.id}>
                  {item.interfaceName}
                </Option>
              );
            })}
          </Select>

          <a
            style={{ marginLeft: '5px' }}
            onClick={() => {
              setModalVisible(true);
            }}
          >
            <img src={add} alt='' />
          </a>
        </Col>
      </Row>
      <Row className={styles.field} style={{ marginBottom: '12px' }} align='middle'>
        <Col
          flex='auto'
          className={styles.fieldLabel}
          style={{ lineHeight: '24px', fontSize: '12px', paddingLeft: '12px' }}
        >
          自动刷新
        </Col>
        <Col
          flex='234px'
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: '16px',
          }}
          className={`${styles.fieldInput} ${styles.antdFieldInput}`}
        >
          <Checkbox
            checked={dynamic.source.repeat.on}
            onChange={(evt) => {
              const { checked } = evt.target;
              const setting = {
                ...dynamic,
                source: {
                  ...dynamic.source,
                  repeat: {
                    ...dynamic.source.repeat,
                    on: checked,
                  },
                },
                data: dataset, // 用于阻止组件的hooks发起请求
              };
              updateDynamicData(dataset, setting);
            }}
            className={styles.fieldLabel}
            style={{
              color: 'rgba(191,191,191,0.65)',
              lineHeight: '24px',
              fontSize: '12px',
              paddingLeft: 0,
            }}
          >
            自动刷新请求
          </Checkbox>
          <InputNumber
            style={{ width: '60px' }}
            min={5}
            value={dynamic.source.repeat.intervalTime}
            onChange={(val) => {
              if (!val) {
                val = 5;
              }
              const setting = {
                ...dynamic,
                source: {
                  ...dynamic.source,
                  repeat: {
                    ...dynamic.source.repeat,
                    intervalTime: val,
                  },
                },
                data: dataset, // 用于阻止组件的hooks发起请求
              };
              updateDynamicData(dataset, setting);
            }}
          />
          <span style={{ fontSize: '12px', paddingLeft: '5px' }}>秒/次</span>
        </Col>
      </Row>

      {customComps.has(englishName) && (
        <Row className={styles.field} style={{ marginBottom: '12px' }} align='middle'>
          <Col
            flex='auto'
            className={styles.fieldLabel}
            style={{
              lineHeight: '24px',
              fontSize: '12px',
              paddingLeft: '12px',
            }}
          >
            <span style={{ marginRight: 4 }}>系列动态生成</span>
            <Tooltip
              placement='top'
              title={
                <div>
                  关闭开关时下方的数据映射会根据属性中数据系列下的系列自动生成映射项；
                  <br />
                  开启时下方固定三个映射项，系列属性需要绑定的数据中需要包含数据系列下每个系列的系列值，样式根据属性中的系列值和数据中的系列映射相匹配。
                </div>
              }
            >
              <QuestionCircleOutlined style={{ fontSize: 14, color: '#3fb5d2' }} />
            </Tooltip>
          </Col>
          <Col
            flex='214px'
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingRight: '16px',
            }}
            className={`${styles.fieldInput} ${styles.antdFieldInput}`}
          >
            <Switch
              size='small'
              checked={dynamic.seriesType === 2}
              onChange={(checked) => {
                const setting = {
                  ...dynamic,
                  seriesType: checked ? 2 : 1,
                  data: dataset, // 用于阻止组件的hooks发起请求
                };
                if (!setting.dataMap2) {
                  // 【兼容历史】以前配置了“指标数据”的组件，可能没有这两个字段，需要加上
                  setting.dataMap2 = dataMap2Config;
                  setting.dimensionMap2 = dimensionMap2Config;
                }
                updateDynamicData(dataset, setting);

                // 将组件的数据系列都改成“自动获取”
                if (compInstance.compAttr.series) {
                  compInstance.updateAttr({
                    ...compInstance.compAttr,
                    series: compInstance.compAttr.series.map((v) => ({
                      ...v,
                      autoSeries: !!checked,
                    })),
                  });
                }
              }}
            />
          </Col>
        </Row>
      )}

      {modalVisible && (
        <DynamicApi
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          dynamic={dynamic}
          updateDynamicData={updateDynamicData}
        />
      )}
    </>
  );
};

export default Dynamic;
