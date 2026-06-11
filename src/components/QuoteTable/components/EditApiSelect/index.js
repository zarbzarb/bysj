import React, { useState, useLayoutEffect, useMemo } from 'react';
import { useSelectSearch } from '@/utils/customReactHooks';
// import { Store } from '@/store/index';
import { observer } from 'mobx-react';
import DynamicApi from '@/pages/Platform/DataSource/Dynamic/components/dynamicApi';
import add from '@/assets/newIcon/add.png';
import SelectInfo from '../SelectInfo';
import './index.less';

// const { globalStore } = Store;

const { Option } = SelectInfo;
function EditApiSelect(props) {
  const { onChange, value, relatedApiList, onChangeApi, isRemovedApi, idx /* , setCurrentIdxFn, isNotApi */ } = props;
  const [isEdit, setEdit] = useState(() => !value);
  const [modalVisible, setModalVisible] = useState(false); // 是否打开弹窗

  const dynamic = useMemo(() => {
    return { id: '', source: { id: value?.id, params: [] }, requireType: true };
  }, [value]);

  // const isRemovedApis = useMemo(() => {
  //   const selectedAPI = relatedApiList.find((item) => item.id === value?.id);
  //   if (value && !selectedAPI) {
  //     globalStore.updateDynamicApis(value);
  //     relatedApiList.push(value);
  //   }
  // }, [relatedApiList]);

  const [searchListState, updateSearchListState] = useSelectSearch({
    list: relatedApiList,
    field: 'interfaceName',
  });

  useLayoutEffect(() => {
    // 未知原因，初始化时value第一次为未定义，导致无法判断初始化是否有值，暂时用这种方法
    if (value) {
      setEdit(false);
    }
  }, [value]);

  // // v7.3 判断当前接口有没有被删除
  // const isRemovedApi = useMemo(() => {
  //   const selectedAPI = relatedApiList.find((item) => item.id === value.id);
  //   return selectedAPI ? true : false;
  // }, [relatedApiList, value.id]);

  const _onChange = (val) => {
    console.log(val, 'val');
    onChangeApi(val);
    onChange(val);
    setEdit(false);
    updateSearchListState('');
  };

  const _updateDynamicData = (setting) => {
    const val = setting?.curApiInfo;
    onChangeApi(val);
    onChange(val);
  };
  return (
    <div className='edit-api-select'>
      <span className='icon' />
      {isEdit ? (
        <>
          {relatedApiList.length > 0 ? (
            <SelectInfo
              data={relatedApiList}
              isRemovedApi={isRemovedApi}
              value={value || {}}
              idName='id'
              placeholder='请选择接口'
              showSearch
              filterOption={false}
              onSearch={updateSearchListState}
              onChange={_onChange}
              onBlur={() => {
                if (value) {
                  setEdit(false);
                } else {
                  // message.warning('请选择接口');
                }
              }}
              style={{ width: '100%' }}
            >
              {searchListState.map(({ id, interfaceName }) => (
                <Option value={id} key={id}>
                  {interfaceName}
                </Option>
              ))}
            </SelectInfo>
          ) : (
            <div style={{ width: '100%' }}>请点击右侧按钮添加接口</div>
          )}
        </>
      ) : (
        <span onClick={() => setEdit(true)} className='not-edit'>
          {isRemovedApi ? '接口已被删除,请选择其他接口' : value.interfaceName}
          {/* {!isNotApi ? '接口已被删除,请选择其他接口' : value.interfaceName} */}
        </span>
      )}
      <a
        style={{ marginLeft: '5px' }}
        onClick={() => {
          // setCurrentIdxFn();
          setModalVisible(true);
        }}
      >
        <img src={add} alt='' />
      </a>

      {modalVisible && (
        <DynamicApi
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          dynamic={dynamic}
          updateDynamicData={_updateDynamicData}
        />
      )}
    </div>
  );
}

export default observer(EditApiSelect);
