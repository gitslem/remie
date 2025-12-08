# REMIE Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 14+
- Redis 6+

## Environment Setup

### Backend (.env)

Create a `.env` file in the `backend` directory:

```bash
# Server
NODE_ENV=production
PORT=5000
API_URL=https://api.remie.app

# Database
DATABASE_URL="postgresql://username:password@host:5432/remie?schema=public"

# Redis
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@remie.app

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
REMITA_MERCHANT_ID=xxxxx
REMITA_API_KEY=xxxxx
REMITA_SERVICE_TYPE_ID=xxxxx

# Crypto
POLYGON_RPC_URL=https://polygon-rpc.com
CRYPTO_PRIVATE_KEY=your-wallet-private-key
USDT_CONTRACT_ADDRESS=0xc2132D05D31c914a87C6611C10748AEb04B58e8F
USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=remie-receipts

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Frontend (.env.local)

Create a `.env.local` file in the `frontend` directory:

```bash
NEXT_PUBLIC_API_URL=https://api.remie.app/api/v1
```

## Docker Deployment

### 1. Build and Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/yourusername/remie.git
cd remie

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit the .env files with your configuration
nano backend/.env

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database (optional)
docker-compose exec backend npm run seed
```

### 2. Individual Service Deployment

#### Backend

```bash
cd backend

# Build Docker image
docker build -t remie-backend .

# Run container
docker run -d \
  --name remie-backend \
  -p 5000:5000 \
  --env-file .env \
  remie-backend
```

#### Frontend

```bash
cd frontend

# Build Docker image
docker build -t remie-frontend .

# Run container
docker run -d \
  --name remie-frontend \
  -p 3000:3000 \
  --env-file .env.local \
  remie-frontend
```

## Cloud Deployment

### AWS Deployment

#### 1. Using AWS ECS/Fargate

1. Push Docker images to ECR
2. Create ECS cluster
3. Define task definitions
4. Create services
5. Configure load balancer
6. Set up RDS for PostgreSQL
7. Set up ElastiCache for Redis

#### 2. Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p docker remie-backend

# Create environment
eb create remie-production

# Deploy
eb deploy
```

### Digital Ocean Deployment

#### Using App Platform

1. Connect GitHub repository
2. Configure services (backend, frontend)
3. Set environment variables
4. Deploy

#### Using Droplet

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/yourusername/remie.git
cd remie

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env

# Run with Docker Compose
docker-compose up -d

# Set up Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/remie

# Add configuration
server {
    listen 80;
    server_name api.remie.app;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name remie.app www.remie.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/remie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d remie.app -d www.remie.app -d api.remie.app
```

## Database Setup

### Run Migrations

```bash
# Development
cd backend
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Seed Database

```bash
npm run seed
```

## Monitoring and Logging

### Set up Application Monitoring

1. Create Sentry account
2. Add SENTRY_DSN to environment
3. Monitor errors in Sentry dashboard

### Log Management

```bash
# View Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Export logs
docker-compose logs backend > backend.log
```

## Backup and Recovery

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres remie > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres remie < backup.sql
```

### Automated Backups

Set up cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * docker-compose exec postgres pg_dump -U postgres remie > /backups/remie-$(date +\%Y\%m\%d).sql
```

## Performance Optimization

### Redis Caching

Implement caching for frequently accessed data:
- User profiles
- Wallet balances
- Payment history

### Database Optimization

- Add indexes to frequently queried fields
- Use connection pooling
- Implement read replicas for scaling

### CDN Setup

Use CloudFlare or AWS CloudFront for:
- Static assets
- Frontend deployment
- DDoS protection

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Implement rate limiting
- [ ] Use strong JWT secrets
- [ ] Enable CORS properly
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement 2FA
- [ ] Set up intrusion detection
- [ ] Regular backups

## Scaling

### Horizontal Scaling

- Use load balancer (Nginx, AWS ALB)
- Scale backend instances
- Use Redis for session management
- Implement message queues (BullMQ)

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Use database read replicas

## Maintenance

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update major versions
npm install package@latest
```

### Health Checks

Set up health check endpoints:
- `/health` - Basic health check
- `/health/db` - Database connection
- `/health/redis` - Redis connection

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL
   - Verify database is running
   - Check firewall rules

2. **Redis Connection Failed**
   - Verify Redis is running
   - Check REDIS_HOST and REDIS_PORT

3. **Payment Gateway Errors**
   - Verify API keys
   - Check sandbox vs production mode
   - Review gateway documentation

## Support

For deployment issues:
- GitHub Issues: https://github.com/yourusername/remie/issues
- Email: support@remie.app
- Documentation: https://docs.remie.app
