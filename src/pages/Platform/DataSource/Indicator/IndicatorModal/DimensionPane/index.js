import React, { forwardRef, useCallback, useImperativeHandle, useState, useMemo, useRef, useContext } from 'react';
import { observer } from 'mobx-react';
import { Input, Tree, Select, message } from 'antd';
import { isPlainObject } from 'lodash';
import { useMount, useDebounceFn } from 'ahooks';
import { SearchOutlined, CaretDownOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import { getIndicatorCatalogs, getIndicatorInfo } from '@/services/apis/indicatorApi';
import { Store } from '@/store/index';
import { TriggerRequest } from '@/TriggerAction/DataQueray';
import { URL_DIMENSIONS_VALUES, HOST_INDICATOR } from '@/utils/constant';
import styles from './index.less';
import { catalogsToTreeData, getFilteredTreeData } from '../../utils';

const { Option } = Select;

const { globalStore } = Store;

// 维度面板
const DimensionPane = forwardRef(function DimensionPane({ dynamic, updateDynamicData }, ref) {
  const [searchText, setSearchText] = useState(''); // 搜索文本
  const [treeData, setTreeData] = useState([]); // 分类数据
  const [expandedKeys, setExpandedKeys] = useState([]); // 已展开的节点
  const [autoExpandParent, setAutoExpandParent] = useState(false); // 自动展开父节点
  const [currentIndicatorId, setCurrentIndicatorId] = useState(); // 当前选择的指标
  const [currentDimensionId, setCurrentDimensionId] = useState(); // 当前选择的维度
  const [indicatorEntities, setIndicatorEntities] = useState({}); // 指标实体信息
  const [parentName, setParentName] = useState(); // 父维度名称

  const originalTreeData = useRef([]); // 保存原始的 treeData

  const currentIndicatorInfo = useMemo(() => {
    const data = indicatorEntities[currentIndicatorId];
    return data || null;
  }, [indicatorEntities, currentIndicatorId]);

  const needParentName = useMemo(() => {
    if (!currentIndicatorInfo || !currentDimensionId) return false;
    const dimensionInfo = currentIndicatorInfo.dimensions.find((v) => v.id === currentDimensionId);
    return dimensionInfo ? !!dimensionInfo.parentId : false;
  }, [currentDimensionId, currentIndicatorInfo]);

  // 接口回显名称
  const interfaceName = useMemo(() => {
    if (!currentIndicatorInfo) return '';
    const dimensionInfo = currentIndicatorInfo.dimensions.find((v) => v.id === currentDimensionId);
    // 指标名称 + 维度名称
    return `${currentIndicatorInfo.friendlyName}_${dimensionInfo?.friendlyName}`;
  }, [currentIndicatorInfo, currentDimensionId]);

  const fetchCatalogs = useCallback(async () => {
    try {
      const params = {
        format: 'compact', // 返回数据格式:full/compact
        loadDimension: false, // 是否加载指标维度信息，默认false
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
        if (typeof callback === 'function') {
          callback(res.data);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [indicatorEntities],
  );

  // 默认选择第一个维度值
  const setDefaultDemensionId = useCallback((indicatorInfo) => {
    const dimensions = indicatorInfo.dimensions.filter((v) => v.type === 1);
    if (dimensions.length > 0) {
      setCurrentDimensionId(dimensions[0].id);
    }
  }, []);

  const handleTreeNodeSelect = useCallback(
    (selectedKeys, e) => {
      // console.log(selectedKeys, e);
      setCurrentIndicatorId(e.node.id);

      if (!indicatorEntities[e.node.id]) {
        fetchIndicatorInfo(e.node.id, setDefaultDemensionId);
      } else {
        setDefaultDemensionId(indicatorEntities[e.node.id]);
      }
    },
    [fetchIndicatorInfo, indicatorEntities, setDefaultDemensionId],
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

    // 如果已经选择过维度数据，需要回显出来
    if (dynamic.source.id && dynamic.source.id.startsWith('indicatorDimensions_')) {
      // TODO 8.0 dynamicApis
      const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));

      const currentApi = dynamicApis.find((api) => api.id === dynamic.source.id);
      if (currentApi) {
        const { id, params } = currentApi;

        // 解析出指标ID、维度ID和参数
        const arr = id.split('_');
        const indicatorId = Number(arr[1]);
        const dimensionId = Number(arr[2]);
        const parentNameVal = params.find((v) => v.name === 'parentName')?.example;

        setCurrentIndicatorId(indicatorId);
        fetchIndicatorInfo(indicatorId, () => {
          setCurrentDimensionId(dimensionId);
          setParentName(parentNameVal);
        });
      }
    }
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        submit(callback) {
          if (!currentDimensionId) {
            message.warning('请选择维度名称');
            return;
          }

          // console.log(currentDimensionId, parentName);
          const params = {
            format: 'raw_merged', // 返回数据格式:raw/raw_merged/general/general_merged
            id: `${currentDimensionId}`, // 维度ID集合
          };
          if (needParentName) {
            params.parentName = parentName;
          }

          // 兼容动态数据的接口参数和 headers
          const paramList = Object.keys(params).map((name) => ({
            id: name,
            name,
            example: params[name],
            type: params[name] !== undefined ? typeof params[name] : 'string',
            paramType: name !== 'id' && name !== 'format' ? 'query' : undefined, // paramType 可选值有 query，body，header
            queryFlag: false,
          }));

          const resultMetadata = {
            id: '维度ID',
            name: '维度名称',
            value: '维度值',
            pid: '父维度ID',
          };

          const id = `indicatorDimensions_${currentIndicatorId}_${currentDimensionId}`; // 接口唯一标识
          const url = HOST_INDICATOR + URL_DIMENSIONS_VALUES;
          const currentApi = {
            method: 'get',
            url,
            source: 1,
            contentType: undefined,
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
          };
          // console.log({ apiInfo });
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
              if (!Array.isArray(data)) {
                if (window.DataI.isConfigPage()) {
                  message.warning(`${interfaceName}接口数据不符合规范!`);
                }
                return;
              }
              if (typeof callback === 'function') {
                callback();
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
    [currentDimensionId, parentName, needParentName, dynamic, updateDynamicData, currentIndicatorId, interfaceName],
  );

  return (
    <div className={styles.indicatorPane}>
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
              switcherIcon={<CaretDownOutlined style={{ fontSize: 12, color: '#04BAD2' }} />}
              treeData={treeData}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onSelect={handleTreeNodeSelect}
              onExpand={handleTreeExpand}
            />
          </Scrollbars>
        </div>
      </div>

      <div className={cls(styles.right, styles.card)}>
        <div>
          <span className={styles.subTitle}>指标名称：</span>
          {currentIndicatorInfo?.friendlyName}
        </div>

        <div style={{ marginTop: 16 }}>
          <span className={styles.subTitle}>维度名称：</span>
          <Select
            value={currentDimensionId}
            onChange={(val) => setCurrentDimensionId(val)}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            style={{ width: 220 }}
          >
            {currentIndicatorInfo &&
              currentIndicatorInfo.dimensions
                .filter((item) => item.type === 1)
                .map((v) => (
                  <Option key={v.id} value={v.id}>
                    {v.friendlyName}
                  </Option>
                ))}
          </Select>
        </div>

        {needParentName && (
          <div style={{ marginTop: 16 }}>
            <span className={styles.subTitle}>请求参数：</span>
            <table style={{ marginTop: 8 }}>
              <tr>
                <th>参数名</th>
                <th>值</th>
              </tr>
              <tr>
                <td>parentName</td>
                <td>
                  <Input value={parentName} onChange={(e) => setParentName(e.target.value)} />
                </td>
              </tr>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

export default observer(DimensionPane);
