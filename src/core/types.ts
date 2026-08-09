export type LayoutPreference = "auto" | "two" | "three";
export type LayoutMode = "native" | "two" | "three";
export type TabPresentation = "horizontal" | "vertical";

export interface PaneSizes {
  sidebar: number;
  listRatio: number;
}

export interface Settings {
  schemaVersion: 3;
  enabled: boolean;
  layoutPreference: LayoutPreference;
  tabsEnabled: boolean;
  tabPresentation: TabPresentation;
  verticalTabsAutoCollapse: boolean;
  groupVerticalTabs: boolean;
  restoreSession: boolean;
  colorizeTabs: boolean;
  ownerOnlyEnabled: boolean;
  cleanModeEnabled: boolean;
  lowEndOptimizationEnabled: boolean;
  previewEnabled: boolean;
  creditEnabled: boolean;
  previewClickMode: "double" | "single";
  maxLiveFrames: number;
  maxOpenTabs: number;
  paneSizes: PaneSizes;
  dualPaneSizes: PaneSizes;
}

export interface TopicTabState {
  id: string;
  topicId: string;
  url: string;
  title: string;
  postNumber?: number;
  scrollY: number;
  suspended: boolean;
  lastActiveAt: number;
}

export interface SessionState {
  schemaVersion: 1;
  sessionId: string;
  listUrl: string;
  listScrollY: number;
  layoutMode: LayoutMode;
  paneSizes: PaneSizes;
  dualPaneSizes: PaneSizes;
  tabs: TopicTabState[];
  activeTabId: string | null;
  secondaryTabIds: string[];
  secondaryActiveTabId: string | null;
  updatedAt: number;
}

export interface StorageAdapter {
  get<T>(key: string, fallback: T): T | Promise<T>;
  set<T>(key: string, value: T): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}
