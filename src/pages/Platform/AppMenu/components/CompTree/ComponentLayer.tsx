import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { trim } from 'lodash';
import { useStore } from '@/hooks';
import DataI from '@/utils/global-api';
import { antdCompList, CardTemplateCompList, mapInteractionCompList } from '@/staticJson/AntdComp';
import customIcon from '@/assets/icon/自定义大图.png';
import referMapIcon from '@/assets/icon/mapIcon/refer_map_icon.png';

const getComponent = DataI.getComponentByKey;

/*
 * @Author: 赵晶晶
 * 组件列表
 */
interface IProps {
  item: any; // 组件
  parentIndex?: string; // 父祖key
  type?: string; // 组内组件类型，子组件，孙组件
  selectedKeys?: any[]; // 选中组件
  keyIndex: number; // 组件的标识序号
  index?: number;
  onContextMenu?: (e) => void; // 显示右键菜单
  changeInstance?: (evt: any, item: any) => void; // 选中组件
  dragEnd?: (e: any, i?: any, groupKey?: any) => void; // 拖拽开始
  dragStart?: (e: any) => void; // 拖拽结束
}
const ComponentLayer = (props: IProps) => {
  const { editorStore, compLibStore, pageTreeStore } = useStore();
  const { forceUpdateAttr } = editorStore;
  const { comList, customList } = compLibStore;
  const { item = {} } = props;
  const {
    onContextMenu,
    parentIndex,
    type,
    selectedKeys,
    changeInstance,
    dragEnd,
    dragStart,
    keyIndex: i,
    index,
  } = props;
  // 组件是否上锁
  const isLock = item && item.comLock ? item.comLock : false;
  // 组件名称
  const [comName, setComName] = useState(item.compName || item.name || '未知组件');
  // 组件是否编辑
  const [isEdit, setIsEdit] = useState(false);
  // 组件是否不可见 v8.5.0修改状态和注释， comInvisible为true表示组件不可见
  const [isInvisible, setIsInvisible] = useState(item.comInvisible ? item.comInvisible : false);

  /**
   * 组件状态发生变化，更新对应状态
   */
  useEffect(() => {
    if (item.classType === 'com' || item.classType === 'group') {
      if (comName !== item.name) {
        setComName(item.name);
      }
    } else if (comName !== item.compName) {
      setComName(item.compName);
    }
  }, [item.name, item.compName, item.classType]);

  useEffect(() => {
    if (isInvisible !== item.comInvisible) {
      setIsInvisible(item.comInvisible);
    }
  }, [isInvisible, item.comInvisible]);

  /**
   * 组件是否可见处理
   * @param item 组件
   * @param type 显示状态 visible可见 invisible不可见
   */
  const handleVisible = (curItem, curType) => {
    // window.executeCommand('VisibleCommand', [curItem], curType);
    window.executeCommand('VisibleCommand', [getComponent(curItem.key)], curType);
    setIsInvisible(curType === 'invisible');
  };

  const className = useMemo(() => {
    // 激活类名
    let classActive = '';
    // 组子组件类名
    let groupChild = '';
    if (type === 'groupChild') {
      groupChild = ' group-child';
    }
    // 组内组子组件
    if (type === 'groupInGroupChild') {
      groupChild = 'group-in-group-child';
    }
    // 是否选中组件，选中激活类
    classActive = selectedKeys.includes(item.key) ? ' changed' : '';
    const groupChildInstance = toJS(selectedKeys);
    let boxBool;
    if (groupChildInstance.length > 0) {
      const child = groupChildInstance[0];
      boxBool = child === item.key;
      if (boxBool) {
        classActive = ' changed';
      }
    }
    return `com-info  ${groupChild} ${classActive} `;
  }, [item.key, selectedKeys, type]);

  const newItem = useMemo(() => {
    const temp = {};
    Object.keys(item).forEach((curKey) => {
      const curType = typeof item[curKey];
      if (curType !== 'function' && curType !== 'object') {
        temp[curKey] = item[curKey];
      }
    });
    return temp;
  }, [item]);

  const idx = useMemo(() => {
    let temp = String(i);
    if (parentIndex !== undefined) {
      temp = `${parentIndex}-${temp}`;
    }
    return temp;
  }, [i, parentIndex]);

  const getTempImgUrls = useCallback(() => {
    let itemImgUrls = [];
    // antd组件
    if (item.classType === 'antd') {
      itemImgUrls = [...antdCompList, ...mapInteractionCompList].filter((item1) => {
        return item1.englishName === item.type;
      });
      // 兼容图层列表显示卡片模板
      if (item.type === 'CardTemplate') {
        itemImgUrls = CardTemplateCompList;
      }
    } else if (item.classType === 'customComp') {
      // console.log(customList, item);
      itemImgUrls = customList.filter((item1: { englishName: any }) => {
        return item1.englishName === item.customCode;
      });
    } else {
      itemImgUrls = comList.filter((item1) => {
        return item1.englishName === (item.refComName ? item.refComName : item.englishName);
      });
    }
    return itemImgUrls;
  }, [comList, customList, item.classType, item.customCode, item.englishName, item.refComName, item.type]);

  const currentImgUrl = useMemo(() => {
    let itemImgUrl = ''; // 已选组件的图标,后续调整组件系统的时候优化
    const itemImgUrls = getTempImgUrls();
    if (itemImgUrls && itemImgUrls.length > 0 && itemImgUrls[0].imgUrl) {
      if (itemImgUrls[0].imgUrl.includes('/storage/file/v1/console/downloadFileByUrl')) {
        const { imgUrl } = itemImgUrls[0];
        itemImgUrl = `/iocoss/${imgUrl.replace(/.+\?url=/, '')}`;
      } else {
        itemImgUrl = `${itemImgUrls[0].imgUrl.replace('/oss/default/', '/iocoss/default/')}`;
      }
    } else {
      itemImgUrl = '';
    }
    const imgUrlPrefix = process.env.NODE_ENV === 'development' ? '/assets/' : '/visual-console/assets/';
    itemImgUrl = itemImgUrl.replace('/iocoss/default/', imgUrlPrefix);
    // let isInvisible = item && item.comInvisible ? item.comInvisible : false;
    if (itemImgUrl === '') {
      itemImgUrl = customIcon;
    }
    return itemImgUrl;
  }, [getTempImgUrls]);

  const isReferenceMap = item.compType === 'referenceMap';

  return (
    <div
      onClick={(evt) => {
        // 单击组件logo, 选中组件
        if (!evt.shiftKey) {
          changeInstance(evt, item);
        }
      }}
      onDoubleClick={() => {
        // 编辑组件
        setIsEdit(true);
      }}
      // 显示菜单
      onContextMenu={onContextMenu}
      className={className}
      style={{ paddingLeft: `${item.level === 1 || isReferenceMap ? 25 : item.level * 15}px` }}
      key={idx}
      data-middleware='com-operable'
      draggable={!isReferenceMap}
      data-id={item.key}
      data-type='comp'
      data-parent={parentIndex}
      onDragEnd={(e) => dragEnd && dragEnd(e, index, parentIndex)}
      onDragStart={(e) => dragStart && dragStart(e)}
      data-item={JSON.stringify(newItem)}
      title={item.name || item.compName}
    >
      {isReferenceMap && (
        // 引用地图组件特殊样式
        <div className='reference-map'>
          <img src={referMapIcon} alt='' />
        </div>
      )}
      <img alt='' src={`${currentImgUrl}`} data-middleware='com-operable' draggable='false' />
      <div className='com-title' data-middleware='com-operable'>
        {isEdit && !isReferenceMap ? (
          // 编辑态组件名称输入框
          <input
            onBlur={(evt) => {
              // 输入框失去焦点，完成输入
              const curComName = trim(evt.target.value);
              if (!curComName) {
                message.error('组件名称不能为空!');
                return;
              }
              const curItem = getComponent(item.key);
              if (!curItem.name) {
                curItem.name = curComName;
              }
              if (!curItem.compName) {
                curItem.compName = curComName;
              }
              // if (!item.name) {
              //   item.name = curComName;
              // }
              // if (!item.compName) {
              //   item.compName = curComName;
              // }
              setIsEdit(false);
              setComName(curComName);
              pageTreeStore.setPageInfoStep(1);
            }}
            onKeyDown={(evt) => {
              if (evt.code === 'Enter') {
                evt.preventDefault();
                setIsEdit(false);
                pageTreeStore.setPageInfoStep(1);
              }
            }}
            // 输入框内容发生改变
            onChange={(evt) => {
              const curComName = evt.target.value;
              const curItem = getComponent(item.key);
              curItem.name = curComName;
              curItem.compName = curComName;
              // item.name = curComName;
              // item.compName = curComName;
              setComName(curComName);
              forceUpdateAttr();
            }}
            value={comName}
          />
        ) : (
          // 显示态，显示组件名称
          <span>{comName}</span>
        )}
      </div>
      <div
        style={{
          display: isReferenceMap ? 'none' : 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
        }}
      >
        {isInvisible ? (
          // 组件是否可见
          <div className='com-lock  com-eyeinvisible'>
            <EyeInvisibleOutlined
              onClick={() => {
                // 点击，显示组件
                handleVisible(item, 'visible');
              }}
              style={{
                fontSize: '12px',
                marginRight: '5px',
                color: '#bfc6ce',
              }}
            />
          </div>
        ) : (
          <div className='com-lock com-eyevisible'>
            <EyeOutlined
              onClick={() => {
                // 点击，隐藏组件
                handleVisible(item, 'invisible');
              }}
              style={{
                fontSize: '12px',
                marginRight: '5px',
                color: '#bfc6ce',
              }}
            />
          </div>
        )}
        {/* 组件是否上锁，上锁显示锁logo */}
        {isLock ? (
          <div className='com-lock'>
            <LockOutlined
              style={{
                fontSize: '12px',
                marginRight: '5px',
                color: '#bfc6ce',
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default observer(ComponentLayer);
