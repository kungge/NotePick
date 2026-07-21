import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'NotePick - 网页笔记',
  version: '1.0.0',
  description: '在浏览网页时采集、批注、管理和检索网页笔记',
  permissions: ['contextMenus', 'activeTab', 'storage', 'scripting'],
  host_permissions: ['<all_urls>'],
  action: {
    default_popup: 'popup.html',
    default_title: 'NotePick',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
    },
  ],
  options_page: 'manager.html',
  commands: {
    'capture-selection': {
      suggested_key: { default: 'Alt+S' },
      description: '采集选区文字',
    },
    'capture-page': {
      suggested_key: { default: 'Alt+P' },
      description: '采集整页内容',
    },
    'open-manager': {
      suggested_key: { default: 'Alt+Shift+N' },
      description: '打开笔记管理页',
    },
  },
});
