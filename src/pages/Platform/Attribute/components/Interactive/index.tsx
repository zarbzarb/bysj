import React, { useCallback, useEffect, useMemo, useState } from 'react';
import EventPanel from '@/pages/Platform/Attribute/components/EventsPanel';
import { EventType } from '@/staticJson/AnimationComponentsList';
import { CompEvent, EventsCollection } from '@/staticJson/PageEvent';
import _, { isEqual } from 'lodash';
import BlackList from './BlackList';

type SelectableEvts<Evts extends Readonly<{ value: string; name: string; once: boolean; supportMobile: boolean }[]>> = {
  [T in Evts[number]['value']]: Pick<Extract<Evts[number], { value: T }>, 'name' | 'once' | 'supportMobile'>;
};

const Interactive = ({ changeKeys: [compKey], isMobile }: { changeKeys: [string]; isMobile: boolean }) => {
  const [count, setCount] = useState(0);

  const comp = window.DataI(compKey)[0];

  const [isFirstRender, setIsFirstRender] = useState(false);

  useEffect(() => {
    if (!comp?.eventSetings || !isFirstRender) return;

    comp.eventSetings = (comp.eventSetings as CompEvent[]).filter((evt) => !isEqual({}, evt));

    (comp.eventSetings as CompEvent[])
      .flatMap(({ groups }) => groups)
      .forEach((ag) => (ag.actions = ag.actions.filter((act) => !isEqual({}, act))));

    setIsFirstRender(false);
  }, [comp, comp?.eventSetings, isFirstRender]);

  const selectableEvents = useMemo(
    () =>
      Object.fromEntries(
        EventType.filter(
          ({ value, once }) =>
            comp?.type &&
            !(comp?.eventSetings?.some?.(({ eventType }) => eventType === value) && once) &&
            !BlackList[comp?.type as string]?.has(value),
        )
          .filter(({ supportMobile }) => (isMobile ? supportMobile : true))
          .map(({ value, ...rest }) => [value, rest]),
      ) as SelectableEvts<typeof EventType>,
    [comp?.eventSetings, comp?.type],
  );

  const onSetEventsCollection = useCallback(
    (fn: (evts: EventsCollection) => void) => {
      const { eventSetings = [] } = comp;

      const tmp = _.cloneDeep(eventSetings);

      fn(tmp);

      window.executeCommand('InteractionCommand', comp, tmp);

      setCount(count + 1);
    },
    [comp, count],
  );

  return comp ? (
    <EventPanel
      comp={comp}
      selectableEvents={selectableEvents}
      mountedEvents={comp?.eventSetings}
      onSetEventsCollection={onSetEventsCollection}
    />
  ) : (
    <></>
  );
};

export default Interactive;
