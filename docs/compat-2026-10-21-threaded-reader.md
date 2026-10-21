# 与「Linux DO 楼中楼阅读」用户脚本的兼容性排查（2026-10-21）

排查对象：`mengxiaoww/linuxdo-threaded-reader` 的 `linuxdo-comments.user.js`（v6.1.4，Tampermonkey 安装）。
环境：Chrome 154 + linux.do，LDU v0.6.18（未打包扩展）与上述用户脚本同时启用。

## 已修复：时间线底部控件重叠

- 症状：楼主帖底部右侧，「已加载 X 条」状态文字、「只看楼主」按钮、回复/铃铛图标互相重叠。
- 根因（三个因素叠加）：
  1. 楼中楼脚本把它自己时间线面板（`.ldt-native-timeline`）内的 `.timeline-footer-controls` 用 CSS 隐藏（`.ldt-native-timeline .timeline-footer-controls { display: none !important; }`，特异性 (0,2,0)）。
  2. LDU 为「窄视口保留时间线」加入的强制显示规则 `html:not([data-ldu-embedded-list="true"]) .timeline-footer-controls { display: flex !important; }`（特异性 (0,2,1)，带 `!important`）将其重新显示，页面出现两组底部按钮。
  3. 「只看楼主」按钮挂载时取文档序第一个 `.timeline-footer-controls`，恰好取到楼中楼面板里本应隐藏的那个。
- 修复：
  - `src/ui/styles.ts`：新增排除规则 `html:not([data-ldu-embedded-list="true"]) .ldt-native-timeline .timeline-footer-controls { display: none !important; }`（含 embedded-topic 变体），不再“复活”对方刻意隐藏的控件。
  - `src/discourse/topic-tools.ts`：新增 `findFooterMount()`，优先在非 `.ldt-native-timeline` 的原生 footer 中挂载按钮。
- 验证（chrome-devtools MCP + CDP 实测）：普通页面、LDU 分屏嵌入页、`username_filters` 过滤视图三种场景下按钮均在原生控件区、对方控件保持隐藏、与状态文字零重叠；「只看楼主」端到端（点击 → 带参重载 → 楼中楼重新整理）正常。

## 已定位（非 LDU 引入）：时间线拖拽定位的「来回跳动」

- 症状：拖动楼层进度条到远端（未加载区域）时，页面反复跳动、数次修正位置。
- 复现与观测（CDP 注入真实鼠标事件）：
  - 目标不在已加载窗口内时，楼中楼脚本执行整页导航（`location.assign('/t/topic/{id}/{post_number}')`），随后重建评论整理视图；重建期间出现多级滚动修正，例如 `0 → 1043 → 989`、`5707 → 8965 → 9019 → 8965 → 11774`，有时还会连续两次导航。
  - 目标楼号常落在楼中楼（嵌套）回复上（实测 #53、#80、#65 等），重建时嵌套楼层需要重新挂载到父分组，位置重排更明显——与用户观察一致。
  - 同一帖子以独立页面（非分屏）打开时同样复现，且修正模式一致 → 与 LDU 分屏无关，属楼中楼脚本「按需加载 + 导航定位」的固有行为。
- 附注：拖拽只有在滑块（`.timeline-scroller-content` / 手柄附近）上起手才会进入拖拽状态；在空白轨道上的按压大多不触发拖拽（多组对照实验结论）。
- 结论：LDU 侧无法直接修复（均属楼中楼脚本 JS 行为）；曾尝试本地补丁处理（见下节，已退役），现维持原版行为，其余建议向上游反馈。

### 曾经尝试：楼中楼本地修复补丁（v6.1.4.1，snap-quiet）——已退役

- 目标机制：脚本的 `updateReader` 检测到「向上滚动」时会执行 **上边界回弹 + 加载上一批**；而脚本**自身的滚动修正**（锚点补偿 `scrollBy`、`readerJump` / `readerEnd` 定位）也会造成「向上滚动」的假象，误触发回弹/加载，叠加后即为「时不时来回跳动抽搐」。
- 补丁内容（共 5 处，完整 diff 见 `docs/patches/linuxdo-threaded-reader-6.1.4-snap-quiet.patch`）：
  1. `readerJump` / `readerEnd`：程序化定位滚动后开启 800ms「静默窗口」（`snapQuietUntil`）；
  2. `refresh()` 锚点补偿 `scrollBy` 后同样开启静默窗口；
  3. `updateReader` 的两处上滑触发（边界回弹、加载上一批）在静默窗口内不触发；
  4. 回弹命中后自身再静默 400ms，避免连锁。
- 状态（已退役）：曾装入本机 Tampermonkey（`6.1.4.1`）。用户实测后认为补丁反而更差（拖拽后的整页重载观感「很难受」），2026-10-21 晚自行删除补丁并重装回 v6.1.4；经 TM 存储写入顺序核验（先 `6.1.4` → `6.1.4.1` → 最后写入 `6.1.4`、无 `6.1.4.1` 残留），确认原版已生效。
- 实测：同一拖拽序列在修补前后的大幅定位跳动一致（例如 `0 → 8068 → 8014 → 8682`，其中 −54px 为「对齐吸顶头部」的定位修正，属既有设计）；补丁抑制的是「假上滑 → 回弹 → 加载上一批」这类**偶发连锁**（即用户所述「时不时」的症状），该场景具有随机性，无法在短时间稳定复现前后对比；其余回归未见异常。
- 回退记录：已按「TM 面板删除 → GitHub 原地址重装」方式完成回退（2026-10-21）。
- 上游：patch 文件保留在 `docs/patches/` 仅作修复建议/参考，不再安装到本机；今后改动用户侧脚本环境（Tampermonkey / 浏览器）须先征得用户同意。

## 其他检查（未发现冲突）

- 存储键：LDU 使用 `linuxdo-ultimate:*` / `on_off`；楼中楼使用 `ldt-jump-end`（sessionStorage）与 GM 存储——无键位冲突。
- URL 参数：LDU 使用 `username_filters` / `filter=summary`；楼中楼不使用 URL 参数——无冲突（过滤视图与楼中楼共存已验证）。
- z-index：LDU 浮层 ≥ 1,000,001；楼中楼最高 990——无遮挡冲突。
- 导航层：LDU frame-pool 不会重复导航已上报的 URL；楼中楼发起的 iframe 内导航会重新上报 `ldu:frame-state`，双方状态同步正常。
- 事件层：LDU 仅在 `.show-summary` / `.top-replies` / `.filtered-replies-show-all` 上做捕获级点击拦截，与楼中楼控件无交集。
- 留意项（非冲突）：
  - 工作区多 iframe + 楼中楼复制帖子节点时内存占用偏高（Chrome 曾提示 ~1.0 GB），为双方功能叠加的正常代价，超长帖建议适度。
  - LDU 的 mutation 观察者会把楼中楼面板的变更一并视作时间线控件变更（仅触发重算，无功能影响）。

## 回归记录

- （补丁期）楼中楼本地补丁（6.1.4.1）曾应用，并经 15+ 组拖拽序列回归：定位、分段加载、模式切换、`username_filters` 过滤视图均正常。
- 最终状态复核（2026-10-21 晚，回退后）：全部 3 个测试页刷新完成，并在**可见主题帧**内复测（分屏工作区的可见内容位于 `ldu-topic-frame`，顶层 `#main-outlet` 隐藏属分屏设计）——楼中楼单实例运行、重复控件保持隐藏、`只看楼主` 挂载原生 footer、与「已加载」状态文字零重叠；分屏工作区（列表帧 + 垂直帖子标签 + 主题帧）恢复完整。
- `npm test`：233 用例全部通过。
- `tests/styles.test.ts`：载荷分离断言更新为允许 `:not()` 守护写法（此前未提交改动遗留的失败已修复）。
- 复现工具：`scripts/cdp-bridge.mjs`（持久 CDP 桥，避免重复触发 Chrome 授权弹窗）+ `scripts/cdp-drag-test.mjs`（拖拽复现），前提是本机 Chrome 已通过 `chrome://inspect/#remote-debugging` 开启远程调试。
