import React, { useState, useMemo } from 'react';
import { Row, Col, Tooltip, Switch, Input } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { cloneDeep } from 'lodash';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Line } from '@yl/datai-ui';
import CompatibleTool from '../Compatible';
import { XYSDataToNormal, normalDataToXYS, getDataFields } from '../utils';
import DataMapList from '../DataMapList';
import styles from '../index.less';

// 不支持“系列动态生成”的组件
const excludedComponents = new Set([
  'ChartLineSector', // 分段折线图
  'ChartAreaBroken', // 区域折线图（写法跟其他的完全不一样，没有ychart，数据格式也不一样，暂时不实现）
  'ChartBarStackTwoWay', // 双向条形图
  'ChartColumnDot', // 圆圈柱状图
  'ChartBarAreaMap', // 条形面积图
  'ChartRankingList', // 排行榜
  'ChartColumnRainbow', // 彩虹柱状图
  'ChartColumnCylinder', // 3D 柱状图
  'ChartTreemap', // 矩形树图
]);

// 数据与属性的映射关系配置（静态数据源和变量）
const MapFieldForDefault = (props) => {
  // console.log({ props });
  const { config, category, defaultValue, changeValue, CompInstance, englishName, el } = props;
  const isXYSChart = CompInstance && CompatibleTool.isXYSChart(config);
  const supportAutoSeries = isXYSChart && !excludedComponents.has(englishName); // 组件是否支持“系列动态生成”
  let parentField = config._seriesType === 1 ? '_dataMap' : '_api';
  if (category === 'variableRef' && config.variableDataMap) {
    parentField = 'variableDataMap';
  }

  const [modalVisible, setModalVisible] = useState(false); // 是否打开“数据映射选择弹窗”
  const [currentIndex, setCurrentIndex] = useState(0); // 当前正在操作的项目的 index

  // 检查字段是否匹配时，是否只取第一行的字段，否则取所有数据行不重复的字段
  const onlyFirstRowFields = useMemo(() => {
    const checkAll = config._seriesType === 1 || el?.type === 'List' || el?.type === 'Table';
    return !checkAll;
  }, [config._seriesType, el?.type]);

  // 不允许选择数据行，只能选择数据列
  const disabledRowSelection = useMemo(() => {
    return (
      (isXYSChart && config._seriesType === 2) ||
      el?.type === 'LayerSelect' ||
      el?.type === 'List' ||
      englishName === 'ChartRadar' ||
      englishName === 'ChartPolar'
    );
  }, [isXYSChart, config._seriesType, el?.type, englishName]);

  // 数据中的字段
  const dataFields = useMemo(() => {
    return getDataFields(defaultValue, onlyFirstRowFields);
  }, [defaultValue, onlyFirstRowFields]);

  // 处理映射类型改变
  const handleMapTypeChange = useMemoizedFn((checked) => {
    // 数据映射类型，1 表示“x轴、系列1、系列2 ... 系列n”，2 表示“x轴、系列和值”
    const type = checked ? 2 : 1;
    changeValue(type, '_seriesType');

    // 自动转换数据格式
    const { _api, _dataMap } = config;
    const xysMap = _api.reduce((res, item) => {
      res[item.field] = item.mapField;
      return res;
    }, {});
    const data =
      type === 1
        ? XYSDataToNormal(defaultValue, _dataMap[0].mapField, xysMap)
        : normalDataToXYS(defaultValue, _dataMap[0].mapField, xysMap);
    changeValue(data, '_data');
  });

  // 处理映射字段改变
  const handleMapFieldChange = useMemoizedFn((value, field, index) => {
    // 表格组件，自动更新"列配置"中的"字段"
    if (el?.type === 'Table') {
      const columns = [...el.props.columns];
      columns[index].dataIndex = value;
      el.props.columns = columns;
    }

    // 多行列表组件，自动更新"列配置"中的"字段"
    if (el?.type === 'List') {
      const columns = [...el.props.columns];
      columns[index].code = value;
      el.props.columns = columns;
    }

    const dataMap = cloneDeep(config[parentField]);
    dataMap[index][field] = value;
    changeValue(dataMap, parentField);
  });

  // 通过“数据映射选择弹窗”选择了映射字段
  const handleConfirm = useMemoizedFn(({ col, row }) => {
    // console.log({ col }, { row });

    // xys类型图表，自动更新"系列配置"中的"系列值"
    if (isXYSChart && config._seriesType === 1 && currentIndex > 0) {
      const series = [...CompInstance.compAttr.series];
      series[currentIndex - 1].serieName = col;
      CompInstance.compAttr = { ...CompInstance.compAttr, series };
    }

    // 多行列表组件，自动更新"列配置"中的"字段"
    if (el?.type === 'List') {
      const columns = [...el.props.columns];
      columns[currentIndex].code = col;
      el.props.columns = columns;
    }

    // 表格组件，自动更新"列配置"中的"字段"
    if (el?.type === 'Table') {
      const columns = [...el.props.columns];
      columns[currentIndex].dataIndex = col;
      el.props.columns = columns;
    }

    // 解决 _mockData 不存在问题
    if (CompInstance && !CompInstance.config._mockData) {
      changeValue(defaultValue, '_data');
    }

    const dataMap = cloneDeep(config[parentField]);
    dataMap[currentIndex].mapField = col;
    dataMap[currentIndex].row = row;
    changeValue(dataMap, parentField);

    setModalVisible(false);
  });

  return (
    <>
      <Line className='marginBottom8 marginTop4' />

      {category === 'json' && supportAutoSeries && (
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
            <Switch size='small' checked={config._seriesType === 2} onChange={handleMapTypeChange} />
          </Col>
        </Row>
      )}

      {category === 'json' && config[parentField]?.[0]?.row && englishName !== 'ChartNestRing' ? (
        <>
          <div className={styles.mapField}>
            <div className={styles.title}>属性名称|映射</div>
            {config[parentField].map((item, index) => {
              // v8.14 属性名称对应
              console.log('config', config);
              console.log('parentField', parentField);
              console.log('config[parentField]', config[parentField]);
              console.log('item', item);
              const status = dataFields.includes(item.mapField);
              return (
                <Row key={item.field} className={styles.row} align='middle' justify='center'>
                  <Col className={styles.col} span={6}>
                    <span className={styles.fieldName} title={item.name || item.field}>
                      {item.name || item.field}
                    </span>
                  </Col>
                  <Col className={styles.col} span={10}>
                    <div
                      className={styles.field}
                      onClick={() => {
                        setCurrentIndex(index);
                        setModalVisible(true);
                      }}
                    >
                      {item.mapField}
                    </div>
                  </Col>
                  <Col className={styles.col} span={8}>
                    <span className={`${styles.status} ${status ? styles.success : styles.failed}`} />
                    <span>{status ? '匹配成功' : '匹配失败'}</span>
                  </Col>
                </Row>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className={styles.mapField}>
            <div className={styles.title}>属性名称|映射</div>
            {config[parentField].map((item, key) => {
              const status =
                category === 'json' ? item.mapField : (config._variable || config.variable) && item.mapField;
              return (
                <Row key={item.field} className={styles.row} align='middle' justify='center'>
                  <Col className={styles.col} span={6}>
                    <span className={styles.fieldName} title={item.name || item.field}>
                      {item.name || item.field}
                    </span>
                  </Col>
                  <Col className={styles.col} span={10}>
                    <Input
                      value={item.mapField}
                      onChange={(e) => handleMapFieldChange(e.target.value, 'mapField', key)}
                    />
                  </Col>
                  <Col className={styles.col} span={8}>
                    <span className={`${styles.status} ${status ? styles.success : styles.failed}`} />
                    <span>{status ? '匹配成功' : '匹配失败'}</span>
                  </Col>
                </Row>
              );
            })}
          </div>
        </>
      )}

      {/* 数据映射选择弹窗 */}
      {modalVisible && (
        <DataMapList
          visible={modalVisible}
          dataset={defaultValue}
          checkedField={{
            col: config[parentField][currentIndex].mapField,
            row: config[parentField][currentIndex].row || [],
          }}
          disabledRowSelection={disabledRowSelection}
          onlyFirstRowFields={onlyFirstRowFields}
          onConfirm={handleConfirm}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
};

export default MapFieldForDefault;
