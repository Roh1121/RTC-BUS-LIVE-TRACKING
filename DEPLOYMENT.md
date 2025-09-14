# Deployment Guide

This guide covers deploying the RTC Bus Tracking application to production environments.

## Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (for production database)
- Vercel account (for frontend deployment)
- Render/Heroku account (for backend deployment)

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rtc-bus-tracking
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SOCKET_CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend Environment Variables

Create a `.env.production` file in the frontend directory:

```env
REACT_APP_API_URL=https://your-backend-domain.render.com/api
REACT_APP_SOCKET_URL=https://your-backend-domain.render.com
GENERATE_SOURCEMAP=false
```

## Backend Deployment (Render)

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select the backend directory
   - Configure build and start commands:
     ```
     Build Command: npm install
     Start Command: npm start
     ```

3. **Environment Variables**: Add all the environment variables from your `.env` file

4. **Database Setup**: 
   - Create MongoDB Atlas cluster
   - Add connection string to `MONGODB_URI`
   - Whitelist Render's IP addresses

5. **Deploy**: Click deploy and wait for the build to complete

## Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from Frontend Directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel dashboard:
   - `REACT_APP_API_URL`
   - `REACT_APP_SOCKET_URL`

4. **Custom Domain** (Optional): Configure custom domain in Vercel settings

## Database Migration

1. **Setup MongoDB Atlas**:
   - Create cluster
   - Create database user
   - Configure network access
   - Get connection string

2. **Populate Production Data**:
   ```bash
   # Update MONGODB_URI in backend/.env to production database
   cd backend
   npm run populate-data
   ```

## SSL/HTTPS Configuration

Both Vercel and Render provide automatic SSL certificates. Ensure:
- All API calls use HTTPS URLs
- WebSocket connections use WSS protocol
- CORS origins are properly configured

## Monitoring and Logging

### Backend Monitoring
- Use Render's built-in logging
- Consider adding external monitoring (e.g., Sentry)
- Set up health check endpoints

### Frontend Monitoring
- Vercel provides analytics
- Add error tracking (e.g., LogRocket, Sentry)

## Performance Optimization

### Backend
- Enable compression middleware
- Implement API response caching
- Optimize database queries with indexes
- Use connection pooling for MongoDB

### Frontend
- Code splitting with React.lazy()
- Optimize images and assets
- Enable service workers for caching
- Use CDN for static assets

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Restrict to specific domains
3. **Rate Limiting**: Configure appropriate limits
4. **JWT**: Use strong secrets and appropriate expiration
5. **Database**: Use MongoDB Atlas security features
6. **HTTPS**: Enforce HTTPS in production

## Scaling

### Horizontal Scaling
- Use Render's auto-scaling features
- Implement load balancing
- Consider microservices architecture

### Database Scaling
- MongoDB Atlas auto-scaling
- Read replicas for read-heavy workloads
- Sharding for large datasets

## Backup and Recovery

1. **Database Backups**: MongoDB Atlas automatic backups
2. **Code Backups**: Git repository with proper branching
3. **Environment Configs**: Secure backup of environment variables

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        # Add Render deployment steps
        
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Testing in Production

1. **Health Checks**: Implement `/health` endpoints
2. **API Testing**: Test all endpoints after deployment
3. **WebSocket Testing**: Verify real-time functionality
4. **Load Testing**: Use tools like Artillery or k6
5. **User Acceptance Testing**: Test complete user workflows

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS_ORIGIN configuration
2. **Database Connection**: Verify MongoDB URI and network access
3. **WebSocket Issues**: Ensure WSS protocol and proper CORS
4. **Environment Variables**: Double-check all required variables
5. **Build Failures**: Check Node.js version compatibility

### Debugging Tools

- Render logs for backend issues
- Vercel function logs for frontend issues
- MongoDB Atlas monitoring
- Browser developer tools for client-side issues

## Maintenance

### Regular Tasks
- Monitor application performance
- Update dependencies regularly
- Review and rotate secrets
- Monitor database performance
- Check error logs and fix issues

### Updates and Releases
- Use semantic versioning
- Maintain staging environment
- Test thoroughly before production deployment
- Plan for zero-downtime deployments
