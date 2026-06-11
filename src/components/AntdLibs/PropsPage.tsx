import React, { useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { Row } from 'antd';
import { isEqual, get, cloneDeep } from 'lodash';
import { listerAttrWraperScroll } from '@/utils/componentUtils';
import type { PropsParamsType } from 'Src/types/CompType';
import DataRef from './common/DataRef';
import s from './index.less';

export default (props: PropsParamsType) => {
  const scrollEle = useRef<HTMLDivElement>(null);
  const multiDatasetRef = useRef<any>({});

  useEffect(() => {
    /** 滚动时关闭下拉面板 */
    scrollEle?.current?.addEventListener('scroll', listerAttrWraperScroll);
    return () => {
      scrollEle?.current?.removeEventListener('scroll', listerAttrWraperScroll);
    };
  }, []);

  const { styles, el, PropsPage, updateDataSource } = props;
  const type = el.type.charAt(0).toUpperCase() + el.type.slice(1);
  const Comp = PropsPage;

  let { dataset } = el;
  multiDatasetRef.current = el?.dataset?.multiDataset || {};
  const { titleData, labelData, contentData } = multiDatasetRef.current;
  const updateMultiDataSource = useCallback(
    (field?: any, parentPath?: any, value?: any) => {
      const newMultiDataset = cloneDeep(multiDatasetRef.current);
      const parentObject = newMultiDataset[parentPath] || {};
      if (isEqual(get(parentObject, field), value)) {
        return;
      }
      parentObject[field] = value;
      newMultiDataset[parentPath] = parentObject;
      updateDataSource('multiDataset', newMultiDataset);
      multiDatasetRef.current = newMultiDataset;
    },
    [updateDataSource],
  );

  const { dataSourceType } = el.props;

  // 描述列表组件数据源支持多种，dataset为null，没有DataRef
  if (dataSourceType === 'multiple') {
    dataset = null;
  }

  return (
    <div className={classNames(styles.demo, s.wrap)} ref={scrollEle}>
      <Row className={styles.field}>
        {type !== 'Input' && <Comp {...props} />}
        {dataset && <DataRef {...props} />}
        {/* 描述列表组件数据有多来源 */}
        {dataSourceType === 'multiple' && (
          <>
            <DataRef
              {...props}
              updateMultiDataSource={updateMultiDataSource}
              parentPath='titleData'
              title='标题数据源'
              dataset={titleData}
            />
            <DataRef
              {...props}
              updateMultiDataSource={updateMultiDataSource}
              parentPath='labelData'
              title='label数据源'
              dataset={labelData}
            />
            <DataRef
              {...props}
              updateMultiDataSource={updateMultiDataSource}
              parentPath='contentData'
              title='内容数据源'
              dataset={contentData}
            />
          </>
        )}
      </Row>
    </div>
  );
};
