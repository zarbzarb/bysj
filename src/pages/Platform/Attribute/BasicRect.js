/**
 * 基础图形配置属性，设置宽高和位移
 */
import React, { useState } from 'react';
import { Row, Col } from 'antd';
import styles from '@/styles/pages/attr.less';
import { formatPosition } from '@/utils/analysis';

import _ from 'lodash';
import { Input, Switch, Select, GroupInputNumber } from '@yl/datai-ui';

const componentPos = [
  {
    label: '左侧定位',
    value: 'left',
  },
  {
    label: '右侧定位',
    value: 'right',
  },
];

const verticalPos = [
  {
    label: '顶部',
    value: 'top',
  },
  {
    label: '底部',
    value: 'bottom',
  },
];

export default ({ item }) => {
  const [x, y] = formatPosition(item.styles.transform);

  const { screenConfig } = item.instance;
  const { isPC } = screenConfig;
  const { isResponsive } = screenConfig;

  // v7.4解决二维地图-添加在线底图-组件宽或高设置为0-配置页面二维地图在线底图高德在线没有加载出来
  const showMapGaudOnlineChildLayer = (item, conditionValue) => {
    // 判断组件为二维地图，组件宽或高设置为0，并且有子组件
    if (conditionValue === 0 && item.englishName === 'MapFoundationPlan' && item.layers && item.layers.length > 0) {
      // 找到所有高德在线子组件
      const childLayers = item.layers.filter((layer) => {
        return layer.englishName === 'MapGaudOnline' && layer._attr?.mapType === 0;
      });
      // 子组件可见
      childLayers.forEach((layer) => {
        if (layer.instance.visible || layer.instance.visible == undefined) {
          layer.instance.show();
        }
      });
    }
  };

  return (
    <div>
      {(isPC && item.classType === 'group' && !item.groupKey) || isResponsive ? (
        <>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              百分比(横向尺寸)
            </Col>
            <Col flex='213px' className={styles.colDouble}>
              <Switch
                value={item.instance.compAttr.xPercent}
                onChange={(value) => {
                  item.instance.compAttr.xPercent = value;
                  // store.forceUpdate();
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              容器居中
            </Col>
            <Col flex='213px'>
              <Switch
                value={item.instance.compAttr.alignCenter}
                onChange={(value) => {
                  item.instance.compAttr.alignCenter = value;
                  if (value) {
                    item.instance.compAttr.compPos = 'left';
                  } else {
                    item.instance.compAttr.verticalPos = 'top';
                  }
                  // store.forceUpdate();
                }}
              />
            </Col>
          </Row>
          {item.instance.compAttr.alignCenter ? (
            <>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  垂直定位
                </Col>
                <Col flex='213px'>
                  <Select
                    value={item.instance.compAttr.verticalPos ? item.instance.compAttr.verticalPos : 'top'}
                    onChange={(value) => {
                      item.instance.compAttr.verticalPos = value;
                      // store.forceUpdate();
                    }}
                    data={verticalPos}
                  />
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  组件定位
                </Col>
                <Col flex='213px'>
                  <Select
                    value={item.instance.compAttr.compPos ? item.instance.compAttr.compPos : 'left'}
                    onChange={(value) => {
                      item.instance.compAttr.compPos = value;
                      // store.forceUpdate();
                    }}
                    data={componentPos}
                  />
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  {`${item.instance.compAttr.compPos === 'left' ? '左' : '右'}侧边距${
                    item.instance.compAttr.xPercent ? '(%)' : ''
                  }`}
                </Col>
                <Col flex='213px'>
                  <Input
                    value={x}
                    onChange={(value) => {
                      const str = `translate(${value}px, ${y}px)`;
                      item.styles.transform = str;
                      // store.forceUpdate();
                    }}
                    data={componentPos}
                  />
                </Col>
              </Row>
            </>
          )}
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              {`${item.instance.compAttr.verticalPos === 'bottom' ? '底' : '顶'}部边距`}
            </Col>
            <Col flex='213px'>
              <Input
                value={y}
                onChange={(value) => {
                  const str = `translate(${x}px, ${value}px)`;
                  item.styles.transform = str;
                  // store.forceUpdate();
                }}
              />
            </Col>
          </Row>
        </>
      ) : (
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            位置
          </Col>
          <Col flex='213px' className={styles.fieldInput}>
            <GroupInputNumber
              fields={['x', 'y']}
              value={{ x, y }}
              onChange={(value, field) => {
                const [innerX, innerY] = formatPosition(item.styles.transform);

                const str = `translate(${field === 'x' ? value ?? innerX : innerX}px, ${
                  field === 'y' ? value ?? innerY : innerY
                }px)`;

                if (str === item.styles.transform) return;

                window.executeCommand('updateAttr', item, 'transform', str);
              }}
            />
          </Col>
        </Row>
      )}
      {item.instance.compAttr.xPercent ? (
        <>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              宽度(%)
            </Col>
            <Col flex='213px'>
              <Input
                unit={1}
                type='number'
                value={Number.parseInt(item.styles.percentWidth ? item.styles.percentWidth : 100)}
                onChange={(value) => {
                  item.styles.percentWidth = value;
                  // store.forceUpdate();
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              高度
            </Col>
            <Col flex='213px'>
              <Input
                unit={1}
                type='number'
                value={Number.parseInt(item.styles.height)}
                onChange={(value) => {
                  item.styles.height = `${value}px`;
                  // store.forceUpdate();
                }}
              />
            </Col>
          </Row>
        </>
      ) : (
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            尺寸
          </Col>
          <Col flex='213px' className={styles.colDouble}>
            <GroupInputNumber
              value={item.styles}
              fields={['width', 'height']}
              onChange={(value, field) => {
                const conditionValue = Number.parseInt(item.styles[field]);
                if (_.isEqual(conditionValue, value)) return;
                window.executeCommand('updateAttr', item, field, `${value}px`);
                showMapGaudOnlineChildLayer(item, conditionValue);
              }}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};
