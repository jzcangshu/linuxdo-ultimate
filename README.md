# Linux Do Ultimate

一个面向 Linux Do 的浏览器插件，让浏览帖子更连贯，同时尽量保留社区原有的界面与操作习惯。

## 核心功能

- **分屏阅读**：列表与帖子正文独立显示、互不干扰；支持双阅读区和拖动调整宽度。
- **帖子标签页**：可同时阅读多个帖子，自由切换横向或垂直标签栏，并支持拖动排序、分类整理和右键管理。
- **阅读辅助**：提供只看楼主、阅读计数修复和会话恢复，刷新页面也能接着阅读。
- **链接预览**：单击或双击链接即可在悬浮窗口中预览，支持多标签、前进后退、刷新和最大化。
- **界面优化**：可隐藏公告、分类徽章、话题标签和列表头像，也可减少动画与过渡效果。
- **自动过盾**：遇到社区错误弹窗或人机验证时自动尝试恢复原页面。
- **实用工具**：可显示 LDC 收入，并自动检查插件更新。

## 安装与设置

### Chrome（谷歌浏览器）

1. 打开 `chrome://extensions`。
2. 开启“开发者模式”，点击“加载已解压的扩展程序”。
3. 选择选择你在 release 中下载的压缩包。
4. 刷新 Linux Do，点击顶部导航栏中的齿轮按钮进行设置。

### Firefox（火狐浏览器）

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击“临时载入附加组件”，选择你在 release 中下载的压缩包。
3. 刷新 Linux Do，点击顶部导航栏中的齿轮按钮进行设置。

若您已安装其他链接预览、页面布局或自动过盾脚本，建议将其关闭，他们大概率会冲突。

## 隐私与权限

设置、分屏比例和阅读标签仅保存在 Linux Do 对应的浏览器本地存储中，插件不会收集或上传用户数据。插件申请全部站点访问权限仅用于用户主动触发的站外链接预览；预览默认关闭，关闭时不会加载预览核心，也不会请求目标网站。为了复现动态网页，预览会运行目标网站脚本，使用则代表接受风险。

## 致谢

由于部分常用脚本会与本插件产生兼容性问题，本项目参考并整合了以下社区作品，感谢原作者的分享：

- [修复阅读帖子数计算脚本](https://linux.do/t/topic/2309449)，作者 `@sansan048`
- [Link Hover Previewer 4.13.1](https://linux.do/t/topic/2699329)，作者 `@trader`
- [「LINUX DO Credit」实时积分收入脚本](https://linux.do/t/topic/1365853)，作者 `@Chenyme`
- [LINUX.DO Cloudflare 5 秒盾自动跳转脚本](https://linux.do/t/topic/1033928)，作者 `@pipecraft`
- [linux.do 小助手（增强版）](https://greasyfork.org/zh-CN/scripts/552210-linux-do-%E5%B0%8F%E5%8A%A9%E6%89%8B-%E5%A2%9E%E5%BC%BA%E7%89%88)，作者未注明

## 开发与维护

项目结构、存储格式、内嵌页面通信、安全边界、构建发布和二次开发说明见 [技术维护文档](docs/technical-guide.md)。

## 🔗 LinuxDo 社区

<div align="center">
  <a href="https://linux.do" target="_blank">
    <img src="https://cdn3.ldstatic.com/original/4X/c/c/d/ccd8c210609d498cbeb3d5201d4c259348447562.png" alt="LinuxDo" height="60">
  </a>
  <p>
    <a href="https://linux.do" target="_blank"><strong>LinuxDo 社区</strong></a><br>
  </p>
    <p>@蕉灼の仓鼠</p>
    <p>本人长期活跃于L站;</p>
    <p>这里的人很好说话又好听;</p>
    <p>欢迎都来加入L站大家庭。 </p>

</div>
