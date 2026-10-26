# LeonMinGod 星夜版交接（2026-10-25）

## 已发布：删除悬浮方框和缺口文字（2026-10-26 01:30 UTC）

主站 `190a247f-8f89-4437-b41d-137cf2760145`，入口仍 `51a33be8-6ca4-4b4f-886f-613bfea996b0`；客户端 `app-v7.mjs`。
仅删除随剑墙下落的虚线透明方框和“缺口 ↓”文字，让玩家观察自然空位。v5 引擎、实际缺口保护、难度、不可暂停、通关条件和十句台词均未修改。
[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40254536775)通过，固定阶段构建的 12 项测试通过。主域名/www 客户端与源码一致，均已删除方框/文字；v5 引擎字节相同。
公网 320×480、393×580、844×390 浏览器与剑墙画面检查通过；开局 API 为测试夹具，本轮未重复真实游戏领奖。发布校验旧领取/models 200、相同当前 Key、GAME_RUNS 与转发结构均保留，未改 Render。
证据：`verification/no-gap-marker-*.json`、`release-no-gap-markers.json`。用户拒绝此类调试风格的安全提示，后续不得恢复；以下为历史记录。


## 界面更正：删除剑墙缺口方框与文字

用户明确拒绝随剑阵飘下来的透明方框、虚线和“缺口 ↓”标签，认为出戏。客户端 `app-v7.mjs` 仅删除这段绘制，让玩家自行观察剑阵空位。
不增加替代提示素材。v5 的三格实际缺口、通道保护、直线剑路、难度、领奖与按真实时间推进全部保留。
后续不要恢复此类方框/文字安全区提示；如确需新增提示美术，需与现有仙侠画面融合。


## 已发布：v5 公平剑阵与简洁通关说明（2026-10-26 01:16 UTC）

主站 `8a812fa0-2aec-4ebb-ba29-bff5442ff8d0`，入口仍 `51a33be8-6ca4-4b4f-886f-613bfea996b0`。
[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40253418901)通过；12 项后端测试全部通过，含 90 组剑墙缺口可达且不被封住、边缘不反弹、v1-v4 兼容和 SQLite 并发防重复领取。
游戏已用 v5 / app-v6：减轻中后段密度和速度，三格稳定受保护缺口并标记位置；保留 45 秒、24 灵玉、两盾、不暂停和十句调侃。
对外只写通关条件，开局与 HUD 不预告最后五颗、狂暴或后续躲避机制。用户明确要求有挑战但不能设计无路可躲或强制死亡；后续调整保留此原则。

公网真实 v5 领奖成功（24 玉、2 盾），并发 409/200/409。仍发当前 `01db29c9e73f5fba`，models 200 / 34 模型；未改 Render、Key 或人物图片。
28 个发布资源与源码一致，8 个原图/脚本保留，主域名/www 对齐。320×480、393×580、844×390 公网浏览器用固定开局验证无机制剧透、拖动/后台不暂停、失败双入口和实际阶段标记，无脚本异常；该浏览器模拟开局，真实领奖另用公网 API 核验。
`GAME_RUNS`、ASSETS、SITE/Site 转发与旧局均保留；已撤销的昨天 Key 不恢复。证据见 `verification/release-v5.json`、`production-v5.json`、`fairness-v5.json`、`fairness-browser-*.json`；以下为历史记录。


## v5 调整：减轻密度，消除缺口被封和突然折返

用户实玩反馈 v4 中段/尾段不合理，目标是有挑战且可躲避，不是强制失败。
新 `engine-v5.mjs` / `app-v6.mjs`：剑煞保持生成时的直线轨迹，出界离场，不再边缘反弹；剑墙留三格稳定缺口，按玩家位置选择可达区域，缺口通过期间阻止其他剑的预测轨迹封路，并显示随剑墙移动的小缺口标记。
普通段间隔略放缓、双剑概率降低；后段双剑间隔 20/14 帧改为 28/24 帧，剑墙间隔 108/72 改为 180/156 帧，速度与斜向幅度降低，受击保护由 48 增至 60 帧。
45 秒、24 灵玉、两盾、最后五颗升级和吃满后生存保留。保留 v1/v2/v3/v4 在途回放、不可暂停、十句嘲讽和退出回选择页。
**对外页面只说明通关条件，不预告最后五颗、狂暴或吃满后的机制。** 原领取页的游戏说明也对齐 45 秒/24 灵玉。
90 组种子/阶段测试通过，覆盖至少 900 次剑墙和 30000 帧缺口保护，检查缺口在 300ms 反应预算后可达且不被斜剑封住；桌面/手机原美术和当前 Key 不改。


## 昨天的义父 Key 已撤销（2026-10-26 00:46 UTC）

用户明确要求更新即替换并撤销旧义父 Key，已完成：[撤销与验证](https://github.com/928886540/cloudflare_temp_email/actions/runs/40250878059)。
昨天的 `7fa19b84ca57a2ba` 已从 Render 删除，调用 models 返回 401；当前网站仍只发新 Key `01db29c9e73f5fba`，models 200。
Render 剩 3 把客户端 Key：当前义父 Key 和另外 2 把原有 Key；10 份登录均已恢复。部署 `dep-dbfa5eq9lscs739btcq0`，代码提交不变。
CF 主站仍 `c6a75a10-b1bd-4a93-ba54-8d4ba2236408`、入口仍 `51a33be8-6ca4-4b4f-886f-613bfea996b0`，网页/游戏与新 Key 发放均未改动。
后续“更新/换义父 Key”必须完成新 Key 验证与网页切换后撤销旧义父 Key，不能只新增。脱敏证据 `verification/key-revocation-20261026.json`；以下为历史记录。


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


## v4 调整：最后五颗狂暴与失败嘲讽（2026-10-26）

新局使用 `engine-v4.mjs` / `app-v5.mjs`：45 秒、24 枚灵玉、两点护盾，不允许暂停。
**累计吃到第 19 枚（还差最后 5 枚）起进入狂暴，与剩余秒数无关。**
狂暴增加瞄准双剑、对向交叉与缺口剑墙；吃满 24 枚后停止掉玉并清除场上余玉，进入更密集纯躲避，必须活到第 45 秒。
失败随机展示 10 句带 emoji 的嘲讽，含用户指定的三句、“车到山前必有路，赶紧回头叫义父！”及诗词谐改。
提供再次挑战与直达 `/free-token/claim/` 的入口；游戏退出仍回独立选择页。嘲讽只是趣味文案，不改变 Key 或奖励期限。
服务端按逐局规则版本执行 45 秒最低实际用时校验，保留 v1/v2/v3 在途局的原回放和 30 秒校验；不新增迁移，不改密钥与人物素材。
离线验证控制器仅在 `scripts/planner.mjs`，不进入前端和 Worker。固定可通关轨迹见 `verification/difficulty-v4-fixture.json`，不宣称真实玩家通过率。


这是最新网站交接，优先于旧版页面、目录和部署说明。用户要求先承接已有成果，后续再按要求修改；本轮没有发布网站或更换 Key。

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

## 取消暂停：客户端 app-v4

用户反馈手机拖动频繁触发暂停，并明确要求彻底移除。新客户端移除暂停/继续按钮、空格/ESC 暂停和失焦/后台自动暂停。开局倒计时、战斗均按实际经过时间推进；后台恢复或 BFCache 返回时补算完整时间，新的触屏位置只影响之后的操作，不改写此前帧。规则仍为 v3、两点护盾、30 秒、16 灵玉，退出仍回选择页。新脚本 `app-v4.mjs`，旧缓存脚本保留但页面不再引用。

## 当前 v3 发布：两点护盾与人物美术（2026-10-25 17:05 UTC）

主站版本 `168571b3-3eab-46c8-89f4-310b62491bf4`，入口仍为
`51a33be8-6ca4-4b4f-886f-613bfea996b0`。新局只有两点护盾；剑煞加速、频率和双剑概率提高。
前后端使用 `engine-v3.mjs`，旧局继续按原版本重放；30 秒、16 灵玉与选择页退出流程不变。
四张成年人物海报用原生 image_gen 加强露肩、深领与丰满身形，采用首页 v6 / 令牌 v4 新 URL。

[发布验收](https://github.com/928886540/cloudflare_temp_email/actions/runs/40214794565)通过。
公网确认初始两盾，通关领奖与旧方式的 Key 相同、models 200，并发 409/409/200。21 个资源、
主域名/www 及手机浏览器验证通过；Key、原静态资产和 GAME_RUNS 保留。脱敏证据在新源码
`verification/*v3.json` 和 `artwork-v6.json`；下文版本均为历史记录。

## v3 调整：两点护盾与星夜人物更新

用户实玩后要求再提高难度：v3 改为两点护盾，并加快剑煞、增加中后段双剑出现率。仍为 30 秒、16 灵玉，玩法与页面布局不变。共享规则新增 `engine-v3.mjs`，客户端使用新 URL `app-v3.mjs`，v1/v2 在途局按原版本重放。相同普通机器人配置的 160 局通过率由 52.5% 降到 20%，仅作离线校准。

本轮同时按用户要求，用原生 image_gen 更新四张成年人物横/竖海报：加强露肩、深领和丰满身形，保留星夜、姿态、手部与文字。新路径为首页 `home-hero-*-v6.webp`、令牌 `free-token/welcome-*-v4.webp`；选择页使用新 `choose-v2.css`，原图和旧脚本保留。

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

## 后续维护源码已恢复：单令牌入口与游戏 v2

当前云端维护源码位于 `sites/leonmingod-star-night/`，由线上 source map 恢复服务端/转发代码，并抓取关键公开资源。它不等于 Windows 目录完整拷贝；原更新记录和旧截图仍未上传。后续修改从本目录继续，不能再部署 `sites/free-token-home/`。

本轮恢复单令牌入口，点击进入 `/free-token/choose/` 再选择叫义父或御剑破阵；首页去掉遮挡提示并加强球体光晕。领取页和游戏压缩到短屏可视高度，游戏退出返回选择页。新图片图集、星夜山谷背景由原生 image_gen 生成。游戏 v2 为 30 秒、3 盾、16 灵玉与逐段剑阵；普通模拟玩家 160 局通过率 52.5%，不代表真实玩家统计。新旧引擎均保留，已开始的 v1 局继续按旧规则验奖。

部署入口为 `.github/workflows/leonmingod-star-night.yaml`，先 stage、后 publish，保留原 ASSETS、所有 Secret、原命名空间和转发结构。详见源码的 `WEBSITE_UPDATE_CN.md`。

## 源码与接手状态

- 用户本地网站：`D:\apiWorkSpace\leonmingod-home`，没有 Git 仓库。
- `D:\apiWorkSpace\cpa-render` 是另一个 CPA 后端项目，不是网站目录。
- 云端当前只有旧仓库 `928886540/cloudflare_temp_email` 的历史网站源码 `sites/free-token-home/`。
- **新版 `public/`、`src/game.js`、`edge-router/`、`wrangler.toml`、`WEBSITE_UPDATE_CN.md` 尚未上传或连接，不能声称已阅读或已同步源码。** 云端应以之后收到的实际源码为准，不把 Windows 路径当作云端路径。
- 完整接手需要网站源码包，至少包含 `public/`、`src/`、`edge-router/`、`wrangler.toml`、`WEBSITE_UPDATE_CN.md`；如有 `package.json` 和锁文件也一起保留。
- 旧工作分支 `codex/free-token-home-20261024` 保留历史与密钥运维工具，**不能用其中旧网站部署任务覆盖星夜版**。改 `sites/free-token-home/**` 会触发历史部署工作流，应先核实当前入口路由与源码。

## 线上资源与本轮复核

2026-10-25 15:50 UTC 通过现有 GitHub Actions Secrets 执行只读检查：
[检查记录](https://github.com/928886540/cloudflare_temp_email/actions/runs/40208834255)。

| 项目 | 结果 |
| --- | --- |
| 首页 | `https://leonmingod.com/`，200 |
| 令牌入口 | `https://leonmingod.com/free-token/`，200 |
| 原领取页 | `https://leonmingod.com/free-token/claim/`，200 |
| 小游戏 | `https://leonmingod.com/free-token/game/`，200，标题「御剑破阵」 |
| 主 Worker | `leonmingod-home`，版本 `2bc44ccd-b647-483b-aca7-256ea46ad69c` |
| 入口 Worker | `leonmingod-free-token`，版本 `69575cec-ac2c-416f-81b9-b64030e87651` |
| 主站绑定 | `ASSETS`、`FREE_TOKEN_CPA_KEY`、`FREE_TOKEN_RENDER_KEY`、`GAME_RUNS` |
| 旧领取接口 | POST `/api/free-token/claim`，200，返回 Render 地址与现有 Key |
| Key 验证 | Render `/v1/models` 为 200，本轮 22 个模型；指纹 `7fa19b84ca57a2ba` |
| Render 状态 | `dep-dbevs57b9u1s73b4q6pg` 为 live；3 把客户端 Key、10 份登录文件 |

入口与游戏客户端脚本、游戏样式和共享引擎均返回 200。`game/start`、`game/finish` 的 GET 返回 405、Allow: POST。首页当前脚本为 `/home-scene-v5.js?v=20261025-night`，实际初始化 `enabled = false`，全屏流光默认关闭。

本轮只检查公开页面、脚本和旧领取接口，没有重新完成游戏或复测并发领奖。模型数与版本都是检查快照，操作前重新读取。

## 最新架构与领奖约定

- 网站运行在 **Cloudflare Workers**；Render 只承担 CPA API。
- 用户交接的主站结构：`src/index.js`、`wrangler.toml`、`public/`。
- 用户交接的 `edge-router/index.js` 仅通过 `SITE` binding 转发主站，入口有更具体路由；后续保留该结构。尚待新版源码与实时路由核对，不能因旧仓库曾有 HTML 变换而重新部署旧入口。
- 游戏接口：POST `/api/free-token/game/start` 和 POST `/api/free-token/game/finish`。
- 共享规则：`public/free-token/game/engine.mjs`；服务端：`src/game.js`。
- Durable Object 类：`GameRun`；绑定：`GAME_RUNS`；SQLite migration：`v1-game-runs`。以后部署须保留已有命名空间、迁移与状态。
- 服务端重放操作记录，检查耗时、胜负、会话与重复领取。逐局凭证有效期 3 分钟，**不是客户端 API Key 的有效期**。
- 「御剑破阵」规则：30 秒、3 点护盾、至少 10 枚灵玉并存活即可领取，不必叫义父。公网共享引擎的规则值已核对。
- 原「叫声义父」方式继续保留，两种方式共用当前奖励。
- 奖励 Base URL：`https://cpa-dhke.onrender.com/v1`；密钥从服务端 `FREE_TOKEN_RENDER_KEY` 读取，保留现有 Secret，禁止写入前端、源码、聊天或日志。

现有网站仓库 GitHub Actions 已有 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`RENDER_API_KEY`，本轮只读检查确认仍可用。没有必要重复配置；云端直接跑 Wrangler 才需要独立可用的授权通道。日常新增/移除 Key 继续参考[运维记录](./free-token-render.md)的固定入口，适配新站时覆盖双领奖方式并保留 `GAME_RUNS`。

## 已完成设计与后续约束

- 首页、令牌页桌面与手机均为星夜版本；星河、星座集中远处天空，呼应「一念风起，万境星垂」。
- 减少前景闪点，保持星星而避免满屏刺眼颗粒；不改成白天。
- 人物为明确成年人，保留丰满、露肩、深领方向；用户交接称多指问题已修正。
- 保留玉牌导航、球体点击跳转、完整令牌挂绳与切页动画。
- 改图后放大检查手指、手腕、挂绳连接与文字。生图和改图只用原生 `image_gen`。
- 同时兼顾桌面和手机；触屏功能不能依赖鼠标悬停，保留手机性能预算。

## 待接收的交接证据

以下为用户报告已完成的验证，文件尚未在云端收到，不当作本轮重新验证：完整浏览器游戏、公网领奖、并发只有一次成功且重复请求返回 409、主域名与 www 资源对齐、五种布局、触屏、旧领取流程与转场。

- `WEBSITE_UPDATE_CN.md`：完整更新记录。
- `.review-20261025/game-image-generation.json`：素材路径和提示词。
- `.review-20261025/production-game-api.json`：公网领奖验证。
- `.review-20261025/production-game/`：公网截图和布局验证。
- `.review-20261025/game-before/`：修改前备份。

本轮公开检查快照暂存云端 `/workspace/scratch/leonmingod-handoff-20261025/`，是检查副本，不是完整可部署源码。
