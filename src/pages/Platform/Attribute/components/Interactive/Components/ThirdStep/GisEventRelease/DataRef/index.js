import React, { Fragment, useState } from 'react';
import { Radio, Row, Col } from 'antd';

import styles from './index.less';
const DataRef = (props) => {
  const [isVariable, setIsVariable] = useState(false);
  return (
    <Fragment>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          数据源类型
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(evt) => {
              // updateField('isVariable', evt.target.value);
            }}
            value={isVariable}
          >
            <Radio className={styles.radioLable} value={true}>
              引用
            </Radio>
            <Radio className={styles.radioLable} value={false}>
              默认值
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
    </Fragment>
  );
};

export default DataRef;
