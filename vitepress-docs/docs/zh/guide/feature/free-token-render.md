# 免费 Token 的 Render 对接

`https://leonmingod.com/api/free-token/claim` 仍接受原有的确认请求，成功后返回
`baseUrl: https://cpa-dhke.onrender.com/v1` 和在 Render CPA 注册的同一把客户端 Key。
客户端 Key 存在主站 Worker 的 `FREE_TOKEN_RENDER_KEY` Secret 中；原 `FREE_TOKEN_CPA_KEY`
继续保留。首页图片、胶囊导航、免费 Token 满屏布局和令牌点击动效不受影响。

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
