import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Form, Input, Button, Select, Checkbox, message, Table, Tooltip, Divider } from 'antd';
import _ from 'lodash';
import { getApiList, getRelatedApiList, addApiRelated, deleteApiRelated, getIdbyUid } from '@/services/apis/dataManage';
import useAsyncTable from '@/hooks/useAsyncTable';
import { GetQueryString } from '@/utils/BrowserUtils';
import { getApiRefer } from '@/utils/pageListRefer';
import { useStore } from '@/hooks';
import s from './index.less';
// import FecthTable from '../FetchTable';
import EditApi from './components/EditApi';
import Refer from './components/Refer';

const FormItem = Form.Item;
const { useForm } = Form;
const { Option } = Select;
// const { Group: RadioGroup, Button: RadioButton } = Radio;

// const formItemLayout = {
//   labelCol: {
//     xs: { span: 24 },
//     sm: { span: 8 },
//     md: { span: 8 },
//     lg: { span: 8 },
//     xl: { span: 5 },
//     xxl: { span: 5 }
//   },
//   wrapperCol: {
//     xs: { span: 24 },
//     sm: { span: 16 },
//     md: { span: 16 },
//     lg: { span: 16 },
//     xl: { span: 19 },
//     xxl: { span: 19 }
//   }
// };

const layout = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 8,
  xl: 8,
  xxl: 6,
};

// v8.6.0 接口引用次数
const getApiReferCount = (interfaceCode, apiReferLists) => {
  let count = 0;
  // console.log('getApiReferCount interfaceCode', interfaceCode);
  // console.log('getApiReferCount apiReferList', apiReferLists);
  count = apiReferLists.filter((um) => um.interfaceCode === interfaceCode).length;
  // console.log('getApiReferCount count', count);
  return count;
};

function Right(props) {
  // let CardStore = MobxGet('CardStore');
  // let cardApiList = toJS(CardStore.cardApiList);
  const {
    versionStore: { apiVersion },
    globalStore: { isApp, screenConfig, allPageRefer }, // v8.6.0
    pageTabsStore: { selectedKey },
    layerStore: { comList }, // v8.6.0 获取业务图层/卡片组件
  } = useStore();
  const { categoryId, pageId } = props;
  // const [form] = useForm();
  // 7.8.0 添加独立筛选表单
  const [rForm] = useForm();
  const [visible, setVisible] = useState(false);
  const [apiInfo, setApiInfo] = useState({});
  // v8.6.0 固定关联接口列表
  // const [type, setType] = useState('related');
  const [relatedApiList, setRelatedApiList] = useState([]);
  const [saveParam, setSaveParam] = useState([]);
  // const [params, setParams] = useState({
  //   categoryId: '',
  // });
  // const [p, setP] = useState({});
  // 7.8.0 添加独立筛选参数
  const [rParams, setRParams] = useState({});
  // const { tableProps, paginationProps, getData } = useAsyncTable({
  //   getListPromise: getApiList,
  //   params,
  // });
  const [speId, setSpeId] = useState(pageId); // 兼容自增的卡片ID
  const [referVisible, setReferVisible] = useState(false); // 控制接口引用关系弹框

  // v8.6.0 接口引用关系获取优化
  const apiReferList = useMemo(() => {
    let dataSource = [];
    if (isApp) {
      // v8.6.0 应用接口引用关系数组
      // 更新当前页接口引用关系数组
      const curPageRef = allPageRefer[selectedKey];
      if (curPageRef) {
        // screenConfig.dynamicApis为当前页dynamicApis
        const dynamicApis = screenConfig.dynamicApis || [];
        const curPageName = curPageRef.pageName || '';
        const curApiRefer = getApiRefer(comList, dynamicApis, curPageName);
        // console.log('refer curApiRefer', curApiRefer);
        curPageRef.apiRefer = curApiRefer;
      }
      // 合并应用所有页面接口引用关系数组
      dataSource = [];
      Object.keys(allPageRefer).forEach((key) => {
        const apiRefer = allPageRefer[key]?.apiRefer || [];
        dataSource = [...dataSource, ...apiRefer];
      });
    } else {
      // v8.6.0 遍历组件列表，添加变量引用关系
      const dynamicApis = screenConfig.dynamicApis || [];
      dataSource = getApiRefer(comList, dynamicApis, '');
    }
    // console.log('apiReferList dataSource', dataSource);
    return dataSource;
  }, [allPageRefer, comList, isApp, screenConfig.dynamicApis, selectedKey]);

  // v7.8.0 获取关联本页面的接口，区分卡片还是页面，除了pageId，还需要添加 rParams筛选参数
  const getRApiList = useCallback(() => {
    getRelatedApiList({
      pageId, // 先用唯一不变的id查
      ver: apiVersion,
      ...rParams,
    })
      .then(({ success, data }) => {
        if (!success) return;
        const type = GetQueryString('type');
        if (data.length === 0 && type === 'card') {
          // 卡片编辑器，且无接口返回 兼容老卡片
          getIdbyUid({
            sysCardId: pageId, // 卡片统一获取自增的卡片ID
          })
            .then(({ success, data }) => {
              if (!success) return;
              setSpeId(data.id);
              getRelatedApiList({
                pageId: data.id, // 查不到再用可变的id查
                ver: apiVersion,
                ...rParams,
              })
                .then(({ success, data }) => {
                  if (!success) return;
                  // v8.6.0 添加接口引用个数
                  const apiList = data.map((um) => {
                    return {
                      ...um,
                      referCount: getApiReferCount(um.interfaceCode, apiReferList),
                    };
                  });
                  setRelatedApiList(apiList);
                })
                .catch((err) => {
                  console.error(err);
                  setRelatedApiList([]);
                });
            })
            .catch((err) => {
              console.error(err);
            });
        } else {
          // 页面编辑器
          // v8.6.0 添加接口引用个数
          const apiList = data.map((um) => {
            return {
              ...um,
              referCount: getApiReferCount(um.interfaceCode, apiReferList),
            };
          });
          setRelatedApiList(apiList);
        }
      })
      .catch((error) => {
        console.error(error);
        setRelatedApiList([]);
      });
  }, [pageId, rParams, apiVersion, apiReferList]);

  // v8.6.0 解除接口关联
  const delApiRelated = async (interfaceCode) => {
    try {
      const res = await deleteApiRelated({
        interfaceCode, // 换成不变的code
        pageId, // 先用唯一不变的id查
      });
      if (res.success) {
        message.success('取消关联成功');
        getRApiList();
      } else {
        // 兼容老大屏
        const res2 = await deleteApiRelated({
          interfaceCode, // 换成不变的code
          pageId: speId, // 兼容之前卡片用可变id存的数据
        });
        if (res2.success) {
          message.success('取消关联成功');
          getRApiList();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // const getId = useCallback(() => {
  //   const type = GetQueryString('type');
  //   if (type === 'card') {
  //     getIdbyUid({
  //       sysCardId: pageId // 卡片统一获取自增的卡片ID
  //     })
  //       .then(({ success, data }) => {
  //         if (!success) return;
  //         if (data.id.length > 5) return; // 后续创建的卡片都是用唯一不变的id
  //         setSpeId(data.id);
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   }
  // }, [pageId]);

  const onParameter = (data) => {
    setSaveParam(data);
  };

  // 保存或重置
  const onOk = (apiInfos, str, paramList) => {
    // 接口刷新
    const type = GetQueryString('type');
    addApiRelated({
      interfaceCode: apiInfo.interfaceCode || apiInfos.interfaceCode, // 换成不变的code
      // pageId: pageId, // 保存引用关系都用不变的id
      pageId: type === 'card' ? window.screenConfig.pageId : pageId, // 卡片用的短id存的接口引用关系
      id: apiInfo.interfaceFilterId || apiInfos.interfaceFilterId,
      paramsJson: str === 'rest' ? '' : JSON.stringify(paramList),
      apiId: apiInfo.id || apiInfos.id, // 通过id保存引用关系兼容项目现场没有升级大屏
      ver: apiVersion,
    })
      .then(({ success }) => {
        if (!success) return;
        setVisible(false);
        message.success('配置保存成功');
        getRApiList();
      })
      .catch((error) => error);
  };

  // 关闭编辑弹框
  const onCancel = () => {
    setVisible(false);
    // 接口刷新
    // const api = _.cloneDeep(apiInfo);
    // setApiInfo(api);
  };

  // 打开接口引用关系弹框
  const onRefer = (api) => {
    setReferVisible(true);
    setApiInfo(api);
  };

  // const onClose = () => setVisible(false);

  // const onFinish = (values) => {
  //   setP(values);
  // };
  // const onReset = () => {
  //   form.resetFields();
  //   setP({});
  // };

  // v7.8.0 关联页面搜索处理
  const onFinish2 = (values) => {
    setRParams(values);
  };

  const onReset2 = () => {
    rForm.resetFields();
    setRParams({});
  };

  // const onChangeRelated = (value, interfaceCode, id) => {
  //   if (value === true) {
  //     const type = GetQueryString('type');
  //     addApiRelated({
  //       interfaceCode: interfaceCode, // 换成不变的code
  //       // pageId: pageId, // 保存引用关系都用不变的id
  //       pageId: type === 'card' ? window.screenConfig.pageId : pageId, // 卡片用的短id存的接口引用关系
  //       apiId: id, // 通过id保存引用关系兼容项目现场没有升级大屏
  //       ver: apiVersion,
  //     })
  //       .then(({ success, data, message: msg }) => {
  //         if (!success) return;
  //         message.success('关联成功');
  //         getRApiList();
  //       })
  //       .catch((err) => err);
  //   } else {
  //     deleteApiRelated({
  //       interfaceCode: interfaceCode, // 换成不变的code
  //       pageId: pageId, // 先用唯一不变的id查
  //     })
  //       .then(({ success, data, message: msg }) => {
  //         if (!success) {
  //           // 兼容老大屏
  //           deleteApiRelated({
  //             interfaceCode: interfaceCode, // 换成不变的code
  //             pageId: speId, // 兼容之前卡片用可变id存的数据
  //           })
  //             .then(({ success, data, message: msg }) => {
  //               if (!success) return;
  //               message.success('取消关联成功');
  //               getRApiList();
  //             })
  //             .catch((err) => err);
  //         } else {
  //           message.success('取消关联成功');
  //           getRApiList();
  //         }
  //       })
  //       .catch((err) => err);
  //   }
  // };

  // const commonColumns = [
  //   {
  //     title: '序号',
  //     width: 68,
  //     dataIndex: 'number',
  //     align: 'center',
  //     render: (text, record, i) => i + 1,
  //   },
  //   {
  //     title: '接口名称',
  //     width: 168,
  //     dataIndex: 'interfaceName',
  //   },
  //   {
  //     title: '接口地址',
  //     dataIndex: 'url',
  //   },
  //   {
  //     title: '请求方式',
  //     width: 124,
  //     dataIndex: 'method',
  //   },
  // ];

  // const columns = [
  //   {
  //     title: '关联本页面',
  //     width: 112,
  //     dataIndex: 'interfaceCode',
  //     align: 'center',
  //     render: (interfaceCode, item) => (
  //       <Checkbox
  //         checked={relatedApiList.some((api) => interfaceCode === api.interfaceCode)}
  //         onChange={(e) => onChangeRelated(e.target.checked, interfaceCode, item.id)}
  //       />
  //     ),
  //   },
  //   ...commonColumns,
  // ];

  const onShowEditDrawer = (api) => {
    setVisible(true);
    setApiInfo(api);
  };

  const relatedColumns = [
    // ...commonColumns,
    {
      title: '序号',
      width: 68,
      dataIndex: 'number',
      align: 'center',
      render: (text, record, i) => i + 1, // 序号从1开始
      // render: (text, record, i) =>
      //   (paginationProps.current - 1) * paginationProps.pageSize + (i + 1)
    },
    {
      title: '接口名称',
      dataIndex: 'interfaceName',
      render: (text, record) => (
        <Tooltip placement='top' title={record.url}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '初始化状态',
      align: 'center',
      width: 124,
      dataIndex: 'configStatus',
      render: (text, record) => {
        return <span>{record.configStatus ? '已设置' : '未设置'}</span>;
      },
    },
    {
      title: '请求方式',
      align: 'center',
      width: 124,
      dataIndex: 'method',
    },
    {
      title: '引用次数',
      align: 'center',
      width: 104,
      dataIndex: 'referCount',
    },
    {
      title: '操作',
      width: 300,
      align: 'center',
      dataIndex: 'active',
      render: (text, record) => (
        <span>
          <a onClick={() => onShowEditDrawer(record)}>参数初始化</a>
          <Divider type='vertical' className={s.line} />
          <a onClick={() => onOk(record, 'rest')}>重置</a>
          <Divider type='vertical' className={s.line} />
          <a onClick={() => onRefer(record)}>引用关系</a>
          {record.referCount === 0 && (
            <>
              <Divider type='vertical' className={s.line} />
              <a onClick={() => delApiRelated(record.interfaceCode)}>取消关联</a>
            </>
          )}
        </span>
      ),
    },
  ];

  // 无用
  // const fromData = [
  //   {
  //     label: '接口名称',
  //     id: 'name',
  //     render: () => <Input placeholder='请输入' />,
  //   },
  //   {
  //     label: '请求方式',
  //     id: 'method',
  //     render: () => (
  //       <Select
  //         getPopupContainer={(triggerNode) => triggerNode.parentNode}
  //         style={{ width: '100%' }}
  //         placeholder='请输入'
  //       >
  //         <Option value='GET' key='GET'>
  //           GET
  //         </Option>
  //         <Option value='POST' key='POST'>
  //           POST
  //         </Option>
  //       </Select>
  //     ),
  //   },
  // ];
  // 关联接口相关过滤条件
  const fromData2 = [
    {
      label: '接口名称',
      id: 'interfaceName',
      render: () => <Input placeholder='请输入' />,
    },
    {
      label: '请求方式',
      id: 'method',
      render: () => (
        <Select
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          style={{ width: '100%' }}
          placeholder='请输入'
        >
          <Option value='GET' key='GET'>
            GET
          </Option>
          <Option value='POST' key='POST'>
            POST
          </Option>
        </Select>
      ),
    },
  ];

  // 固定获取关联列表
  const typeTable = {
    // all: (
    //   <FecthTable
    //     rowKey={'id'}
    //     columns={columns}
    //     className={s.table}
    //     tableProps={{
    //       ...tableProps,
    //       size: 'middle',
    //     }}
    //     paginationProps={paginationProps}
    //   />
    // ),
    related: (
      <Table
        pagination={false}
        rowKey='id'
        columns={relatedColumns}
        className={s.table}
        dataSource={relatedApiList}
        bordered
        size='middle'
      />
    ),
  };

  useEffect(() => {
    if (!window.globalEventEmitter) return;
    const mergeCard = (data) => {
      const newArr = [...relatedApiList, ...data];
      setRelatedApiList(_.uniqWith(newArr, _.isEqual));
    };
    window.globalEventEmitter.on('cardApiList', mergeCard);
  }, [relatedApiList]);

  useEffect(() => {
    getRApiList();
  }, [getRApiList]);

  // useEffect(() => {
  //   getId();
  // }, [getId]);

  // useEffect(() => {
  //   // v7.8.0 全部处理
  //   let value = categoryId;
  //   if (value === -1) {
  //     value = undefined;
  //   }
  //   const obj = {
  //     categoryId: value,
  //     ...p,
  //   };
  //   if (_.isEqual(params, obj)) {
  //     return;
  //   }
  //   setParams(obj);
  //   // v7.8.0 搜索条件改变，重置页码发请求
  //   paginationProps.onChange && paginationProps.onChange(1);
  // }, [categoryId, p, params]);

  return (
    <div className={s.rightWrap}>
      {/* {type === 'all' ? (
        <Form key='form1' form={form} onFinish={onFinish}>
          <Row gutter={18}>
            {fromData.map(({ id, label, render }) => (
              <Col key={id} {...layout}>
                <FormItem name={id} label={label}>
                  {render()}
                </FormItem>
              </Col>
            ))}
            <Col {...layout}>
              <FormItem>
                <Button style={{ marginRight: 8 }} onClick={onReset} type='default'>
                  重置
                </Button>
                <Button type='primary' htmlType='submit'>
                  搜索
                </Button>
              </FormItem>
            </Col>
          </Row>
        </Form>
      ) : ( */}
      <Form key='form2' form={rForm} onFinish={onFinish2}>
        <Row gutter={18}>
          {fromData2.map(({ id, label, render }) => (
            <Col key={id} {...layout}>
              <FormItem name={id} label={label}>
                {render()}
              </FormItem>
            </Col>
          ))}
          <Col {...layout}>
            <FormItem>
              <Button style={{ marginRight: 8 }} onClick={onReset2} type='default'>
                重置
              </Button>
              <Button type='primary' htmlType='submit'>
                搜索
              </Button>
            </FormItem>
          </Col>
        </Row>
      </Form>
      {/* )} */}
      {/* <RadioGroup
        value={type}
        onChange={(e) => {
          setType(e.target.value);
        }}>
        <RadioButton value="all">全部</RadioButton>
        <RadioButton value="related">关联本页面</RadioButton>
      </RadioGroup> */}
      {typeTable.related}
      <EditApi
        visible={visible}
        pageId={speId}
        apiInfo={apiInfo}
        saveParam={saveParam}
        onOk={onOk}
        onCancel={onCancel}
        onParameter={onParameter}
      />
      {referVisible ? (
        <Refer
          visible={referVisible}
          onCancel={() => setReferVisible(false)}
          apiInfo={apiInfo}
          dataSource={apiReferList}
        />
      ) : null}
    </div>
  );
}

export default Right;
