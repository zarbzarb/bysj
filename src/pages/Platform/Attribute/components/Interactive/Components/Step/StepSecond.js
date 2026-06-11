import React, { useState, Fragment, memo, useEffect } from 'react';
import { Button, Collapse, Row, Col, TreeSelect, Divider } from 'antd';
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import QuoteTable from '@/components/QuoteTable';
import { createKeyName } from '@/utils/random';
import { Actions } from '@/staticJson/AnimationComponentsList';
import { addAnimate, stopAnimation } from '@/components/commons/AnimationComponents/TriggerAnimation';
import { visiableToggleHandler } from '@/EventHandlers/AnimateEvent';
import $ from 'jquery';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import PosInput from '../posInput';
import AnimationStep from './AnimationStep';
import ToggleVisibleComp from './ToggleVisibleComp';
import styles from './index.less';
import EventEmitSettings from '../EventEmitSettings';
import GisEventEmitSettings from '../GisEventEmitSettings';

const getComponent = window.DataI.getComponentByKey;

const { Panel } = Collapse;
const { SHOW_PARENT } = TreeSelect;

export default memo((props) => {
  const {
    // currentEvent,
    currentComponet,
    animateItem,
    monitoringKey,
    deleteItem,
    idx,
  } = props;

  const [relation, setRelation] = useState(animateItem.associatComponents || undefined);
  let currentUpdateComponet = null;
  let timer = null;
  if (animateItem.associatComponents) {
    currentUpdateComponet = getComponent(animateItem.associatComponents);
  }
  const [count, setCount] = useState(0);
  const [posAlign, setPosAlign] = useState('left');
  const [relationName, setRelationName] = useState(
    (currentUpdateComponet && currentUpdateComponet.name) || animateItem.associatComponentsName || '',
  );
  const [AnimationStepNum, setAnimationStepNum] = useState([{}]);
  const [currentAnimationObj, setCurrentAnimationObj] = useState();
  const [Postion, setPostion] = useState(animateItem.settings && animateItem.settings.startPosition);

  useEffect(() => {
    const arr = ['visiableToggle', 'dataQuery'];
    if (animateItem.settings && animateItem.settings.startPosition) {
    } else {
      if (arr.includes(animateItem.type)) {
        if (animateItem.settings === undefined) {
          animateItem.settings = {};
        }
        return;
      }
      animateItem.settings = {
        animationStep: [],
        startPosition: {},
      };
    }
  }, [animateItem]);

  const addAnimation = () => {
    const AnimationStepNumCopy = JSON.parse(JSON.stringify(AnimationStepNum));
    AnimationStepNumCopy.push({});
    setAnimationStepNum(AnimationStepNumCopy);
    animateItem.settings.animationStep.push({});
  };
  const onTreeChange = (e, label) => {
    const key = monitoringKey || createKeyName();
    setRelation(e);
    setRelationName(label[0]);
    animateItem.associatComponents = e;
    animateItem.associatComponentsName = label[0];
    const currentComp = getComponent(e); // 被绑定的组件
    animateItem.animateKey = key;
    if (currentComp.animateQueue) {
      currentComp.animateQueue.push(key);
    } else {
      currentComp.animateQueue = [key];
    }
    if (animateItem.type === 'visiableToggle') return;
    const { isPC } = window.screenConfig;
    animateItem.settings.animationStep.push({});
    const compAttr = (currentComp.instance && currentComp.instance.compAttr) || {};
    let posAlign = 'left';
    if (isPC && !compAttr.alignCenter && compAttr.compPos === 'right') {
      posAlign = 'right';
    }
    if (isPC && compAttr.alignCenter) {
      posAlign = 'center';
      if (compAttr.verticalPos === 'bottom') {
        posAlign = 'bottom';
      }
    }
    setPosAlign(posAlign);
    const transformArr = currentComp.styles.transform.split(/\s+/);
    let translateX;
    let translateY;
    try {
      translateX = Number(
        transformArr[0]
          .split('')
          .filter((item) => {
            return !isNaN(Number(item));
          })
          .join(''),
      );
    } catch {
      translateX = 0;
    }
    try {
      translateY = Number(
        transformArr[1]
          .split('')
          .filter((item) => {
            return !isNaN(Number(item));
          })
          .join(''),
      );
    } catch {
      translateY = 0;
    }
    setPostion({
      x: translateX,
      y: translateY,
    });

    animateItem.settings.startPosition = {
      x: translateX,
      y: translateY,
    };
  };
  const mapData = (data) => {
    return data.map((item) => {
      const obj = {
        title: item.name || item.compName,
        value: item.key,
      };
      if (item.childComList) {
        const arr = mapData(item.childComList);
        obj.children = arr;
      }
      if (item.layers) {
        const arr = mapData(item.layers);
        obj.children = arr;
      }
      return obj;
    });
  };
  const treeData = mapData(window.componentList);
  const tProps = {
    treeData,
    value: relation,
    onChange: onTreeChange,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '请选择',
  };
  const filterAction = Actions.find((item) => item.value === animateItem.type);

  const onChange = (val, e) => {
    animateItem.settings[val] = e;
    setPostion(e);
  };
  let alignText = '(左)';
  switch (posAlign) {
    case 'left':
      alignText = '(左)';
      break;
    case 'right':
      alignText = '(右)';
      break;
    case 'center':
      alignText = '(顶)';
      break;
    case 'bottom':
      alignText = '(底)';
      break;
  }
  return (
    <>
      {relationName && (
        <Collapse key='key1' className='secondCollapse' defaultActiveKey={['1']}>
          <Panel
            header={
              <div>
                <span>{`${relationName} ${filterAction.name}`}</span>{' '}
                <DeleteOutlined
                  title='删除'
                  className={styles.delSecondCollapse}
                  onClick={(e, i) => {
                    deleteItem(idx);
                  }}
                />
                <span
                  className={styles.test}
                  onClick={(e) => {
                    e.stopPropagation();
                    stopAnimation(currentAnimationObj);
                    if (animateItem.type === 'visiableToggle') {
                      visiableToggleHandler(animateItem);
                      return;
                    }

                    if ($(`[data-key="${animateItem.associatComponents}"]`).length === 0) return false;

                    const animateObj = addAnimate(
                      {
                        key: animateItem.associatComponents,
                      },
                      animateItem,
                    );
                    animateObj.start();
                    setCurrentAnimationObj(animateObj);
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                      animateObj.resetStartPosition();
                    }, 5000);
                  }}
                >
                  测试
                </span>
              </div>
            }
            key='1'
          >
            {animateItem.type !== 'dataQuery' &&
              animateItem.type !== 'eventEmit' &&
              animateItem.type !== 'visiableToggle' && (
                <>
                  <Row>
                    <Col span={7}>{`起始位置${alignText}`}</Col>
                    <Col span={17}>
                      <PosInput posAlign={posAlign} value={Postion} onChange={(e) => onChange('startPosition', e)} />
                    </Col>
                  </Row>
                  {animateItem.settings &&
                    animateItem.settings.animationStep.map((item, index) => {
                      return (
                        <>
                          <AnimationStep
                            key={index}
                            step={index + 1}
                            currentAnimateQueue={item}
                            animateItem={animateItem}
                            currentComponet={currentComponet}
                            alignText={alignText}
                            posAlign={posAlign}
                            deleteStepItem={(key) => {
                              const animationStep = JSON.parse(JSON.stringify(animateItem.settings.animationStep));
                              animationStep.splice(index, 1);
                              animateItem.settings.animationStep = animationStep;
                              setCount(count + 1);
                            }}
                          />
                          {index !== animateItem.settings.animationStep.length - 1 && <Divider />}
                        </>
                      );
                    })}
                  <Button
                    type='primary'
                    icon={<PlusCircleOutlined />}
                    className='addAnimationBtn'
                    onClick={addAnimation}
                  >
                    新增动画步骤
                  </Button>
                </>
              )}

            {animateItem.type === 'visiableToggle' && <ToggleVisibleComp {...props} />}
          </Panel>
        </Collapse>
      )}

      {/**  事件发布配置 */}
      {!relationName && animateItem.type === 'eventEmit' && (
        <EventEmitSettings
          idx={idx}
          {...props}
          delHandler={(idx) => {
            deleteItem(idx);
          }}
        />
      )}
      {/**  gis事件发布配置 */}
      {!relationName && animateItem.type === 'gisEventEmit' && (
        <GisEventEmitSettings
          idx={idx}
          {...props}
          delHandler={(idx) => {
            deleteItem(idx);
          }}
        />
      )}

      {!relationName && animateItem.type === 'sceneInteraction' && (
        <GisEventEmitSettings
          idx={idx}
          {...props}
          delHandler={(idx) => {
            deleteItem(idx);
          }}
        />
      )}

      {!relationName && animateItem.type !== 'eventEmit' && animateItem.type !== 'dataQuery' && (
        <Collapse key='key2' className='secondCollapse' defaultActiveKey={['1']}>
          <Panel
            header={
              <div>
                <span>{filterAction.name}</span>{' '}
                <DeleteOutlined
                  title='删除'
                  className={styles.delSecondCollapse}
                  onClick={(e, i) => {
                    deleteItem(idx);
                  }}
                />
              </div>
            }
            key='1'
          >
            <TreeSelect
              className='treeSelect'
              suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              {...tProps}
            />
          </Panel>
        </Collapse>
      )}
      {animateItem.type === 'dataQuery' && (
        <Collapse key='key3' className='secondCollapse' defaultActiveKey={['1']}>
          <Panel
            header={
              <div>
                <span>{filterAction.name}</span>{' '}
                <DeleteOutlined
                  title='删除'
                  className={styles.delSecondCollapse}
                  onClick={(e, i) => {
                    deleteItem(idx);
                  }}
                />
              </div>
            }
            key='1'
          >
            <QuoteTable {...props} />
            <div>
              <Button>测试</Button>
            </div>
          </Panel>
        </Collapse>
      )}
    </>
  );
});
