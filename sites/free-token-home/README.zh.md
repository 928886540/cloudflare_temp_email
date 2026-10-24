# 免费 Token 海报首页

在 https://leonmingod.com/free-token/ 展示基于用户原海报分别生成的手机竖版（941×1672）和电脑横版（1824×862）。图片内容均来自用户提供的“白嫖 Token？先叫声义父”海报。横版选择规则与主站一致：屏幕宽度至少 768px 且横屏。

独立的 `leonmingod-free-token` Worker 只接管根域和 www 下的 `/free-token` 与 `/free-token/*` 路径，提供海报首页和图片。点击“进入免费 Token”打开 `/free-token/claim/`，通过服务绑定访问原主站的领取页；原页面的 JS、CSS 和图片也通过同一绑定访问。

原主站 Worker、静态资源、领取 API 和密钥不需要修改。`src/site-original.js` 是发布前备份，不参与新 Worker 部署。首次安装脚本会核对主站版本，并拒绝覆盖已有同名 Worker 或专用路由。发布后检查海报、领取页、主站和 API 的 GET 方法限制；失败时移除本次新建的路由和 Worker。

使用仓库现有 GitHub Secrets 部署，源码保存在独立分支 `codex/free-token-home-20261024`。后续更新前需要先核对线上专用 Worker，并调整首次安装的保护条件。
