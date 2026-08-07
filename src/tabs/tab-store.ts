import { closeTopicTab, upsertTopicTab } from "../core/session";
import type { SessionState, TopicTabState } from "../core/types";

type TopicInput = Pick<TopicTabState, "topicId" | "url" | "title"> & Partial<Pick<TopicTabState, "postNumber" | "categoryName" | "categoryColor">>;
type TabPatch = Partial<Pick<TopicTabState, "url" | "title" | "postNumber" | "categoryName" | "categoryColor" | "scrollY" | "suspended">>;

export class TopicTabStore {
  constructor(
    private session: SessionState,
    private readonly maxTabs: number,
    private readonly onChange?: (session: SessionState) => void,
  ) {}

  getSession(): SessionState { return this.session; }
  getTabs(): TopicTabState[] { return this.session.tabs.map((tab) => ({ ...tab })); }
  getPrimaryTabs(): TopicTabState[] {
    const secondary = new Set(this.session.secondaryTabIds);
    return this.session.tabs.filter((tab) => !secondary.has(tab.id)).map((tab) => ({ ...tab }));
  }
  getSecondaryTabs(): TopicTabState[] {
    const byId = new Map(this.session.tabs.map((tab) => [tab.id, tab]));
    return this.session.secondaryTabIds.flatMap((id) => byId.has(id) ? [{ ...byId.get(id)! }] : []);
  }
  getActive(): TopicTabState | null { return this.session.tabs.find((tab) => tab.id === this.session.activeTabId) ?? null; }
  getSecondaryActive(): TopicTabState | null {
    return this.session.tabs.find((tab) => tab.id === this.session.secondaryActiveTabId) ?? null;
  }

  setSessionFields(fields: Partial<Pick<SessionState, "layoutMode" | "paneSizes" | "listUrl" | "listScrollY">>, now: number, notify = true): void {
    this.session = { ...this.session, ...fields, updatedAt: now };
    if (notify) this.emit();
  }

  open(input: TopicInput, now: number): TopicTabState {
    this.session = upsertTopicTab(this.session, input, now);
    if (this.session.tabs.length > this.maxTabs) {
      const removable = this.session.tabs.filter((tab) => tab.id !== this.session.activeTabId);
      const removeCount = this.session.tabs.length - this.maxTabs;
      const removeIds = new Set(removable.slice(0, removeCount).map((tab) => tab.id));
      this.session = { ...this.session, tabs: this.session.tabs.filter((tab) => !removeIds.has(tab.id)) };
    }
    this.repairPanelOwnership();
    this.emit();
    return this.getActive()!;
  }

  openSecondary(input: TopicInput, now: number): TopicTabState {
    this.session = upsertTopicTab(this.session, input, now);
    const tab = this.session.tabs.find((candidate) => candidate.topicId === input.topicId)!;
    if (!this.session.secondaryTabIds.includes(tab.id)) {
      this.session = {
        ...this.session,
        secondaryTabIds: [...this.session.secondaryTabIds, tab.id],
        secondaryActiveTabId: tab.id,
        activeTabId: this.session.activeTabId === tab.id
          ? this.getPrimaryTabs().find((candidate) => candidate.id !== tab.id)?.id ?? null
          : this.session.activeTabId,
      };
    }
    this.repairPanelOwnership();
    this.emit();
    return { ...tab };
  }

  activate(tabId: string, now: number): TopicTabState | null {
    if (!this.getPrimaryTabs().some((tab) => tab.id === tabId)) return null;
    this.session = {
      ...this.session,
      activeTabId: tabId,
      tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
      updatedAt: now,
    };
    this.emit();
    return this.getActive();
  }

  activateSecondary(tabId: string, now: number): TopicTabState | null {
    if (!this.session.secondaryTabIds.includes(tabId)) return null;
    this.session = {
      ...this.session,
      secondaryActiveTabId: tabId,
      tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
      updatedAt: now,
    };
    this.emit();
    return this.getSecondaryActive();
  }

  moveToSecondary(tabId: string, now: number, notify = true): TopicTabState | null {
    if (!this.session.tabs.some((tab) => tab.id === tabId)) return null;
    if (this.session.secondaryTabIds.includes(tabId)) return this.activateSecondary(tabId, now);
    const primaryTabs = this.getPrimaryTabs();
    const index = primaryTabs.findIndex((tab) => tab.id === tabId);
    const remaining = primaryTabs.filter((tab) => tab.id !== tabId);
    this.session = {
      ...this.session,
      secondaryTabIds: [...this.session.secondaryTabIds, tabId],
      secondaryActiveTabId: tabId,
      activeTabId: this.session.activeTabId === tabId
        ? remaining[Math.min(index, remaining.length - 1)]?.id ?? null
        : this.session.activeTabId,
      tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
      updatedAt: now,
    };
    if (notify) this.emit();
    return this.getSecondaryActive();
  }

  mergeSecondaryIntoPrimary(now: number, notify = true): void {
    if (this.session.secondaryTabIds.length === 0) return;
    const lastSecondary = this.session.secondaryActiveTabId;
    this.session = {
      ...this.session,
      activeTabId: this.session.activeTabId ?? lastSecondary,
      secondaryTabIds: [],
      secondaryActiveTabId: null,
      updatedAt: now,
    };
    if (notify) this.emit();
  }

  closeOthersInPane(tabId: string, now: number): string[] {
    const secondary = this.session.secondaryTabIds.includes(tabId);
    const paneTabs = secondary ? this.getSecondaryTabs() : this.getPrimaryTabs();
    const removeIds = paneTabs.filter((tab) => tab.id !== tabId).map((tab) => tab.id);
    if (removeIds.length === 0) return [];
    const removeSet = new Set(removeIds);
    this.session = {
      ...this.session,
      tabs: this.session.tabs.filter((tab) => !removeSet.has(tab.id)),
      activeTabId: secondary ? this.session.activeTabId : tabId,
      secondaryTabIds: this.session.secondaryTabIds.filter((id) => !removeSet.has(id)),
      secondaryActiveTabId: secondary ? tabId : this.session.secondaryActiveTabId,
      updatedAt: now,
    };
    this.emit();
    return removeIds;
  }

  reorderInPane(tabId: string, targetTabId: string, position: "before" | "after", now: number): boolean {
    if (tabId === targetTabId) return false;
    const secondary = this.session.secondaryTabIds.includes(tabId);
    if (secondary !== this.session.secondaryTabIds.includes(targetTabId)) return false;
    const paneIds = (secondary ? this.getSecondaryTabs() : this.getPrimaryTabs()).map((tab) => tab.id);
    const original = [...paneIds];
    const sourceIndex = paneIds.indexOf(tabId);
    if (sourceIndex < 0 || !paneIds.includes(targetTabId)) return false;
    paneIds.splice(sourceIndex, 1);
    const targetIndex = paneIds.indexOf(targetTabId);
    paneIds.splice(targetIndex + (position === "after" ? 1 : 0), 0, tabId);
    if (paneIds.every((id, index) => id === original[index])) return false;
    const paneSet = new Set(paneIds);
    const byId = new Map(this.session.tabs.map((tab) => [tab.id, tab]));
    let nextPaneIndex = 0;
    this.session = {
      ...this.session,
      tabs: this.session.tabs.map((tab) => paneSet.has(tab.id) ? byId.get(paneIds[nextPaneIndex++]!)! : tab),
      secondaryTabIds: secondary ? paneIds : this.session.secondaryTabIds,
      updatedAt: now,
    };
    this.emit();
    return true;
  }

  update(tabId: string, patch: TabPatch, now: number, notify = true): void {
    this.session = {
      ...this.session,
      tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, ...patch, lastActiveAt: now } : tab),
      updatedAt: now,
    };
    if (notify) this.emit();
  }

  suspend(tabId: string, now: number): void {
    this.update(tabId, { suspended: true }, now);
  }

  close(tabId: string, now: number, notify = true): void {
    this.session = closeTopicTab(this.session, tabId, now);
    if (notify) this.emit();
  }

  clear(now: number): void {
    if (this.session.tabs.length === 0) return;
    this.session = { ...this.session, tabs: [], activeTabId: null, secondaryTabIds: [], secondaryActiveTabId: null, updatedAt: now };
    this.emit();
  }

  private emit(): void {
    this.onChange?.(this.session);
  }

  private repairPanelOwnership(): void {
    const validIds = new Set(this.session.tabs.map((tab) => tab.id));
    const secondaryTabIds = this.session.secondaryTabIds.filter((id) => validIds.has(id));
    const secondaryIds = new Set(secondaryTabIds);
    const primaryTabs = this.session.tabs.filter((tab) => !secondaryIds.has(tab.id));
    this.session = {
      ...this.session,
      secondaryTabIds,
      activeTabId: this.session.activeTabId && primaryTabs.some((tab) => tab.id === this.session.activeTabId)
        ? this.session.activeTabId
        : primaryTabs.at(-1)?.id ?? null,
      secondaryActiveTabId: this.session.secondaryActiveTabId && secondaryTabIds.includes(this.session.secondaryActiveTabId)
        ? this.session.secondaryActiveTabId
        : secondaryTabIds.at(-1) ?? null,
    };
  }
}
