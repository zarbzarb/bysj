declare namespace Global {
  type ScreenConfigType = any;
}

// 组件数据的公共类型
declare namespace CompCommon {
  type DynamicType = {
    apis: Record<string, any>[];
    dataMap: {
      key: string;
      name: string;
    }[];
    dimensionMap: {
      col: string;
      dataMapKey: string;
      row: number[];
    }[];
    reserved: Record<string, any>[];
    source: {
      id: string;
      params: Record<string, any>[];
      repeat: {
        intervalTime: number;
        on: boolean;
      };
    };
  };

  type EventSetingsType = {
    eventType: string;
    eventKey: string;
    isActive: boolean;
    variables?: Record<string, any>[];
    actions?: ActionsType[];
    groups: ActionGroupType[];
  };

  type ActionsType = {
    actionKey?: string;
    actionName: string;
    actionType: string;
    isActive: boolean;
    actionSettings?: Record<string, any>;
    [key: string]: any;
  };

  type ActionGroupType = {
    key: string;
    actions?: ActionsType[];
  };
}

// antd 组件数据的类型
declare namespace AntdComp {
  type DatasetType = {
    category?: string;
    defaultValue?: Record<string, any>[];
    dynamic?: CompCommon.DynamicType;
    expression?: string;
    isVariable?: boolean;
    refDataType?: string;
    variable?: string;
    multiDataset?: any;
  };

  type StylesType = {
    transform: string; // 位置
    position: any; // 定位
    display: string; // 显示
    width: string; // 默认宽度
    height: string; // 默认高度
    opacity: number | string; // 默认透明度
    xPercent: boolean;
    alignCenter: boolean; // 是否居中
    compPos: string; // 对齐
    verticalPos: string; // 垂直位置
    background: string; // 背景
    overflow: string; // 内容溢出
    color: string; // 颜色
    zIndex?: number;
    overflowX?: string;
    transformOrigin?: string;
    border: {
      borderWidth: number | string; // 边框宽度
      borderTop: boolean; // 是否有上边框
      borderBottom: boolean; // 是否有下边框
      borderLeft: boolean; // 是否有左边框
      borderRight: boolean; // 是否有右边框
      borderColor: string; // 边框颜色
      borderStyle: string; // 边框样式
    };
    font: {
      fontSize: string; // 字体大小
      color: string; // 字体颜色
    };
    borderRadius: {
      borderRadius: number | string; // 圆角
      borderTopLeftRadius: boolean; // 左上角
      borderTopRightRadius: boolean; // 右上角
      borderBottomLeftRadius: boolean; // 左下角
      borderBottomRightRadius: boolean; // 右下角
    };
    margin: {
      marginTop: number | string; // 上边距
      marginRight: number | string; // 右边距
      marginBottom: number | string; // 下边距
      marginLeft: number | string; // 左边距
    };
    textAlign: string; // 字体对齐
    padding: {
      paddingTop: number | string; // 上填充
      paddingRight: number | string; // 右填充
      paddingBottom: number | string; // 下填充
      paddingLeft: number | string; // 左填充
    };
    paddingTop?: number | string;
    paddingRight?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    filter?: string;
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    marginLeft?: number | string;
  };

  // 待完善
  type PropsType = {
    dataSourceType?: string;
    variable?: string;
    mapGlobalVariable?: string;
    [key: string]: any;
  };

  type InstanceType = {
    classType: string;
    compType: string;
    compName: string;
    comLock?: boolean;
    name: string;
    fileName: string;
    key?: string;
    type: string;
    mockState: boolean;
    templateKey?: string;
    state: {
      // 用于管理一些状态
      drag: boolean;
    };
    cssStyle: any;
    styles: StylesType;
    props?: PropsType;
    dataSource: Record<string, any>; // 数据源
    dataSourceRef: {
      isRef: boolean; // 是否引用变量
      variable: string; // 变量
      variableType: string; // 变量类型
      variableFields: any[];
      variableDescription: string; // 变量描述
    };
    params: any;
    fields: any;
    children: [
      {
        key: number;
        AntdChildComponents: { [key: string]: any }[];
      },
    ];
    attr: Record<string, any>;
    props: Record<string, any>;
    layout: Record<string, any>;
    comInvisible: boolean; // 控制编辑态显隐属性
    eventSetings?: EventSetingsType[];
    customStyle?: boolean;
    customStyles?: Record<string, any>[];
    refresh?: () => void;
    compRef?: React.MutableRefObject<any>; // antd 组件的 ref
    mockData?: Record<string, any>[];
    dataset?: DatasetType;
    effectEvent?: string[];
    layerId?: string;
    createFlag?: boolean;
    showFlag?: boolean;
    hideFlag?: boolean;
    isCustomListChild?: any;
    selectedValue?: any; // v8.5.1 添加选中值写入
    selectedIndex?: any; // v8.5.1 添加选中序号写入 针对部分Datai组件
  };
}

declare type Extensions<T extends { [K: AnyKey]: any }> = T &
  Omit<
    {
      [K: AnyKey]: any;
    },
    keyof T
  >;

declare type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};

declare type MayReadonly<T> = Readonly<T> | T;
declare type AnyKey = keyof any;
declare type AnyConstable =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | ReadonlyArray<AnyConstable>
  | { readonly [K: AnyKey]: AnyConstable };

declare type Color = RGBColor | RGBAColor | HEXColor | CssColorNames;

declare type RGBColor = `${'rgb' | 'RGB'}(${number}, ${number}, ${number})`;
declare type RGBAColor = `${'rgba' | 'RGBA'}(${number}, ${number}, ${number}, ${number})`;
declare type HEXColor = `#${string}`;

declare type CssColorNames =
  | 'AliceBlue'
  | 'AntiqueWhite'
  | 'Aqua'
  | 'Aquamarine'
  | 'Azure'
  | 'Beige'
  | 'Bisque'
  | 'Black'
  | 'BlanchedAlmond'
  | 'Blue'
  | 'BlueViolet'
  | 'Brown'
  | 'BurlyWood'
  | 'CadetBlue'
  | 'Chartreuse'
  | 'Chocolate'
  | 'Coral'
  | 'CornflowerBlue'
  | 'Cornsilk'
  | 'Crimson'
  | 'Cyan'
  | 'DarkBlue'
  | 'DarkCyan'
  | 'DarkGoldenRod'
  | 'DarkGray'
  | 'DarkGrey'
  | 'DarkGreen'
  | 'DarkKhaki'
  | 'DarkMagenta'
  | 'DarkOliveGreen'
  | 'DarkOrange'
  | 'DarkOrchid'
  | 'DarkRed'
  | 'DarkSalmon'
  | 'DarkSeaGreen'
  | 'DarkSlateBlue'
  | 'DarkSlateGray'
  | 'DarkSlateGrey'
  | 'DarkTurquoise'
  | 'DarkViolet'
  | 'DeepPink'
  | 'DeepSkyBlue'
  | 'DimGray'
  | 'DimGrey'
  | 'DodgerBlue'
  | 'FireBrick'
  | 'FloralWhite'
  | 'ForestGreen'
  | 'Fuchsia'
  | 'Gainsboro'
  | 'GhostWhite'
  | 'Gold'
  | 'GoldenRod'
  | 'Gray'
  | 'Grey'
  | 'Green'
  | 'GreenYellow'
  | 'HoneyDew'
  | 'HotPink'
  | 'IndianRed'
  | 'Indigo'
  | 'Ivory'
  | 'Khaki'
  | 'Lavender'
  | 'LavenderBlush'
  | 'LawnGreen'
  | 'LemonChiffon'
  | 'LightBlue'
  | 'LightCoral'
  | 'LightCyan'
  | 'LightGoldenRodYellow'
  | 'LightGray'
  | 'LightGrey'
  | 'LightGreen'
  | 'LightPink'
  | 'LightSalmon'
  | 'LightSeaGreen'
  | 'LightSkyBlue'
  | 'LightSlateGray'
  | 'LightSlateGrey'
  | 'LightSteelBlue'
  | 'LightYellow'
  | 'Lime'
  | 'LimeGreen'
  | 'Linen'
  | 'Magenta'
  | 'Maroon'
  | 'MediumAquaMarine'
  | 'MediumBlue'
  | 'MediumOrchid'
  | 'MediumPurple'
  | 'MediumSeaGreen'
  | 'MediumSlateBlue'
  | 'MediumSpringGreen'
  | 'MediumTurquoise'
  | 'MediumVioletRed'
  | 'MidnightBlue'
  | 'MintCream'
  | 'MistyRose'
  | 'Moccasin'
  | 'NavajoWhite'
  | 'Navy'
  | 'OldLace'
  | 'Olive'
  | 'OliveDrab'
  | 'Orange'
  | 'OrangeRed'
  | 'Orchid'
  | 'PaleGoldenRod'
  | 'PaleGreen'
  | 'PaleTurquoise'
  | 'PaleVioletRed'
  | 'PapayaWhip'
  | 'PeachPuff'
  | 'Peru'
  | 'Pink'
  | 'Plum'
  | 'PowderBlue'
  | 'Purple'
  | 'RebeccaPurple'
  | 'Red'
  | 'RosyBrown'
  | 'RoyalBlue'
  | 'SaddleBrown'
  | 'Salmon'
  | 'SandyBrown'
  | 'SeaGreen'
  | 'SeaShell'
  | 'Sienna'
  | 'Silver'
  | 'SkyBlue'
  | 'SlateBlue'
  | 'SlateGray'
  | 'SlateGrey'
  | 'Snow'
  | 'SpringGreen'
  | 'SteelBlue'
  | 'Tan'
  | 'Teal'
  | 'Thistle'
  | 'Tomato'
  | 'Turquoise'
  | 'Violet'
  | 'Wheat'
  | 'White'
  | 'WhiteSmoke'
  | 'Yellow'
  | 'YellowGreen';
