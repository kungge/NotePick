<div align="center">

# NotePick

浏览网页时随手存笔记的 Chrome 扩展

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-148%20passed-brightgreen.svg)](#测试)
[![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

</div>

## 这是什么

NotePick 是一个 Chrome 扩展（MV3），解决的问题很简单：浏览网页时看到有用的内容，想快速存下来，以后还能找到。

几个核心能力：

- 选中文字右键就存，或者一键抓整页正文（用 Readability 提取，同时留 HTML 快照兜底）
- 存下来的东西带原文和来源信息，原网页删了也不影响
- 全文搜索标题、内容、批注、来源，结果高亮
- 数据全在本地 IndexedDB，不需要注册登录，也不上传任何东西

MVP 阶段，全本地存储。

## 功能

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 选区采集 | `Alt+S` | 选中文字保存为笔记，带选区 HTML、前后各 100 字上下文、来源元数据 |
| 整页采集 | `Alt+P` | 保存 Readability 正文 + 原始 HTML 快照；正文提取失败会降级存快照 |
| 打开管理页 | `Alt+Shift+N` | 列表、详情、排序、软删除 |
| 编辑批注 | — | 改标题、写批注、加标签，debounce 自动保存 |
| 全文搜索 | — | 子串匹配标题/内容/批注/来源，结果高亮 |

快捷键在 `chrome://extensions/shortcuts` 可以改。

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 扩展规范 | Chrome Extension MV3 | Manifest V3 |
| UI 框架 | Vue 3 + TypeScript | `<script setup>` 语法 |
| 构建工具 | Vite 5 + @crxjs/vite-plugin | MV3 专用构建，HMR + 多入口 |
| 状态管理 | Pinia | Composition API 风格 |
| 正文提取 | @mozilla/readability | Mozilla 官方维护 |
| 存储 | Dexie.js (IndexedDB) | Promise API + 类型推导 |
| 样式 | Tailwind CSS | Toast 用 Shadow DOM 隔离，不污染宿主页面 |
| 测试 | Vitest + jsdom + fake-indexeddb | 148 个单元测试 |

## 项目结构

```
NotePick/
├── src/
│   ├── types/            # 数据模型 + 消息协议（discriminated union）
│   ├── services/         # db, noteService, tagService, searchService
│   ├── background/       # Service Worker: 消息路由 + 右键菜单 + 快捷键
│   ├── content/          # Content Script: 选区采集 + 整页采集 + Toast
│   ├── manager/          # 管理页: 列表视图 + 详情视图
│   ├── components/       # NoteCard, SearchBar, TagInput, AnnotationEditor 等
│   ├── stores/           # Pinia store
│   ├── utils/            # messaging, format, highlight
│   ├── popup/            # Popup UI
│   └── styles/           # Tailwind CSS 入口 + 全局样式
├── doc/                  # 需求分析、PRD、架构设计文档
├── popup.html            # Popup 入口
├── manager.html          # 管理页入口
└── manifest 定义在 src/manifest.ts
```

## 快速开始

### 环境要求

- Node.js >= 18
- Chrome 浏览器

### 安装与开发

```bash
# 安装依赖
npm install

# 开发模式（HMR 热更新）
npm run dev

# 生产构建
npm run build

# 类型检查
npm run typecheck
```

### 加载到 Chrome

1. `npm run build` 生成 `dist/` 目录
2. 打开 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点「加载已解压的扩展程序」，选 `dist/` 目录
5. 工具栏出现 NotePick 图标，可以用了

### 用法

1. 打开任意网页，选中一段文字，按 `Alt+S`（或右键 →「保存为网页笔记」）
2. 在文章页按 `Alt+P` 抓整页正文
3. `Alt+Shift+N` 打开管理页，搜索、写批注、打标签、删除

## 测试

```bash
# 运行全部测试
npm test

# 监听模式
npm run test:watch
```

覆盖了数据层 CRUD、搜索服务、工具函数、Pinia Store，148 个用例全过。

## 几个设计决策

这个项目有些刻意的选择，大多是 MV3 的限制逼出来的。

**管理页直连 IndexedDB，不走 SW 中转。** 管理页是 `chrome-extension://` 页面，能直接访问 IndexedDB。搜索和 CRUD 直接走 Dexie.js，省掉一层消息往返。搜索在内存里做子串匹配，1000 条笔记实测毫秒级。

**Readability 在 Content Script 里跑。** Service Worker 没有 DOM，Readability 又依赖 DOM，只能在 CS 里解析完再序列化传回去。

**tags 存标签名字，不存 ID。** MVP 阶段省事，笔记里直接存 `string[]`，Tag 表只管唯一性。代价是以后重命名标签要批量更新，但那是一之后的事。

**搜索内存化。** 打开管理页时把全部笔记加载到 Pinia store，搜索在内存做。数据量大了可能要改方案，但 MVP 够用。

**SW 消息处理幂等。** MV3 的 Service Worker 空闲 30 秒会被杀，所以每次都从 IndexedDB 读写，不靠内存状态。

## 项目文档

| 文档 | 说明 |
|------|------|
| [需求分析](doc/需求分析.md) | 产品背景、用户画像、功能需求、优先级规划 |
| [MVP PRD](doc/PRD-MVP.md) | MVP 详细规格：功能需求 + 验收标准 + 技术方向 |
| [架构设计](doc/architecture.md) | 系统架构 + 任务分解 + 数据模型 + 消息协议 |

## License

[MIT](LICENSE)
