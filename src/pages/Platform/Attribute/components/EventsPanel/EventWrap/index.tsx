import { PageEvent, CompEvent, ActionType, Action } from '@/staticJson/PageEvent';
import { Actions as ActionList, EventType as EventList } from '@/staticJson/AnimationComponentsList';
import { AutoComplete, Button, Collapse, Input, Menu, Popover, Space, Typography, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortUUID from 'short-uuid';

import actionInitJson from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/settingsData';

import { observer } from 'mobx-react';

import RenameIcon from '@/assets/svg/eventIcons/rename.svg';
import VisibleTestIcon from '@/assets/svg/eventIcons/visibleTest.svg';
import DeleteIcon from '@/assets/svg/eventIcons/delete.svg';
import EventCondition from '@/pages/Platform/Attribute/components/Interactive/Components/EventCondition';

import ListenEvent from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/ListenEvent';
import {
  EventConfig,
  ActionConfig as ListenBrowserAction,
} from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/ListenBrowserEvent';
import ListenVaulueChange from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/ListenValueChange';
import ListenEventVariable from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/ListenEventVariable';
import TableRowClick from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/TableRowClick';
import TablePagination from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/TablePagination';
import TableColumnClick from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/TableColumnClick';
import EchartMouseDrag from '@/pages/Platform/Attribute/components/Interactive/Components/SecondStep/EchartMouseDrag';

import useStore from '@/hooks/useStore';
import { Tabs } from '@yl/datai-ui';
import _, { isEqual } from 'lodash';

import ErrorBoundary from '@/components/ErrorBoundary';
import * as SelectBlackList from './BlackList';
import * as ConditionBlackList from './ConditionBlackList';

import styles from './style.less';
import ActionWrap from './ActionWrap';

const Comp: React.FC<{
  id: string | number;
  event?: PageEvent | CompEvent;
  selectableActions: typeof ActionList;
  onPasteWhenEvent: () => void;
  onSetEvent: (fn: (evt: PageEvent | CompEvent) => void) => void;
  onDelEvent: () => void;
  refresh: () => void;
  comp: any;
}> = ({
  id: key,
  comp,
  event,
  selectableActions,
  onPasteWhenEvent,
  onSetEvent,
  onDelEvent: onDelete,
  refresh: forceUpdate,
}) => {
  const {
    globalStore: { remoteControllInfo, isMobile },
    editorStore: { renderAttrCount },
    pageTreeStore: { isHomePage, eventCopy, eventClipboard, selectedEventOrAction, selectEvtOrAct },
  } = useStore();

  const unselectableEvtActsMapping = useMemo(
    () => (isHomePage ? SelectBlackList.BlackListWhenHomePage : SelectBlackList.BlackListWhenSubPage),
    [isHomePage],
  );

  const withNoConditionEvts = useMemo(
    () => (isHomePage ? ConditionBlackList.BlackListWhenHomePage : ConditionBlackList.BlackListWhenSubPage),
    [isHomePage],
  );

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    renderAttrCount;
  }, [renderAttrCount]);

  const [isRenaming, setIsRenaming] = useState(false);

  const title = useMemo(
    () =>
      event?.customName ??
      event?.name ??
      EventList.find(({ value }) => value === event?.eventType)?.name ??
      event?.eventType ??
      '',
    [event?.customName, event?.eventType, event?.name],
  );

  const [inputVal, setInputVal] = useState('');

  const [isSelected, setIsSelected] = useState(false);

  const options = useMemo(() => {
    let actions = selectableActions.filter(
      ({ value }) => !(unselectableEvtActsMapping?.[event.eventType] as string[])?.includes?.(value),
    );
    if (remoteControllInfo.remoteControlType !== 1) {
      actions = actions.filter((v) => v.value !== 'remoteEvent');
    }
    if (isMobile) {
      actions = actions.filter((v) => !['gisEventEmit', 'fullScreen', 'crossOriginMessage'].includes(v.value));
    }
    return actions.map(({ name }) => ({ value: name }));
  }, [unselectableEvtActsMapping, event.eventType, selectableActions, remoteControllInfo]);

  const onRename = useCallback((newName: string) => onSetEvent((evt) => (evt.customName = newName)), [onSetEvent]);

  const onActionGroupChange = useCallback((idx: number) => onSetEvent((evt) => (evt.activeIdx = idx)), [onSetEvent]);

  const onActionGroupAdd = useCallback(
    () =>
      onSetEvent((evt) => {
        evt.groups.push({
          key: shortUUID.generate().toString(),
          actions: [],
          conditions: [],
        });
        evt.activeIdx = evt.groups.length - 1;
      }),
    [onSetEvent],
  );

  const onActionGroupDel = useCallback(
    (idx: number) =>
      onSetEvent((evt) => {
        evt.groups.splice(idx, 1);

        if (idx <= evt.activeIdx) evt.activeIdx = Math.max(evt.activeIdx - 1, 0);
      }),
    [onSetEvent],
  );

  const onNewAction = useCallback(
    (actionType: ActionType) =>
      onSetEvent(({ groups, activeIdx }) =>
        groups[activeIdx]?.actions.push({
          actionName: ActionList.find(({ value }) => value === actionType).name,
          actionType,
          actionKey: shortUUID.generate().toString(),
          isActive: true,
          actionSettings: actionInitJson[actionType],
        }),
      ),
    [onSetEvent],
  );

  const onDeleteAction = useCallback(
    (actIdx: number) =>
      onSetEvent(
        ({ groups, activeIdx }) =>
          (groups[activeIdx].actions = groups[activeIdx]?.actions.filter((_act, idx) => idx !== actIdx)),
      ),
    [onSetEvent],
  );

  const onUpMoveAction = useCallback(
    (idx: number) =>
      onSetEvent(({ groups, activeIdx }) => {
        const actions = groups[activeIdx]?.actions ?? [];
        const act = actions[idx];

        if (!act || idx - 1 < 0) return;

        actions.splice(idx, 1);
        actions.splice(idx - 1, 0, act);
      }),
    [onSetEvent],
  );

  const onDownMoveAction = useCallback(
    (idx: number) =>
      onSetEvent(({ groups, activeIdx }) => {
        const actions = groups[activeIdx]?.actions;
        const act = actions[idx];

        if (!act || idx + 1 >= actions.length) return;

        actions.splice(idx, 1);
        actions.splice(idx + 1, 0, act);
      }),
    [onSetEvent],
  );

  const isPopMenuOpen = useMemo(
    () => selectedEventOrAction === event.eventKey,
    [event.eventKey, selectedEventOrAction],
  );

  const setIsPopMenuOpen = useCallback(
    (isOpen: boolean) => (isOpen ? selectEvtOrAct(event.eventKey) : selectEvtOrAct(null)),
    [event.eventKey, selectEvtOrAct],
  );

  const onPasteWhenAction = useCallback(
    () =>
      onSetEvent(({ groups, activeIdx }) => {
        if (eventClipboard?.type !== 'action') {
          message.error('你必须先复制一个交互才能粘贴');
          return;
        }

        const action = eventClipboard?.goods as Action;

        if (
          options.every(({ value }) => selectableActions.find(({ name: n }) => n === value).value !== action.actionType)
        ) {
          message.error(`这个事件不支持这个交互: ${action.actionName}`);
          return;
        }

        groups[activeIdx].actions.push({ ..._.cloneDeep(action), actionKey: shortUUID.generate().toString() });
      }),
    [eventClipboard?.goods, eventClipboard?.type, onSetEvent, options, selectableActions],
  );

  const onPaste = useCallback(() => {
    if (eventClipboard?.type === 'event') {
      onPasteWhenEvent();
    } else {
      onPasteWhenAction();
    }
  }, [eventClipboard?.type, onPasteWhenAction, onPasteWhenEvent]);

  const menu = useMemo(
    () => (
      <Menu selectable={false} className={styles.contextMenuWrap}>
        <Menu.Item onClick={() => eventCopy('event', event)}>复制事件</Menu.Item>
        <Menu.Item disabled={!eventClipboard?.goods} onClick={onPaste}>
          粘贴
        </Menu.Item>
      </Menu>
    ),
    [event, eventClipboard?.goods, eventCopy, onPaste],
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
        {title} 事件交互配置异常!
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

  console.log(comp, 'console.log(comp)');

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`${title} 事件配置出现异常!`, error, errorInfo);
      }}
      fallback={renderError()}
    >
      <Popover
        getPopupContainer={() => document.body}
        zIndex={99998}
        arrow={false}
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
              className={styles['Collapse-Panel']}
              header={
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {isRenaming ? (
                    <Input
                      style={{ width: '170px' }}
                      value={title}
                      onChange={(evt) => {
                        onRename(evt.target.value ?? undefined);
                      }}
                      onBlur={() => setIsRenaming(false)}
                    />
                  ) : (
                    <Typography onClick={(evt) => evt.preventDefault()}>{title}</Typography>
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

                    <Button icon={<img src={VisibleTestIcon} alt='测试' />} type='text' size='small' />

                    <Button
                      onClick={(evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();

                        onDelete();
                      }}
                      icon={<img src={DeleteIcon} alt='删除' />}
                      type='text'
                      size='small'
                    />
                  </div>
                </div>
              }
            >
              {title === '监听浏览器事件' && <EventConfig refresh={forceUpdate} comp={comp} idx={key} />}
              <Tabs
                tabs={event.groups?.map((_ag, idx) => `动作组${idx + 1}`)}
                onChange={onActionGroupChange}
                tabIndex={event.activeIdx}
                plusHandler={onActionGroupAdd}
                delHandler={onActionGroupDel}
                plusState={true}
                delState={event.groups?.length > 1}
                className='eventActionGroupTabs'
              >
                {event.groups?.map((ag, agIdx) => (
                  <div key={ag.key}>
                    {!withNoConditionEvts.has(event.eventType as any) && (
                      <EventCondition comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {event.eventType === 'monitoringEvent' && (
                      <ListenEvent refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {(event.eventType === 'listenBrowserEvent' || event.eventType === '监听浏览器事件') && (
                      <ListenBrowserAction refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {event.eventType === 'changeValue' && (
                      <ListenVaulueChange refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {event.eventType === 'listenVariable' && (
                      <ListenEventVariable refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {(event.eventType === 'tableRowClick' || event.eventType === 'treeRowClick') && (
                      <TableRowClick refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {(event.eventType === 'tablePagination' || event.eventType === 'listPagination') && (
                      <TablePagination refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {event.eventType === 'mouseDrag' && <EchartMouseDrag refresh={forceUpdate} comp={comp} idx={key} />}

                    {event.eventType === 'tableColumnClick' && (
                      <TableColumnClick refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {(event.eventType === 'clickSeries' || event.eventType === 'clickLegend') && (
                      <TableRowClick refresh={forceUpdate} comp={comp} idx={key} agIdx={agIdx} />
                    )}

                    {ag.actions?.map(
                      (act, idx) =>
                        !isEqual({}, act) && (
                          <ActionWrap
                            key={idx}
                            id={idx}
                            eventIdx={key}
                            action={act}
                            event={event}
                            refresh={forceUpdate}
                            onPaste={onPaste}
                            onSetAct={(fn) => fn(act)}
                            onDelete={() => onDeleteAction(idx)}
                            onUpMove={() => onUpMoveAction(idx)}
                            onDownMove={() => onDownMoveAction(idx)}
                            comp={comp}
                          />
                        ),
                    )}
                  </div>
                ))}
              </Tabs>

              <Space.Compact style={{ width: '350px', padding: '0 15px 10px 15px', marginTop: '7px' }}>
                {isSelected ? (
                  <AutoComplete
                    autoFocus
                    defaultOpen
                    className={styles['Auto-Complete']}
                    onBlur={() => setIsSelected(false)}
                    value={inputVal}
                    placeholder='添加动作'
                    style={{ width: '100%' }}
                    onChange={(value) => setInputVal(value)}
                    onSelect={(name) => {
                      onNewAction(selectableActions.find(({ name: n }) => n === name).value);
                      setInputVal('');
                      setIsSelected(false);
                    }}
                    options={options}
                    filterOption={(inputValue, { value }) => value.toUpperCase().includes(inputValue.toUpperCase())}
                  />
                ) : (
                  <Button style={{ width: '100%' }} onClick={() => setIsSelected(true)}>
                    添加动作
                  </Button>
                )}
              </Space.Compact>
            </Collapse.Panel>
          </Collapse>
        </div>
      </Popover>
    </ErrorBoundary>
  );
};

export default observer(Comp);
