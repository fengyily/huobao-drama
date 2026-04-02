# 部署指南

## 架构概览

```
用户 → Nginx (80/443) → App 容器 (5679)
                ↓
          SSL 证书 (acme.sh + 阿里云 DNS)
```

- **App 容器**：Node.js + FFmpeg，运行后端并托管前端静态文件
- **Nginx 容器**：反向代理，处理 HTTPS 终止和 HTTP→HTTPS 跳转
- **镜像仓库**：阿里云容器镜像服务（ACR），国内服务器拉取速度快
- **SSL 证书**：通过 acme.sh 使用阿里云 DNS 验证自动申请 Let's Encrypt 证书

## GitHub 配置

### 1. Repository Variable

进入 **Settings → Secrets and variables → Actions → Variables → New repository variable**

**名称**: `CONFIG`

**值** (JSON 格式):

```json
{
  "host": "1.2.3.4",
  "user": "ubuntu",
  "domain": "drama.example.com",
  "deploy_path": "/opt/huobao-drama",
  "acr_registry": "crpi-xxxxx.cn-hangzhou.personal.cr.aliyuncs.com",
  "acr_namespace": "your-namespace"
}
```

| 字段 | 说明 |
|------|------|
| `host` | 服务器 IP 地址 |
| `user` | SSH 登录用户名 |
| `domain` | 绑定的域名 |
| `deploy_path` | 服务器上的部署目录 |
| `acr_registry` | ACR 个人实例域名（在 ACR 控制台 → 实例列表中查看） |
| `acr_namespace` | ACR 命名空间名称 |

### 2. Repository Secrets

进入 **Settings → Secrets and variables → Actions → Secrets → New repository secret**

| Secret 名称 | 说明 |
|-------------|------|
| `SSH_KEY` | 服务器 SSH 私钥（完整内容，包含 BEGIN/END 行） |
| `ALI_ACCESS_KEY_ID` | 阿里云 AccessKey ID（用于 DNS 证书验证） |
| `ALI_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret（用于 DNS 证书验证） |
| `ACR_USERNAME` | 阿里云 ACR 登录用户名（控制台右上角的账号名） |
| `ACR_PASSWORD` | 阿里云 ACR 固定密码（在 ACR 控制台 → 访问凭证中设置） |

## 阿里云配置

### 容器镜像服务（ACR）

1. 登录 [容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 选择**个人实例**（免费）
3. 创建**命名空间**（如 `huobao`），填入 `vars.CONFIG` 的 `acr_namespace` 字段
4. 仓库 `huobao-drama` 会在首次推送时自动创建

### RAM 用户权限

确保 RAM 用户拥有以下权限策略：

| 权限策略 | 用途 |
|---------|------|
| `AliyunContainerRegistryFullAccess` | 镜像推送与拉取 |
| `AliyunDNSFullAccess` | SSL 证书 DNS 验证 |

或使用最小权限自定义策略：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cr:GetAuthorizationToken",
        "cr:PushRepository",
        "cr:PullRepository",
        "cr:CreateRepository",
        "cr:GetRepository"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "alidns:AddDomainRecord",
        "alidns:DeleteDomainRecord",
        "alidns:DescribeDomainRecords",
        "alidns:DescribeDomains"
      ],
      "Resource": "*"
    }
  ]
}
```

### 域名解析

在阿里云 DNS 中添加一条 A 记录，将域名指向服务器 IP：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ 或子域名 | 服务器 IP 地址 |

## 服务器要求

### 前置安装

```bash
# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Docker Compose (Docker 新版已内置 compose 插件)
docker compose version
```

### 防火墙

开放以下端口：

| 端口 | 用途 |
|------|------|
| 22 | SSH |
| 80 | HTTP（自动跳转 HTTPS） |
| 443 | HTTPS |

## 部署触发

推送到 `release` 分支即可自动触发部署：

```bash
git push origin release
```

## 流水线流程

1. 构建 Docker 镜像（多阶段：前端 generate + 后端 tsc 编译 + FFmpeg 运行时）
2. 推送镜像到阿里云 ACR（国内拉取速度快）
3. 首次部署时通过 acme.sh + 阿里云 DNS API 申请 SSL 证书
4. SSH 到服务器从 ACR 拉取镜像并启动服务

## SSL 证书管理

- **自动申请**：首次部署时自动通过 DNS-01 挑战申请 Let's Encrypt 证书
- **自动续期**：acme.sh 安装时自动配置 cron 任务，证书到期前自动续期
- **续期后重载**：续期完成后自动重启 Nginx 容器加载新证书
- **证书位置**：服务器 `${deploy_path}/ssl/` 目录

手动续期（一般不需要）：

```bash
~/.acme.sh/acme.sh --renew -d your-domain.com --force
```

## 数据持久化

以下目录通过 Docker volume 挂载到宿主机，不会因容器重建丢失：

| 宿主机路径 | 容器路径 | 说明 |
|-----------|---------|------|
| `${deploy_path}/data/` | `/app/data/` | SQLite 数据库 + 静态资源 |
| `${deploy_path}/configs/config.yaml` | `/app/configs/config.yaml` | 应用配置 |
| `${deploy_path}/ssl/` | `/etc/nginx/ssl/` | SSL 证书 |

## 首次部署后

1. SSH 到服务器，编辑 `${deploy_path}/configs/config.yaml` 配置 AI 服务等参数
2. 重启应用容器使配置生效：

```bash
cd /opt/huobao-drama  # 你的 deploy_path
sudo docker compose -f docker-compose.prod.yml restart app
```

## 常用运维命令

```bash
cd /opt/huobao-drama  # 你的 deploy_path

# 查看服务状态
sudo docker compose -f docker-compose.prod.yml ps

# 查看应用日志
sudo docker compose -f docker-compose.prod.yml logs -f app

# 查看 Nginx 日志
sudo docker compose -f docker-compose.prod.yml logs -f nginx

# 重启所有服务
sudo docker compose -f docker-compose.prod.yml restart

# 停止所有服务
sudo docker compose -f docker-compose.prod.yml down

# 手动拉取最新镜像并更新
sudo docker compose -f docker-compose.prod.yml pull
sudo docker compose -f docker-compose.prod.yml up -d
```
