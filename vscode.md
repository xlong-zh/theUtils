## VSCODE 简要说明

Microsoft 开源编辑器。基于 node 的 Electron。
选择 vscode 的原因

- TypeScript。vscode 为 TypeScript 提供原生支持。vscode 是在实现 TypeScript 的支持下顺便实现了 JavaScript
- 轻量简单
- 插件
- 免费

_WebStorm 其实也不错_

1. ## 插件

> 建议安装 10 个以内数量的插件。插件太多容易卡顿，摈弃了 vscode 轻量化的优势，与选择 vscode 的初衷背道而驰。

主要插件

- Bracket Pair Colorizer\
  括号高亮

- Debugger for Chrome\
  Angular 和 React 断点调试

- Prettier - Code formatter\
  代码格式化

- Vim\
  vim 插件

- Material Icon Thema\
  文件类型 icon。文件类型太多时方便区分

- Material Theme\
  主题。语法高亮样式

次要插件

> React 建议不用。

- React-Native/React/Redux snippets for es6/es7\
  React 全家桶 语法提示 (不建议)

- Angular 8 Snippets - TypeScript, Html, Angular Material, ngRx, RxJS & Flex Layout\
  Angular 语法提示

- Angular Follow Selector
  Angular 模板跳转

2. ## 配置

- 配置文件
  > 包括 编辑器配置和插件配置

```json
{
  // editor
  "editor.fontSize": 14, // 字号
  "editor.formatOnSave": true, // 保存执行格式化
  "explorer.confirmDragAndDrop": true, // 拖动文件时确认
  "explorer.confirmDelete": true, // 删除文件时确认
  "editor.detectIndentation": false, // 让自己设置的缩进在所有文件中生效
  "files.autoSave": "off", // 自动保存
  "editor.fontFamily": "'FuraCode Nerd Font Mono', 'monospace', monospace, 'Droid Sans Fallback'", // 字体。FuraCode 比较适合编码，支持连体
  "editor.fontLigatures": true, // 允许连体
  "workbench.iconTheme": "material-icon-theme",
  "workbench.colorTheme": "Material Theme Palenight",

  // prettier
  "prettier.printWidth": 120, // 一行代码最大长度120字符
  "editor.tabSize": 2, // tab大小2空格
  "prettier.singleQuote": true, // 单引号
  "prettier.semi": true, // 分号

  // typescript
  "typescript.updateImportsOnFileMove.enabled": "always", // 文件移动后更新import路径

  // 装饰器
  "javascript.implicitProjectConfig.experimentalDecorators": true,

  // stylus
  "stylusSupremacy.insertColons": false, // 是否插入冒号
  "stylusSupremacy.insertSemicolons": false, // 是否插入分好
  "stylusSupremacy.insertBraces": false, // 是否插入大括号
  "stylusSupremacy.insertNewLineAroundImports": true, // import之后是否换行
  "stylusSupremacy.insertNewLineAroundBlocks": true, // 两个选择器中是否换行
  "stylusSupremacy.insertSpaceAfterComment": true, // 注释后插入空格
  "window.zoomLevel": 0,

  // Formatter
  "[javascript]": {
    "editor.defaultFormatter": "vscode.typescript-language-features"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // vim
  "vim.useSystemClipboard": true, // 系统剪切板
  "vim.hlsearch": true, // 搜索高亮
  "vim.smartcase": true, // 搜索按大小写匹配
  "vim.leader": ",", // leader键
  "vim.highlightedyank.enable": true, // 复制高亮
  "vim.highlightedyank.duration": 1000, // 高亮时间
  "vim.highlightedyank.color": "rgba(250, 240, 170, 0.5)", // 高亮颜色
  "vim.history": 50, // 记录历史操作数量
  "vim.cursorStylePerMode.insert": "line", // 光标样式
  "vim.cursorStylePerMode.normal": "underline",
  "vim.cursorStylePerMode.replace": "underline",
  "vim.cursorStylePerMode.visual": "blink",
  "vim.cursorStylePerMode.visualblock": "blink",
  "vim.cursorStylePerMode.visualline": "underline",
  "vim.easymotion": true, // easymotion插件
  "vim.easymotionMarkerFontSize": "16", // easymotion标记字体大小
  "vim.easymotionMarkerHeight": 16, // easymotion标记高度
  "vim.easymotionMarkerWidthPerChar": 9, // easymotion标记宽度
  "vim.normalModeKeyBindings": [], // mormal模式键位绑定
  "vim.normalModeKeyBindingsNonRecursive": [
    // 普通模式键位绑定（不递归执行）
    {
      "before": ["d"],
      "after": ["\"", "_", "d"] // d映射为\_d。旨在使用黑洞寄存器
    },
    {
      "before": ["d", "d"],
      "after": ["\"", "_", "d", "d"]
    },
    {
      "before": ["D"],
      "after": ["\"", "_", "D"]
    },
    {
      "before": ["x"],
      "after": ["\"", "_", "x"]
    },
    {
      "before": ["X"],
      "after": ["\"", "_", "X"]
    },
    {
      "before": ["s"],
      "after": ["\"", "_", "s"]
    },
    {
      "before": ["S"],
      "after": ["\"", "_", "S"]
    },
    {
      "before": ["c"],
      "after": ["\"", "_", "c"]
    },
    {
      "before": ["C"],
      "after": ["\"", "_", "C"]
    }
  ],
  "vim.visualModeKeyBindings": [
    // visual模式键位绑定
    {
      "before": ["s"],
      "after": ["\"", "_", "s"]
    },
    {
      "before": ["S"],
      "after": ["\"", "_", "S"]
    },
    {
      "before": ["z", ")"],
      "after": ["c", "(", ")", "<Esc>", "h", "p"] // 旨在在v模式下选中文本快速添加')'包裹文本
    },
    {
      "before": ["z", "}"],
      "after": ["c", "{", "}", "<Esc>", "h", "p"]
    },
    {
      "before": ["z", "]"],
      "after": ["c", "[", "]", "<Esc>", "h", "p"]
    },
    {
      "before": ["z", "'"],
      "after": ["c", "'", "'", "<Esc>", "h", "p"]
    },
    {
      "before": ["z", "\""],
      "after": ["c", "\"", "\"", "<Esc>", "h", "p"]
    },
    {
      "before": ["z", ">"],
      "after": ["c", "<", ">", "<Esc>", "h", "p"]
    },
    {
      "before": ["z", "`"],
      "after": ["c", "`", "`", "<Esc>", "h", "p"]
    },
    {
      "before": ["s"],
      "after": ["\"", "_", "s"]
    },
    {
      "before": ["S"],
      "after": ["\"", "_", "S"]
    }
  ],
  "vim.handleKeys": {
    "<C-a>": false, // 禁用ctrl-c
    "<C-f>": false // 禁用ctrl-f
  }
}
```

- 键位

> vscode 键位可以制定聚焦于不同区域有不同键位绑定

结合 vim 插件在默认键位做了以下修改

    1. 删除默认的ctrl+F4。使用:q代替
    2. 跳转资源管理栏（侧边栏）改为ctrl+q。结合vim的hjkl打开文件

> > 结合 vim 和键位改动基本可以做到不动用鼠标编写代码

3. ## 编辑器

> 编辑器分侧边栏（文件栏），编辑区域和终端区域三部分。

4. ## debug 断点调试

> 代码调试使用 vscode 自带的 debug。需要结合 Debugger for Chrome 插件使用

vscode debug 设置生成基于 Chrome 的配置文件并做如下修改。

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",

      "sourceMaps": true, // 打开源码映射
      "skipFiles": ["node_modules/**"],
      "sourceMapPathOverrides": {
        "webpack:///*": "${webRoot}/*"
      }
    }
  ]
}
```

接下来就可以使用断点调试了。快捷键和 visual 系 ide 一样：\
F5 为 开始/停止 调试\
F10 为 大步跳过 会进入函数内部\
F11 为 小步跳转 不会进入函数内部\
Shift+F11 为 跳出 跳出函数
