import React, { useState, useMemo } from 'react';
import { Row, Col } from 'antd';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import DataMapList from '../DataMapList';
import { getDataFields } from '../utils';
import styles from './index.less';

const MapField = ({
  config,
  dataset = [],
  updateDynamicData: _updateDynamicData,
  isIndicator = false, // v7.11 新增，表示是否为指标接口
  el,
}) => {
  let { dynamic } = config;
  let updateDynamicData = _updateDynamicData;
  if (isIndicator) {
    // NOTE: dynamic 实际上取的是 config.indicator 的值，updateDynamicData 更新的也是 config.indicator
    dynamic = config.indicator;
    updateDynamicData = (data, setting, notUpdate) => {
      _updateDynamicData(data, setting, 'indicator', notUpdate);
    };
  }

  let dataMap = dynamic?.dataMap;
  let dimensionMap = dynamic.dimensionMap || [];
  if (dynamic.seriesType === 2) {
    dataMap = dynamic.dataMap2;
    dimensionMap = dynamic.dimensionMap2 || [];
  }

  const [modalVisible, setModalVisible] = useState(false); // 是否打开“数据映射选择弹窗”
  const [currentIndex, setCurrentIndex] = useState(0); // 当前正在操作的项目的 index

  // 检查字段是否匹配时，是否只取第一行的字段，否则取所有数据行不重复的字段
  const onlyFirstRowFields = useMemo(() => {
    return true;
  }, []);

  // 不允许选择数据行，只能选择数据列
  const disabledRowSelection = useMemo(() => {
    return dynamic.seriesType === 2 || el?.isCustomListChild;
  }, [dynamic.seriesType, el?.isCustomListChild]);

  // 数据中的字段
  const dataFields = useMemo(() => {
    return getDataFields(dataset, onlyFirstRowFields);
  }, [dataset, onlyFirstRowFields]);

  // 通过“数据映射选择弹窗”选择了映射字段
  const handleConfirm = useMemoizedFn(({ col, row }) => {
    // console.log({ col }, { row });

    const arr = _.cloneDeep(dimensionMap);
    arr[currentIndex].col = col;
    arr[currentIndex].row = row;
    const updateField = dynamic.seriesType === 2 ? 'dimensionMap2' : 'dimensionMap';
    const setting = {
      ...dynamic,
      [updateField]: arr,
    };
    updateDynamicData(dataset, setting);

    setModalVisible(false);
  });

  if (['CustomList', 'CustomCell'].includes(el?.type)) {
    // 自定义列表，不显示属性映射
    return null;
  }

  return (
    <>
      {dataMap.length > 0 && (
        <div className={styles.mapField}>
          <div className={styles.title}>属性名称|映射</div>
          {dataMap.map((val) => {
            const { key } = val;
            const index = dimensionMap.findIndex((d) => d.dataMapKey === key);
            const mapField = dimensionMap[index];
            const status = dataFields.includes(mapField?.col);
            return (
              <Row key={key} className={styles.row} align='middle' justify='center'>
                <Col className={styles.col} span={6}>
                  <span className={styles.fieldName} title={val.name}>
                    {val.name}
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
                    {mapField?.col}
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
      )}

      {/* 数据映射选择弹窗 */}
      {modalVisible && (
        <DataMapList
          visible={modalVisible}
          dataset={dataset}
          checkedField={dimensionMap[currentIndex]}
          disabledRowSelection={disabledRowSelection}
          onlyFirstRowFields={true}
          onConfirm={handleConfirm}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
};

export default MapField;
