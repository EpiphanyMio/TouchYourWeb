# TouchYourWeb

面向老年用户的通用网页辅助平台原型。启动周版本提供顶部网址栏、中间独立的 Electron `WebContentsView` 和右侧助手空壳。页面理解、找入口、任务与工作台仍在后续周次开发；界面已将这些入口标为“即将开放”。

## 开发版启动

需要 Node.js 22.12.0 或更新版本、npm，以及可访问 npm 和目标网站的网络。首次安装 Electron 时，npm 会下载对应系统的运行文件。Mac 和 Windows 使用**同一份** `src/renderer/` 网页界面代码。

### macOS

在终端进入仓库目录：

```bash
npm ci
npm start
```

终端需保持打开；关闭窗口或按 `Control+C` 可结束开发版。

### Windows

在 PowerShell 中进入仓库目录：

```powershell
npm ci
npm start
```

PowerShell 执行策略拦截 `npm` 时，可改用 `npm.cmd ci`、`npm.cmd start`。当前只提供开发版，尚未生成安装包。

## 验收操作

1. 按上述命令打开应用，确认右侧显示“你好，我在这里帮你”和“当前网页”。
2. 在顶部网址栏输入 `https://example.com` 并按回车或点“打开网页”。中间应显示实际网站，右侧状态变为“网页已打开”，顶部保留网站地址。
3. 再输入另一个公开网站，检查返回、前进、刷新按钮。输入 `file:///etc/passwd` 应被拒绝，并在右侧给出原因。
4. 若网页加载失败，查看右侧错误信息；可检查网络后重新打开。部分网站会拒绝内置浏览器访问，记录网站地址与错误，不把失败写成成功。

本阶段的右侧助手仅是可见界面，**尚未读取网站内容或调用 AI**。外部网页与应用界面由不同的 WebContents 承载，外站视图关闭 Node 集成，启用上下文隔离和沙箱；弹出的新窗口及权限请求暂时被拒绝。

## 文件与后续页面

- [站点地图](docs/site-map.md)：当前窗口、计划中的工作台与测试站、文件状态和分工。
- [每周分工与行动计划](docs/总规划/雏雁计划_每周分工与行动计划.docx)：逐周任务与验收语句。
- [技术实现方案](docs/雏雁计划_双端系统代码与技术实现方案.md)：后续技术路线。

运行 `npm test` 可检查网址校验。启动周的 [成功截图](docs/screenshots/startup-window.png) 和 [拒绝非 HTTP(S) 地址的截图](docs/screenshots/rejected-url.png) 记录本机运行结果；跨系统验收仍需在 Mac 和 Windows 分别执行。
