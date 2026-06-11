import React, { memo } from 'react';
import { Row, Col, Radio, Switch } from 'antd';
import { Select, InputNumber, GroupInputNumber } from '@yl/datai-ui';
import {
  AnimationSettingTypes,
  VisibleTypes,
  ShowAnimationTypes,
  HideAnimationTypes,
  MoveTypes,
  MoveAnimationTypes,
  SizeModeTypes,
  getNameForValue,
} from '@/staticJson/AnimationComponentsList';
import { useStore } from '@/hooks';
import CompTree from '../../components/CompTree';
import SelectPage from '../../components/SelectPage';
import styles from './index.less';

const isNeedGradual = (effect) => {
  const animationEffectList = ['gradually', 'none'];
  if (effect) {
    return !animationEffectList.includes(effect);
  }
  return false;
};

const isSlideAnimation = (effect) => {
  if (effect) {
    return effect.includes('slide');
  }
  return false;
};

const { Option } = Select;

// 兼容旧屏
const compatible = (setting, selectedKey) => {
  if (setting.appPageId === undefined) {
    setting.appPageId = selectedKey;
  }
};

// 单个动作配置
const AnimateSetting = memo(({ setting, parentRefresh, type }) => {
  const {
    pageTabsStore,
    globalStore: { bigScreenType },
  } = useStore();
  compatible(setting, pageTabsStore.selectedKey); // 兼容旧屏
  const actions = AnimationSettingTypes.filter((action) => {
    // 去掉初始化`显示/隐藏`,`等待`事件
    if (type === 'initialization') return !['showHide', 'waitingInterval'].includes(action.value);

    return true;
  });

  /**
   * 切换动作,修改动作类型，并同时修改animationName
   * @param {object} value animationType
   */
  const changeAnimation = (value) => {
    const label = getNameForValue(value, actions);
    setting.animationType = value;
    setting.animationName = label;
    parentRefresh();
  };

  /**
   * 更新属性值
   * @param {*} value 对应的值
   * @param {*} field 对应的属性名
   */
  const updateAttribute = (value, field) => {
    setting[field] = value;
    parentRefresh();
  };

  /**
   * 选择页面
   * @param {*} value 对应页面的 id
   * @param {*} field 对应页面的 id 属性名
   * @param {*} compFiled 操作组件的属性名
   */
  const handlePageTreeChange = (value, typeChange, field, compFiled) => {
    setting[field] = value;
    if (typeChange !== 'init') {
      setting[compFiled] = undefined; // 重置被操作组件
    }
    parentRefresh();
  };

  return (
    <div>
      {/* 请选择动作 */}
      <Row className={styles.animteRow}>
        <Col className={styles.label} span={8}>
          请选择动作
        </Col>
        <Col span={16}>
          <Select
            className={styles.inputSelect}
            onChange={(value) => {
              console.log('value', value);
              changeAnimation(value);
            }}
            value={setting.animationType || ''}
            placeholder='请选择动作'
          >
            {actions?.map((item, idx) => {
              return (
                <Option value={item.value} key={idx}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </Col>
      </Row>

      {/* 显示/隐藏配置 */}
      {setting.animationType === 'showHide' && (
        <>
          {/* 选择页面 */}
          {bigScreenType === 'page' && (
            <SelectPage
              className={styles.animteRow}
              colSpans={[8, 16]}
              colClassName={{ left: styles.label }}
              appPageId={setting.appPageId}
              handlePageTreeChange={(value, type) => {
                handlePageTreeChange(value, type, 'appPageId', 'associatComponents');
              }}
            />
          )}
          {/* 被操作组件 */}
          <Row className={styles.animteRow} style={{ marginBottom: 12 }}>
            <Col className={styles.label} span={8}>
              被操作组件
            </Col>
            <Col span={16}>
              <CompTree
                relation={setting.associatComponents}
                appPageId={setting.appPageId}
                onTreeChange={(value) => {
                  console.log('value', value);
                  updateAttribute(value, 'associatComponents');
                }}
              />
            </Col>
          </Row>
          {/* 选择效果 */}
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              请选择效果
            </Col>
            <Col span={16}>
              <Radio.Group
                onChange={(evt) => {
                  updateAttribute(evt.target.value, 'visible');
                }}
                className={styles.effectSelect}
                value={setting.visible}
              >
                {VisibleTypes.map((item, idx) => {
                  return (
                    <Radio.Button value={item.value} key={idx}>
                      {item.name}
                    </Radio.Button>
                  );
                })}
              </Radio.Group>
            </Col>
          </Row>
          {(setting.visible === '0' || setting.visible === '2') && (
            <>
              <Row className={styles.animteRow}>
                <Col className={styles.label} span={8}>
                  显示动画
                </Col>
                <Col span={16}>
                  <Select
                    className={styles.inputSelect}
                    onChange={(value) => {
                      console.log('value', value);
                      updateAttribute(value, 'visibleEffect');
                    }}
                    value={setting.visibleEffect}
                    placeholder='请选择动画效果'
                  >
                    {ShowAnimationTypes.map((item, idx) => (
                      <Option value={item.value} key={idx}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              {/* 动画类型 */}
              {isSlideAnimation(setting.visibleEffect) && (
                <>
                  <Row className={styles.animteRow}>
                    <Col className={styles.label} span={8}>
                      动画类型
                    </Col>
                    <Col span={16}>
                      <Radio.Group
                        size='small'
                        onChange={(evt) => {
                          console.log('evt.target.value', evt.target.value);
                          updateAttribute(evt.target.value, 'visibleAnimationMode');
                        }}
                        value={setting.visibleAnimationMode || '1'}
                      >
                        <Radio value='1'>原位置</Radio>
                        <Radio value='2'>偏移</Radio>
                      </Radio.Group>
                    </Col>
                  </Row>
                  {/* 偏移距离 */}
                  {setting.visibleAnimationMode === '2' && (
                    <Row className={styles.animteRow}>
                      <Col className={styles.label} span={8}>
                        偏移距离
                      </Col>
                      <Col className={styles.fullCol} span={16}>
                        <InputNumber
                          className={styles.unitInput}
                          min={0}
                          value={setting.visibleOffsetDistance || 400}
                          onChange={(value) => {
                            updateAttribute(value, 'visibleOffsetDistance');
                          }}
                          placeholder='请输入'
                        />
                        <span className={styles.unitText}>px</span>
                      </Col>
                    </Row>
                  )}
                </>
              )}
              {/* 动画时长 */}
              <Row className={styles.animteRow}>
                <Col className={styles.label} span={8}>
                  动画时长
                </Col>
                <Col className={styles.fullCol} span={16}>
                  <InputNumber
                    className={styles.unitInput}
                    value={setting.visibleDuration}
                    min={0}
                    disabled={!setting.visibleEffect || setting.visibleEffect === 'none'}
                    onChange={(value) => {
                      updateAttribute(value, 'visibleDuration');
                    }}
                    placeholder='请输入'
                  />
                  <span className={styles.unitText}>毫秒</span>
                </Col>
              </Row>
              {/* 渐变 */}
              {isNeedGradual(setting.visibleEffect) && (
                <Row className={styles.animteRow}>
                  <Col className={styles.label} span={8}>
                    渐变
                  </Col>
                  <Col span={16}>
                    <Switch
                      checked={setting.visibleIsGradual || false}
                      onChange={(value) => {
                        updateAttribute(value, 'visibleIsGradual');
                      }}
                    />
                  </Col>
                </Row>
              )}
            </>
          )}
          {(setting.visible === '1' || setting.visible === '2') && (
            <>
              <Row className={styles.animteRow}>
                <Col className={styles.label} span={8}>
                  隐藏动画
                </Col>
                <Col span={16}>
                  <Select
                    className={styles.inputSelect}
                    onChange={(value) => {
                      console.log('value', value);
                      updateAttribute(value, 'hideEffect');
                    }}
                    value={setting.hideEffect}
                    placeholder='请选择动画效果'
                  >
                    {HideAnimationTypes.map((item, idx) => {
                      return (
                        <Option value={item.value} key={idx}>
                          {item.name}
                        </Option>
                      );
                    })}
                  </Select>
                </Col>
              </Row>
              {/* 动画类型 */}
              {isSlideAnimation(setting.hideEffect) && (
                <>
                  <Row className={styles.animteRow}>
                    <Col className={styles.label} span={8}>
                      动画类型
                    </Col>
                    <Col span={16}>
                      <Radio.Group
                        size='small'
                        onChange={(evt) => {
                          console.log('evt.target.value', evt.target.value);
                          updateAttribute(evt.target.value, 'hideAnimationMode');
                        }}
                        value={setting.hideAnimationMode || '1'}
                      >
                        <Radio value='1'>原位置</Radio>
                        <Radio value='2'>偏移</Radio>
                      </Radio.Group>
                    </Col>
                  </Row>
                  {/* 偏移距离 */}
                  {setting.hideAnimationMode === '2' && (
                    <Row className={styles.animteRow}>
                      <Col className={styles.label} span={8}>
                        偏移距离
                      </Col>
                      <Col className={styles.fullCol} span={16}>
                        <InputNumber
                          className={styles.unitInput}
                          min={0}
                          value={setting.hideOffsetDistance || 400}
                          onChange={(value) => {
                            updateAttribute(value, 'hideOffsetDistance');
                          }}
                          placeholder='请输入'
                        />
                        <span className={styles.unitText}>px</span>
                      </Col>
                    </Row>
                  )}
                </>
              )}
              {/* 动画时长 */}
              <Row className={styles.animteRow}>
                <Col className={styles.label} span={8}>
                  动画时长
                </Col>
                <Col className={styles.fullCol} span={16}>
                  <InputNumber
                    className={styles.unitInput}
                    value={setting.hideDuration}
                    min={0}
                    disabled={!setting.hideEffect || setting.hideEffect === 'none'}
                    onChange={(value) => {
                      updateAttribute(value, 'hideDuration');
                    }}
                    placeholder='请输入'
                  />
                  <span className={styles.unitText}>毫秒</span>
                </Col>
              </Row>
              {/* 渐变 */}
              {isNeedGradual(setting.hideEffect) && (
                <Row className={styles.animteRow}>
                  <Col className={styles.label} span={8}>
                    渐变
                  </Col>
                  <Col span={16}>
                    <Switch
                      checked={setting.hideIsGradual || false}
                      onChange={(value) => {
                        updateAttribute(value, 'hideIsGradual');
                      }}
                    />
                  </Col>
                </Row>
              )}
            </>
          )}
        </>
      )}

      {setting.animationType === 'move' && (
        <>
          {/* 选择页面 */}
          {bigScreenType === 'page' && (
            <SelectPage
              className={styles.animteRow}
              colSpans={[8, 16]}
              colClassName={{ left: styles.label }}
              appPageId={setting.appPageId}
              handlePageTreeChange={(value, typeChange) => {
                handlePageTreeChange(value, typeChange, 'appPageId', 'compKey');
              }}
            />
          )}
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              被操作组件
            </Col>
            <Col span={16}>
              <CompTree
                type='animate' // 动画不能选择图层,并且支持单选
                relation={setting.compKey}
                appPageId={setting.appPageId}
                onTreeChange={(value) => {
                  console.log('value', value);
                  updateAttribute(value, 'compKey');
                }}
              />
            </Col>
          </Row>

          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              移动
            </Col>
            <Col className={styles.flexCol} span={16}>
              <Select
                onChange={(value) => {
                  console.log('value', value);
                  updateAttribute(value, 'moveType');
                }}
                value={setting.moveType}
                placeholder='请选择移动方式'
              >
                {MoveTypes.map((item, idx) => {
                  return (
                    <Option value={item.value} key={idx}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            </Col>
          </Row>

          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8} />

            <GroupInputNumber
              fields={['x', 'y']}
              value={setting.movePoint}
              onChange={(val, field) => {
                updateAttribute({ ...setting.movePoint, [field]: val }, 'movePoint');
              }}
            />
          </Row>

          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              动画效果
            </Col>
            <Col className={styles.flexCol} span={16}>
              <Select
                onChange={(value) => {
                  console.log('value', value);
                  updateAttribute(value, 'moveEffect');
                }}
                value={setting.moveEffect}
                placeholder='请选择动画效果'
              >
                {MoveAnimationTypes.map((item, idx) => {
                  return (
                    <Option value={item.value} key={idx}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            </Col>
          </Row>

          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8} />
            <Col className={styles.flexCol} span={16}>
              <InputNumber
                suffix='ms'
                value={setting.moveDuration}
                min={0}
                disabled={!setting.moveEffect || setting.moveEffect === 'none'}
                onChange={(value) => {
                  updateAttribute(value, 'moveDuration');
                }}
                placeholder='请输入'
              />
            </Col>
          </Row>
        </>
      )}

      {setting.animationType === 'setSize' && (
        <>
          {/* 选择页面 */}
          {bigScreenType === 'page' && (
            <SelectPage
              className={styles.animteRow}
              colSpans={[8, 16]}
              colClassName={{ left: styles.label }}
              appPageId={setting.appPageId}
              handlePageTreeChange={(value, typeChange) => {
                handlePageTreeChange(value, typeChange, 'appPageId', 'sizeCompKey');
              }}
            />
          )}
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              被操作组件
            </Col>
            <Col span={16}>
              <CompTree
                type='animate' // 动画不能选择图层,并且支持单选
                relation={setting.sizeCompKey}
                appPageId={setting.appPageId}
                onTreeChange={(value) => {
                  console.log('value', value);
                  updateAttribute(value, 'sizeCompKey');
                }}
              />
            </Col>
          </Row>
          {/* 动画时间 */}
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              动画时间
            </Col>
            <Col span={16}>
              <InputNumber
                suffix='ms'
                value={setting.sizeDuration}
                min={0}
                onChange={(value) => {
                  updateAttribute(value, 'sizeDuration');
                }}
                placeholder='请输入'
              />
            </Col>
          </Row>
          {/* 设置模式 */}
          <Row className={styles.animteRow}>
            <Col className={styles.label} span={8}>
              设置模式
            </Col>
            <Col span={16}>
              <Select
                className={styles.inputSelect}
                onChange={(value) => {
                  console.log('value', value);
                  updateAttribute(value, 'sizeMode');
                }}
                value={setting.sizeMode}
                placeholder='请选择模式'
              >
                {SizeModeTypes.map((item, idx) => {
                  return (
                    <Option value={item.value} key={idx}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            </Col>
          </Row>
          {setting.sizeMode === 'fixedScale' && (
            <Row className={styles.animteRow}>
              <Col className={styles.label} span={8}>
                固定比例
              </Col>
              <Col span={16}>
                <InputNumber
                  value={setting.fixedScale}
                  min={0}
                  onChange={(value) => {
                    updateAttribute(value, 'fixedScale');
                  }}
                />
              </Col>
            </Row>
          )}
          {setting.sizeMode === 'fixedSize' && (
            <Row className={styles.animteRow}>
              <Col className={styles.label} span={8}>
                固定尺寸
              </Col>
              <Col span={16}>
                <div className={styles.colDouble}>
                  <InputNumber
                    className={styles.colInput}
                    value={setting.size.width}
                    min={0}
                    onChange={(value) => {
                      updateAttribute({ width: value, height: setting.size.height }, 'size');
                    }}
                  />
                  <InputNumber
                    className={styles.colInput}
                    value={setting.size.height}
                    min={0}
                    onChange={(value) => {
                      updateAttribute({ width: setting.size.width, height: value }, 'size');
                    }}
                  />
                </div>
              </Col>
            </Row>
          )}
        </>
      )}
      {setting.animationType === 'waitingInterval' && (
        <Row className={styles.animteRow}>
          <Col className={styles.label} span={8}>
            等待
          </Col>
          <Col span={16}>
            <InputNumber
              suffix='ms'
              value={setting.delay}
              min={0}
              onChange={(value) => {
                updateAttribute(value, 'delay');
              }}
              placeholder='请输入'
            />
          </Col>
        </Row>
      )}

      {typeof setting?.animationType === 'string' && setting.animationType !== 'waitingInterval' && (
        <Row className={styles.animteRow}>
          <Col className={styles.label} span={8}>
            清除进行动画
          </Col>
          <Col className={styles.fullCol} span={16}>
            <Switch
              checked={setting?.isClearBeforeAnimation}
              onChange={(v) => updateAttribute(v, 'isClearBeforeAnimation')}
            />
          </Col>
        </Row>
      )}
    </div>
  );
});

export default AnimateSetting;
