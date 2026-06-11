import { Select, Input, Space, Modal, Button, Table, message, Tooltip, Divider, Typography } from 'antd';
import React, { useCallback, useState } from 'react';
import shortId from 'short-uuid';
import { QuestionCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useStore } from '@/hooks';
import { setStoreData } from '@/utils/dataStoreUtils';
import { getVarRefer } from '@/utils/pageListRefer';
import markActivedIcon from '@/assets/newIcon/markActivedIcon.png';
import markIcon from '@/assets/newIcon/markIcon.png';
import Refer from './components/Refer';
import styles from './index.less';
import ModalEdiDefaultValue from './ModalEditDefaultValue';

const { Option } = Select;
const { Search } = Input;

const defaultDataValueByType = {
  // all: '',
  string: '',
  'Array String': ['张三', '李四'],
  'Array Object': [{ name: '张三' }, { name: '李四' }],
  Object: {},
};

function Variable(props) {
  const {
    globalStore: CommonStore,
    editorStore,
    controlStore: { setIsDataStoreModify },
    pageTabsStore: { selectedKey },
    layerStore: { comList }, // v8.6.0 获取业务图层/卡片组件
  } = useStore();
  // const componentList = editorStore.getCompList();
  const { groupIdx } = props;
  const [visible, setVisible] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [visiable, setVisiable] = useState(); // 设置变量
  const [referVisible, setReferVisible] = useState(false); // 控制变量引用关系弹框
  const [isModalVisible, setIsModalVisible] = useState(false); // 删除变量弹框
  const [isModalShow, setIsModalShow] = useState(false); // 确认删除变量弹框
  // v8.6.0 区分是否多页面应用
  const { isApp, allPageRefer } = CommonStore;

  // v7.6.2 变量搜索表单
  const [keyWord, setKeyWord] = useState('');
  /**
   * 搜索
   * @param {*} value
   */
  const onKeySearch = useCallback(
    (value) => {
      console.log('onKeySearch variableName', value);
      CommonStore.setVariableName(value);
      setKeyWord(value);
    },
    [setKeyWord, CommonStore],
  );
  /**
   * 搜索框文字修改，为空时触发搜索
   * @param {*} e
   */
  const onKeySearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      if (val.length === 0) {
        onKeySearch(val);
      }
    },
    [onKeySearch],
  );

  const refreshHandler = useCallback(() => {
    setRefresh(refresh + 1);
    editorStore.forceUpdateAttr();
  }, [refresh, editorStore]);

  const store = window.dataStore[groupIdx] || {};
  const data = store.children || [];

  function changeValueByKey(key, value) {
    data.forEach((vl, idx) => {
      if (vl.key == key) {
        vl.name = value;
      }
    });
    setIsDataStoreModify(true);
    CommonStore.updateDataStore();
  }

  const resetVariableValueHandler = (item) => {
    // let errorStr = initDataByDefault(item);
    // if (errorStr) {
    //   message.error(errorStr);
    //   message.error('请点击设置值，重新设置默认值信息！');
    //   throw `变量 ${item.key}：` + errorStr;
    // } else {
    const obj = {
      key: item.key,
      name: item.name,
      count: item.count,
      data: undefined,
      mapCompIds: [],
      isMark: item.isMark,
      variableType: item.variableType,
      defaultValue: '',
      defaultValueCode: `//请将返回值以retun方式返回
return ""`,
      setData: (data) => {
        this.data = data;
      },
    };
    if (window.dataStore[groupIdx] == undefined) {
      message.error('请先添加变量组再进行操作！');
      return;
    }
    store.children = store.children.map((val) => (val.key == item.key ? obj : val));
    CommonStore.updateDataStore();
    refreshHandler();
    // setStoreData(item.key, item.defaultValue); // 更新全局存储的变量数据
    // refreshHandler();
    // }
  };

  // 标记或取消标记
  const goMark = (item) => {
    item.isMark = !item.isMark;
    setIsDataStoreModify(true);
    CommonStore.updateDataStore();
    refreshHandler();
  };

  const { Paragraph, Text } = Typography;
  const columns = [
    {
      title: '变量名称',
      dataIndex: 'name',
      width: 200,
      key: 'name',
      render: (text, item, i) => {
        return (
          <div className={styles.variableName}>
            <img src={item.isMark ? markActivedIcon : markIcon} alt='' />
            <Input
              defaultValue={text}
              onChange={(evt) => {
                changeValueByKey(item.key, evt.target.value);
                // refreshHandler();
              }}
              onBlur={() => {
                refreshHandler();
              }}
            />
          </div>
        );
      },
    },
    {
      title: '变量标识',
      dataIndex: 'key',
      width: 200,
      key: 'key',
      render: (text, item, i) => {
        return (
          <Text
            className='version-v'
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0',
              width: '170px',
            }}
            ellipsis
            copyable={{ text: item.key }}
          >
            {item.key}
          </Text>
        );
      },
    },
    // {
    //   title: '值预览',
    //   dataIndex: 'data',
    //   key: 'data',
    //   render: (text, item, i) => {
    //     return (
    //       <Tooltip title={JSON.stringify(text, null, '\t')}>
    //         <QuestionCircleOutlined />
    //       </Tooltip>
    //     );
    //   }
    // },
    {
      title: '变量类型',
      dataIndex: 'variableType',
      render: (text, item, i) => {
        return (
          <Select
            value={text}
            style={{ width: '100px' }}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            onChange={(value) => {
              item.variableType = value;
              const defaultValue = defaultDataValueByType[value];
              if (defaultValue !== undefined) {
                item.defaultValue = defaultValue;
                //                 (item.defaultValueCode = `//请将返回值以retun方式返回   // 先撤销，测试时间不够
                // return ${JSON.stringify(defaultValue)}`),
                setStoreData(item.key, defaultValue); // 更新全局存储的变量数据
                CommonStore.updateDataStore();
              }
              refreshHandler();
            }}
          >
            <Option>请选择</Option>
            <Option value='all'>随意数据</Option>
            <Option value='string'>字符串</Option>
            <Option value='Array String'>数组字符串</Option>
            <Option value='Array Object'>数组对象</Option>
            <Option value='Object'>对象</Option>
          </Select>
        );
      },
    },
    {
      title: '操作',
      render: (text, item) => {
        const ele = (
          <>
            <span style={{ marginRight: 8 }}>标记</span>
            <Tooltip title='被标记的变量是用来被“布局设计器页面的保存按钮”使用'>
              <QuestionCircleOutlined />
            </Tooltip>
          </>
        );
        return (
          <Space>
            <Tooltip title={JSON.stringify(text, null, '\t')}>
              <QuestionCircleOutlined />
            </Tooltip>
            <Divider type='vertical' className={styles.line} />
            <a
              onClick={() => {
                setVisible(true);
                setVisiable(item);
              }}
            >
              初始值函数
            </a>
            <Divider type='vertical' className={styles.line} />
            <a
              onClick={() => {
                setIsModalVisible(true);
                setVisiable(item);
              }}
              type='link'
            >
              删除
            </a>
            <Divider type='vertical' className={styles.line} />
            <a
              onClick={() => {
                onRefer(item);
              }}
              type='link'
            >
              引用关系
            </a>
            <Divider type='vertical' className={styles.line} />
            <a
              onClick={() => {
                goMark(item);
              }}
              type='link'
            >
              {item.isMark ? '取消标记' : ele}
            </a>
          </Space>
        );
      },
    },
  ];

  const addVariable = useCallback(() => {
    const store = window.dataStore[groupIdx] || {};
    const obj = {
      key: `${store.key}-${shortId.generate()}`,
      name: '变量',
      count: 0,
      data: undefined,
      mapCompIds: [],
      variableType: 'all',
      defaultValue: '',
      defaultValueCode: `//请将返回值以retun方式返回
return ""`,
      setData: (data) => {
        this.data = data;
      },
    };
    if (window.dataStore[groupIdx] == undefined) {
      message.error('请先添加变量组再进行操作！');
      return;
    }
    store.children.unshift(obj);
    setIsDataStoreModify(true);
    CommonStore.updateDataStore();
    refreshHandler();
  }, [groupIdx, CommonStore, refreshHandler, setIsDataStoreModify]);

  const title = useCallback(() => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* v7.6.2 添加变量名称搜索 */}
        <Search
          allowClear
          style={{ width: '510px' }}
          placeholder='请输入变量名称/标识搜索'
          onSearch={onKeySearch}
          onChange={onKeySearchChange}
        />
        <Button onClick={addVariable} type='primary' icon={<PlusCircleOutlined />}>
          增加
        </Button>
      </div>
    );
  }, [addVariable, onKeySearch, onKeySearchChange]);

  const editDefaultValueProps = {
    visiable,
    onOk: () => {
      setVisible(false);
    },
    onCancel: () => {
      setVisible(false);
    },
    // 重置
    resetVariableValueHandler,
    // 变量是否修改
    setIsDataStoreModify,
  };

  // 引用关系
  const onRefer = (visiable) => {
    setReferVisible(true);
    setVisiable(visiable);
  };

  // v8.6.0 变量引用关系获取优化， 兼容删除变量
  const getVariableRefer = (delKey) => {
    let dataSource = [];
    // v8.6.0 应用变量引用关系数组
    // 更新当前页变量引用关系数组
    if (isApp) {
      const curPageRef = allPageRefer[selectedKey];
      if (curPageRef) {
        const curPageName = curPageRef.pageName || '';
        const curVarRefer = getVarRefer(comList, delKey, curPageName);
        // console.log('refer curVarRefer', curVarRefer);
        curPageRef.varRefer = curVarRefer;
      }
      // 合并应用所有页面变量引用关系数组
      dataSource = [];
      Object.keys(allPageRefer).forEach((key) => {
        const varRefer = allPageRefer[key]?.varRefer || [];
        dataSource = [...dataSource, ...varRefer];
      });
    } else {
      // v8.6.0 遍历组件列表，添加变量引用关系
      dataSource = getVarRefer(comList, delKey, '');
    }
    // console.log('refer dataSource', dataSource);
    return dataSource;
  };

  const handleOk = () => {
    setIsModalShow(false);
    const { key } = visiable;
    // v8.6.0 支持删除变量
    getVariableRefer(key);
    data.some((vl, idx) => {
      if (vl.key == key) {
        data.splice(idx, 1);
        return true;
      }
      return false;
    });
    // 存储已经删除的变量key
    CommonStore.updateInvalidVariableKeys(key);
    CommonStore.updateDataStore(); // 更新列表
    refreshHandler();
    setIsDataStoreModify(true);
  };

  // useEffect(() => {
  //   if (isApp) {
  //     getAllPageInfo().then((result) => {
  //       console.log(result);
  //       if (Number(result.code) === 200) {
  //         pageListRef.current = result.data || [];
  //       }
  //     });
  //   }
  // }, [getAllPageInfo, isApp]);

  return (
    <div style={{ height: '650px', overflowY: 'scroll' }}>
      {visible && <ModalEdiDefaultValue {...editDefaultValueProps} />}
      <Table
        title={title}
        Pagination={{ size: 'small' }}
        dataSource={data
          .filter((vl) => {
            return vl.name.includes(keyWord) || vl.key === keyWord;
          })
          .map((vl) => {
            return vl;
          })}
        columns={columns}
      />
      {/* 变量引用关系 v8.6.0 新增页面pageName */}
      <Refer
        visible={referVisible}
        onCancel={() => setReferVisible(false)}
        visiable={visiable}
        getVariableRefer={getVariableRefer}
      />
      <Modal
        title='提示'
        getContainer={false}
        open={isModalVisible}
        onOk={() => {
          setIsModalVisible(false);
          setIsModalShow(true);
        }}
        onCancel={() => setIsModalVisible(false)}
      >
        请通过“引用关系”查看变量被使用的情况，删除变量将影响有关配置！确定要删除吗？
      </Modal>
      <Modal
        title='提示'
        getContainer={false}
        open={isModalShow}
        onOk={handleOk}
        onCancel={() => setIsModalShow(false)}
      >
        请再次确认要删除指定的变量！
      </Modal>
    </div>
  );
}
export default Variable;
