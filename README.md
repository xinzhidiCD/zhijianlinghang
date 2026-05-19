# 知见领航通

<p>
  <img src="https://img.shields.io/badge/Vue-3.x-42b883" alt="Vue 3" />
  <img src="https://img.shields.io/badge/uni--app-3.x-2b9939" alt="uni-app" />
  <img src="https://img.shields.io/badge/Vite-5.x-646cff" alt="Vite" />
  <img src="https://img.shields.io/badge/license-please%20add-lightgrey" alt="License" />
</p>

知见领航通是由新知地（成都）人工智能科技有限公司打造的金融知识直播课堂系统，面向金融投顾机构、证券服务机构、财经教育机构和知识付费团队，提供私有化部署版与 SaaS 版两种交付方式。

系统将直播教学、课程交易、销售转化、客户运营和合规风控整合到同一套系统中，帮助团队完成从内容直播、课程售卖、销售邀约到回放管理、客户管理、数据权限和风险提示的完整业务闭环。

本仓库是知见领航通的前端工程，基于 uni-app、Vue 3、Vite 开发，覆盖 H5、PC Web 和多端小程序构建场景。项目提供直播间、回放、商品展示、订单、优惠券、积分、个人中心、互动消息等常见业务页面，可作为直播活动、在线课程、内容营销类应用的前端基础工程。

本仓库只包含前端代码。后端 API、登录授权应用、MQTT 服务、支付渠道、OSS 上传凭证、生产域名等能力需要由使用方自行接入和配置。

## 产品信息

| 项目 | 内容 |
| --- | --- |
| 品牌名称 | 知见领航通 |
| 公司名称 | 新知地（成都）人工智能科技有限公司 |
| 产品类型 | 金融知识直播课堂系统 |
| 部署方式 | 私有化部署版 + SaaS 版 |
| 目标客户 | 金融投顾机构、证券服务机构、财经教育机构、知识付费团队 |
| 核心卖点 | 将直播教学、课程交易、销售转化、客户运营和合规风控整合到同一套系统中 |

## 核心能力

- 直播教学：支持直播授课、视频播放、助教场控、消息审核、弹幕互动和回放管理。
- 课程交易：支持课程售卖、商品展示、优惠券、抽奖、积分、订单管理和支付流程对接。
- 销售转化：支持销售邀约、客户运营、个人中心、课程学习记录和用户权益管理。
- 合规风控：支持风险提示、数据权限、访问控制和统一身份令牌接入。
- 多端交付：覆盖 H5、PC Web 和多端小程序构建场景，支持私有化部署版与 SaaS 版。

## 在线体验

- 官网示例：https://www.xzdlinghang.com

> 说明：官网用于展示产品形态。开源代码中的接口、AppID、MQTT、支付和上传能力均需要自行配置。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 基础框架 | Vue 3、uni-app、Vite |
| 状态管理 | Pinia |
| 样式与组件 | UnoCSS、uv-ui |
| 实时通信 | MQTT.js |
| 视频播放 | hls.js、第三方播放器 SDK |
| 分页列表 | z-paging |
| 工程化 | TypeScript、Sass、Docker、Nginx |

## 项目结构

```text
.
|-- src
|   |-- api                # API 请求封装
|   |-- composables        # 组合式工具
|   |-- pages              # H5 / 移动端页面
|   |-- pagesPc            # PC 端页面与组件
|   |-- static             # 静态资源
|   |-- store              # Pinia 状态管理
|   `-- utils              # 请求、MQTT、平台判断、通用工具
|-- index.html             # H5 入口模板
|-- src/pages.json         # uni-app 页面路由配置
|-- src/manifest.json      # uni-app 应用配置
|-- vite.config.mjs        # Vite 配置
|-- Dockerfile.prod        # 生产镜像构建模板
`-- nginx.conf             # Nginx 配置
```

## 环境要求

- Node.js 18+
- pnpm 8+
- HBuilderX 或 DCloud CLI 环境

## 快速开始

安装依赖：

```bash
pnpm install
```

创建本地环境变量文件：

```bash
cp .env.example .env.development
```

启动 H5 开发环境：

```bash
pnpm dev:h5
```

构建 H5：

```bash
pnpm build:h5
```

构建微信小程序：

```bash
pnpm build:mp-weixin
```

## 环境变量

请勿提交真实环境变量文件。生产配置建议放在部署平台、CI/CD Secret 或本地忽略文件中。

```env
VITE_BASE_URL=/api
VITE_WX_OPEN_APPID=
VITE_WX_SERVICE_APPID=
VITE_CLIENT_ID=
VITE_TENANT_ID=
VITE_DOMAIN=http://localhost:5173
VITE_MQTT_HOST=
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev:h5` | 启动 H5 开发环境 |
| `pnpm build:h5` | 构建 H5 产物 |
| `pnpm dev:mp-weixin` | 启动微信小程序开发构建 |
| `pnpm build:mp-weixin` | 构建微信小程序产物 |

## 部署说明

构建 H5 产物：

```bash
pnpm build:h5
```

构建 Docker 镜像：

```bash
docker build -f Dockerfile.prod -t linghang-live:latest .
```

运行容器：

```bash
docker run -d --name linghang-live -p 8080:80 linghang-live:latest
```

生产镜像默认使用 Nginx 托管 `dist/build/h5`。如果部署环境需要平台验证文件，请在私有部署流程中注入，不建议提交到开源仓库。

## 联系我们

- 官网：https://www.xzdlinghang.com
- 电话：19180707636
- 邮箱：wangkai@xinzhidi.com
- 微信：扫码添加项目负责人 

微信二维码：

![微信联系二维码](docs/images/contact-wechat.jpg)
