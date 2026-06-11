import { Action, ActionType, CompEvent, PageEvent } from '@/staticJson/PageEvent';
import { Actions as ActionsList } from '@/staticJson/AnimationComponentsList';
import { Button, Collapse, Input, Menu, Popover, Typography, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { observer } from 'mobx-react';

import UpMoveIcon from '@/assets/svg/eventIcons/upMoveAction.svg';
import DownMoveIcon from '@/assets/svg/eventIcons/downMoveAction.svg';
import RenameIcon from '@/assets/svg/eventIcons/rename.svg';
import DeleteIcon from '@/assets/svg/eventIcons/delete.svg';

import { getCurrentAction } from '@/pages/Platform/Attribute/components/Interactive/utils';
import AnimateSettings from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/AnimateSettings';
import ComSpecialAction from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/ComSpecialAction';
import RemoteEvent from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/RemoteEvent';
import CreateToggle from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/CreateToggle';
import EventRelease from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/EventRelease';
import FullScreen from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/FullScreen';
import GisEventRelease from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/GisEventRelease';
import JumpPage from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/JumpPage';
import QuoteTable from '@/components/QuoteTable';
import RefreshDataSource from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/RefreshDataSource';
import SceneInteraction from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/SceneInteraction';
import SetPramsAction from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/SetPramsAction';
import UpdateData from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/UpdateData';
import CrossOriginMessage from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/CrossOriginMessage';
import VariableSettings from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/VariableSettings';
import VideoInteraction from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/VideoInteraction';
import VisiableToggle from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/VisiableToggle';

import ErrorBoundary from '@/components/ErrorBoundary';
import { useStore } from '@/hooks';
import styles from './style.less';

const ActionPanelsImport: React.FC<{
  type: ActionType;
  comp: any;
  initEventType: any;
  parentIdx: string | number;
  idx: number;
  parentItem: any;
  refresh: () => void;
}> = ({ type, ...props }) => (
  <>
    {type === 'dataQuery' && <QuoteTable {...props} />}

    {type === 'variableSettings' && <VariableSettings {...props} />}

    {type === 'createToggle' && <CreateToggle {...props} />}

    {type === 'visiableToggle' && <VisiableToggle {...props} />}

    {type === 'eventEmit' && <EventRelease {...props} />}

    {type === 'gisEventEmit' && <GisEventRelease {...props} />}

    {type === 'sceneInteraction' && <SceneInteraction {...props} />}

    {type === 'videoInteraction' && <VideoInteraction {...props} />}

    {type === 'animateSettings' && <AnimateSettings {...props} />}

    {type === 'fullScreen' && <FullScreen {...props} />}

    {type === 'jumpPage' && <JumpPage {...props} />}

    {type === 'refreshDataSource' && <RefreshDataSource {...props} />}

    {type === 'updateData' && <UpdateData {...props} />}

    {type === 'comSpecialAction' && <ComSpecialAction {...props} />}

    {type === 'remoteEvent' && <RemoteEvent {...props} />}

    {type === 'crossOriginMessage' && <CrossOriginMessage {...props} />}
    {type === 'SetPramsAction' && <SetPramsAction {...props} />}
  </>
);

const Comp: React.FC<{
  id: number;
  eventIdx: string | number;
  action: Action;
  event?: PageEvent | CompEvent;
  refresh: () => void;
  onPaste: () => void;
  onSetAct: (fn: (act: Action) => void) => void;
  onUpMove: () => void;
  onDownMove: () => void;
  onDelete: () => void;
  comp: any;
}> = ({ onUpMove, onDownMove, id: key, eventIdx, comp, action, event, refresh, onPaste, onSetAct, onDelete }) => {
  const {
    pageTreeStore: { eventCopy, eventClipboard, selectedEventOrAction, selectEvtOrAct },
  } = useStore();

  const currentAction = getCurrentAction(comp.eventSetings, eventIdx, key);

  const [isRenaming, setIsRenaming] = useState(false);

  const title = action?.actionName ?? ActionsList?.find?.(({ value }) => action.actionType === value)?.name ?? '';

  const isPopMenuOpen = useMemo(
    () => selectedEventOrAction === action.actionKey,
    [action.actionKey, selectedEventOrAction],
  );

  const setIsPopMenuOpen = useCallback(
    (isOpen: boolean) => (isOpen ? selectEvtOrAct(action.actionKey) : selectEvtOrAct(null)),
    [action.actionKey, selectEvtOrAct],
  );

  const menu = useMemo(
    () => (
      <Menu autoFocus selectable={false} className={styles.contextMenuWrap}>
        <Menu.Item onClick={() => eventCopy('action', action)}>复制交互</Menu.Item>
        <Menu.Item disabled={!eventClipboard?.goods} onClick={onPaste}>
          粘贴
        </Menu.Item>
      </Menu>
    ),
    [action, eventClipboard?.goods, eventCopy, onPaste],
  );

  const onContextMenu = useCallback<React.MouseEventHandler<HTMLElement>>(
    (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      setIsPopMenuOpen(!isPopMenuOpen);
    },
    [isPopMenuOpen, setIsPopMenuOpen],
  );

  const renderError = useCallback(
    () => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '50px',
        }}
      >
        交互配置异常!
      </div>
    ),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    window.addEventListener('click', () => setIsPopMenuOpen(false), { signal });
    window.addEventListener('contextmenu', () => setIsPopMenuOpen(false), { signal });

    return () => controller.abort();
  }, [setIsPopMenuOpen]);

  return (
    <Popover
      getPopupContainer={() => document.body}
      arrow={false}
      zIndex={99998}
      open={isPopMenuOpen}
      content={menu}
      overlayClassName={styles.popoverRewrite}
      placement='leftTop'
    >
      <div
        style={{ width: '100%', border: `1px solid ${isPopMenuOpen ? '#39a3bd' : 'transparent'}` }}
        onContextMenu={onContextMenu}
      >
        <Collapse style={{ width: '100%', display: 'flex', flexDirection: 'column' }} defaultActiveKey={[key]}>
          <Collapse.Panel
            key={key}
            className={`${styles['Collapse-Panel']}`}
            header={
              <div
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                {isRenaming ? (
                  <Input
                    style={{ width: '130px' }}
                    value={title}
                    onChange={(evt) => {
                      onSetAct((act) => {
                        act.actionName = evt.target.value ?? act.actionName;
                      });

                      refresh();
                    }}
                    onBlur={() => setIsRenaming(false)}
                  />
                ) : (
                  <Typography onClick={(evt) => evt.preventDefault()}>
                    {title}
                    {title === '跨源通讯' && (
                      <Tooltip title='通过postMessage实现跨源通信，允许与iframe组件或父页面之间安全地传递信息'>
                        <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                      </Tooltip>
                    )}
                  </Typography>
                )}

                <div className={styles.ButtonsGroup}>
                  <Button
                    onClick={(evt) => {
                      evt.preventDefault();
                      evt.stopPropagation();

                      setIsRenaming(!isRenaming);
                    }}
                    icon={<img src={RenameIcon} alt='重命名' />}
                    type='text'
                    size='small'
                  />

                  <Button
                    onClick={(evt) => {
                      evt.preventDefault();
                      evt.stopPropagation();

                      onUpMove();
                    }}
                    icon={<img src={UpMoveIcon} alt='上移' />}
                    size='small'
                    type='text'
                    title='上移'
                  />

                  <Button
                    onClick={(evt) => {
                      evt.preventDefault();
                      evt.stopPropagation();
                      onDownMove();
                    }}
                    icon={<img src={DownMoveIcon} alt='下移' />}
                    size='small'
                    type='text'
                    title='下移'
                  />

                  <Button
                    onClick={(evt) => {
                      evt.preventDefault();
                      evt.stopPropagation();
                      onDelete();
                      refresh();
                    }}
                    icon={<img src={DeleteIcon} alt='删除' />}
                    type='text'
                    size='small'
                  />
                </div>
              </div>
            }
          >
            {currentAction.actionSettings ? (
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error(`组件key:${comp.key} ${action.actionType} 交互配置异常!`, error, errorInfo);
                }}
                fallback={renderError()}
              >
                <ActionPanelsImport
                  type={action.actionType}
                  initEventType={action.actionType}
                  comp={comp}
                  parentIdx={eventIdx}
                  idx={key}
                  parentItem={event}
                  refresh={refresh}
                />
              </ErrorBoundary>
            ) : null}
          </Collapse.Panel>
        </Collapse>
      </div>
    </Popover>
  );
};

export default observer(Comp);
