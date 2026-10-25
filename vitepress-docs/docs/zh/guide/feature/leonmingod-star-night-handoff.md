# LeonMinGod 星夜版交接（2026-10-25）

这是最新网站交接，优先于旧版页面、目录和部署说明。用户要求先承接已有成果，后续再按要求修改；本轮没有发布网站或更换 Key。

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
