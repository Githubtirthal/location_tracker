# 🚀 Production Deployment Guide

## Quick Setup Commands

### 1. GitHub Repository Setup
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - MapMates Location Tracker"

# Add remote and push
git remote add origin https://github.com/Githubtirthal/location_tracker.git
git branch -M main
git push -u origin main
```

### 2. Environment Variables Setup

**For Render (Django Backend):**
```
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=location-tracker-4zk7.onrender.com,localhost
CORS_ALLOWED_ORIGINS=https://location-tracker-135y.vercel.app
CSRF_TRUSTED_ORIGINS=https://location-tracker-135y.vercel.app
```

**For Render (Node.js Socket Server):**
```
NODE_ENV=production
DJANGO_API_BASE=https://location-tracker-4zk7.onrender.com/api
CORS_ALLOWED_ORIGINS=https://location-tracker-135y.vercel.app
PORT=5000
```

**For Vercel (React Frontend):**
```
VITE_DJANGO_BASE=https://location-tracker-4zk7.onrender.com/api
VITE_NODE_WS=https://node-server-yp9l.onrender.com
```

## 🔧 Deployment Steps

### Django Backend (Render)
1. Connect GitHub repo to Render
2. Create new Web Service
3. Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
4. Start Command: `gunicorn django_api.wsgi:application`
5. Add environment variables above

### Node.js Socket Server (Render)
1. Create new Web Service
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables above

### React Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Framework Preset: Vite
3. Root Directory: `client`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add environment variables above

## 🌐 Live URLs
- **Frontend:** https://location-tracker-135y.vercel.app
- **Django API:** https://location-tracker-4zk7.onrender.com
- **Socket Server:** https://node-server-yp9l.onrender.com

## ✅ Verification Checklist
- [ ] All services are running
- [ ] CORS is properly configured
- [ ] Environment variables are set
- [ ] Database migrations are applied
- [ ] Static files are served correctly
- [ ] Socket connections work
- [ ] Authentication flows work
- [ ] Real-time features work

## 🔍 Troubleshooting

**CORS Issues:**
- Check CORS_ALLOWED_ORIGINS in Django
- Verify Vercel domain in allowed origins

**Socket Connection Issues:**
- Ensure NODE_WS URL is correct in React
- Check socket server is running on Render

**Database Issues:**
- Run migrations: `python manage.py migrate`
- Check database connection in Render logs

**Build Issues:**
- Check build logs in respective platforms
- Verify all dependencies are in requirements.txt/package.json