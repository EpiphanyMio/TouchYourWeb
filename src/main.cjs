const path = require('node:path');
const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const { normalizeHttpUrl, isHttpUrl } = require('./navigation.cjs');

const layout = { margin: 16, toolbar: 100, sidebar: 360, gap: 16 };
let window;
let siteView;
let siteAttached = false;
let state = {
  status: 'idle',
  url: '',
  title: '',
  canGoBack: false,
  canGoForward: false,
  error: '',
};

function publishState(change = {}) {
  state = { ...state, ...change };
  if (siteView && !siteView.webContents.isDestroyed()) {
    const history = siteView.webContents.navigationHistory;
    state.canGoBack = history.canGoBack();
    state.canGoForward = history.canGoForward();
  }
  if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
    window.webContents.send('navigation:state', state);
  }
  return state;
}

function resizeSiteView() {
  if (!window || !siteView || !siteAttached) return;
  const [width, height] = window.getContentSize();
  const x = layout.margin;
  const y = layout.toolbar + layout.margin;
  siteView.setBounds({
    x,
    y,
    width: Math.max(1, width - layout.sidebar - layout.gap - layout.margin * 2),
    height: Math.max(1, height - y - layout.margin),
  });
}

function attachSiteView() {
  if (siteAttached) return;
  window.contentView.addChildView(siteView);
  siteAttached = true;
  resizeSiteView();
}

function assertInternalSender(event) {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) {
    throw new Error('不允许从外部网页调用应用导航。');
  }
}

async function navigate(input) {
  let url;
  try {
    url = normalizeHttpUrl(input);
  } catch (error) {
    publishState({ status: 'error', error: error.message });
    return { ok: false, error: error.message };
  }

  attachSiteView();
  publishState({ status: 'loading', url, title: '', error: '' });
  try {
    await siteView.webContents.loadURL(url);
    return { ok: true };
  } catch (error) {
    const message = `无法打开网站：${error.message}`;
    publishState({ status: 'error', error: message });
    return { ok: false, error: message };
  }
}

function createWindow() {
  state = {
    status: 'idle',
    url: '',
    title: '',
    canGoBack: false,
    canGoForward: false,
    error: '',
  };
  window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'TouchYourWeb 网页助手',
    backgroundColor: '#f3f5f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  siteView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  siteView.setBackgroundColor('#ffffff');
  siteView.webContents.setWindowOpenHandler(() => {
    publishState({ status: 'notice', error: '此网站尝试打开新窗口；当前原型未开放该操作。' });
    return { action: 'deny' };
  });

  const site = siteView.webContents;
  site.on('will-navigate', (event, url) => {
    if (!isHttpUrl(url)) {
      event.preventDefault();
      publishState({ status: 'notice', error: '已阻止非 HTTP(S) 地址。' });
    }
  });
  site.on('will-redirect', (event, url) => {
    if (!isHttpUrl(url)) {
      event.preventDefault();
      publishState({ status: 'notice', error: '已阻止跳转到非 HTTP(S) 地址。' });
    }
  });
  site.on('did-start-loading', () => publishState({ status: 'loading', error: '' }));
  site.on('did-navigate', (_event, url) => publishState({ url, status: 'ready', error: '' }));
  site.on('did-navigate-in-page', (_event, url, isMainFrame) => {
    if (isMainFrame) publishState({ url });
  });
  site.on('page-title-updated', (_event, title) => publishState({ title }));
  site.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      publishState({ status: 'error', url, error: `加载失败：${description} (${code})` });
    }
  });
  site.on('did-stop-loading', () => {
    if (state.status === 'loading') publishState({ status: 'ready', error: '' });
  });

  window.on('resize', resizeSiteView);
  window.on('closed', () => {
    if (siteView && !siteView.webContents.isDestroyed()) siteView.webContents.close();
    siteView = null;
    window = null;
    siteAttached = false;
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const startupUrl = process.argv.find((argument) => argument.startsWith('--open-url='));
  window.loadFile(path.join(__dirname, 'renderer', 'index.html')).then(() => {
    if (startupUrl) navigate(startupUrl.slice('--open-url='.length));
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  ipcMain.handle('navigation:get-state', (event) => {
    assertInternalSender(event);
    return state;
  });
  ipcMain.handle('navigation:open', (event, input) => {
    assertInternalSender(event);
    return navigate(input);
  });
  ipcMain.handle('navigation:back', (event) => {
    assertInternalSender(event);
    if (siteAttached && siteView.webContents.navigationHistory.canGoBack()) {
      siteView.webContents.navigationHistory.goBack();
    }
    return publishState();
  });
  ipcMain.handle('navigation:forward', (event) => {
    assertInternalSender(event);
    if (siteAttached && siteView.webContents.navigationHistory.canGoForward()) {
      siteView.webContents.navigationHistory.goForward();
    }
    return publishState();
  });
  ipcMain.handle('navigation:reload', (event) => {
    assertInternalSender(event);
    if (siteAttached) siteView.webContents.reload();
    return publishState();
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
