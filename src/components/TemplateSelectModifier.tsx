import { Col, Row } from 'antd';
import { observer } from 'mobx-react';
import React, { useCallback } from 'react';

import templateManager from '@/theme/TemplateManager';
import { chartCompTemplatesMap } from '@/staticJson/CompTemplates';

import styles from '@/styles/pages/attr.less';
import RootStore from '@/store/common/RootStore';
import type CompLibStore from '@/store/module/ComLibStore';

const TemplateSelectModifier: React.FC<{ comp: any; CompLibStoreIncase?: any }> = ({ comp, CompLibStoreIncase }) => {
  const showCompTempList = useCallback(() => {
    const { setCurrentCompTemps, setShowTempListByAttr }: CompLibStore = CompLibStoreIncase ?? RootStore.CompLibStore;

    const compId = comp.englishName ?? comp.type;

    Object.entries(chartCompTemplatesMap).forEach(([key, value]) => (value.isActive = !!(key === compId)));

    if (!compId) return;

    templateManager.registryTemplateWithComType(compId).then((res) =>
      setCurrentCompTemps(
        Object.entries(res).map(([key, { name, thumbnail }]) => ({
          id: key,
          name,
          thumbnail,
        })),
      ),
    );

    setShowTempListByAttr(true);
  }, [CompLibStoreIncase, comp.englishName, comp.type]);

  if (chartCompTemplatesMap?.[comp.englishName ?? comp.type])
    return (
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          组件模板
          <span
            className='attr-comp-temp-btn'
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              marginLeft: '8px',
              position: 'relative',
              top: '2px',
            }}
            onClick={() => showCompTempList()}
          >
            <img alt='新增' style={{ width: '100%', height: '100%' }} src='./assets/datai/icons/addBtn.png' />
          </span>
        </Col>
      </Row>
    );

  return <></>;
};

export default observer(TemplateSelectModifier);
