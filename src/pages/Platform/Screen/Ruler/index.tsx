import React from 'react';
import { useStore } from '@/hooks';
import Ruler from './Ruler';
import styles from './index.less';

const Index = (props) => {
  const { rulerWidth, ruleHeight, verticalRuler, horizontalRuler } = props;
  const {
    editorStore: { zoom },
  } = useStore();

  return (
    <>
      <div className={styles.horizontalRuler}>
        <Ruler
          ref={horizontalRuler}
          type='horizontal'
          direction='end'
          scrollPos={-50 / (zoom / 100)}
          height={30}
          unit={Math.round(50 / (zoom / 100))}
          width={rulerWidth}
          zoom={zoom / 100}
          style={{
            display: 'block',
            height: '30px',
            paddingLeft: 30,
          }}
        />
      </div>
      <div className={styles.verticalRuler}>
        <Ruler
          ref={verticalRuler}
          type='vertical'
          direction='start'
          scrollPos={-50 / (zoom / 100)}
          height={ruleHeight}
          zoom={zoom / 100}
          unit={Math.round(50 / (zoom / 100))}
          width={30}
          style={{
            display: 'block',
            width: '30px',
            paddingTop: 30,
          }}
        />
      </div>
    </>
  );
};
export default Index;
