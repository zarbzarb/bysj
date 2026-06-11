/*
 * @Author: Bernard
 * @Date: 2021-07-13 17:40:37
 * @LastEditTime: 2021-08-20 11:02:59
 * @LastEditors: Bernard
 * @Description: 行政区划选择数据配置表单渲染组件
 * @FilePath: /smart-visual-fe/src/components/AntdLibs/component/RenderForm/index.js
 * @Copyright ©云粒智慧科技有限公司 All rights reserved.
 */
import React from 'react';
import { Row, Col } from 'antd';
import CollectValue from '../CollectValue';
import { get } from 'lodash';

function RenderForm(props) {
  let { path, styles, value, updateField, initValues = {}, formData, rowStyle, updateDefaultDataField } = props;
  value = Object.assign(initValues, value);
  const commonChange = (id, value) => {
    let updatePath = path ? `${path}.${id}` : id;
    if (id.includes('refField') && updateDefaultDataField) {
      updateDefaultDataField && updateDefaultDataField(0, value);
    }
    updateField(updatePath, value);
  };
  return formData.map(({ label, helper, id, Com, format, related, valuePropName, render = true, loading }) => {
    if (related && !Object.entries(related).every(([key, v]) => v === get(value, key))) {
      return null;
    }
    return render ? (
      label === '变量表达式' ? (
        <>
          <Row className={styles.field} key={id} align='middle' style={rowStyle}>
            <Col flex='auto' className={styles.fieldLabel}>
              {label}
              {helper}
            </Col>
          </Row>
          <Row className={styles.field} key={id} align='middle' style={rowStyle}>
            <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <CollectValue
                valuePropName={valuePropName}
                format={format}
                id={id}
                onChange={commonChange}
                value={loading ? '加载中...' : value[id]}
              >
                {Com}
              </CollectValue>
            </Col>
          </Row>
        </>
      ) : (
        <Row className={styles.field} key={id} align='middle' style={rowStyle}>
          <Col flex='auto' className={styles.fieldLabel}>
            {label}
            {helper}
          </Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <CollectValue
              valuePropName={valuePropName}
              format={format}
              id={id}
              onChange={commonChange}
              value={loading ? '加载中...' : value[id]}
            >
              {Com}
            </CollectValue>
          </Col>
        </Row>
      )
    ) : null;
  });
}

export default RenderForm;
