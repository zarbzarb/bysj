export type TemplateType = {
  readonly name: string;
  readonly thumbnail: string;
  readonly from: 'datai' | 'antd';
  readonly attr: (typeof this)['from'] extends 'datai'
    ? Extensions<
        { series?: Record<string, any>[]; dataSeries?: Record<string, any>[] } & {
          [K: `is${string}`]: boolean;
        }
      >
    : (typeof this)['from'] extends 'antd'
    ? { props: Record<string, any>; styles?: Record<string, any> }
    : never;
};
