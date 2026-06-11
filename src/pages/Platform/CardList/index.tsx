import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { Row, Col, Form, Input, Button, Typography, Pagination, List, Spin, message, Collapse } from 'antd';
import drawerBack from '@/assets/newIcon/drawerBack.png';
import userCard from '@/assets/newIcon/useCard.png';
import marketCard from '@/assets/newIcon/marketCard.png';
import noConfig from '@/assets/newIcon/noConfig.png';
import { isPlainObject } from 'lodash';
import {
  // dynamicLoadVideoSource,
  dynamicLoadPlugins,
  dynamicLoadBasic,
  dynamicLoadChart,
  dynamicLoad2D,
  dynamicLoad3D,
  dynamicLoadGL,
} from '@/utils/loadScript';
import {
  ALLCARDLIST,
  CARDINFOBYID,
  CARDINFOBYUID,
  // FILECOPY,
  GETCATEGORYLIST,
  CUSTOMCAEDMARKETLIST,
  MARKETCARDINFOBYID,
} from '@/services/apis/CardApi';
import { getRelatedApiList, getIdbyUid, addApiRelatedByList } from '@/services/apis/dataManage';
import { useForm } from 'antd/lib/form/Form';
import { intNewComponent, resetKeys } from '@/utils/resetKeys';
import { DragEndPosition, DrawScrollPosition } from '@/Computed/PositionComputed';
import { changeComponentLevel } from '@/utils/configPageUtils';
import { setCompTransform } from '@/utils/transformUtils';
import { compatibleEventSettings, concatDataStore } from '@/utils/componentUtils';
// import { GetQueryString } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';
import CompLibStore from '@/store/module/ComLibStore';

const { Paragraph } = Typography;
const { Panel } = Collapse;
const { Item } = Form;

interface SearchFormProps {
  searchFn: (value: any) => void;
  inputFaInputFn: (value: string) => void;
}
/**
 * 搜索表单
 * @param props
 * @returns
 */
const SearchForm = (props: SearchFormProps) => {
  const [form] = useForm();
  const onFinish = (value) => {
    if (value.cardName === undefined) {
      message.warning('输入需要搜索的内容');
      return;
    }
    props.searchFn(value);
  };
  const inputFn = (value) => {
    props.inputFaInputFn(value);
  };
  // 卡片
  return (
    <Form className='card-form-search' form={form} size='small' name='form' onFinish={onFinish}>
      <Row>
        <Col span={16}>
          <Item name='cardName'>
            <Input placeholder='请输入名称' onChange={inputFn} />
          </Item>
        </Col>
        <Col span={8} style={{ paddingLeft: '6px' }}>
          <Item>
            <Button
              type='primary'
              onClick={() => {
                form.submit();
              }}
            >
              查询
            </Button>
          </Item>
        </Col>
        {/* <Col span={12}>
          <Item name="templateType" label="类型">
            <Select placeholder="请选择">
              <Option value="">全部</Option>
              <Option value="1">卡片模板</Option>
              <Option value="2">业务模板</Option>
            </Select>
          </Item>
        </Col> */}
        {/* <Col span={24} className="right">
          <Item>
            <Space>
              <Button
                onClick={() => {
                  form.resetFields();
                  form.submit();
                }}>
                重置
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  form.submit();
                }}>
                查询
              </Button>
            </Space>
          </Item>
        </Col> */}
      </Row>
    </Form>
  );
};
const staticCard = [
  { id: 1, cardTypeName: '自定义卡片', image: userCard },
  { id: 2, cardTypeName: '卡片集市', image: marketCard },
];
export default (props) => {
  const {
    globalStore,
    editorStore,
    cardStore,
    controlStore,
    compLibStore,
    layerStore,
    serviceStore,
    pageTreeStore,
    versionStore: { apiVersion },
  } = useStore();
  const { bigScreenId, bigScreenType, isApp } = globalStore;
  const { activeLayerId } = layerStore;
  const { changeTabsHandler } = controlStore;
  const { sourceLoaded, setSourceLoaded, mapResLoaded, setMapResLoaded } = compLibStore;
  const { getCardApiList } = cardStore;
  // 卡片列表
  const [list, setList] = useState([]);
  // 自定义卡片
  const [cardSortList, setCardSortList] = useState();
  // 卡片集市
  const [marketSortList, setMarketSortList] = useState([]);
  // 自定义卡片1，卡片集市2
  const [typeStr, setTypeStr] = useState(1);
  // 是否搜索状态
  const [isSearch, setIsSearch] = useState(false);
  // 是否loading状态
  const [loading, setLoading] = useState(true);
  // 当前分类
  const sortIdRef = useRef();
  const paramsRef = useRef(null);
  // 搜索页码
  const pageParamsRef = useRef({
    currentPage: 1,
    pageSize: 30,
    totalCount: 0,
  });
  // 自定义卡片页码
  const paginationRef = useRef({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    sortId: undefined,
    quote: false,
  });

  // 卡片集市
  const getMarketCardList = useCallback(
    async (obj, type?) => {
      setLoading(true);
      setList([]);
      if (type === 'init') {
        // 获取分类
        const res = await GETCATEGORYLIST({ sortType: 2, includeCount: true });
        if (Number(res.code) === 200) {
          setMarketSortList(res.data);
          // 需要考虑空数组的情况
          if (Array.isArray(res.data) && res.data.length > 0) {
            obj.sortId = res.data[0].id;
            sortIdRef.current = obj.sortId;
          }
        }
      }
      obj.quote = true;
      // 获取卡片列表
      const rs = await CUSTOMCAEDMARKETLIST(obj);
      if (Number(rs.code) === 200) {
        const cardList = rs.data.records.filter((item) => {
          return item.status === 3;
        });
        if (isSearch) {
          pageParamsRef.current.totalCount = rs.data.totalCount;
        } else {
          paginationRef.current.totalCount = rs.data.totalCount;
        }
        setList(cardList);
        setLoading(false);
      }
    },
    [isSearch],
  );
  // 自定义
  const getCardList = useCallback(
    async (obj, type?) => {
      setLoading(true);
      setList([]);
      if (type === 'init') {
        // 获取分类

        const res = await GETCATEGORYLIST({ sortType: 1, includeCount: true });
        if (Number(res.code) === 200) {
          setCardSortList(res.data);
          // 需要考虑空数组的情况
          if (Array.isArray(res.data) && res.data.length > 0) {
            obj.sortId = res.data[0].id;
            sortIdRef.current = obj.sortId;
          }
        }
      }
      const rs = await ALLCARDLIST(obj);
      if (Number(rs.code) === 200) {
        const cardList = rs.data.records || [];
        if (isSearch) {
          pageParamsRef.current.totalCount = rs.data.totalCount;
        } else {
          paginationRef.current.totalCount = rs.data.totalCount;
        }
        setList(cardList);
        setLoading(false);
      }
    },
    [isSearch],
  );
  // 搜索框
  const searchHandler = useCallback(
    (formValues) => {
      setIsSearch(true);
      paramsRef.current = { ...formValues };
      let obj = {};
      if (typeStr === 1) {
        obj = {
          ...pageParamsRef.current,
          ...paramsRef.current,
        };
        getCardList(obj);
      } else {
        obj = {
          ...pageParamsRef.current,
          keyword: formValues.cardName,
        };
        getMarketCardList(obj);
      }
    },
    [typeStr, getCardList, getMarketCardList],
  );

  // 清空输入框
  const inputFaInput = (value) => {
    if (value.target.value) {
      setIsSearch(false);
      sortIdRef.current = undefined;
      if (typeStr === 1) {
        getCardList(paginationRef.current, 'init');
      } else {
        getMarketCardList(paginationRef.current, 'init');
      }
    }
  };
  // 切换集市，自定义列表
  const changeSideBar = (menuIndex) => {
    if (typeStr === menuIndex) return;
    paginationRef.current.currentPage = 1;
    sortIdRef.current = undefined;
    setIsSearch(false);
    setTypeStr(menuIndex);
    if (menuIndex === 1) {
      getCardList(paginationRef.current, 'init');
    } else {
      getMarketCardList(paginationRef.current, 'init');
    }
  };

  // 点击分类请求数据
  const changeCategory = async (id) => {
    // 避免重复请求
    if (id !== undefined && id !== sortIdRef.current) {
      setList([]);
      setLoading(true);
      // 页码重置为1
      paginationRef.current.currentPage = 1;
      // 设置分类
      paginationRef.current.sortId = id;
      paginationRef.current.quote = true;
      // 是否是自定义还是集市
      const rs = await (typeStr === 1
        ? ALLCARDLIST(paginationRef.current)
        : CUSTOMCAEDMARKETLIST(paginationRef.current));
      if (Number(rs.code) === 200) {
        sortIdRef.current = id;
        paginationRef.current.totalCount = rs.data.totalCount;
        // 获取卡片
        setList(rs.data.records || []);
        setLoading(false);
      }
    }
  };
  /**
   * 搜索页码切换
   * @param currentPage
   */
  const paginationChange = (currentPage) => {
    pageParamsRef.current.currentPage = currentPage;
    const marketSearchName = {
      keyword: paramsRef.current?.cardName,
    };
    const obj = {
      ...pageParamsRef.current,
      ...(typeStr === 1 ? paramsRef.current : marketSearchName),
    };
    if (typeStr === 1) {
      getCardList(obj);
    } else {
      getMarketCardList(obj);
    }
  };
  // 卡片页码切换
  const cardPaginationChange = async (values) => {
    paginationRef.current.currentPage = values;
    paginationRef.current.sortId = sortIdRef.current;
    paginationRef.current.quote = true;
    const rs = await (typeStr === 1 ? ALLCARDLIST(paginationRef.current) : CUSTOMCAEDMARKETLIST(paginationRef.current));
    if (Number(rs.code) === 200) {
      // 获取卡片
      setList(rs.data.records || []);
      setLoading(false);
    }
  };

  const getCardApi = async (item) => {
    try {
      const { cardUid } = item;
      const { success, data } = await getRelatedApiList({ pageId: cardUid, ver: apiVersion });
      if (!success) return;
      if (data.length === 0) {
        const { success: success1, data: data1 } = await getIdbyUid({ sysCardId: cardUid });
        if (!success1) return;
        const { success: success2, data: data2 } = await getRelatedApiList({ pageId: data1.id, ver: apiVersion });
        if (!success2) return;
        // 更新关联接口的id不是当前卡片id，该是当前屏id
        getCardApiList(bigScreenId, data2);
      } else {
        // 更新关联接口的id不是当前卡片id，应该是当前屏id
        getCardApiList(bigScreenId, data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const replaceCrossLevel = (comList, level) => {
    comList.forEach((child) => {
      child.level = level + 1;
      if (child.classType === 'group' || child?.isDragContainer) {
        replaceCrossLevel(child.childComList, child.level);
      }
    });
  };

  const setCardLayerId = (com, layerId) => {
    if (com.childComList && com.childComList.length > 0) {
      com.childComList.forEach((v) => {
        v.layerId = layerId;
        setCardLayerId(v, v.layerId);
      });
    }
  };

  // 大屏设计器中点击卡片列表中的卡片调用
  const changeCardHandler = async (item, position) => {
    let rs;
    const { id } = item;
    if (typeStr === 2) {
      rs = await MARKETCARDINFOBYID({ id }); // 查询卡片集市中的卡片配置信息
    } else if (id.length > 5) {
      rs = await CARDINFOBYUID({ sysCardId: id }); // 目前自增的卡片ID长度没有超过5，后续新建的卡片详情都走这里查询
    } else {
      rs = await CARDINFOBYID({ sysCardId: id });
    }
    if (Number(rs?.code) !== 200) return;
    let json = rs?.data?.jsonConfig; // 反转义
    if (json === undefined || json === 'undefined') {
      message.warning('卡片未配置，请先行配置卡片信息！');
      return;
    }
    // v7.4 替换卡片信息里的key
    json = resetKeys(json);
    // 解析卡片信息
    json = JSON.parse(json);
    // 获取卡片的变量dataStore
    const dataStoreJson = json.dataStore || [];
    // 获取卡片的关联接口relatedApis
    const copyRelatedApi = json.relatedApis || []; // 关联接口
    let dynamicApis = json.screenConfig?.dynamicApis ?? [];
    if (Array.isArray(dynamicApis)) {
      dynamicApis = dynamicApis.filter((api) => isPlainObject(api));
    }

    let comList = [];
    // 卡片本身不是数组
    if (!Array.isArray(json)) {
      // 全部为一级组件，去掉父组key
      comList = json.componentList.map((v) => {
        v.groupKey = undefined;
        return v;
      });
      // 重置层级
      changeComponentLevel(comList, 1);
    }
    // 重新初始化组件, 不要直接使用 activeLayerId， 要从 layerStore 取，这样才是最新值！
    intNewComponent(comList, layerStore.activeLayerId, bigScreenType);
    // 合并变量
    if (dataStoreJson) {
      if (!window.dataStore) {
        window.dataStore = [];
      }
      // let newKeyArr = resetDataKey(dataStoreJson, codeId);
      // const nerArr = [...dataStoreJson, ...window.dataStore];
      // window.dataStore = nerArr;

      concatDataStore(dataStoreJson);
      // TODO 应用自动保存变量
      // if (isApp) {
      //   serviceStore.saveAPP();
      // }
    }
    // if (!Array.isArray(dataStoreJson)) {
    //   newJson = newJson.componentList;
    // }
    // v7.4 添加卡片
    window.DataI.each(comList, (component) => {
      // 组件树转为map映射
      window.DataI.setComInfoMap(component);

      // 卡片的创建状态
      component.comCreated = !component.comInvisible;

      // 历史配置的卡片中的事件转换为动作组
      compatibleEventSettings(component.eventSetings ?? []);
    });
    if (comList.length === 1) {
      const com = comList[0];
      setCompTransform(com, position[0], position[1]);
      // 执行数据更新
      // 只更新当前选中图层数据
      const componentList = editorStore.getCompList(true);
      // 更新页面组件树
      // if (bigScreenType !== 'card') {
      com.layerId = layerStore.activeLayerId;
      setCardLayerId(com, com.layerId);

      // 卡片插入对应图层
      const insertIndex = componentList.findIndex((v) => v.layerId === layerStore.activeLayerId);
      if (insertIndex === -1) {
        componentList.splice(0, 0, com);
      } else {
        componentList.splice(insertIndex, 0, com);
      }
      if (editorStore.editModePaths.length !== 1) {
        // 所有需要对组件列表进行操作，都调用次函数操作当前图层数据(增加、删除、移动、成组、复制)
        layerStore.updateCurrentLayerComList(componentList);
      }
      // } else {
      //   componentList.unshift(com);
      // }
      let pasteToType = 'normal';
      let editComp;
      if (editorStore.editModePaths.length > 0) {
        editComp = editorStore.getEditComp(editorStore.editModePaths);
        if (editComp?.type === 'DynamicPanel' || editComp?.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          pasteToType = 'dynamicPanel';
        } else if (editComp?.type === '@yl/dataq-com-group-basic' || editComp?.isDragContainer) {
          pasteToType = 'group';
        }
      }
      // 更新卡片本身groupKey和level
      if (pasteToType === 'group') {
        com.groupKey = editComp.key;
        replaceCrossLevel(componentList, editComp.level);
      } else if (pasteToType === 'dynamicPanel') {
        // v8.17 新增折叠面板
        replaceCrossLevel([com], 0);
      }
      // v7.6.0 新增组支持选中
      editorStore.changeComponents([com.key]);
    }
    // console.log(window.componentList);
    // 添加关联接口
    if (copyRelatedApi.length > 0) {
      const apiParams = {
        filters: copyRelatedApi.map(({ interfaceCode, id: apiId }) => {
          return {
            interfaceCode, // 换成不变的code
            pageId: bigScreenId,
            apiId, // 通过id保存引用关系兼容项目现场没有升级大屏
          };
        }),
      };
      const res = await addApiRelatedByList(apiParams);
      if (Number(res?.code) !== 200) {
        message.error('关联接口失败');
      }
    }
    console.log('dynamicApis', dynamicApis);
    if (dynamicApis.length > 0) {
      globalStore.mergeDynamicApis(dynamicApis);
    }
    editorStore.forceUpdate();
    if (isApp) {
      pageTreeStore.setPageInfoStep(1);
    }
  };

  const handleOpenCollapse = (e) => {
    // console.log('handleOpenCollapse', e);
    if (typeStr === 2 && e && (e.length === 0 || !JSON.parse(e[0])?.isLeaf)) {
      // 卡片集市非叶子节点面板不调接口，因为卡片集市分类只有叶子节点才有卡片
      return;
    }
    // console.log('e', e);
    if (e.length > 0) {
      changeCategory(JSON.parse(e[0]).id);
    }
  };

  // 提取单个面板渲染逻辑，方便复用
  const renderPanel = (item, index, level) => {
    return (
      <Panel
        header={`${item.sortName}(${item.sortCount})`}
        key={index}
        className={`isleaf-panel card-market-panel-${level}`}
      >
        <Spin spinning={loading}>
          <List
            grid={{ column: 2 }}
            dataSource={list}
            renderItem={(em) => (
              <List.Item
                draggable='true'
                onDragEnd={(evt) => {
                  // v7.4 当前卡片不可添加
                  if (em.cardUid === bigScreenId && bigScreenType === 'card') {
                    message.warning('请勿添加当前卡片自身！');
                    return;
                  }
                  const position = DragEndPosition({
                    x: evt.clientX,
                    y: evt.clientY,
                  });
                  if (position === undefined) return;
                  changeCardHandler(em, position);
                  getCardApi(em);
                }}
                onClick={() => {
                  // v7.4 当前卡片不可添加
                  if (em.cardUid === bigScreenId && bigScreenType === 'card') {
                    message.warning('请勿添加当前卡片自身！');
                    return;
                  }
                  const position = DrawScrollPosition();
                  changeCardHandler(em, position);
                  getCardApi(em);
                }}
              >
                <div className='card-info'>
                  {em.previewImg ? (
                    <img
                      alt='卡片预览图'
                      className='card-image'
                      src={
                        em.previewImg && em.previewImg.includes('/storage/file/v1/console/downloadFileByUrl')
                          ? `/iocoss/${em.previewImg.replace(/.+\?url=/, '')}`
                          : em.previewImg && em.previewImg.includes('/iocoss/')
                          ? em.previewImg
                          : `/iocoss/${em.previewImg}`
                      }
                    />
                  ) : (
                    <div
                      className='card-image'
                      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      <img alt='未配置' src={noConfig} />
                    </div>
                  )}

                  <Paragraph
                    className='card-title'
                    ellipsis={{
                      rows: 1,
                      expandable: true,
                    }}
                    title={`${em.cardName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {em.cardName}
                  </Paragraph>
                  <div />
                </div>
              </List.Item>
            )}
          />
          {list.length > 0 && (
            <div className='right'>
              <Pagination
                size='small'
                simple={true}
                onChange={cardPaginationChange}
                current={paginationRef.current.currentPage}
                pageSize={paginationRef.current.pageSize}
                total={paginationRef.current.totalCount}
              />
            </div>
          )}
        </Spin>
      </Panel>
    );
  };

  // 渲染卡片集市，嵌套面板
  const renderMarketCollapse = (arr = [], level = 1) => {
    if (Array.isArray(arr)) {
      return (
        <Collapse onChange={handleOpenCollapse} accordion>
          {arr &&
            arr.map((item) => {
              const isLeaf = !item.childrenList?.length;
              const key = JSON.stringify({
                id: item.id,
                sortName: item.sortName,
                parentId: item.parentId,
                sortCount: item.sortCount,
                sortType: item.sortType,
                isLeaf,
              });
              if (!isLeaf) {
                return (
                  <Panel
                    header={`${item.sortName}(${item.sortCount})`}
                    key={key}
                    className={`card-market-panel card-market-panel-${level}`}
                  >
                    {renderMarketCollapse(item.childrenList, level + 1)}
                  </Panel>
                );
              }
              return renderPanel(item, key, level);
            })}
        </Collapse>
      );
    }
  };

  // 动态加载地图资源
  const dynamicLoadMapSource = useCallback(() => {
    if (!mapResLoaded) {
      const promise1 = dynamicLoad2D([], true);
      const promise2 = dynamicLoad3D([], true);
      const promise3 = dynamicLoadGL([], true);
      Promise.allSettled([promise1, promise2, promise3])
        .then((results) => {
          setMapResLoaded(true);
          return results;
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  }, [mapResLoaded, setMapResLoaded]);

  /**
   * 加载资源
   */
  useLayoutEffect(() => {
    if (!sourceLoaded) {
      // 加载视频播放器资源
      // dynamicLoadVideoSource([], true);
      // 加载第三方插件
      dynamicLoadPlugins([], true);
      // 加载基础组件
      dynamicLoadBasic();
      // 加载报表组件
      dynamicLoadChart();
      // 加载地图资源
      dynamicLoadMapSource();
      setSourceLoaded(true);
    }
  }, [dynamicLoadMapSource, setSourceLoaded, sourceLoaded]);

  /**
   * 初次请求
   */
  useLayoutEffect(() => {
    paginationRef.current.currentPage = 1;
    const obj = {
      ...paginationRef.current,
      ...paramsRef.current,
    };
    getCardList(obj, 'init');
    return () => {};
  }, []);

  return (
    <div className={props.className}>
      <div className='card-list-title'>
        卡片列表
        <div>
          {/* 收起按钮 */}
          <img
            alt='收起'
            src={drawerBack}
            onClick={() => {
              changeTabsHandler('card');
            }}
          />
        </div>
      </div>
      {/* 搜索框 */}
      <SearchForm searchFn={searchHandler} inputFaInputFn={inputFaInput} />
      <div className='card-list-container antd-dark'>
        {/*  侧边菜单栏 */}
        <div className='com-type-bar'>
          <ul>
            {staticCard.map((item, i) => {
              return (
                <li
                  key={i}
                  className={typeStr === item.id ? 'active' : ''}
                  onClick={() => {
                    // 切换侧边栏
                    changeSideBar(item.id);
                  }}
                >
                  <img alt='' className='market-img' title={item.cardTypeName} src={item.image} draggable='false' />
                </li>
              );
            })}
          </ul>
        </div>
        <div className='com-by-type-list'>
          {isSearch ? (
            // 搜索
            <div>
              {/* <div className="card-info-list "> */}
              <Spin spinning={loading}>
                <List
                  grid={{ column: 2 }}
                  dataSource={list}
                  renderItem={(item) => (
                    <List.Item
                      draggable='true'
                      onDragEnd={(evt) => {
                        // v7.4 当前卡片不可添加
                        if (item.cardUid === bigScreenId && bigScreenType === 'card') {
                          message.warning('请勿添加当前卡片自身！');
                          return;
                        }
                        const position = DragEndPosition({
                          x: evt.clientX,
                          y: evt.clientY,
                        });
                        if (position === undefined) return;
                        changeCardHandler(item, position);
                      }}
                      onClick={() => {
                        // v7.4 当前卡片不可添加
                        if (item.cardUid === bigScreenId && bigScreenType === 'card') {
                          message.warning('请勿添加当前卡片自身！');
                          return;
                        }
                        const position = DrawScrollPosition();
                        changeCardHandler(item, position);
                        getCardApi(item);
                      }}
                    >
                      <div className='card-info'>
                        {item.previewImg ? (
                          <img
                            alt='卡片预览图'
                            className='card-image'
                            src={
                              item.previewImg && item.previewImg.includes('/storage/file/v1/console/downloadFileByUrl')
                                ? `/iocoss/${item.previewImg.replace(/.+\?url=/, '')}`
                                : item.previewImg && item.previewImg.includes('/iocoss/')
                                ? item.previewImg
                                : `/iocoss/${item.previewImg}`
                            }
                          />
                        ) : (
                          <div
                            className='card-image'
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                          >
                            <img alt='未配置' src={noConfig} />
                          </div>
                        )}
                        <Paragraph
                          className='card-title'
                          ellipsis={{
                            rows: 1,
                            expandable: true,
                          }}
                          title={`${item.cardName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {item.cardName}
                        </Paragraph>

                        <div />
                      </div>
                    </List.Item>
                  )}
                />
              </Spin>
              {/* </div> */}

              <div className='right'>
                <Pagination
                  size='small'
                  simple={true}
                  onChange={paginationChange}
                  current={pageParamsRef.current.currentPage}
                  pageSize={pageParamsRef.current.pageSize}
                  total={pageParamsRef.current.totalCount}
                />
              </div>
            </div>
          ) : typeStr === 1 ? (
            renderMarketCollapse(cardSortList)
          ) : (
            renderMarketCollapse(marketSortList)
          )}
        </div>
      </div>
    </div>
  );
};
