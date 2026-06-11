import React, { useState, useCallback } from 'react';
import { Row, Col, Button, ConfigProvider } from 'antd';
import { cloneDeep } from 'lodash';
import ConditionModal from '@/pages/Platform/Attribute/components/Interactive/Components/EventCondition/ConditionModal';
import successIcon from '@/assets/icon/success.png';
import classNames from 'classnames';
import styles from './index.less';

const ListenVariableCondition = ({ item, saveConditions, options }) => {
  const [open, setOpen] = useState(false);

  const onOk = useCallback((conditions) => {
    console.log('callback', conditions, item);
    saveConditions(conditions);
    setOpen(false);
  }, []);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const eventConditions = cloneDeep(item.conditions) || [];
  return (
    <ConfigProvider>
      <div className={styles.conditionContainer}>
        <Row className={styles.conditionRow}>
          <Col span={7}>{options?.label ?? '触发条件'}</Col>
          <Col span={17}>
            <Button
              className={classNames(styles.conditionBtn, eventConditions.length > 0 ? styles.success : '')}
              type='primary'
              onClick={() => {
                setOpen(true);
              }}
            >
              {options?.text ?? '设置条件'}
              {eventConditions.length > 0 && <img className={styles.successIcon} src={successIcon} alt='条件' />}
            </Button>
          </Col>
        </Row>
        <ConditionModal eventConditions={eventConditions} open={open} onOk={onOk} onCancel={onCancel} />
      </div>
    </ConfigProvider>
  );
};

export default ListenVariableCondition;
