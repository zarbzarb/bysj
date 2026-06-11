import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CompEvent, EventsCollection, PageEvent } from '@/staticJson/PageEvent';
import { AutoComplete, Button, Menu, Popover, Space, message } from 'antd';

import { Actions as ActionList, EventType as CompEvtList } from '@/staticJson/AnimationComponentsList';

import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import shortUUID from 'short-uuid';
import _ from 'lodash';
import EventWrap from './EventWrap';
import styles from './EventWrap/style.less';

import { BlackListWhenHomePage, BlackListWhenSubPage, listenBrowserEventConfig } from './BlackList';

const Comp = <SelectableEvents extends { [K: string]: { once: boolean; name?: string } }>({
  comp,
  selectableEvents,
  mountedEvents,
  onSetEventsCollection,
}: {
  comp: any;
  selectableEvents: SelectableEvents;
  mountedEvents: EventsCollection;
  onSetEventsCollection: (fn: (evts: EventsCollection) => void) => void;
}): React.JSX.Element => {
  const {
    pageTreeStore: { isHomePage, eventClipboard, selectedEventOrAction },
  } = useStore();

  type EventType = (CompEvent | PageEvent)['eventType'];

  const mountedEventsEntries: [string | number, PageEvent | CompEvent][] = Object.entries(mountedEvents ?? {});

  const availableEventKeys = useMemo(
    () =>
      Object.entries(selectableEvents)
        .filter(
          ([k, { once }]) =>
            !once ||
            (mountedEventsEntries.every(([, { eventType }]) => eventType !== k) &&
              !((isHomePage ? BlackListWhenHomePage : BlackListWhenSubPage) as Set<string>).has(k)),
        )
        .map(([k, opt]) => ({ value: k, label: opt?.name })) as {
        value: EventType;
      }[],
    [isHomePage, mountedEventsEntries, selectableEvents],
  );

  const [isSelected, setIsSelected] = useState(false);

  const [count, setCount] = useState(0);
  const forceUpdate = useCallback(() => setCount(count + 1), [count]);

  const onNewEvent = useCallback(
    (type: EventType) =>
      onSetEventsCollection((evts) => {
        const evtKey = shortUUID.generate().toString();

        let newEvt = {
          eventType: type,
          customName: CompEvtList?.find((et) => et.value === type)?.name ?? type,
          isActive: true,
          // 动作组
          groups: [
            {
              key: shortUUID.generate().toString(),
              actions: [],
              conditions: [],
            },
          ],
          // 选中的动作组
          activeIdx: 0,
          eventKey: evtKey,
        } as CompEvent | PageEvent;

        if (type === 'listenBrowserEvent' || type === '监听浏览器事件')
          newEvt = { ...newEvt, ...listenBrowserEventConfig };

        if (Array.isArray(evts)) (evts as (CompEvent | PageEvent)[]).push(newEvt);
        else evts[evtKey] = newEvt;

        forceUpdate();
      }),
    [forceUpdate, onSetEventsCollection],
  );

  const onSetEvent = useCallback(
    (key: string | number) => (fn: (evt: CompEvent | PageEvent) => void) =>
      onSetEventsCollection((evts) => {
        fn(evts[key]);
      }),
    [onSetEventsCollection],
  );

  const onDelEvent = useCallback(
    (key: string | number) => () =>
      onSetEventsCollection((evts) => {
        if (Array.isArray(evts)) evts.splice(key as number, 1);
        else delete evts[key];
      }),
    [onSetEventsCollection],
  );

  const [isPopMenuOpen, setIsPopMenuOpen] = useState(false);

  const onPasteWhenEvent = useCallback(
    () =>
      onSetEventsCollection((evts) => {
        if (eventClipboard?.type !== 'event') {
          message.error('你必须先复制一个事件才能进行粘贴');
          return;
        }

        const event = (eventClipboard?.goods && {
          ...eventClipboard.goods,
          eventKey: shortUUID.generate().toString(),
        }) as PageEvent | CompEvent;

        if (availableEventKeys.every(({ value }) => value !== event.eventType)) {
          message.error(`无法粘贴重复事件或非法事件: ${event.customName}`);
          return;
        }

        if (Array.isArray(evts)) (evts as (CompEvent | PageEvent)[]).push(_.cloneDeep(event));
        else evts[event.eventKey] = _.cloneDeep(event);
      }),
    [availableEventKeys, eventClipboard?.goods, eventClipboard?.type, onSetEventsCollection],
  );

  const menu = useMemo(
    () => (
      <Menu selectable={false} className={styles.contextMenuWrap}>
        <Menu.Item onClick={onPasteWhenEvent} disabled={eventClipboard?.type !== 'event'}>
          粘贴
        </Menu.Item>
      </Menu>
    ),
    [eventClipboard?.type, onPasteWhenEvent],
  );

  const onContextMenu = useCallback<React.MouseEventHandler<HTMLElement>>(
    (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      setIsPopMenuOpen(!isPopMenuOpen);
    },
    [isPopMenuOpen],
  );

  useEffect(() => {
    if (selectedEventOrAction === null) setIsPopMenuOpen(false);
  }, [selectedEventOrAction]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    window.addEventListener('click', () => setIsPopMenuOpen(false), { signal });
    window.addEventListener('contextmenu', () => setIsPopMenuOpen(false), { signal });

    return () => controller.abort();
  }, []);

  return (
    <Popover
      arrow={false}
      getPopupContainer={() => document.body}
      zIndex={99998}
      open={isPopMenuOpen}
      content={menu}
      overlayClassName={styles.popoverRewrite}
      placement='leftTop'
    >
      <Space
        className={styles.scrollContainer}
        onContextMenu={onContextMenu}
        direction='vertical'
        style={{
          display: 'flex',
          paddingBottom: 20,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'start',
          height: 'calc(100vh - 106px)',
          width: '100%',
          overflowY: 'auto',
        }}
      >
        {mountedEventsEntries.map(([key, evt]) => (
          <Space.Compact style={{ width: '350px' }} key={key}>
            <EventWrap
              refresh={forceUpdate}
              comp={comp}
              key={key}
              id={key}
              event={evt}
              selectableActions={ActionList}
              onPasteWhenEvent={onPasteWhenEvent}
              onSetEvent={onSetEvent(key)}
              onDelEvent={onDelEvent(key)}
            />
          </Space.Compact>
        ))}

        <Space.Compact style={{ width: '350px', padding: '0 15px', marginTop: '7px' }}>
          {isSelected ? (
            <AutoComplete
              autoFocus
              defaultOpen
              filterOption
              onBlur={() => setIsSelected(false)}
              size='large'
              placeholder='添加事件'
              style={{ width: '100%' }}
              className={styles['Auto-Complete']}
              onSelect={(value) => {
                onNewEvent(value.toString());
                setIsSelected(false);
              }}
              options={availableEventKeys}
            />
          ) : (
            <Button style={{ width: '100%' }} onClick={() => setIsSelected(true)}>
              添加事件
            </Button>
          )}
        </Space.Compact>
      </Space>
    </Popover>
  );
};

export default observer(Comp);
