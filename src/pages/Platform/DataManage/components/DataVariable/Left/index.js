import React, { useRef, useState, useEffect, memo } from 'react';
import { Input, Space, Col, Row, message } from 'antd';
import { useMemoizedFn, useDebounceFn } from 'ahooks';
import { EditOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import uuid from 'short-uuid';
import { useStore } from '@/hooks';
import { observer } from 'mobx-react';
import s from './index.less';
import InitParamsModal from './InitParamsModal';

function Left(props) {
  const {
    editorStore,
    globalStore: store,
    controlStore: { setIsDataStoreModify },
  } = useStore();
  const { groupIdx, setGroupIdx, setRefresh, searchGroupName, setSearchGroupName } = props;
  const treeWrapRef = useRef();
  const [refreshCount, setRefreshCount] = useState(0);
  // const [editGroupIdx, setEditGroupIdx] = useState();
  const [changeGroupIdx, setChangeGroupIdx] = useState();
  const [paramsVisiable, setParamsVisiable] = useState();

  const toggleParamsVisiable = () => {
    setParamsVisiable(!paramsVisiable);
  };

  function forceUpdate() {
    setRefreshCount(refreshCount + 1);
    editorStore.forceUpdateAttr();
  }

  const updateSearchText = useDebounceFn(
    (value) => {
      setSearchGroupName(value.trim());
    },
    { wait: 500 },
  );

  const onSearchTextChange = useMemoizedFn(
    (e) => {
      updateSearchText.run(e.target.value);
    },
    [updateSearchText],
  );

  const addVariable = () => {
    const group = {
      name: '变量组',
      key: `store_group_${uuid.generate()}`,
      refreshCount: 0,
      children: [],
    };
    setChangeGroupIdx();
    window.dataStore.push(group);
    store.updateDataStore();
    setRefresh();
    forceUpdate();
    setIsDataStoreModify(true);
  };

  const editGroupName = (name, idx) => {
    if (name.length < 2 || name.length > 12) {
      message.error('变量组名称长度为2~12位！');
      return;
    }
    window.dataStore[idx].name = name;
    setChangeGroupIdx();
    store.updateDataStore();
    setRefresh();
    forceUpdate();
    setIsDataStoreModify(true);
  };

  const delGroupByIdx = (idx) => {
    if (window.dataStore[idx].children.length > 0) {
      return message.error('请先删除关联子变量，再删除变量组！');
    }
    const delGroup = window.dataStore.splice(idx, 1);
    // 存储已经删除的变量组key
    store.updateInvalidVariableKeys(delGroup[0]?.key);
    store.updateDataStore();
    setRefresh();
    forceUpdate();
    setIsDataStoreModify(true);
  };
  const initVariables = () => {
    if (window.dataStore == undefined) {
      window.dataStore = [];
      addVariable();
    }
  };
  initVariables();
  // v7.6.2 刷新
  useEffect(() => {
    forceUpdate();
  }, [store.variableName]);
  return (
    <div className={s.left}>
      <div className={s.title}>
        <Row className='padding-about-12'>
          <Col span={12}>变量组</Col>
          <Col span={12} className='right'>
            <InitParamsModal onCancel={toggleParamsVisiable} visible={paramsVisiable} />
            <PlusOutlined onClick={addVariable} />
          </Col>
        </Row>
      </div>
      <div ref={treeWrapRef} className={s.treeWrap}>
        <Input
          size='default'
          className={s.searchInput}
          placeholder='搜索'
          onChange={onSearchTextChange}
          suffix={<SearchOutlined style={{ color: '#666', fontSize: 16 }} />}
          allowClear
        />
        {/**
          * 不确定是否有意义 临时隐藏
          *  <div className="margin-bottom-12">
          <Button onClick={toggleParamsVisiable}>临时initParams</Button>
        </div>
          */}

        {window.dataStore.map((group, idx) => {
          const filterByGroupName = searchGroupName ? group.name.includes(searchGroupName) : true;
          const filterByVariableName =
            store.variableName == '' ||
            (group.children &&
              group.children.some((item) => {
                return item.name.includes(store.variableName) || item.key === store.variableName;
              }));
          const isShow = filterByGroupName && filterByVariableName;
          if (idx == changeGroupIdx) {
            return isShow ? (
              <div key={group.key} className={s.groupInput}>
                <Input
                  autofocus='autofocus'
                  onPressEnter={(evt) => {
                    editGroupName(evt.target.value, idx);
                  }}
                  onBlur={(evt) => {
                    editGroupName(evt.target.value, idx);
                  }}
                  defaultValue={group.name}
                />
              </div>
            ) : null;
          }
          const isActive = idx == groupIdx ? s.active : '';
          return isShow ? (
            <div className={`${s.groupItem} ${isActive}`} key={group.key}>
              <div
                className={s.groupName}
                onClick={() => {
                  setChangeGroupIdx();
                  setGroupIdx(idx);
                }}
              >
                {group.name}
              </div>
              <div className={s.groupEdit}>
                <Space>
                  <EditOutlined
                    onClick={() => {
                      setChangeGroupIdx(idx);
                    }}
                  />
                  <DeleteOutlined
                    title='删除'
                    onClick={() => {
                      delGroupByIdx(idx);
                    }}
                  />
                </Space>
              </div>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
export default memo(observer(Left));
