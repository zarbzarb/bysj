import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button, Modal, Tabs, message, ConfigProvider, Empty } from 'antd';
import './index.less';
import shortId from 'short-uuid';
import { cloneDeep, isEqual } from 'lodash';
import { SmileOutlined } from '@ant-design/icons';
import emptyCondition from '@/assets/newIcon/emptyCondition.png';
import ConditionTable, { initialRule } from '../ConditionTable';

interface ConditionModalProps {
  eventConditions: Record<string, any>[];
  open: boolean;
  onOk: (params) => void;
  onCancel: () => void;
}
type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

const ConditionModal = (props: ConditionModalProps) => {
  const { eventConditions, open, onOk, onCancel } = props;
  const [conditions, setConditions] = useState(eventConditions);
  const [activeKey, setActiveKey] = useState(eventConditions[0]?.key);

  // 检查条件是否填写完整
  const validate = useMemo(
    () => !conditions.some((cond) => cond.rules.some((rule) => !rule.compKey || !rule.compDataItem || !rule.operator)),
    [conditions],
  );

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
  };

  const add = () => {
    if (!validate) {
      return message.warning('请将条件补充完整！');
    }

    const newActiveKey = shortId.generate();

    const condition = {
      key: newActiveKey,
      name: `条件${conditions.length + 1}`,
      rules: [cloneDeep(initialRule)],
    };

    const data = [...conditions, condition];
    setConditions(data);

    setActiveKey(newActiveKey);
  };

  const remove = (targetKey: TargetKey) => {
    let newActiveKey = activeKey;
    let lastIndex = -1;
    conditions.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const newPanes = conditions.filter((item) => item.key !== targetKey);

    if (newPanes.length > 0 && newActiveKey === targetKey) {
      newActiveKey = lastIndex >= 0 ? newPanes[lastIndex].key : newPanes[0].key;
    }

    setConditions(newPanes);
    setActiveKey(newActiveKey);
  };

  const onEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'add') {
      add();
    } else {
      remove(targetKey);
    }
  };

  const changeHandler = (key, params) => {
    const data = conditions.map((con) => {
      if (con.key === key) {
        con.rules = params;
      }
      return con;
    });

    setConditions(data);
  };

  const saveConditions = () => {
    // console.log('conditions', conditions);
    if (!validate) {
      return message.warning('请将条件补充完整！');
    }
    onOk(cloneDeep(conditions));
  };

  useEffect(() => {
    if (!isEqual(conditions, eventConditions)) {
      setConditions(eventConditions);
      setActiveKey(eventConditions[0]?.key);
    }

    return () => {};
  }, [eventConditions]);

  const items = conditions.map((c) => ({
    label: c.name,
    children: <ConditionTable conditionKey={c.key} rules={c.rules} onChange={changeHandler} />,
    key: c.key,
  }));

  return (
    <Modal
      className='antd-dark condition-modal'
      maskClosable={false}
      width={900}
      title='条件'
      open={open}
      onOk={saveConditions}
      onCancel={onCancel}
      keyboard={false}
    >
      <Tabs
        className='custom-condition-tabs'
        type='editable-card'
        onChange={onChange}
        activeKey={activeKey}
        onEdit={onEdit}
        items={items}
        getPopupContainer={() => document.querySelector('.custom-condition-tabs')}
      />
      {items.length === 0 && (
        <Empty
          image={emptyCondition}
          imageStyle={{ height: 40 }}
          description={<span style={{ color: '#30808E' }}>未添加任何条件</span>}
        />
      )}
    </Modal>
  );
};

export default ConditionModal;
