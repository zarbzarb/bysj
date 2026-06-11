import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, TreeSelect, Modal } from 'antd';
import classNames from 'classnames';
// import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';

const { confirm } = Modal;

type IProps = {
  label?: string;
  appPageId: string | number;
  handlePageTreeChange: (val: string | number, type?: string) => void;
  colSpans?: number[];
  colClassName?: { left: string; right: string };
  className?: string;
  from?: string;
};

const Index: React.FC<IProps> = (props) => {
  const { label, appPageId, handlePageTreeChange, className, colSpans, colClassName, from } = props;
  const {
    pageTreeStore: { pageTree, homePageId },
    pageTabsStore: { selectedKey, getSimplePage },
  } = useStore();

  useEffect(() => {
    if (appPageId && appPageId !== selectedKey) {
      // 初始加载的时候选择跨页面，需要把组件获取到
      getSimplePage(appPageId, () => {
        handlePageTreeChange(appPageId, 'init');
      }); // 获取页面下的组件
    }
  }, []);

  const treeData = useMemo(() => {
    const loop = (tree: any) => {
      return tree.map((item: any) => {
        let isDisabled = false;
        if (from === 'CrossOriginMessage' && selectedKey !== homePageId) {
          isDisabled = ![selectedKey, homePageId].includes(item.appPageId);
        }
        const obj = {
          title: item.name,
          value: item.appPageId,
          disabled: item.type === 0 || isDisabled, // 文件夹
        };
        return item.children?.length
          ? {
              ...obj,
              children: loop(item.children),
            }
          : obj;
      });
    };
    const data = loop(pageTree);
    return data;
  }, [pageTree, selectedKey, homePageId]);

  const handleChange = (val: string | number) => {
    if (val === appPageId) return;
    confirm({
      getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
      title: '提示',
      content: '切换页面将清除被操作组件内容，是否确定切换？',
      onOk() {
        getSimplePage(val, () => {
          handlePageTreeChange(val, 'change');
        }); // 获取页面下的组件
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  const classes = classNames(styles.selectPage, className);

  return (
    <Row className={classes}>
      <Col className={colClassName.left} span={colSpans[0]}>
        {label}
      </Col>
      <Col className={colClassName.left} span={colSpans[1]}>
        <TreeSelect
          suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
          showSearch
          style={{
            width: '100%',
          }}
          treeData={treeData}
          value={appPageId || selectedKey}
          dropdownStyle={{
            maxHeight: 400,
            overflow: 'auto',
          }}
          placeholder='请选择'
          treeDefaultExpandAll
          treeNodeFilterProp='title'
          onChange={handleChange}
        />
      </Col>
    </Row>
  );
};

Index.defaultProps = {
  label: '操作页面',
  className: '',
  colSpans: [7, 17],
  colClassName: {
    left: '',
    right: '',
  },
};

export default Index;
