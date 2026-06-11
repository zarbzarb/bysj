import React from 'react';
import StepFirst from '../Step/StepFirst';

export default (props) => {
  const { filterClick, currentEvent, isScreenConfig, currentComponet, item, changeFresh } = props;

  return (
    <div>
      {currentEvent.map((vl, idx) => {
        if (vl == null) return <div></div>;
        return (
          <StepFirst
            key={idx}
            idx={idx}
            filterClick={filterClick}
            isScreenConfig={isScreenConfig}
            currentEvent={vl}
            currentComponet={currentComponet}
            type={item}
            changeFresh={changeFresh}
          />
        );
      })}
    </div>
  );
};
