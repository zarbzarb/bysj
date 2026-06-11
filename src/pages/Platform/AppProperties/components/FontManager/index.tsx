import React, { useEffect, useState, useMemo } from 'react';
import { Collapse, message } from 'antd';
import { CustomCollapse, CustomTabs } from '@yl/datai-ui';
import { useStore } from '@/hooks';

import { generateId } from '@/utils/random';
import { getImageUrl } from '@/utils/utils';
import { cloneDeep } from 'lodash';
import { loadFonts } from '@/utils/loadScript';

import FileUpload from '../FontUpload';
import styles from './index.less';

const { Panel } = Collapse;
type FontType = {
  fontName: string;
  fontUrl: string;
  key: string;
  id: string | number | undefined;
};

const FontTitle = ({ name }) => {
  return <span style={{ fontSize: '12px' }}>{name}</span>;
};
const FontBody = ({ font, uplaodCallback, onChange }) => {
  return (
    <>
      <FileUpload
        styles={styles}
        label='字体文件'
        el={{ classType: 'antd', changeImageFlag: true }}
        field='font'
        font={font}
        onChange={(data) => {
          onChange(data);
        }}
        success={uplaodCallback}
      />
    </>
  );
};

const FontManager: React.FC = () => {
  const {
    serviceStore,
    globalStore: { saveScreenConfig, screenConfig },
    versionStore: { apiVersion },
  } = useStore();
  const [fonts, setFonts] = useState<FontType[]>([]);
  const [activeKey, setActiveKey] = useState(`${fonts[0]?.key}`);

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
  };

  const onNameChange = (font) => {
    const list = [...fonts];
    list.forEach((item) => {
      if (item.key === font.key) {
        item.fontName = font.fontName;
      }
    });

    setFonts(list);
  };

  // 增加字体
  const add = () => {
    const list = [...fonts];

    if (list.some((item) => !item.fontName || !item.fontUrl)) {
      return message.warning('请先将当前字体上传完成后再进行操作!');
    }

    const newFont: FontType = {
      fontName: '字体名称',
      fontUrl: '',
      key: `font_${generateId()}`,
      id: undefined,
    };
    list.push(newFont);
    setActiveKey(newFont.key);
    setFonts(list);
  };

  // 删除字体
  const remove = (tar) => {
    const curIndex = fonts.findIndex((f) => f.key === tar);
    const list: FontType[] = [...fonts];
    if (curIndex === -1) return;

    // 本地删除
    const delFont = list.splice(curIndex, 1);
    setFonts(list);

    // 选中
    setActiveKey(curIndex - 1 > -1 ? list[curIndex - 1].key : list[0]?.key);

    // 接口删除
    if (delFont.length === 0) return;
    const delFontId = delFont[0].id;
    if (delFontId === undefined) return;

    serviceStore
      .deleteFontById(delFontId)
      .then((result) => {
        if (result && Number(result.code) === 200) {
          console.log(result);

          const appfonts = cloneDeep(screenConfig.fonts) ?? [];
          const delIndex = appfonts.findIndex((font) => font.id === delFontId);
          appfonts.splice(delIndex, 1);
          saveScreenConfig(appfonts, 'fonts');

          // 删除字体列表中的当前字体
          const fIdx = window.fontFamilyList.findIndex((font) => font.id === delFontId);
          window.fontFamilyList.splice(fIdx, 1);

          message.success('字体删除成功!');
        }
      })
      .catch((error) => console.error(error));
  };

  // 获取字体
  const getFonts = () => {
    const { appId } = window.screenConfig;
    return serviceStore
      .queryFontList({
        appIdSet: appId,
        version: apiVersion,
      })
      .then((result) => {
        console.log(result);
        if (Number(result.code) === 200) {
          const items = result.data.map((item) => {
            return {
              fontName: item.name,
              fontUrl: item.fileUrl,
              key: `${item.id}`,
              id: item.id,
            };
          });

          setFonts(items);
          return items;
        }
      });
  };

  // 上传字体成功后选中当前上传字体
  const uplaodCallback = (data) => {
    getFonts()
      .then(() => {
        setActiveKey(`${data.id}`);
        (window as any).fontFamilyList.unshift({
          id: data.id,
          label: data.name,
          value: data.name,
        });
      })
      .catch((error) => console.error(error));

    // 上传成功后加载字体文件
    const fontUrl = getImageUrl(data.url);
    loadFonts(data.name, fontUrl);

    // 保存字体
    const items = cloneDeep(screenConfig.fonts) || [];
    items.push({ ...data });

    saveScreenConfig(items, 'fonts');
  };

  /* useEffect(() => {
    getFonts()
      .then((data) => {
        setActiveKey(`${data[0]?.key}`);
        // 加入到字体列表
        const items = data.map((item) => {
          return {
            id: item.id,
            label: item.fontName,
            value: item.fontName,
          };
        });
        (window as any).fontFamilyList.unshift(...items);
      })
      .catch((error) => console.error(error));
    return () => {};
  }, []); */

  const fontItems = useMemo(
    () =>
      fonts.map((font) => {
        return {
          label: font.fontName ? font.fontName : '字体名称',
          children: <FontBody font={font} uplaodCallback={uplaodCallback} onChange={onNameChange} />,
          key: font.key,
        };
      }),
    [fonts, onNameChange, uplaodCallback],
  );

  return (
    <>
      <CustomCollapse>
        <Panel key='fontKey' header='外部字体'>
          <CustomTabs
            onChange={onChange}
            activeKey={activeKey}
            isNeedRemoveConfirm={true}
            removeTips='确定删除字体文件吗?'
            onEdit={(tar, act) => {
              if (act === 'add') add();

              if (act === 'remove') remove(tar);
            }}
            items={fontItems}
          />
        </Panel>
      </CustomCollapse>
    </>
  );
};

export default FontManager;
