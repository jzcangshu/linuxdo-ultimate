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
  getActive(): TopicTabState | null { return this.session.tabs.find((tab) => tab.id === this.session.activeTabId) ?? null; }

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
    this.emit();
    return this.getActive()!;
  }

  activate(tabId: string, now: number): TopicTabState | null {
    if (!this.session.tabs.some((tab) => tab.id === tabId)) return null;
    this.session = {
      ...this.session,
      activeTabId: tabId,
      tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
      updatedAt: now,
    };
    this.emit();
    return this.getActive();
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

  close(tabId: string, now: number): void {
    this.session = closeTopicTab(this.session, tabId, now);
    this.emit();
  }

  clear(now: number): void {
    if (this.session.tabs.length === 0) return;
    this.session = { ...this.session, tabs: [], activeTabId: null, updatedAt: now };
    this.emit();
  }

  private emit(): void {
    this.onChange?.(this.session);
  }
}
