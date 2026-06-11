import React, { useMemo } from 'react';
import { Table, Tooltip } from 'antd';
import { useStore } from '@/hooks';
import { findPath } from '@/utils/common';
import DataI from '@/utils/global-api';
import styles from './index.less';

interface MapTableProps {
  dataParams: any[];
  editorType: string;
}

const MapTable: React.FC<MapTableProps> = ({ dataParams, editorType }) => {
  const { layerStore, editorStore } = useStore();
  const columns: any[] = [
    {
      title: '参数项',
      dataIndex: 'mapName',
      width: 80,
      height: 24,
      ellipsis: true,
      align: 'center',
    },
    {
      title: '数据类型',
      colSpan: 0,
      dataIndex: 'mapType',
      width: 80,
      height: 24,
      ellipsis: true,
      align: 'center',
    },
    {
      title: editorType === 'post' ? '数据目标' : '数据来源',
      colSpan: 2,
      dataIndex: 'mapInfo',
      height: 24,
      ellipsis: true,
      align: 'center',
      // render: (text) => {
      //   return (
      //     <Tooltip title={text}>
      //       <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
      //     </Tooltip>
      //   );
      // },
    },
  ];

  const dataSource = useMemo(() => {
    const dataType = ['手动输入', '组件数据', '变量', '选中值'];
    return dataParams
      .map((item) => {
        const {
          updateType = 3,
          inputVal,
          variableKey,
          compKey,
          interactDataItem,
          interactDataItemOptions,
          compDataItemOptions,
          compDataItem,
        } = item;
        const obj = {
          key: item.key,
          mapName: item.paramName,
          mapType: dataType[updateType - 1],
          mapInfo: undefined,
        };
        switch (updateType) {
          case 2: {
            const compPath = findPath(layerStore.comList, compKey);
            const layerKey = DataI.getComponentByKey(compKey)?.layerId;
            const compData = compDataItemOptions.find((v) => v.value === compDataItem)?.label;
            obj.mapInfo = compData
              ? `${layerStore.layers.find((layer) => layer.layerId === layerKey)?.layerName}/${compPath}/${compData}`
              : '';
            break;
          }
          case 3: {
            obj.mapInfo = findPath(window.dataStore, variableKey);
            break;
          }
          case 4: {
            const setCompKey = editorStore.changeKeys[0];
            const name = DataI.getComponentByKey(setCompKey)?.type;
            if (name === 'NewInput' || name === 'Input') {
              obj.mapType = '输入值';
            }
            obj.mapInfo = interactDataItemOptions.find((v) => v.value === interactDataItem)?.label;
            break;
          }
          default: {
            obj.mapInfo = inputVal;
            break;
          }
        }

        return obj;
      })
      .filter((item) => item.mapInfo);
  }, [dataParams]);

  const isShow = useMemo(() => {
    return dataParams.some((item) => {
      let bool = false;
      if (item.paramName === 'all' && item.variableKey) return true;
      if (item.updateType === 1 && item.inputVal) bool = true;
      if (item.updateType === 2 && item.compKey && item.compDataItem) bool = true;
      if (item.updateType === 3 && item.variableKey) bool = true;
      if (item.updateType === 4 && item.interactDataItem) bool = true;
      return bool;
    });
  }, [dataParams]);

  return isShow ? (
    <div className={styles.mapTableContainer}>
      <Table columns={columns} dataSource={dataSource} bordered pagination={false} />
    </div>
  ) : null;
};

export default MapTable;
