import React from 'react';
import classNames from 'classnames';
import s from './index.less';

function ColorBall(props) {
  const { item, active, setActive = () => {} } = props;
  const { key, color } = item;
  return (
    <div
      className={classNames(s.colorCard, {
        [s.activeColorCard]: key === active,
      })}
      style={{
        background: color.hex,
      }}
      onClick={() => setActive(key)}
    ></div>
  );
}

export default ColorBall;
