const addressForm = document.getElementById('address-form');
const address = document.getElementById('address');
const back = document.getElementById('back');
const forward = document.getElementById('forward');
const reload = document.getElementById('reload');
const pageTitle = document.getElementById('page-title');
const statusText = document.getElementById('status-text');

function render(state) {
  back.disabled = !state.canGoBack;
  forward.disabled = !state.canGoForward;
  reload.disabled = !state.url;
  if (state.url && document.activeElement !== address) address.value = state.url;
  pageTitle.textContent = state.title || (state.url ? state.url.replace(/^https?:\/\//, '').split('/')[0] : '尚未打开网站');

  const messages = {
    idle: '等待输入网址',
    loading: '正在打开网页…',
    ready: '网页已打开',
    error: state.error || '网页打开失败',
    notice: state.error || '此操作暂不可用',
  };
  statusText.textContent = messages[state.status] || messages.idle;
  statusText.dataset.status = state.status;
}

addressForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await window.desktop.open(address.value);
});
back.addEventListener('click', () => window.desktop.back());
forward.addEventListener('click', () => window.desktop.forward());
reload.addEventListener('click', () => window.desktop.reload());

window.desktop.onState(render);
window.desktop.getState().then(render);
