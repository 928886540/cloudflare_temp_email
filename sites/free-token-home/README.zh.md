# 免费 Token 海报首页

在 https://leonmingod.com/free-token/ 展示基于用户原海报分别生成的手机竖版（941×1672）和电脑横版（1824×862），图片内容均来自用户提供的“白嫖 Token？先叫声义父”海报。横版选择规则与主站一致：屏幕宽度至少 768px 且横屏。

点击“进入免费 Token”进入 `/free-token/claim/`，继续原有领取流程。已有静态资源、领取接口和 `FREE_TOKEN_CPA_KEY` 密钥保留在 Cloudflare，不将密钥值写入源码。

`src/site-original.js` 保存修改前的 Worker，新增入口委托该模块处理原有功能。`deploy.py` 在发布前检查线上版本，保留静态资源和密钥绑定；检查海报、领取页、原主站及 API 方法限制，失败后恢复到修改前版本。

部署使用仓库现有 GitHub Secrets，在独立分支 `codex/free-token-home-20261024` 运行。后续更新前请先核对线上 Worker，将 `deploy.py` 的 `EXPECTED_VERSION` 更新为核对过的线上版本。
