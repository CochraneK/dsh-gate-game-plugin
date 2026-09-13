# dsh-gate-game

一个用于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI 的标准 Cordis 客户端插件：在侧栏底部加入一个**休息游戏**按钮，打开全屏吃 logo 小游戏。

> [!IMPORTANT]
> 这个全屏层只是休息/防误触 UI，**不是安全锁屏，也不提供认证或访问控制**。任何能操作当前浏览器会话的人都可以点击“返回工作”。

## 效果预览

![侧栏入口](assets/screenshot-lock-btn.png)

![游戏画面](assets/screenshot-game.png)

## 功能

- **休息模式**：侧栏底部一键进入全屏小游戏，不修改 Harness 应用代码。
- **多种控制方式**：鼠标、触控/触控笔（Pointer Events）、方向键和 WASD 都可控制大 logo；`Esc` 可随时退出。
- **吃 logo**：下落 logo 被吞噬后累计分数，大 logo 持续变大，达到极限会爆裂并重生。
- **最佳分数**：最高分保存在浏览器 `localStorage`。
- **更省资源**：碰撞检测使用内存坐标，不再每帧为所有小 logo 做 DOM 布局读取；切到后台标签页时自动暂停。
- **无障碍/舒适性**：支持键盘、focus 样式、`prefers-reduced-motion`、响应式 HUD 和系统深色模式。
- **自包含图标**：浏览器游戏不再依赖宿主 `/favicon.svg`，降低 Harness 路径/资源变化导致的破图风险。
- **可选桌面快捷方式**：明确配置 `shortcut: true` 后，才会创建/刷新桌面快捷方式；支持 Windows、macOS 和 Linux/XDG。

## 安装

```bash
dsh plugin --profile web add github:CochraneK/dsh-gate-game-plugin
```

或从本地目录安装：

```bash
dsh plugin --profile web add ./dsh-gate-game-plugin
```

重启 `dsh web` 后，侧栏底部会出现休息游戏按钮。

## 桌面快捷方式（可选）

从 `0.2.0` 开始，安装插件**不会默认写入桌面**。需要时显式开启：

```yaml
dsh-gate-game:
  shortcut: true
  shortcutName: "DeepSeek Harness"
```

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `shortcut` | `boolean` | `false` | 是否创建/刷新桌面快捷方式 |
| `shortcutName` | `string` | `"DeepSeek Harness"` | 快捷方式文件名；会自动过滤跨平台非法字符 |

快捷方式会在 Web Server 端口解析后创建。如果端口变化，插件会更新已有快捷方式，而不是因为文件已存在就永久保留旧地址。Linux 会优先读取 `~/.config/user-dirs.dirs`（或 `$XDG_CONFIG_HOME/user-dirs.dirs`）中的桌面目录。

## 兼容性

| DeepSeek Harness | 状态 | 说明 |
| --- | --- | --- |
| `v0.1.5-rc.2` | ✅ 已按当前 slot 契约核对 | `sidebar.footer.action` 仍为 root/list slot |
| `v0.1.0-rc.7` | ✅ 原始开发基线 | `0.1.x` 早期版本的初始实现来源 |

Harness 仍处于快速迭代阶段。升级后如果侧栏结构发生破坏性变化，优先检查 `sidebar.footer.action` slot 契约。

## 开发

项目没有运行时 npm 依赖。`src/` 是源码，`lib/` 是 Harness 直接加载的生成文件。

```bash
npm run build      # src -> lib
npm test           # Node 内置测试
npm run check      # 语法 + 生成文件一致性 + 测试
npm pack --dry-run # 检查发布包内容
```

CI 在 Node 20 和 Node 22 上执行相同检查。

## 结构

```text
.
├── src/
│   ├── client.js      # 浏览器插件 + 游戏引擎
│   └── index.js       # Node host + 可选桌面快捷方式
├── lib/               # npm run build 生成；Harness 实际加载
├── scripts/build.mjs  # 零依赖构建/一致性检查
├── test/              # Node 内置测试
├── .github/workflows/ # Node 20/22 CI
├── assets/            # README 截图 + 桌面快捷方式图标
├── cordis.patch.yml
└── package.json
```

`package.json` 声明 `dsh.client`（Web）和 `dsh.bundle.patch`；浏览器端通过 `window.__ModuleLoader__.load` 注册，并把组件挂到官方 `sidebar.footer.action` slot。插件不修改 Harness 应用源码。

## 许可证

MIT
