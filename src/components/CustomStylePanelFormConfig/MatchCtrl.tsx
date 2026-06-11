import React, { useEffect, useState } from 'react';
import { Col, Collapse, Input, Radio, Row, Select, Switch } from 'antd';
import { Color, InputFloat, ImageUpload } from '@yl/datai-ui';
import { Updater } from 'use-immer';
import { CustomStylePanelConfig, CustomStyleGetValue, CustomStylePanelConfigItem } from './utils';
import styles from './styles.less';
import CtrlWrap from '.';

const Comp = <ConfigType extends CustomStylePanelConfig, Key extends keyof ConfigType>({
  ctrl,
  defaultValue,
  config,
  ctrlKey,
  setGetValue,
}: {
  ctrl: CustomStylePanelConfigItem<ConfigType[Key]['type']>;
  defaultValue: CustomStylePanelConfigItem<ConfigType[Key]['type']>['value'];
  config: ConfigType;
  ctrlKey: Key;
  setGetValue: Updater<CustomStyleGetValue<ConfigType>>;
}): JSX.Element => {
  const [value, set] = useState<any>(defaultValue ?? ctrl?.value);

  useEffect(
    () =>
      setGetValue((v) => {
        v[ctrlKey] = value;
      }),
    [ctrlKey, setGetValue, value],
  );

  const Wrap = (jsx: JSX.Element, className = '') => (
    <Row key={ctrlKey.toString()} className={styles.field}>
      <Col flex='auto' className={styles.fieldLabel}>
        {ctrl?.label ?? ctrlKey.toString()}
      </Col>
      <Col flex='213px' className={`${styles.fieldInput} ${className}`}>
        {jsx}
      </Col>
    </Row>
  );

  switch (ctrl?.type) {
    case 'input': {
      return Wrap(
        <Input
          value={value}
          disabled={ctrl?.config?.disabled}
          placeholder={ctrl?.config?.placeholder}
          prefix={ctrl?.config?.prefix}
          suffix={ctrl?.config?.suffix}
          onChange={(evt) => set(evt.target.value)}
        />,
      );
    }

    case 'number': {
      return Wrap(
        <InputFloat
          value={value}
          disabled={ctrl?.config?.disabled}
          placeholder={ctrl?.config?.placeholder}
          suffix={ctrl?.config?.suffix}
          max={ctrl?.config?.max}
          min={ctrl?.config?.min}
          unit={ctrl?.config?.step}
          onChange={set}
        />,
      );
    }

    case 'select': {
      return Wrap(
        <Select
          value={value}
          onChange={set}
          placeholder={ctrl?.config?.placeholder}
          options={(ctrl?.config?.options as any) ?? []}
        />,
      );
    }

    case 'radio': {
      return Wrap(
        <Radio.Group value={value} onChange={(evt) => set(evt.target.value)}>
          {ctrl?.config?.options.map(({ value: val, label }) => (
            <Radio value={val} key={val.toString()}>
              {label}
            </Radio>
          ))}
        </Radio.Group>,
      );
    }

    case 'switch': {
      return Wrap(
        <div>
          <Switch checked={value} onChange={set} />
        </div>,
      );
    }

    case 'color': {
      return Wrap(<Color value={value} onChange={set} />);
    }

    case 'image': {
      return <ImageUpload value={value} onChange={set} label={ctrl?.label ?? ctrlKey.toString()} />;
    }

    case 'collapse': {
      return (
        <Collapse ghost key={ctrlKey.toString()} expandIconPosition='right'>
          <Collapse.Panel key={ctrlKey.toString()} header={ctrl?.label}>
            <CtrlWrap config={config[ctrlKey].value as CustomStylePanelConfig} onChange={(v) => set(v)} />
          </Collapse.Panel>
        </Collapse>
      );
    }

    case 'group': {
      return Wrap(
        <CtrlWrap
          config={{ l: value[0], r: value[1] } as CustomStylePanelConfig}
          onChange={({ l, r }) =>
            setGetValue((v) => {
              v[ctrlKey][0] = l;
              v[ctrlKey][1] = r;
            })
          }
        />,
        `yl-comp-tabs ${styles.fromGroupWrap}`,
      );
    }

    default: {
      return <></>;
    }
  }
};

export default Comp;
