function normalizeHttpUrl(input) {
  if (typeof input !== 'string') {
    throw new Error('请输入网站地址。');
  }

  const value = input.trim();
  if (!value) {
    throw new Error('请输入网站地址。');
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
  const candidate = hasScheme ? value : `https://${value}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('网址格式不正确，请检查后重试。');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('只支持 http 或 https 网站地址。');
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error('网址格式不正确，请检查后重试。');
  }

  return url.toString();
}

function isHttpUrl(input) {
  try {
    return ['http:', 'https:'].includes(new URL(input).protocol);
  } catch {
    return false;
  }
}

module.exports = { normalizeHttpUrl, isHttpUrl };
