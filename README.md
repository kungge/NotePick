<div align="center">

# NotePick

网页笔记浏览器扩展 — 选中即存，一键整页，全文搜索

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-148%20passed-brightgreen.svg)](#测试)
[![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

</div>

## 简介

NotePick 是一款 Chrome 浏览器扩展（Manifest V3），让你在浏览网页时随时**采集、批注、管理、检索**网页笔记。

- **采得到** — 选中文字右键即存，或一键保存整页正文（Readability 提取 + HTML 快照）
- **留得住** — 原文快照 + 来源元数据，链接失效也不丢内容
- **找得回** — 全文搜索（标题 / 内容 / 批注 / 来源），结果高亮
- **带得走** — 全本地 IndexedDB 存储，无云依赖，数据可控

MVP 阶段全本地存储，零配置即用。

## 功能一览

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 选区采集 | `Alt+S` | 选中文字 → 保存为笔记（含选区 HTML、前后各 100 字上下文、来源元数据） |
| 整页采集 | `Alt+P` | 一键保存 Readability 正文 + 原始 HTML 快照，提取失败自动降级 |
| 打开管理页 | `Alt+Shift+N` | 笔记列表 + 详情查看 + 排序 + 软删除 |
| 编辑批注 | — | 标题编辑、纯文本批注、标签增删、debounce 自动保存 |
| 全文搜索 | — | 子串匹配，搜索结果高亮显示，内存级响应 |

> 快捷键可在 `chrome://extensions/shortcuts` 中自定义。

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 扩展规范 | Chrome Extension MV3 | Manifest V3 标准 |
| UI 框架 | Vue 3 + TypeScript | `<script setup>` 语法 |
| 构建工具 | Vite 5 + @crxjs/vite-plugin | MV3 专用构建，HMR + 多入口 |
| 状态管理 | Pinia | 管理页状态，Composition API 风格 |
| 正文提取 | @mozilla/readability | Mozilla 官方维护 |
| 存储 | Dexie.js (IndexedDB) | Promise API + 类型安全 |
| 样式 | Tailwind CSS | 原子化 CSS；Toast 用 Shadow DOM 隔离 |
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

### 加载扩展到 Chrome

1. 运行 `npm run build`，生成 `dist/` 目录
2. 打开 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist/` 目录
5. NotePick 图标出现在工具栏，开始使用

### 使用流程

1. 打开任意网页，选中一段文字 → 按 `Alt+S`（或右键 →「保存为网页笔记」）
2. 在文章页按 `Alt+P` 一键保存整页正文
3. 按 `Alt+Shift+N` 打开管理页 → 搜索、编辑批注、打标签、删除

## 测试

```bash
# 运行全部测试
npm test

# 监听模式
npm run test:watch
```

测试覆盖：数据层 CRUD、搜索服务、工具函数、Pinia Store — 共 148 个用例全部通过。

## 架构亮点

- **Manager 直连 IndexedDB** — 管理页直接通过 Dexie.js 读写数据库，不经 Service Worker 中转，搜索在内存完成
- **Readability 在 Content Script 执行** — SW 无 DOM 环境，CS 执行后序列化传结果
- **tags 存标签名称** — 简化 MVP 开发，避免 JOIN 查询
- **搜索内存化** — 首次加载全量笔记到 Pinia store，子串匹配毫秒级响应
- **消息幂等** — SW 可安全休眠，每次从 IndexedDB 读写
- **Toast 用 Shadow DOM 隔离** — 不污染宿主页面样式

## 项目文档

| 文档 | 说明 |
|------|------|
| [需求分析](doc/需求分析.md) | 产品背景、用户画像、功能需求、优先级规划 |
| [MVP PRD](doc/PRD-MVP.md) | MVP 详细规格：功能需求 + 验收标准 + 技术方向 |
| [架构设计](doc/architecture.md) | 系统架构 + 任务分解 + 数据模型 + 消息协议 |

## License

[MIT](LICENSE)
