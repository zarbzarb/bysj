import React, { useLayoutEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import { useStore } from '@/hooks';
import $ from 'jquery';

const TreeTitle = (props) => {
  const { globalStore } = useStore();
  const { bigScreenType } = globalStore;
  // node 图层节点， 图层操作方法
  const { node, onConfirmEdit, onCancelEdit, removeLayer, editLayer, toggleVisible } = props;
  //
  const { layerName, editing, key, visible, isDefault } = node;
  // 图层名称输入框内容
  const [value, setValue] = useState(layerName);
  const domRef = useRef(null);
  /**
   * 可见logo
   * @returns
   */
  const EyesIcon = () => {
    return visible ? <EyeOutlined /> : <EyeInvisibleOutlined />;
  };
  useLayoutEffect(() => {
    if (domRef.current) {
      const container = $(domRef.current).parents('.ant-tree-title').parent();
      if (editing) {
        container.addClass('ant-tree-node-edit');
      } else {
        container.removeClass('ant-tree-node-edit');
      }
    }
  }, [editing]);
  return (
    <span key={key} ref={domRef} style={{ display: 'flex', width: '100%' }}>
      {editing ? (
        // 编辑态
        <>
          {/* 输入框 */}
          <Input
            className='menu-tree-node-title-edit'
            onChange={(e) => {
              e.stopPropagation();
              setValue(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            onSelect={(e) => e.stopPropagation()}
            value={value}
          />
          {/* 确认按钮 */}
          <Tooltip title='确认'>
            <Button
              type='primary'
              shape='circle'
              icon={<CheckCircleOutlined />}
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                onConfirmEdit(node, value);
              }}
            />
          </Tooltip>
          {/* 取消按钮 */}
          <Tooltip title='取消'>
            <Button
              type='primary'
              shape='circle'
              icon={<CloseCircleOutlined />}
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit(node);
              }}
            />
          </Tooltip>
        </>
      ) : (
        // 非编辑态
        <>
          {/* 图层名称 */}
          <span className='menu-tree-node-title'>{layerName}</span>
          {bigScreenType === 'page' && (
            <>
              {/* 删除按钮 */}
              {(!isDefault || layerName === '必须删除图层') && (
                <Tooltip>
                  <Button
                    type='primary'
                    shape='circle'
                    icon={<MinusCircleOutlined />}
                    size='small'
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(node);
                    }}
                  />
                </Tooltip>
              )}
              {/* 编辑按钮 */}
              <Tooltip>
                <Button
                  type='primary'
                  shape='circle'
                  icon={<EditOutlined />}
                  size='small'
                  onClick={(e) => {
                    e.stopPropagation();
                    editLayer(node);
                  }}
                />
              </Tooltip>
            </>
          )}
          {/* 是否可见按钮 */}
          <Tooltip>
            <Button
              type='primary'
              shape='circle'
              icon={EyesIcon()}
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                toggleVisible(node);
              }}
            />
          </Tooltip>
        </>
      )}
    </span>
  );
};

export default observer(TreeTitle);
