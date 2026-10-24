# 免费 Token 海报首页与主站导航

免费 Token 子站使用基于用户原海报分别生成的手机竖版（941×1672）和电脑横版（1824×862）。横版选择规则与主站一致：屏幕宽度至少 768px 且横屏。点击“进入免费 Token”打开 `/free-token/claim/`，继续原有领取流程。

主站首页在已有“进入灵境”和“免费Token”旁新增“地址证明”，指向 `https://addr.leonmingod.com`，沿用现有入口样式。手机和竖屏设备上，邮箱入口独占第一行，两个子站入口并排显示在第二行。

独立的 `leonmingod-free-token` Worker 接管根域和 www 下的 `/`、`/index.html`、`/free-token` 与 `/free-token/*`。主站首页通过服务绑定读取原站并使用 HTMLRewriter 添加导航；原领取页及依赖也通过服务绑定访问。原主站 Worker、静态资源、领取 API 和密钥保留不变。`src/site-original.js` 是发布前备份，不参与部署。

部署脚本校验已核对的主站和入口 Worker 版本，仅创建尚未存在的专用路由，不覆盖其他 Worker 的路由。发布后检查首页导航、两张海报、领取页和 API 的 GET 方法限制；失败时恢复入口的旧版本并移除本次新建路由。

使用现有 GitHub Secrets 部署，源码保存在 `codex/free-token-home-20261024` 分支。后续更新前，核对线上版本并更新 `deploy.py` 的 `EXPECTED_VERSION` 和 `EXPECTED_ENTRANCE_VERSION`。
