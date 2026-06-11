import React from 'react';

export type FieldValueFn = (field: string, value: any) => void;

export type PropsParamsType = {
  parentStyles: Record<string, any>;
  styles: Record<string, any>;
  el: AntdComp.InstanceType;
  updateField: FieldValueFn;
  updateAttr: FieldValueFn;
  forceUpdate?: () => void;
  updateMockData?: (value: []) => void;
  updateCustomStyle?: FieldValueFn;
  styleProps?: any;
  translate?: string[];
  borderDataSource?: { key: string; text: string }[];
  overflowDataSource?: { label: string; value: string }[];
  forceUpdateLayout?: () => void;
  updateDataSource?: FieldValueFn;
  StylePage?: React.ComponentType<PropsParamsType>;
  PropsPage?: React.ComponentType<PropsParamsType>;
  store?: any;
  [key: string]: any;
};

export type AttrType = {
  StylePage?: React.ComponentType<PropsParamsType>;
  PropsPage?: React.ComponentType<PropsParamsType>;
};
