# 免费 Token 的 Render 对接

## 已发布：v5 公平剑阵与简洁通关说明（2026-10-26 01:16 UTC）

主站 `8a812fa0-2aec-4ebb-ba29-bff5442ff8d0`，入口仍 `51a33be8-6ca4-4b4f-886f-613bfea996b0`。
[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40253418901)通过；12 项后端测试全部通过，含 90 组剑墙缺口可达且不被封住、边缘不反弹、v1-v4 兼容和 SQLite 并发防重复领取。
游戏已用 v5 / app-v6：减轻中后段密度和速度，三格稳定受保护缺口并标记位置；保留 45 秒、24 灵玉、两盾、不暂停和十句调侃。
对外只写通关条件，开局与 HUD 不预告最后五颗、狂暴或后续躲避机制。用户明确要求有挑战但不能设计无路可躲或强制死亡；后续调整保留此原则。

公网真实 v5 领奖成功（24 玉、2 盾），并发 409/200/409。仍发当前 `01db29c9e73f5fba`，models 200 / 34 模型；未改 Render、Key 或人物图片。
28 个发布资源与源码一致，8 个原图/脚本保留，主域名/www 对齐。320×480、393×580、844×390 公网浏览器用固定开局验证无机制剧透、拖动/后台不暂停、失败双入口和实际阶段标记，无脚本异常；该浏览器模拟开局，真实领奖另用公网 API 核验。
`GAME_RUNS`、ASSETS、SITE/Site 转发与旧局均保留；已撤销的昨天 Key 不恢复。证据见 `verification/release-v5.json`、`production-v5.json`、`fairness-v5.json`、`fairness-browser-*.json`；以下为历史记录。


## 昨天的义父 Key 已撤销（2026-10-26 00:46 UTC）

用户明确要求更新即替换并撤销旧义父 Key，已完成：[撤销与验证](https://github.com/928886540/cloudflare_temp_email/actions/runs/40250878059)。
昨天的 `7fa19b84ca57a2ba` 已从 Render 删除，调用 models 返回 401；当前网站仍只发新 Key `01db29c9e73f5fba`，models 200。
Render 剩 3 把客户端 Key：当前义父 Key 和另外 2 把原有 Key；10 份登录均已恢复。部署 `dep-dbfa5eq9lscs739btcq0`，代码提交不变。
CF 主站仍 `c6a75a10-b1bd-4a93-ba54-8d4ba2236408`、入口仍 `51a33be8-6ca4-4b4f-886f-613bfea996b0`，网页/游戏与新 Key 发放均未改动。
后续“更新/换义父 Key”必须完成新 Key 验证与网页切换后撤销旧义父 Key，不能只新增。脱敏证据 `verification/key-revocation-20261026.json`；以下为历史记录。


## 用户更正：更新义父 Key 必须撤销旧 Key（2026-10-26）

“更新义父 Key”“换个新的义父 key”是轮换，不是只新建：只保留最新的义父发放 Key。
先记录旧网页 Key 的指纹，新增并验证新 Key、同步网站成功后，必须用 `yifu-remove-key.yaml` 的明确旧指纹撤销旧义父 Key，并验证旧 Key 401、新 Key 200。
切换后不要用移除流程的默认 `current`，否则会删掉新 Key。其他原有客户端 Key 和登录凭证保留；明确要求“额外新增并保留旧义父 Key”时才追加保留。
本次需撤销昨天的 `7fa19b84ca57a2ba`，保留当前 `01db29c9e73f5fba`；指纹不含 Key 原值。


## 当前发放 Key 已更新（2026-10-26 00:39 UTC）

按用户“换个新的义父 key”要求，使用默认分支 `yifu-add-key.yaml`，`publish=true` 完成。
新客户端 Key 指纹 `01db29c9e73f5fba`（非凭据），Render 共 4 把 Key，原 3 把全部保留；10 份登录凭证全部备份并恢复。
Render 部署 `dep-dbfa25cs728c73elg030`，仍为原代码提交 `f9cee393e5360db6b47dd18d6c2747a2e6c6cbb7`。新旧 Key 均经 models 验证，新 Key models 200 / 34 模型。
网站 `FREE_TOKEN_RENDER_KEY` 已同步同一把新 Key，领奖地址仍为 `https://cpa-dhke.onrender.com/v1`。
主站当前版本 `c6a75a10-b1bd-4a93-ba54-8d4ba2236408`；入口仍 `51a33be8-6ca4-4b4f-886f-613bfea996b0`。本轮仅切 Secret，全部 Worker 模块、页面/动效、游戏 v4 规则、其他绑定和 Render 环境配置不变。
[操作与验收记录](https://github.com/928886540/cloudflare_temp_email/actions/runs/40250335029)，脱敏结果 `verification/key-rotation-20261026.json`。后续换 Key 继续用此固定流程，重新读取实时版本；以下为历史记录。


## 已发布：v4 最后五颗狂暴与十句嘲讽（2026-10-26 00:24 UTC）

主站版本 `ad78a420-ae8e-4df3-86b4-8b2f3d3edca3`，入口保留 `51a33be8-6ca4-4b4f-886f-613bfea996b0` 和 SITE → Site 绑定。
[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40249180162)通过，阶段构建 9 项后端测试全部通过。
新局 v4 / app-v5：45 秒、24 枚灵玉、两点护盾；累计 19 枚即还差 5 枚时狂暴，不按剩余时间触发。吃满后不再掉玉，纯躲避至 45 秒。
失败随机显示 10 句带 emoji 的嘲讽，保留用户给出的三句、“车到山前必有路，赶紧回头叫义父！”及诗词谐改；可重试或直达义父领取。仍然不准暂停，退出回选择页。

公网真实 v4 领奖通过：24 枚灵玉、剩 1 盾，并发三次仅一次成功（409/409/200）；与原领取 Key 相同，models 200 / 34 个模型。
26 个发布资源与源码一致，8 个原图/脚本保留，主域名/www 对齐。320×480、393×580、844×390 公网浏览器用模拟开局验证短屏、拖动不暂停、后台时间结算、嘲讽/双入口首屏可见，以及第 19/24 枚状态，无脚本异常；真实领奖另用公网 API 核验。
密钥、Render 配置、星夜人物素材、原 ASSETS、GAME_RUNS 命名空间和 v1/v2/v3 在途局均保留。证据在 `verification/production-v4.json`、`rage-browser-*.json`、`release-v4.json`；以下为历史记录。


## 已发布：彻底取消暂停（2026-10-25 23:50 UTC）

主站版本 `423d9f41-8557-4716-92d1-9b0035f63719`，入口仍为 `51a33be8-6ca4-4b4f-886f-613bfea996b0`。
页面改用 `app-v4.mjs`；暂停/继续按钮、空格/ESC 暂停、失焦及后台自动暂停均已移除。
游戏按实际经过时间推进，后台/BFCache 返回时补算；手机拖动和焦点变化不会停止游戏。
用户明确要求不准暂停，后续不要从历史客户端恢复此功能。规则仍为 v3，两点护盾、30 秒、16 灵玉。

[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40246534213)通过。
主域名/www 的游戏 HTML 与 app-v4 均和源码一致，均无暂停/继续按钮。公网 393×580 浏览器
使用固定开局测试夹具验证连续拖动、反复失焦、空格/ESC 和冻结回调后跳时返回；无暂停和脚本异常。
该浏览器用例模拟开局 API，不代表本轮重新完成真实领奖；发布检查真实旧领取/models 200，奖励未变。
本轮未改规则引擎、密钥、人物图片或 GAME_RUNS；阶段构建的原 6 项后端验收仍通过。证据见
`verification/no-pause-browser*.json`、`no-pause-public-source.json`。

## 当前 v3 发布：两点护盾与人物美术（2026-10-25 17:05 UTC）

主站版本 `168571b3-3eab-46c8-89f4-310b62491bf4`，入口仍为
`51a33be8-6ca4-4b4f-886f-613bfea996b0`。新局只有两点护盾；剑煞加速、频率和双剑概率提高。
前后端使用 `engine-v3.mjs`，旧局继续按原版本重放；30 秒、16 灵玉与选择页退出流程不变。
四张成年人物海报用原生 image_gen 加强露肩、深领与丰满身形，采用首页 v6 / 令牌 v4 新 URL。

[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40214794565)通过。
公网确认初始两盾，通关领奖与旧方式的 Key 相同、models 200，并发 409/409/200。21 个资源、
主域名/www 及手机浏览器验证通过；Key、原静态资产和 GAME_RUNS 保留。脱敏证据在新源码
`verification/*v3.json` 和 `artwork-v6.json`；下文版本均为历史记录。

## 当前发布：独立选择页与御剑破阵 v2（2026-10-25 16:40 UTC）

当前维护源码为 `sites/leonmingod-star-night/`，由本轮线上恢复并修改。主站版本
`f9576720-5c7f-4909-a685-5e145fc25001`；转发版本
`51a33be8-6ca4-4b4f-886f-613bfea996b0`。转发源码不变，SITE 绑定主站命名入口 `Site`，
保留原具体路由、ASSETS、Secret 和 GAME_RUNS。令牌点击后进入 `/free-token/choose/`，
选择原义父领取或 v2 游戏；游戏退出回选择页。v2 为 30 秒、3 盾、16 灵玉。

[发布记录](https://github.com/928886540/cloudflare_temp_email/actions/runs/40212806612)通过。
公网两种领取 Key 完全相同，指纹仍为 `7fa19b84ca57a2ba`，models 200/22 个模型；
游戏并发领奖为 200/409/409。14 个更新资源、8 个原图/脚本和 www 对齐检查通过。
当前记录与证据在新目录的 `WEBSITE_UPDATE_CN.md` 和 `verification/`，不含密钥原值。

保留 ASSETS 时不应只设置 `assets.config.run_worker_first` 期待覆盖其旧路由；保留命名入口
绑定才能让当前页面进入主站处理。HTML 校验排除 CF 统计脚本及其多插入的一行空白。
旧版本号及旧部署说明在下文作为历史记录保留。

## 最新网站交接优先（2026-10-25）

先读[星夜版与御剑破阵交接](./leonmingod-star-night-handoff.md)。主站已更新到
`2bc44ccd-b647-483b-aca7-256ea46ad69c`，新增 `GAME_RUNS` 与游戏领奖；新源码来自用户
尚未上传的独立网站目录。下文旧页面部署与源码位置仅供历史参考，不得用旧仓库覆盖线上。
原领取仍有效，与游戏共用 `FREE_TOKEN_RENDER_KEY`。现有 Actions 授权已重新验证可用。

## 日常一键操作：添加 / 移除

两个固定操作已安装到默认分支 `main`，下次无需修改脚本、手动刷新版本号或生成备份私钥。

| 操作 | 默认行为 | GitHub Actions 入口 |
| --- | --- | --- |
| 添加义父 Key | 在 Render 追加新客户端 Key，并同步到网站领取流程 | [添加义父 Key](https://github.com/928886540/cloudflare_temp_email/actions/workflows/yifu-add-key.yaml) |
| 移除义父 Key | 停止网页发放当前 Key，并从 Render 移除该 Key，验证其返回 401 | [移除义父 Key](https://github.com/928886540/cloudflare_temp_email/actions/workflows/yifu-remove-key.yaml) |

直接执行：

```bash
gh workflow run yifu-add-key.yaml -R 928886540/cloudflare_temp_email
gh workflow run yifu-remove-key.yaml -R 928886540/cloudflare_temp_email
```

添加时 `publish=false` 表示只加到 Render；移除时可填 `fingerprint`（16 位 SHA-256 指纹），
选择其他 Key，不影响网页当前 Key。不填则针对网页当前 Key。`dry_run=true` 仅检查，不更改线上。
新增保留已有 Key；移除只针对选中的 Key，并阻止删除最后一把 Render 客户端 Key。

共享实现：`.github/scripts/yifu_keys.py` 与 `yifu_key_api.py`。每次先读取实时状态并准备计划，
上传加密恢复计划成功后才应用；应用前再次比对版本、配置与登录文件，发生并发变化就停止。
只用原构建重新部署，保留并恢复登录文件；只更新或移除 CF Secret，不上传页面代码。
删除当前网页 Key 后，领取接口返回 503 停止发放；下次添加并同步会重新开放。

备份使用 AES-GCM 完整性加密，密钥由现有 `RENDER_API_KEY` 加随机盐派生，无需额外配置 Secrets。
加密计划保留 7 天，操作结果保留 90 天并写入 Actions 摘要；管理凭据更换后，旧备份仍需当时的
凭据原值解密。失败步骤会尝试恢复缺失登录文件。固定流程省去改代码与手工核对步骤，但 Render
重新部署仍需要等待，不能承诺瞬时完成。旧 `issue-yifu-key.yaml` 和一次性迁移脚本留作历史记录，
日常操作使用上面两个入口。

## 当前义父密钥发放记录（北京时间 2026-10-25 21:03）

已新建并开放网页领取。Key 原值只保存在 Render 与 CF Secret 中；用于识别的 SHA-256 前 16 位为
`7fa19b84ca57a2ba`，不是鉴权凭据。Render 现有 3 把客户端 Key（原 2 把保留），10 份登录凭证已恢复。
网页领取与该 Key 调用 `/v1/models` 均为 200，验收时返回 34 个模型；页面、动效与代码模块均未改变。

- 主站当前版本：`fad0e247-77a5-43c2-b708-737898d88ea4`（仅更新 `FREE_TOKEN_RENDER_KEY`）。
- 入口版本：`69575cec-ac2c-416f-81b9-b64030e87651`，本次未改。
- Render 部署：`dep-dbevs57b9u1s73b4q6pg`，仍使用原代码构建。
- [发放与验证记录](https://github.com/928886540/cloudflare_temp_email/actions/runs/40195833941)。
- 后续新增并开放 Key 使用 `Issue and publish Yifu Token key`，先 `inspect` 再审阅保护值后 `issue`。
  不重跑历史 `connect` 或默认撤销旧 Key。当前主站包含 `index.js` 与 `index.js.map` 两个模块，
  旧脚本的单模块假设已不适用；新流程通过 CF Secret API 更新绑定并核对全部模块摘要。

## 新增并开放义父密钥

使用网站工作分支的 `Issue and publish Yifu Token key` 工作流：默认 `inspect` 只读检查；
明确选择 `issue` 后，追加一把新的 Render 客户端 Key、使用原构建部署并恢复登录文件，
验证新旧 Key 后，仅更新主站 Worker 的 `FREE_TOKEN_RENDER_KEY` Secret，让网页发放同一把新 Key。
页面入口 Worker、首页、手机轻量特效和现有源代码模块不重部署；包括 `index.js.map` 在内的
主站模块均进行 SHA-256 比对。主站 CF 版本会随 Secret 更新而改变。

脚本为 `.github/scripts/issue_yifu_key.py`，与历史一次性 `connect`、旧密钥撤销任务分开。
历史工作流的默认模式也已改回 `inspect`；不再因推送自动执行撤销。
操作前重新读取并核对 CF 主站/入口版本、模块摘要与 Render 部署，更新新脚本的保护值。
加密备份使用 `yifu-issue-backup-public.pem`，必须持有其对应的私钥；不要将私钥或客户端 Key 写入仓库。
新发放只追加 Key，不删除、覆盖现有 Render Key；网页切换失败时恢复前一个 CF 版本。

## 用户固定用语（2026-10-25 确认）

| 用户说法 | 在本项目中的含义与执行目标 |
| --- | --- |
| 义父 Token / 义父token | 本免费 Token 网站：`https://leonmingod.com/free-token/` |
| 加一个义父密钥 | 去 Render 的 `cpa` 服务配置新增一把客户端 API Key，保留已有 Key 与其他配置 |
| 打开义父 Token 给别人用 | 将对应客户端 Key 挂到本网站的领取流程，让别人通过网页领取使用；同步 CF Secret 与 Render 中的同一把 Key，并验证发布 |

“义父密钥”是提供给 API 使用者的客户端 Key，不是管理 Render 的 `RENDER_API_KEY`。
“打开给别人用”是启用网页发放的操作要求，不能只打开浏览器页面就当作完成。
仅要求新增密钥时，先完成 Render 新增，不自动替换网页当前发放值；要求开放网页使用时，
再按当前会话明确的对应 Key 接入并发布。沿用已有仓库、服务和 GitHub Secrets，
不因简称不同而重新建项目或重复要求用户创建管理凭据。

## 手机流光性能修复

已于北京时间 2026-10-25 01:18 发布。代码提交 `89de9160c60e63f6a3c937d15e461dcd79155cfa`；
入口版本 `2abf9c44-faf5-4f98-80fa-e383108cca07`，主站仍为 `8aa85754-acf1-498e-91ad-78117e40f8e5`。
[发布与线上验证](https://github.com/928886540/cloudflare_temp_email/actions/runs/40115492703)通过；
线上入口、领取页和 v2 脚本与已测试预览一致，首页保持发布前内容。

触屏设备改为轻量渲染：流体纹理 256、模拟网格 64、压力迭代 6、最高 30 帧、画布像素比上限 1；
低配置设备进一步降至 192 / 48 / 4、最高 24 帧。手机闲置 2.5 秒后暂停，恢复触摸时重新启动；
屏幕/键盘引发的连续 resize 在 150ms 后合并处理。手机令牌和领取卡片保留光晕，移除多层大范围
drop-shadow、模糊及背景实时模糊；桌面保留原画质和悬停效果。

专用引擎 `/free-token/fluid-v2.js` 从 `assets/token-fluid-v2.txt` 提供，保留原 MIT 许可，
增加帧率/像素比预算，并修正原引擎会把显式手机纹理设置强制升回 512 的逻辑。
页面控制脚本升级到 `/free-token/effects-v2.js`；首页的 `/vendor/fluid.js` 未改。
验证覆盖 DPR=3 的普通/低配置触屏模式、桌面模式、实际 WebGL 绘制频率上限、闲置暂停、
resize 合并、令牌点击和确认表单。浏览器模拟验证不代表已在用户的 iPhone 上做过真机测量。

此修复保留仓库后续新增的四入口、品牌 Logo、领取卡片居中与退出行为，不修改 Render 配置或 Key。

`https://leonmingod.com/api/free-token/claim` 仍接受原有的确认请求，成功后返回
`baseUrl: https://cpa-dhke.onrender.com/v1` 和在 Render CPA 注册的同一把客户端 Key。
客户端 Key 存在主站 Worker 的 `FREE_TOKEN_RENDER_KEY` Secret 中；原 `FREE_TOKEN_CPA_KEY`
继续保留。首页图片、胶囊导航、免费 Token 满屏布局和令牌点击动效不受影响。

## 最新页面发布（2026-10-24 05:23 UTC）

免费 Token 入口和领取页现已加入首页同款青玉/淡金流光，令牌浮动约 7px，
光晕与发光轮廓增强。领取页手机卡片最大 340px，压缩插画及表单间距；
393×664 可视区域的确认按钮底边约为 511px，320×480 窄屏也可在首屏点到。

| 项目 | 当前页面发布记录 |
| --- | --- |
| 页面代码提交 | `60af1c18e1fcc1df18086c9210fe7e4a9ab6cca4`，网站工作分支 |
| 新入口 Worker 版本 | `5e32ed4c-a405-4e69-872d-f88526cba7d9` |
| 入口部署 ID | `1a433adb-05de-4fd9-bee1-00c6da262e19` |
| 主站 Worker 版本 | 仍为 `8aa85754-acf1-498e-91ad-78117e40f8e5` |
| 发布记录 | <https://github.com/928886540/cloudflare_temp_email/actions/runs/40066068773> |
| 本次 Render 操作 | 无；地址、Key、主站源码和首页内容保持不变，所发 Key 调用 models 仍为 200、50 个模型 |

`src/token-scene.js` 复用原 `/vendor/fluid.js`；`src/claim.js` 用 HTMLRewriter 收紧原领取页，
不重写原 `app.js` 的确认、领取与复制流程。新浏览器脚本地址为 `/free-token/effects-v1.js`，
使用长期缓存，未来修改脚本时必须同时更新 URL 版本。特效层不拦截链接、表单或弹窗，
支持减少动态效果偏好、WebGL 不可用回退和隐藏/闲置暂停。

Chromium 渲染检查覆盖 320×480、375×548、393×664、430×740、1440×900，
以及横屏令牌定位、点击跳转、输入/确认/拒绝/领取弹窗、减少动态效果和无 WebGL 回退。
线上页面与预览内容一致（比对时排除 Cloudflare 自动注入的统计脚本），四张原图保留。
下方 05:08 的对接版本表是历史验收快照；后续修改入口前以此节的新版本为参考并重新读线上。

## 横屏主页导航更新（已完成）

用户在本次页面发布后指出，主站横屏底部的三个入口过小，提供了画有三个红圈的位置参考。
已按照用户红圈截图与要求完成以下改动并发布：

- 页面为主站 `https://leonmingod.com/`，修改网站工作分支的 `src/homepage.js` 导航布局。
- 三个入口移到画面右侧 Logo/题字下方的红圈位置。1920×909 参考图的圆心约为
  `(61%,72%)`、`(70%,73%)`、`(81%,74%)`；这些是构图参考，不是固定像素。
- 按钮改为绿色背景的圆形，尺寸接近所画红圈（参考图直径约 130–150px），文字与图标清晰。
  顺序和目标仍为“进入灵境”→邮箱、“免费 Token”→免费 Token 入口、“地址证明”→地址证明站。
- 其他界面文字适当增大，尤其右上角流光控制与底部提示；保留当前首页背景和流光。
- 针对横屏/桌面自适应定位；检查 1920×909 和较小手机横屏，不得重叠或超出视口。
  竖屏与免费 Token 入口、领取页也要回归检查。
- 用户正在准备新开会话；新会话应同时参考其红圈截图及本记录，完成修改、真实浏览器验证和发布。

## 配置来源

Render 服务 `cpa` 绑定私库 `928886540/cpa` 的 `main` 分支，使用
`./CLIProxyAPI --config /etc/secrets/config.yaml` 启动。客户端 Key 在该 Secret File
的 `api-keys`（或新版 `access.api-keys`）列表中追加，其他配置不变。

GitHub Actions 的 `Connect Free Token to Render` 工作流使用仓库 Secrets
`RENDER_API_KEY`、`CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。
`RENDER_API_KEY` 是管理 Render 的凭据，不能作为发给用户的客户端 Key。

## 发布与验证

工作流在推送时仅执行 `inspect`。手动选择 `connect` 前，先核对检查输出中的
主站、入口 Worker 版本和 Render 当前提交，再更新脚本里的版本保护值。
连接脚本会保留原客户端 Key，先加密备份配置与登录文件，再追加新 Key 并使用原构建部署。
没有持久化磁盘时，部署后通过 CPA 管理接口恢复缺失的登录文件，保留禁用状态。
加密恢复备份以 Actions artifact 保留两天；解密私钥由本次操作的执行工作区单独保管，
不提交到仓库。私钥不在 Actions artifact 中。

只有新旧 Key 均通过 `/v1/models` 验证后，才替换主站领取接口的地址及 Secret 引用。
发布后检查领取接口发放的 Key 与 Render 注册值一致，并逐字节校验页面、图片和交互脚本。
验证失败时恢复发布前的主站版本。入口 Worker 不参与这次切换。

`sites/free-token-home/src/site-original.js` 继续作为旧主站源码备份；连接脚本直接读取、
核对并最小修改当前线上源码。旧入口部署脚本的版本保护值不会自动刷新，不能直接重跑。

## 运维交接记录（2026-10-24）

对接已完成并发布。最后一次完整验收为 **2026-10-24 05:08 UTC**：领取接口返回新地址，
所发 Key 调用 Render `/v1/models` 返回 200，共 50 个模型；原 2 把客户端 Key 仍可用，
8 份登录凭证已全部恢复，配置和环境变量保留。页面、四张图片及交互脚本逐字节比对通过。
以下版本和数量是该次验收的快照，后续修改前必须重新读取。

### 仓库与入口

| 用途 | 位置 |
| --- | --- |
| 主站 | `https://leonmingod.com/` |
| 免费 Token 入口 | `https://leonmingod.com/free-token/` |
| 领取页 | `https://leonmingod.com/free-token/claim/` |
| 领取 API | `POST https://leonmingod.com/api/free-token/claim` |
| 发放的 API Base URL | `https://cpa-dhke.onrender.com/v1` |
| 网站仓库 | `928886540/cloudflare_temp_email` |
| 网站工作分支 | `codex/free-token-home-20261024` |
| 网站代码 | `sites/free-token-home/`（位于工作分支） |
| 部署脚本 | `.github/scripts/free_token_render.py`（位于工作分支） |
| 对接工作流 | `.github/workflows/connect-render-free-token.yaml`（位于工作分支） |
| 本次发布代码提交 | `e3d6320dcd65a9192cc705d4926aa4157e207893` |

本记录与根目录 `AGENTS.md` 的索引同时保存到默认分支 `main` 和网站工作分支。
**记录出现在 `main` 不代表网站工作分支已经合并。** 新会话在默认分支找不到网站代码时，
先获取并切换工作分支，不要据此重新建站。

### Cloudflare

| 配置 | 已核对的值 |
| --- | --- |
| 主站 Worker | `leonmingod-home`：原站静态资源与领取 API |
| 入口 Worker | `leonmingod-free-token`：主站首页变换、免费 Token 入口 |
| 入口到主站的服务绑定 | `SITE` → `leonmingod-home` |
| Zone | `leonmingod.com`，ID `4f078f06b815a404337c3b5387c45275` |
| 发布后主站版本 | `8aa85754-acf1-498e-91ad-78117e40f8e5` |
| 入口版本（本次未改） | `4fda0cc3-1bdd-4b31-a5e6-9012b933931b` |
| 切换前主站版本 | `b3943206-85ca-4ca0-8617-951317245755` |
| 主站绑定 | `ASSETS`（assets）、`FREE_TOKEN_CPA_KEY`、`FREE_TOKEN_RENDER_KEY`（secret_text） |
| 当前领取 API 使用的绑定 | `FREE_TOKEN_RENDER_KEY` |
| 发布后主站源码 SHA-256 | `1bfd639be2c04996d8e7fac80c2ab42e085acc5200f416b02a2904adc749562a` |

入口 Worker 的根域与 www 路由覆盖首页、`/index.html`、`/free-token`、`/free-token/*`、
两张 `home-hero-*-v4.webp` 和 `/home-scene-v4.js`。领取 API 由原主站处理。
不要将主站 Worker 与入口 Worker 混为一个部署目标。

`src/site-original.js` 仍包含旧地址和旧绑定，这是**历史备份**，不能直接覆盖线上主站。
本次线上修改仅替换其中的两处 `env.FREE_TOKEN_CPA_KEY` 引用及一处旧 API 地址，静态资源不变。
当前主站行为以线上源码和本记录为准。

### Render

| 配置 | 已核对的值 |
| --- | --- |
| 工作区 | `My Workspace`，`tea-d779tahr0fns73e1h3lg`，用户已指定此工作区 |
| 服务 | `cpa`，`srv-d9c4kkvavr4c73ab3sfg` |
| 控制台 | `https://dashboard.render.com/web/srv-d9c4kkvavr4c73ab3sfg` |
| 实际部署仓库 | 私库 `https://github.com/928886540/cpa`，`main` 分支 |
| 公开仓库 | `928886540/CLIProxyAPI` 不是此服务当前绑定的部署仓库 |
| 运行方式 | Docker，`./Dockerfile`，构建上下文 `.` |
| 启动命令 | `./CLIProxyAPI --config /etc/secrets/config.yaml` |
| Secret File | 文件名 `config.yaml`，运行路径 `/etc/secrets/config.yaml` |
| 客户端 Key 配置 | 当前为根级 `api-keys` 列表，共 3 把：原 2 把 + 本次新 Key |
| 管理接口 | `/v8/management`；管理口令与客户端 Key 是不同用途的凭据 |
| 环境变量 | `MANAGEMENT_PASSWORD`、`MANAGEMENT_STATIC_PATH`，本次值未改 |
| 代码提交 | `f9cee393e5360db6b47dd18d6c2747a2e6c6cbb7`，v8.0.22 |
| 本次成功部署 | `dep-dbe3q94s728c7392m8kg`，使用原构建部署，无代码升级 |
| 健康检查 | `/healthz`，200 |
| 区域与套餐 | Singapore，free，1 个实例 |
| 自动部署 | 已开启，推送到所绑定私库的 `main` 会触发部署 |
| 持久化磁盘 | 无；登录文件会因重新部署而丢失，必须先备份并在部署后恢复 |

`/etc/secrets/config.yaml` 为只读运行配置。不要依赖管理页把配置写回此路径；
持久配置应更新 Render Secret File。不要为了记录运维信息随意向私库 `cpa/main` 推送，
因为它会触发线上重新部署。

### 密钥保存位置与接入方式

| 名称 | 保存位置与用途 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | 网站仓库 Actions Secret，CF 账户定位 |
| `CLOUDFLARE_API_TOKEN` | 网站仓库 Actions Secret，CF 管理鉴权；现有部署已验证可用 |
| `RENDER_API_KEY` | 网站仓库 Actions Secret，Render REST API 管理鉴权；本次已验证可用 |
| `FREE_TOKEN_RENDER_KEY` | CF 主站 Secret；同一值已追加进 Render `config.yaml`，用于发给用户 |
| `FREE_TOKEN_CPA_KEY` | CF 主站原 Secret，保留但领取接口已不使用 |

Secrets 设置页：`https://github.com/928886540/cloudflare_temp_email/settings/secrets/actions`。
**不要在记录、仓库、聊天或日志中写密钥原值。** GitHub 中已有 Secret 不会自动成为新会话
云环境的环境变量；本机看不到 `RENDER_API_KEY` 不等于 GitHub 没配置，不要重复要求用户创建。
可通过已经配置好的 Actions 通道使用这些 Secrets。

本次 Render 插件可以列出服务、读取服务信息、修改环境变量及触发部署，但没有 Secret File
读写工具。Secret File 操作走 Render REST API，鉴权使用 Actions 中的 `RENDER_API_KEY`：
`GET` / `PUT /v1/services/{serviceId}/secret-files/config.yaml`，单文件 PUT 的 JSON 为
`{"content": "完整的更新后文件内容"}`。先读、仅追加客户端 Key、比较其他配置，再写；
不要用覆盖全体环境变量或 Secret File 集合的操作。

### 下次修改的流程

1. 先读本记录和 `AGENTS.md`，确认用户要改页面、领取逻辑还是 Render 服务；切换到网站工作分支。
2. 先执行只读检查，读取主站、入口当前版本、线上源码、Render 当前部署和 Secret 配置。
   工作分支支持以下命令；工作流输出已脱敏：

   ```bash
   gh workflow run issue-yifu-key.yaml \
     -R 928886540/cloudflare_temp_email \
     --ref codex/free-token-home-20261024 -f mode=inspect
   gh run list -R 928886540/cloudflare_temp_email \
     --workflow issue-yifu-key.yaml -L 3
   ```

3. 仅改页面时，使用入口 Worker 的部署路径；保留原图、胶囊导航、满屏裁切和令牌点击动效，
   除非用户要求更换。修改工作分支的 `sites/free-token-home/**` 会触发入口部署工作流，
   包括修改该目录里的 README；部署前先核对并更新其版本保护值。
4. 改主站领取逻辑时，读取当前主站源码再最小修改，保留 `ASSETS` 和所有 Secret 绑定。
   `stage-render-free-token.yaml` 是旧暂存任务；不要重跑。
   `connect` 是已经执行完成的**一次性切换**，内部仍校验切换前版本和旧地址；不能当作日常重部署命令，
   也不能只刷新版本常量就盲目重跑。`inspect` 可继续用于只读核对。
5. 只要 Render 操作会重新部署，先列出并下载当前全部登录 JSON，保存可恢复的加密备份，
   核对配置和原 Key，再操作。下一次需使用自己持有私钥的新备份密钥对；仓库中的公钥
   对应本次执行工作区的私钥，不能假定新会话也有该私钥。
6. 部署后恢复缺失登录文件，保留禁用状态；检查原 Key 和新 Key，确认配置和环境变量未被误改。
7. 验收：`/healthz` 200；领取 API 返回预期地址及 Key；用所发 Key 调用 `/v1/models` 200。
   同时验证领取确认、同源限制和 GET 405，再检查图片哈希、胶囊导航、满屏令牌及交互脚本。
8. 记录本次新版本、提交、部署和验收链接。版本保护用**刚读取并审阅的版本**，不要照抄历史快照。

领取请求仍为 JSON `{"oath":"义父","confirmed":true}`，同源 Origin 为
`https://leonmingod.com`，响应设置 `Cache-Control: no-store`。测试时不要打印响应中的 Key。

### 验收证据与恢复注意

- 成功发布与完整验收：<https://github.com/928886540/cloudflare_temp_email/actions/runs/40065013859>
- 发布后只读复核：<https://github.com/928886540/cloudflare_temp_email/actions/runs/40065097553>
- 加密恢复 artifact 位于成功发布任务，名称 `encrypted-render-integration-backup`，保留两天；
  它不是长期备份，也不包含解密私钥。未来操作应重新备份当前状态。
- 主站可通过 CF 版本部署回滚；未来修改应以当时发布前版本为回滚点。上表切换前的
  `b394...` 版本会重新发放旧域名，不能当作保留 Render 对接的日常回滚版本。
- 本次保留的是 8 份登录文件及其禁用状态，不代表将来在无持久化磁盘的 Render 上自动持久保存。
