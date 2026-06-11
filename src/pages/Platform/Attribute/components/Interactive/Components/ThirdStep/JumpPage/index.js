import React, { Fragment, useState, useMemo } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { Row, Col, Input, Tooltip, Select, TreeSelect } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useStore } from '@/hooks';
import { GetQueryString } from '@/utils/BrowserUtils';
import { getCurrentAction, setCurrentAction } from '../../../utils';
import styles from './index.less';

const options = [
  {
    value: '_router',
    label: '切换页面',
  },
  {
    value: '_self',
    label: '覆盖当前页面',
  },
  {
    value: '_blank',
    label: '打开标签页',
  },
];

const Index = ({ comp, parentIdx, idx }) => {
  const stores = useStore();
  const {
    pageTreeStore: { pageTree, homePageId },
    pageTabsStore: { selectedKey },
  } = stores;

  const pageType = GetQueryString('type');

  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = getCurrentAction(eventSettings, parentIdx, idx);

  // 跳转页面配置
  const { target, url, appPageId } = item?.actionSettings || {};

  // 刷新状态值
  const [count, setCount] = useState(0);

  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = getCurrentAction(eventSettings, parentIdx, idx);
    } catch (error) {
      console.error(error);
    }
  };
  /**
   * 点击切换跳转方式变量设值
   * @param {*} val
   */
  const changeTargetHandler = (val) => {
    updateEventSettings();
    item.actionSettings.target = val;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  /**
   * 页面链接变量设值
   * @param {*} evt
   */
  const changeURLHandler = (evt) => {
    updateEventSettings();
    item.actionSettings.url = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  /**
   * 选择页面
   * @param {*} val
   */
  const handlePageTreeChange = (val) => {
    updateEventSettings();
    item.actionSettings.appPageId = val || '';
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  /**
   * 刷新组件
   */
  const refresh = () => {
    setCount(count + 1);
  };

  const treeData = useMemo(() => {
    const loop = (tree) => {
      return tree.map((item) => {
        const obj = {
          title: item.name,
          value: item.appPageId,
          disabled: item.type === 0 || selectedKey === item.appPageId || homePageId === item.appPageId, // 文件夹或当前页或主页禁用
        };
        if (item.children?.length) {
          return {
            ...obj,
            children: loop(item.children),
          };
        }
        return obj;
      });
    };
    const data = loop(pageTree);
    return data;
  }, [pageTree]);

  let curOptions = options;
  if (pageType !== 'page') {
    curOptions = options.slice(1);
  }

  return (
    <>
      <div className={styles.jumpPageContainer}>
        <Row className={styles.jumpPageValueRow}>
          <Col span={7}>跳转方式</Col>
          <Col span={17}>
            <Select onChange={changeTargetHandler} value={target} options={curOptions} />
          </Col>
        </Row>
        {target === '_router' ? (
          <Row className={styles.jumpPageValueRow}>
            <Col span={7}>选择页面</Col>
            <Col span={17}>
              <TreeSelect
                showSearch
                style={{
                  width: '100%',
                }}
                treeData={treeData}
                value={appPageId || undefined}
                dropdownStyle={{
                  maxHeight: 400,
                  overflow: 'auto',
                }}
                placeholder='请选择页面'
                allowClear
                treeDefaultExpandAll
                treeNodeFilterProp='title'
                onChange={handlePageTreeChange}
              />
            </Col>
          </Row>
        ) : (
          <Row className={styles.jumpPageValueRow}>
            <Col span={7}>
              页面链接
              <Tooltip title='要跳转页面的链接'>
                <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col span={17}>
              <Input value={url} onChange={changeURLHandler} placeholder='请输入页面的链接' />
            </Col>
          </Row>
        )}
      </div>
    </>
  );
};

export default observer(Index);
