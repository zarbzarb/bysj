import React from 'react';
import { ConfigProvider, message, Modal, Select, theme } from 'antd';
import _ from 'lodash';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { EventType } from '@/staticJson/AnimationComponentsList';
import { createKeyName } from '@/utils/random';
import styles from './styles.less';

const { confirm } = Modal;
const { Option } = Select;

let event;
let action;
const changEvent = (info) => {
  event = info;
};
const changeAction = (info) => {
  action = info;
};
const copyHandler = () => {
  if (event) {
    message.success('复制成功！');
  }
};
const onlyEventType = new Set([
  'click',
  'doubleClick',
  'initialization',
  'mouseDrag',
  // v7.1 交互添加鼠标移入、鼠标移出事件
  'mouseenter',
  'mouseleave',
]);

const pasteEventHandler = (comp, forceUpdate) => {
  if (!event) {
    return message.error('请先选中某一项事件复制！');
  }

  if (event) {
    const eventInfo = _.cloneDeep(event);
    eventInfo.eventKey = createKeyName();
    // v7.7.1 事件 action key修改,防止actionKey和animationSettingKey重复
    if (eventInfo.actions) {
      eventInfo.actions.forEach((act) => {
        act.actionKey = createKeyName();
        if (act.actionType === 'animateSettings') {
          const animationSettings = act?.actionSettings?.animationSettings || [];
          animationSettings.forEach((animationSetting) => {
            animationSetting.animationSettingKey = createKeyName();
          });
        }
      });
    }
    const compEvents = comp.eventSetings || [];
    let type = event.eventType;

    const changeEventType = (evt) => {
      eventInfo.eventType = evt;
      type = evt;
    };

    confirm({
      getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
      title: '粘贴事件?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <ConfigProvider
          theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#79BAC3', colorText: '#FFFFFF' } }}
        >
          <div>
            <label>更改事件类型：</label>
            <Select
              popupClassName={`change-event-type-select ${styles['event-selector-popup']}`}
              dropdownClassName='change-event-type-select'
              defaultValue={type}
              style={{ width: '220px' }}
              placeholder='更改事件类型'
              onChange={changeEventType}
            >
              {EventType.map((vl) => (
                <Option key={vl.value} value={vl.value}>
                  {vl.name}
                </Option>
              ))}
            </Select>
          </div>
        </ConfigProvider>
      ),
      onOk() {
        if (onlyEventType.has(type)) {
          const isHaveOnlyEvent = compEvents.find((evtInfo) => evtInfo.eventType === type);
          if (isHaveOnlyEvent) {
            message.error('事件已存在，请删除当前事件或重新确认粘贴内容！');
            return;
          }
        }

        if (
          comp.effectEvent &&
          ![
            ...comp.effectEvent,
            'createBefore',
            'createAfter',
            'destroyBefore',
            'destroyAfter',
            'afterHidden',
            'beforeHidden',
            'beforeHide',
            'beforeShowUp',
          ].includes(type)
        ) {
          message.error('该组件不支持此事件');
          return;
        }
        if (compEvents.length === 0) {
          comp.eventSetings = [eventInfo];
        } else {
          comp.eventSetings.push(eventInfo);
        }
        forceUpdate();
      },
      onCancel() {},
    });
  }
};

const pasteActionHandler = (comp, forceUpdate) => {
  if (!event) {
    return message.error('请先选中某一项事件！');
  }
  if (!action) {
    return message.error('请先选中某一项交互粘贴！');
  }
  let curEvent;
  if (comp.eventSetings) {
    curEvent = comp.eventSetings.find((item) => item.eventKey === event.eventKey);
    if (!curEvent) {
      return message.error('请先选中某一项事件！');
    }
  } else {
    return message.error('请先选中某一项事件！');
  }
  if (action) {
    const actionInfo = _.cloneDeep(action);
    // v7.7.1 事件 action key修改 防止actionKey和animationSettingKey重复
    actionInfo.actionKey = createKeyName();
    if (actionInfo.actionType === 'animateSettings') {
      const animationSettings = actionInfo?.actionSettings?.animationSettings || [];
      animationSettings.forEach((animationSetting) => {
        animationSetting.animationSettingKey = createKeyName();
      });
    }
    confirm({
      getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
      title: '粘贴交互?',
      icon: <ExclamationCircleOutlined />,
      content: <div>是否粘贴{actionInfo.activePropName}交互</div>,
      onOk() {
        if (curEvent) {
          curEvent.actions.push(actionInfo);
        }
        // event.actions.push(actionInfo); 旧代码，粘贴不生效
        forceUpdate();
      },
      onCancel() {},
    });
  }
};

export { copyHandler, pasteEventHandler, pasteActionHandler, changEvent, changeAction };
