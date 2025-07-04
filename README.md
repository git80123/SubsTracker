# SubsTracker

> 🌈 Cloudflare Workers 部署的订阅管理与提醒系统，可通过 Telegram/NotifyX 发送及时提醒。

---

## 功能介绍

- **多平台订阅到期提醒**  
  - 支持 Telegram、NotifyX（推荐）通知渠道，灵活切换。
  - 可手动测试通知通道，确保配置生效。
- **可视化后台管理**  
  - 直观易用的网页端后台，支持新增、编辑、删除、启用/停用订阅。
  - 支持订阅类型、周期、自动续订、提前提醒天数、备注等自定义。
  - 订阅到期自动续订，自动推送到期提醒。
- **系统配置管理**  
  - 管理员用户名/密码可在线修改。
  - 通知渠道配置灵活切换与测试。
- **安全登录认证**  
  - 后台和 API 均需登录，基于 JWT+Cookie。
- **定时任务自动提醒**  
  - Cloudflare Workers 定时触发，自动检测并提醒即将到期的订阅，支持自动续订逻辑。
- **全部数据本地化存储**  
  - 订阅与配置数据全部存储于 Cloudflare KV，无需外部数据库。

---

## 快速部署教程

### 1. 注册并配置 Cloudflare Workers

1. 注册并登录 [Cloudflare](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**，新建 Worker 项目。
3. 进入 **KV 命名空间**，新建命名空间（建议命名为 `SUBSCRIPTIONS_KV`）。
4. 在 Worker 设置中，添加环境变量绑定 KV 命名空间，变量名设为 `SUBSCRIPTIONS_KV`。

### 2. 部署项目代码

- 将本项目代码上传到 Worker（可用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 或 Web 控制台直接粘贴 `SubsTracker.js`）。
- 保证入口文件为 `SubsTracker.js`。

### 3. 配置环境变量

| 变量名            | 说明                        | 是否必须 | 示例                |
|-------------------|-----------------------------|----------|---------------------|
| SUBSCRIPTIONS_KV  | Cloudflare KV 命名空间绑定   | 是       | 见 Cloudflare KV    |
| JWT_SECRET        | JWT 登录签名密钥             | 否       | your-secret-key     |

> 其他如管理员密码、通知参数等均可在后台「系统配置」页面设置，无需提前写入环境变量。

### 4. 首次登录账号

- **用户名**: `admin`
- **密码**: `password`

> 首次登录后请前往「系统配置」修改用户名和密码，保障安全。

### 5. 定时任务设置

- 在 Cloudflare Workers 项目「触发器」中添加定时（如每天 8:00），即可自动检测到期订阅并推送提醒。

---

## 通知渠道配置说明

### Telegram

- 通过 [@BotFather](https://t.me/BotFather) 创建机器人，获取 **Bot Token**
- 通过 [@userinfobot](https://t.me/userinfobot) 获取你的 **Chat ID**
- 在后台「系统配置」页面填写上述信息，切换通知方式为 Telegram 并测试

### NotifyX（推荐）

- 访问 [NotifyX官网](https://www.notifyx.cn/) 注册账号并获取 API Key
- 在后台「系统配置」页面填写 NotifyX API Key，切换通知方式为 NotifyX 并测试

---

## 环境变量与配置项说明

| 配置项            | 说明                          | 配置方式         | 备注                  |
|-------------------|-------------------------------|------------------|-----------------------|
| ADMIN_USERNAME    | 管理员用户名                  | 后台页面         | 默认 admin            |
| ADMIN_PASSWORD    | 管理员密码                    | 后台页面         | 默认 password         |
| JWT_SECRET        | JWT 签名密钥                  | 环境变量         | 可选                  |
| TG_BOT_TOKEN      | Telegram Bot Token            | 后台页面         | 可选                  |
| TG_CHAT_ID        | Telegram Chat ID              | 后台页面         | 可选                  |
| NOTIFYX_API_KEY   | NotifyX API Key               | 后台页面         | 可选                  |
| NOTIFICATION_TYPE | 通知渠道（telegram/notifyx）  | 后台页面         | 推荐 notifyx          |

---

## API 说明（开发者参考）

> 正常使用无需关心 API，前端页面已全部自动化调用。下列接口仅供扩展或二次开发参考。

- `/api/login`  登录接口
- `/api/logout` 注销接口
- `/api/subscriptions` 订阅增删改查
- `/api/subscriptions/{id}/toggle-status` 启用/禁用订阅
- `/api/subscriptions/{id}/test-notify` 单项订阅测试通知
- `/api/config` 获取/保存系统配置
- `/api/test-notification` 测试通知通道

---

## 常见问题

1. **如何切换通知渠道？**  
   在后台「系统配置」页面选择通知方式即可，支持 NotifyX 和 Telegram。
2. **订阅已过期且自动续订怎么办？**  
   系统会自动续订并推送新周期提醒，无需手动干预。
3. **如何自定义 UI？**  
   界面源码在 `SubsTracker.js` 文件 HTML 模板部分，自由修改。
4. **数据如何备份？**  
   定期导出 Cloudflare KV 数据即可。

---

## 鸣谢

感谢 [TailwindCSS](https://tailwindcss.com/)、[NotifyX](https://www.notifyx.cn/)、[Cloudflare Workers](https://workers.cloudflare.com/) 及所有开源贡献者！

---

如有问题欢迎提 [Issue](https://github.com/git80123/SubsTracker/issues) 或 PR！
