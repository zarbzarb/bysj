import React, { forwardRef, useCallback, useImperativeHandle, useState, useMemo, useRef } from 'react';
import { observer } from 'mobx-react';
import { Input, Tree, Tooltip, message } from 'antd';
import { useMount, useDebounceFn } from 'ahooks';
import { MinusCircleOutlined, SearchOutlined, CaretDownOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { isPlainObject } from 'lodash';
import { Scrollbars } from 'react-custom-scrollbars';
import dayjs from 'dayjs';
import { getIndicatorCatalogs, getIndicatorInfo } from '@/services/apis/indicatorApi';
import { TriggerRequest } from '@/TriggerAction/DataQueray';
import { Store } from '@/store/index';
import { URL_INDICATORS_VALUES, HOST_INDICATOR } from '@/utils/constant';
import iconCollapse from '@/assets/svg/icon-collapse-bordered.svg';
import iconExpand from '@/assets/svg/icon-expand-bordered.svg';
import { catalogsToTreeData, getFilteredTreeData } from '../../utils';
import ParamsForm from './ParamsForm';
import IndicatorDetail from './IndicatorDetail';
import styles from './index.less';

const { globalStore } = Store;

// 指标面板
const IndicatorPane = forwardRef(function IndicatorPane({ dynamic, updateDynamicData }, ref) {
  const [searchText, setSearchText] = useState(''); // 搜索文本
  const [treeData, setTreeData] = useState([]); // 分类数据
  const [myCheckedKeys, setMyCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]); // 已展开的节点
  const [autoExpandParent, setAutoExpandParent] = useState(false); // 自动展开父节点
  const [selectedIndicators, setSelectedIndicators] = useState([]); // 已选择的指标
  const [currentIndicatorId, setCurrentIndicatorId] = useState(); // 当前选择的指标
  const [indicatorEntities, setIndicatorEntities] = useState({}); // 指标实体信息
  const [indicatorListCollapsed, setIndicatorListCollapsed] = useState(false); // 是否收起“指标列表”

  const originalTreeData = useRef([]); // 保存原始的 treeData
  const formRef = useRef(null);

  const currentIndicatorInfo = useMemo(() => {
    const data = indicatorEntities[currentIndicatorId];
    return data || null;
  }, [indicatorEntities, currentIndicatorId]);

  // 是否需要开始时间和结束时间请求参数
  const needTime = useMemo(() => {
    if (selectedIndicators.length === 0) return false;
    for (const indicator of selectedIndicators) {
      const indicatorInfo = indicatorEntities[indicator.id];
      if (!indicatorInfo) return false;
      if (!indicatorInfo.bindings?.time) return false;
    }
    return true;
  }, [selectedIndicators, indicatorEntities]);

  const fetchCatalogs = useCallback(async () => {
    try {
      const params = {
        format: 'compact', // 返回数据格式:full/compact
        loadDimension: true, // 是否加载指标维度信息，默认false
      };
      const res = await getIndicatorCatalogs(params);
      const data = catalogsToTreeData(res.data);
      setTreeData(data);
      originalTreeData.current = data;
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchIndicatorInfo = useCallback(
    async (id, callback) => {
      try {
        const res = await getIndicatorInfo(id);
        setIndicatorEntities({
          ...indicatorEntities,
          [id]: res.data,
        });
        setCurrentIndicatorId(id); // 页面关闭后重新打开时，指标详情id为上一次最后选中的id

        if (typeof callback === 'function') {
          callback(res.data);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [indicatorEntities],
  );

  const handleTreeNodeSelect = useCallback(
    (selectedKeys, e) => {
      // console.log(selectedKeys, e);
      setCurrentIndicatorId(e.node.id);

      if (!indicatorEntities[e.node.id]) {
        fetchIndicatorInfo(e.node.id);
      }
    },
    [fetchIndicatorInfo, indicatorEntities],
  );

  const handleTreeNodeCheck = useCallback(
    (checkedKeys, e) => {
      // console.log(checkedKeys, e);
      if (e.checked) {
        if (selectedIndicators.length > 0 && e.node.indicatorDimensions !== selectedIndicators[0].indicatorDimensions) {
          message.warning('指标维度不同无法同时选择');
          return;
        }

        setMyCheckedKeys(checkedKeys);
        setCurrentIndicatorId(e.node.id);
        fetchIndicatorInfo(e.node.id);
        if (!selectedIndicators.some((v) => v.key === e.node.key)) {
          setSelectedIndicators([
            ...selectedIndicators,
            {
              id: e.node.id, // 指标ID（同一个指标可能出现在多个分类，所以需要 node.key 作为唯一标识）
              title: e.node.title, // 指标中文名称
              name: e.node.name, // 指标英文名称
              key: e.node.key, // 节点ID
              indicatorDimensions: e.node.indicatorDimensions, // 指标维度信息
            },
          ]);
        }
      } else {
        setMyCheckedKeys(checkedKeys);
        const indicators = selectedIndicators.filter((v) => v.key !== e.node.key);
        setSelectedIndicators(indicators);
      }
    },
    [fetchIndicatorInfo, selectedIndicators],
  );

  const removeIndicator = useCallback(
    (item) => {
      setSelectedIndicators(selectedIndicators.filter((v) => v.key !== item.key));
      setMyCheckedKeys(myCheckedKeys.filter((key) => key !== item.key));
    },
    [selectedIndicators, myCheckedKeys],
  );

  const doSearch = useDebounceFn(
    (_treeData, _searchText) => {
      const query = _searchText.trim();
      if (!query) {
        setTreeData([..._treeData]);
        setExpandedKeys([]);
        setAutoExpandParent(false);
        return;
      }

      const expandedKeysSet = new Set();
      const filteredTreeData = getFilteredTreeData(_treeData, query, expandedKeysSet);
      // console.log(filteredTreeData, expandedKeysSet);
      setTreeData(filteredTreeData);
      setExpandedKeys([...expandedKeysSet]);
      setAutoExpandParent(true);
    },
    { wait: 500 },
  );

  const handleSearchTextChange = useCallback(
    (e) => {
      setSearchText(e.target.value);

      doSearch.run(originalTreeData.current, e.target.value);
    },
    [doSearch],
  );

  const handleTreeExpand = useCallback((newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  }, []);

  useMount(() => {
    fetchCatalogs();

    // 如果已经选择过指标数据，需要回显出来
    if (dynamic.source.id && dynamic.source.id.startsWith('indicatorValues_')) {
      // TODO 8.0 dynamicApis
      const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));

      const currentApi = dynamicApis.find((api) => api.id === dynamic.source.id);
      if (currentApi) {
        const { id, interfaceName, params, indicatorNames, _startTimestamp, _endTimestamp } = currentApi;
        const indicatorKeys = currentApi.indicatorKeys || currentApi.interfaceCode;

        // 解析出指标ID和参数等信息
        const indicatorIds = id
          .split('_')
          .slice(1)
          .map((v) => Number(v));
        const keys = indicatorKeys.split(',');
        const names = indicatorNames ? indicatorNames.split(',') : undefined;
        const titles = interfaceName.split(',');
        const values = {};
        params.forEach((v) => {
          if (v.name !== '_id' && v.name !== '_format') {
            if (v.name === '_start') {
              values[v.name] = _startTimestamp ? dayjs(_startTimestamp) : undefined;
            } else if (v.name === '_end') {
              values[v.name] = _endTimestamp ? dayjs(_endTimestamp) : undefined;
            } else if (v.name === '_orders') {
              values[v.name] = v.example ? v.example.split(',') : undefined;
            } else {
              values[v.name] = v.example;
            }
          }
        });

        fetchIndicatorInfo(indicatorIds[0], (indicatorInfo) => {
          const indicatorDimensions = indicatorInfo.dimensions
            .map((v) => v.id)
            .sort()
            .join('-');
          setSelectedIndicators(
            indicatorIds.map((v, i) => ({
              id: v,
              title: titles[i],
              name: names ? names[i] : undefined,
              key: keys[i],
              indicatorDimensions,
            })),
          );
          setMyCheckedKeys(keys);

          // 等表单创建之后，再更新它的值
          setTimeout(() => {
            formRef.current.setFieldsValue(values);
          }, 200);
        });
      }
    }
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        submit(callback) {
          if (selectedIndicators.length === 0) {
            message.warning('请选择指标');
            return;
          }
          if (formRef.current.hasError()) return;

          const values = formRef.current.getFieldsValue();
          console.log({ values }, { needTime });
          if (!needTime) {
            delete values._start;
            delete values._end;
          }
          if (values._start && values._end && values._start.valueOf() > values._end.valueOf()) {
            message.warning('开始时间不能大于结束时间');
            return;
          }
          if (typeof callback === 'function') {
            // 关闭弹窗
            callback();
          }

          const indicatorIds = [...new Set(selectedIndicators.map((v) => v.id))]; //  需要去重
          const params = {
            ...values,
            _format: 'raw_merged', // 返回数据格式:raw/raw_merged/general/general_merged
            _id: indicatorIds.join(','), // 指标ID集合
          };
          params._start = params._start ? dayjs(params._start).format('YYYY-MM-DD HH:mm:ss') : undefined;
          params._end = params._end ? dayjs(params._end).format('YYYY-MM-DD HH:mm:ss') : undefined;
          params._orders = params._orders ? params._orders.join(',') : undefined;

          // 兼容动态数据的接口参数和 headers
          const paramList = Object.keys(params).map((name) => ({
            id: name,
            name,
            example: params[name],
            type: params[name] !== undefined ? typeof params[name] : 'string',
            paramType: name !== '_id' && name !== '_format' ? 'query' : undefined, // paramType 可选值有 query，body，header
            queryFlag: false,
          }));

          const resultMetadata = {};
          selectedIndicators.forEach((v) => {
            if (v.name) {
              resultMetadata[`_${v.name}`] = v.title;
            }
          });
          if (currentIndicatorInfo?.dimensions) {
            currentIndicatorInfo.dimensions.forEach((v) => {
              resultMetadata[v.name] = v.friendlyName;
            });
          }
          resultMetadata.__time = '业务时间';
          // console.log({ resultMetadata });

          const indicators = indicatorIds.map((id) => selectedIndicators.find((v) => v.id === id));
          const id = `indicatorValues_${indicatorIds.join('_')}`; // 接口唯一标识
          const interfaceName = indicators.map((v) => v.title).join(','); // 接口回显名称
          const url = HOST_INDICATOR + URL_INDICATORS_VALUES;
          const currentApi = {
            method: 'get',
            url,
            source: 1,
            contentType: undefined,
            isIndicator: true,
            resultMetadata, // v8.6 新增“返回数据元信息”
          };

          const apiInfo = {
            id,
            interfaceName,
            url,
            params: paramList,
            contentType: currentApi.contentType, // v7-10-0 添加参数contentType
            headers: [],
            apiInfo: currentApi,
            isIndicator: true, // v7.11 新增字段，表示是否为指标接口
            indicatorKeys: indicators.map((v) => v.key).join(','), // 把指标在树中的节点 key 保存下去
            indicatorNames: indicators.map((v) => v.name).join(','), // 保存指标英文名称，方便回显时还原
            _startTimestamp: values._start ? values._start.valueOf() : undefined, // 保存开始时间的 unix 时间戳，方便回显时还原
            _endTimestamp: values._end ? values._end.valueOf() : undefined, // 保存结束时间的 unix 时间戳，方便回显时还原
          };
          console.log({ apiInfo });
          TriggerRequest(
            {
              apiInfo: apiInfo.apiInfo,
              headers: apiInfo.headers,
              paramList: apiInfo.params, // 选择接口时使用接口的配置参数
              contentType: apiInfo.contentType, // v7-10-0 添加参数contentType
            },
            (data) => {
              if (data?.code === '403') {
                if (window.DataI.isConfigPage()) {
                  message.warning(`${interfaceName}接口已被禁用`);
                }
                return;
              }
              if (data?.code === '501') {
                if (window.DataI.isConfigPage()) {
                  message.warning('接口请求失败，多个指标不能存在相同的维度值列！');
                }
                return;
              }
              if (!Array.isArray(data)) {
                if (window.DataI.isConfigPage()) {
                  message.warning(`${interfaceName}接口数据不符合规范!`);
                }
                return;
              }

              // 全局存储选择过的api
              globalStore.updateDynamicApis(apiInfo);

              const setting = {
                ...dynamic,
                source: {
                  ...dynamic.source,
                  id: apiInfo.id,
                  params: [...apiInfo.params, ...apiInfo.headers],
                },
                dimensionMap: dynamic.dimensionMap.map((dims) => {
                  dims.row = [];
                  return dims;
                }),
              };
              updateDynamicData(data, setting);
            },
          );
        },
      };
    },
    [dynamic, needTime, selectedIndicators, updateDynamicData],
  );

  return (
    <div className={cls(styles.indicatorPane, 'indicator-pane')}>
      <div className={cls(styles.left, styles.card)}>
        <div className={styles.title}>分类</div>
        <div className={styles.search}>
          <Input
            size='default'
            className={styles.searchInput}
            placeholder='请输入指标名称搜索'
            value={searchText}
            onChange={handleSearchTextChange}
            suffix={<SearchOutlined style={{ color: '#4CDDE6', fontSize: 16 }} />}
          />
        </div>
        <div className={styles.tree}>
          <Scrollbars autoHide>
            <Tree
              checkable
              switcherIcon={<CaretDownOutlined style={{ fontSize: 12, color: '#04BAD2' }} />}
              treeData={treeData}
              checkedKeys={myCheckedKeys}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onSelect={handleTreeNodeSelect}
              onCheck={handleTreeNodeCheck}
              onExpand={handleTreeExpand}
            />
          </Scrollbars>
        </div>
      </div>

      <div className={cls(styles.middle, styles.card)}>
        <Scrollbars autoHide>
          <div className={styles.scrollContainer}>
            <div className={cls(styles.title, styles.expandable)}>
              <span>指标列表：</span>
              <img
                src={indicatorListCollapsed ? iconExpand : iconCollapse}
                onClick={() => setIndicatorListCollapsed(!indicatorListCollapsed)}
                alt=''
              />
            </div>
            <table className={cls({ hidden: indicatorListCollapsed })}>
              <tr>
                <th>指标名称</th>
                <th className={styles.operation}>操作</th>
              </tr>
              {selectedIndicators.map((item) => (
                <tr key={item.key}>
                  <td>{item.title}</td>
                  <td className={styles.operation}>
                    <Tooltip title='移除'>
                      <MinusCircleOutlined style={{ color: 'red' }} onClick={() => removeIndicator(item)} />
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </table>

            {selectedIndicators.length > 0 && indicatorEntities[selectedIndicators[0].id] && (
              <>
                <div className={styles.title}>请求参数：</div>
                <ParamsForm
                  ref={formRef}
                  dimensions={indicatorEntities[selectedIndicators[0].id].dimensions}
                  needTime={needTime}
                  selectedIndicators={selectedIndicators}
                />
              </>
            )}
          </div>
        </Scrollbars>
      </div>

      <div className={cls(styles.right, styles.card)}>
        <Scrollbars autoHide>
          <div className={styles.title}>指标详情</div>
          <IndicatorDetail currentIndicatorInfo={currentIndicatorInfo} />
        </Scrollbars>
      </div>
    </div>
  );
});

export default observer(IndicatorPane);
