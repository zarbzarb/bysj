import React, { useMemo, useState } from 'react';
import { Drawer } from 'antd';
import shortcutKeyIconChecked from '@/assets/icon/shortcutKey/shortcut-key-checked.png';
import shortcutKeyIconDefault from '@/assets/icon/shortcutKey/shortcut-key-default.png';

import styles from './index.less';

const Shortcutkey = () => {
  const [visible, setVisible] = useState(false);

  const isMac = useMemo(() => {
    return /macintosh|mac os x/i.test(navigator.userAgent);
  }, []);

  const isMacCtrl = useMemo(() => {
    return isMac ? '⌘' : 'Ctrl';
  }, []);

  return (
    <div className={styles['shortcutKey-box']}>
      <img
        className={styles['keyboard-img']}
        src={visible ? shortcutKeyIconChecked : shortcutKeyIconDefault}
        alt=''
        onClick={() => setVisible((bool) => !bool)}
      />
      <Drawer
        title='快捷键'
        placement='left'
        closable={false}
        onClose={() => setVisible(false)}
        open={visible}
        width={240}
      >
        <div className='shortcutKey-box-title'>组件控制</div>
        <div className='shortcutKey-box-ul'>
          <div className='key-label'>成组</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>G</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>解组</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='center-bg'>Shift</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>G</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>删除</div>
          <div className='key-value'>
            <div className='large-bg'>{isMac ? 'Delete' : 'Backspace'}</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>编辑</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>E</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>上移</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>&gt;</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>下移</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>&lt;</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>置顶</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='center-bg'>Shift</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>&gt;</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>置底</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='center-bg'>Shift</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>&lt;</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>多选组件</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='mouse-left' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>复制</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>C</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>剪切</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>X</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>粘贴</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='min-bg'>V</div>
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向上平移1px</div>
          <div className='key-value'>
            <div className='arrow-top-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向下平移1px</div>
          <div className='key-value'>
            <div className='arrow-bottom-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向左平移1px</div>
          <div className='key-value'>
            <div className='arrow-left-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向右平移1px</div>
          <div className='key-value'>
            <div className='arrow-right-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向上平移5px</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='arrow-top-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向下平移5px</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='arrow-bottom-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向左平移5px</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='arrow-left-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>向右平移5px</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='arrow-right-bg' />
          </div>
        </div>

        <div className='shortcutKey-box-title canvas-ul'>画布控制</div>
        <div className='shortcutKey-box-ul'>
          <div className='key-label'>缩放</div>
          <div className='key-value'>
            <div className='small-bg'>{isMacCtrl}</div>
            <div className='plus-sign'>+</div>
            <div className='mouse-scroll' />
          </div>
        </div>

        <div className='shortcutKey-box-ul'>
          <div className='key-label'>拖动</div>
          <div className='key-value'>
            <div className='small-bg'>空格</div>
            <div className='plus-sign'>+</div>
            <div className='mouse-left' />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Shortcutkey;
