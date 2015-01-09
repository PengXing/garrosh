# 概述

## 简介
garrosh是基于nodejs的web应用框架，拥有安装快速便捷，使用简单迅速，功能完整等特点，特别适用于小型且快速迭代项目的搭建。它的特点包括：

* 文件目录简单清晰，框架约束力强，避免项目复杂导致目录结构或者逻辑混乱。
* 控制器(controller)按需加载，编写方式灵活多样。
* 内置监控(monitor)模块，快速掌握web应用的全面信息。
* 中间件(middleware)扩展性强。

## 安装
garrosh的安装和其他node插件类似，使用npm在项目根目录执行：
```bash
$ npm install garrosh
```

## 启动
您可以使用garrosh内置的脚手架工具进行项目的初始化。在命令行输入如下命令即可。
```javascript   
garrosh init --name someProject --author somePerson
```

输入命令后，脚手架工具会帮助您创建必要的文件。接着输入如下命令会调用node cluster启动数个进程，数量等于物理机cpu个数。（可在`config/server.js`的`cluster`配置项进行更改）
```bash       
$ node index.js
```
    
## 目录结构
为了保证项目的功能需求，您还必须满足一定的目录结构并编写控制器、模板页面、前端JS脚本（如果需要的话）等等。[点此查看基本目录结构](http://node.baidu.com/documents/garrosh/fileStructure.md)
