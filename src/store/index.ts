import { createContext } from 'react';
import { configure } from 'mobx';

import type GlobalStore from '@/store/common/global';
import type CardStore from '@/store/module/CardStore';
import type ComStore from '@/store/module/ComStore';
import type ControlStore from '@/store/module/ControlStore';
import type DynamicApiStore from '@/store/module/DynamicApiStore';
import type EditorStore from '@/store/module/EditorStore';
import type HookStore from '@/store/module/HookStore';
import type MapStore from '@/store/module/MapStore';
import type OssStore from '@/store/module/OssStore';
import type ServiceStore from '@/store/module/ServiceStore';
import type UserStore from '@/store/module/UserStore';
import type LayerManagerStore from '@/store/layerManager';
import type PageTreeStore from '@/store/pageTree';
import type PageTabsStore from '@/store/pageTabs';

import LayoutStore from './module/LayoutStore';
import RootStore from './common/RootStore';
import CompLibStore from './module/ComLibStore';

configure({
  enforceActions: 'never',
  isolateGlobalState: true,
});

export const Store: {
  globalStore: GlobalStore;
  layerStore: LayerManagerStore;
  cardStore: CardStore;
  comStore: ComStore;
  controlStore: ControlStore;
  compLibStore: CompLibStore;
  dynamicApiStore: DynamicApiStore;
  editorStore: EditorStore;
  hookStore: HookStore;
  layoutStore: LayoutStore;
  mapStore: MapStore;
  ossStore: OssStore;
  serviceStore: ServiceStore;
  pageTreeStore: PageTreeStore;
  pageTabsStore: PageTabsStore;
  userStore: UserStore;
  [k: string]: any;
} = {
  globalStore: RootStore.GlobalStore,
  layoutStore: new LayoutStore(),
  comStore: RootStore.ComStore,
  layerStore: RootStore.LayerStore,
  controlStore: RootStore.ControlStore,
  compLibStore: RootStore.CompLibStore,
  ossStore: RootStore.OssStore,
  editorStore: RootStore.EditorStore,
  serviceStore: RootStore.ServiceStore,
  dynamicApiStore: RootStore.DynamicApiStore,
  cardStore: RootStore.CardStore,
  hookStore: RootStore.HookStore,
  userStore: RootStore.UserStore,
  mapStore: RootStore.MapStore,
  pageTabsStore: RootStore.PageTabsStore,
  pageTreeStore: RootStore.PageTreeStore,
  versionStore: RootStore.VersionStore,
};

export const storeContext = createContext(Store);
export const StoreProvider = storeContext.Provider;
