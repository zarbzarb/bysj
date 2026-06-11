import { CustomStylePanelConfigBaseForUsual, newControls, CustomStylePanelConfigItem } from './utils';

const ud = <T>(v?: T) => (v ?? undefined) as T | undefined;

// eslint-disable-next-line no-unused-expressions
`注册控件步骤:
  1. 在 Controls 中注册控件, 把 type 中的内容改为 key
  2. 如果要注册的控件是容器类型控件(会嵌套其他控件):
    [1] allContainer 中注册容器属性 type
    [2] 在 Container 中补充它的类型, 这时候需要保留 type
`;

export const allContainer: Container['type'][] = ['collapse', 'group'];

export const Controls = newControls({
  input: {
    label: '输入' as string,
    value: '',
    config: {
      disabled: ud<boolean>(false),
      placeholder: ud<string>(),
      prefix: ud<string>(),
      suffix: ud<string>(),
    },
  },
  number: {
    label: '数值输入' as string,
    value: 0,
    config: {
      disabled: ud<boolean>(false),
      placeholder: ud<string>(),
      suffix: ud<string>(),
      max: ud<number>(),
      min: ud<number>(),
      step: ud<number>(),
      // suffix: ud<string>(), // InputNumber 没这个东西
    },
  },
  select: {
    label: '下拉选择' as string,
    value: 'idx' as AnyKey,
    config: {
      options: [
        {
          value: 'idx',
          label: '选项',
        },
      ] as Readonly<{ value: AnyKey; label: string }[]>,
      placeholder: ud<string>(),
    },
  },
  radio: {
    label: '单选框' as string,
    value: 'idx' as string,
    config: {
      options: [
        {
          value: 'idx',
          label: '选项',
        },
      ] as Readonly<{ value: AnyKey; label: string }[]>,
    },
  },
  switch: {
    label: '开关' as string,
    value: false as boolean,
  },
  color: {
    label: '颜色' as string,
    value: '#ff7eb3' as Color,
  },
  image: {
    label: '图片' as string,
    value: './assets/datai/icons/defaultImage.png',
  },
  collapse: {
    label: '折叠面板' as string,
    value: {},
  },
  group: {
    label: '控件对' as string,
    value: [
      {
        label: '输入',
        type: 'input',
        value: '',
        config: {
          disabled: false,
        },
      },
      {
        label: '数值输入',
        type: 'number',
        value: 0,
        config: {
          disabled: false,
        },
      },
    ],
  },
});

export type Container =
  | {
      label: string;
      type: 'collapse';
      value: { [K: AnyKey]: CustomStylePanelConfigBaseForUsual<any> | Container };
    }
  | {
      label: string;
      type: 'group';
      value: readonly [
        CustomStylePanelConfigBaseForUsual<'input' | 'number'>,
        CustomStylePanelConfigBaseForUsual<'input' | 'number'>,
      ];
    };

export default (() =>
  Object.fromEntries(Object.entries(Controls).map(([type, ctrl]) => [type, { ...ctrl, type }])) as {
    [K in keyof typeof Controls]: CustomStylePanelConfigItem<K>;
  })();
