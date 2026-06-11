import React, { useCallback, useEffect, useState } from 'react';
import { Radio, Row, Col } from 'antd';
import DynamicApi from '@/pages/Platform/DataSource/Dynamic';
import IndicatorApi from '@/pages/Platform/DataSource/Indicator';
import MapField from '@/pages/Platform/DataSource/MapField';
import MapFieldForDefault from '@/pages/Platform/DataSource/MapFieldForDefault';
import CompatibleTool from '@/pages/Platform/DataSource/Compatible';
import VariableRef from './VariableRef';
import DefaultValueComp from './DefaultValue';
import DataMap from './DataMap';
import s from './index.less';

// 动态生成“属性映射关系”
const updateDataMap = (el, config) => {
  if (el.type === 'List' || el.type === 'Table') {
    // 多行列表
    let prevDataMap = null;

    // 静态映射
    if (!config.isVariable || config.category === 'json') {
      if (config._api) {
        prevDataMap = config._api.reduce((res, item) => {
          res[item.field] = item;
          return res;
        }, {});
      }
    }

    // 变量映射
    if (config.isVariable || config.category === 'variableRef') {
      if (config.variableDataMap) {
        prevDataMap = config.variableDataMap.reduce((res, item) => {
          res[item.field] = item;
          return res;
        }, {});
      }
    }

    if (el.type === 'List' && prevDataMap) {
      el.props.columns.forEach((col) => {
        const key = `col${col.id}`;
        col.code = prevDataMap[key]?.mapField;
      });
    }

    if (el.type === 'Table' && prevDataMap) {
      el.props.columns.forEach((col) => {
        const key = `col${col.id}`;
        col.dataIndex = prevDataMap[key]?.mapField;
      });
    }
  }

  if (el.type === 'MapInfoWin' && !config._api) {
    // 地图标牌组件，之前的属性映射保存在 props.mapFields 里，需要兼容历史
    config._api = [
      { name: '经度值', field: 'lon', mapField: el.props.mapFields?.[0]?.mapField || 'lon', row: [] },
      { name: '维度值', field: 'lat', mapField: el.props.mapFields?.[1]?.mapField || 'lat', row: [] },
    ];
  }
};

const DataRef = (props) => {
  const { el, styles, updateDataSource, updateMultiDataSource, title = '数据源', parentPath, dataset } = props;
  let config = dataset;
  if (!config) {
    config = el.dataset; // 兼容之前版本
  }

  updateDataMap(el, config);

  const [data, setData] = useState(() => {
    if (el.isCustomListChild && config.category === 'dynamic' && config.dynamic?.dataFromParent) {
      // v8.5 自定义列表的子组件，直接使用 dynamic.dataFromParent 中的数据（自定义列表传递过来的数据）
      return [...config.dynamic.dataFromParent];
    }
    return [];
  }); // 接口请求的原始数据

  useEffect(() => {
    if (el.isCustomListChild && config.category === 'dynamic' && config.dynamic?.dataFromParent) {
      // v8.5 自定义列表的子组件，直接使用 dynamic.dataFromParent 中的数据（自定义列表传递过来的数据）
      setData([...config.dynamic.dataFromParent]);
    }
  }, [config.category, config.dynamic?.dataFromParent, el.isCustomListChild]);

  const updateField = useCallback(
    (field, value) => {
      if (parentPath) {
        updateMultiDataSource(field, parentPath, value);
      } else {
        updateDataSource(field, value);
      }
    },
    [parentPath, updateDataSource, updateMultiDataSource],
  );

  /**
   *
   * @param {} _data 请求的接口数据
   * @param {} setting dynamic配置
   * @param {} field 更新的字段，默认为 dynamic string
   * @param {} notUpdate 是否需要更新组件dynamic配置
   * @returns
   */
  const updateDynamicData = (_data, setting, field = 'dynamic', notUpdate) => {
    setData(_data);

    // 打开组件配置栏时需要更新请求数据但是不更新组件dynamic配置
    if (notUpdate) return;
    let normalData = _data;
    let originalData;
    if (el.type !== 'CustomList' && el.type !== 'CustomCell') {
      normalData = CompatibleTool.dataFieldMapArrayObject(setting.dimensionMap, _data);
      originalData = CompatibleTool.filterDataset(setting.dimensionMap, _data);
      console.log({ normalData }, { originalData });
    }
    updateDataSource(field, {
      ...setting,
      data: normalData,
      originalData,
    });
  };

  let { category } = config; // 设置是否引用变量
  if (!category) {
    category = config.isVariable ? 'variableRef' : 'json';
  }
  const { defaultValue } = config;
  const isCustomListChild = el.isCustomListChild && config.dynamic?.dataFromParent;

  const showIndicator = window.sessionStorage.getItem('showIndicator') === 'true';
  if (el.type === 'LayerSearch') {
    category = 'variableRef';
  }
  return (
    <>
      {el.hasDataMap && <DataMap {...props} />}
      {/* <Row className={`${styles.field} margin-top-8`} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          {title}
        </Col>
      </Row> */}
      {el.type != 'LayerSearch' && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            {title}
          </Col>
          <Col className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Radio.Group
              size='small'
              onChange={(evt) => {
                // updateField('isVariable', evt.target.value);

                if (config.category) {
                  updateField('category', evt.target.value);
                } else {
                  updateField('isVariable', evt.target.value === 'variableRef');
                }
              }}
              value={category}
            >
              <Radio className={s.radioLable} value='json'>
                静态
              </Radio>
              {config.category && (
                <Radio className={s.radioLable} value='dynamic'>
                  {isCustomListChild ? '父组件数据' : '动态'}
                </Radio>
              )}
              <Radio className={s.radioLable} value='variableRef'>
                变量
              </Radio>
              {config.category && showIndicator && !isCustomListChild && (
                <Radio className={s.radioLable} value='indicator'>
                  指标
                </Radio>
              )}
            </Radio.Group>
          </Col>
        </Row>
      )}

      {/** 设置变量值信息 */}
      {category === 'variableRef' && (
        <>
          <VariableRef {...props} updateField={updateField} dataset={config} />

          {Array.isArray(config.variableDataMap) && config.variableDataMap.length > 0 && (
            <MapFieldForDefault
              config={config}
              category={category}
              defaultValue={defaultValue}
              changeValue={(val, field) => updateField(field, val)}
              el={el}
            />
          )}
        </>
      )}

      {/** 设置默认值信息 */}
      {category === 'json' && (
        <>
          <DefaultValueComp {...props} updateField={updateField} dataset={config} />

          {Array.isArray(config._api) && config._api.length > 0 && (
            <MapFieldForDefault
              config={config}
              category={category}
              defaultValue={defaultValue}
              changeValue={(val, field) => updateField(field, val)}
              el={el}
            />
          )}
        </>
      )}

      {/** 动态数据 */}
      {category && category === 'dynamic' && (
        <>
          {!isCustomListChild && <DynamicApi config={config} dataset={data} updateDynamicData={updateDynamicData} />}

          <MapField key='dynamic' config={config} dataset={data} updateDynamicData={updateDynamicData} el={el} />
        </>
      )}

      {/** 指标数据 */}
      {category && category === 'indicator' && (
        <>
          <IndicatorApi config={config} dataset={data} updateDynamicData={updateDynamicData} />

          <MapField
            key='indicator'
            config={config}
            dataset={data}
            updateDynamicData={updateDynamicData}
            isIndicator={true}
            el={el}
          />
        </>
      )}
    </>
  );
};

export default DataRef;
