import React, { useState, useCallback } from 'react';
import { Row, Col, Button, ConfigProvider } from 'antd';
import { cloneDeep } from 'lodash';
import classNames from 'classnames';
import successIcon from '@/assets/icon/success.png';
import styles from './index.less';
import ConditionModal from './ConditionModal';

const EventCondition = ({ comp, idx: eventIdx, agIdx }) => {
  const [open, setOpen] = useState(false);
  const updateEventSettings = (conditions) => {
    try {
      const eventSettings = cloneDeep(comp.eventSetings) || [];
      eventSettings[eventIdx].groups[agIdx].conditions = conditions;

      window.executeCommand('InteractionCommand', comp, eventSettings);
    } catch (error) {
      console.error(error);
    }
  };

  const onOk = (conditions) => {
    updateEventSettings(conditions);
    setOpen(false);
  };

  const onCancel = () => {
    setOpen(false);
  };

  const eventConditions = cloneDeep(comp.eventSetings[eventIdx]?.groups[agIdx]?.conditions) || [];
  return (
    <ConfigProvider>
      <div className={styles.conditionContainer}>
        <Row className={styles.conditionRow}>
          <Col span={7} className={styles['flex-center']}>
            触发条件
          </Col>
          <Col span={17} className={styles['flex-center']}>
            <Button
              className={classNames(styles.conditionBtn, eventConditions.length > 0 ? styles.success : '')}
              type='primary'
              onClick={() => {
                setOpen(true);
              }}
            >
              设置条件
              {eventConditions.length > 0 && <img className={styles.successIcon} src={successIcon} alt='条件' />}
            </Button>
          </Col>
        </Row>
        <ConditionModal eventConditions={eventConditions} open={open} onOk={onOk} onCancel={onCancel} />
      </div>
    </ConfigProvider>
  );
};

export default EventCondition;
