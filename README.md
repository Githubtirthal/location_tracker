# MapMates - Real-Time Location Tracker

A comprehensive real-time location tracking system built with Django, Node.js, and React.

## 🚀 Live Demo

- **Frontend:** https://location-tracker-135y.vercel.app
- **Django API:** https://location-tracker-4zk7.onrender.com
- **Socket Server:** https://node-server-yp9l.onrender.com

## 🏗️ Architecture

- **Frontend:** React + Vite + Tailwind CSS
- **Backend API:** Django REST Framework
- **Real-time Server:** Node.js + Socket.IO
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Maps:** Leaflet + OpenStreetMap

## 🔧 Local Development

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Githubtirthal/location_tracker.git
cd location_tracker
```

2. **Backend Setup (Django)**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

3. **Socket Server Setup (Node.js)**
```bash
cd server
npm install

# Copy environment file
cp .env.example .env

# Start socket server
npm start
```

4. **Frontend Setup (React)**
```bash
cd client
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

## 🌐 Production Deployment

### Environment Variables

**Django (.env)**
```
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=location-tracker-4zk7.onrender.com
CORS_ALLOWED_ORIGINS=https://location-tracker-135y.vercel.app
```

**Node.js (server/.env)**
```
NODE_ENV=production
DJANGO_API_BASE=https://location-tracker-4zk7.onrender.com/api
CORS_ALLOWED_ORIGINS=https://location-tracker-135y.vercel.app
```

**React (.env.production)**
```
VITE_DJANGO_BASE=https://location-tracker-4zk7.onrender.com/api
VITE_NODE_WS=https://node-server-yp9l.onrender.com
```

### Deployment Steps

1. **Deploy Django to Render**
   - Connect GitHub repository
   - Use `render.yaml` configuration
   - Set environment variables

2. **Deploy Node.js to Render**
   - Create new web service
   - Build: `cd server && npm install`
   - Start: `cd server && npm start`

3. **Deploy React to Vercel**
   - Connect GitHub repository
   - Use `vercel.json` configuration
   - Auto-deploys on push to main

## 📱 Features

- **Real-time Location Tracking**
- **Room-based Organization**
- **Geofencing with Alerts**
- **Meeting Point Coordination**
- **Emergency Hospital Finder**
- **Smart Search & Navigation**
- **Mobile Responsive Design**

## 🔐 Security

- JWT Authentication
- CORS Protection
- Input Validation
- SQL Injection Prevention
- XSS Protection

## 📄 License

MIT License - see LICENSE file for details.

## 👨‍💻 Author

**Tirthal**
- GitHub: [@Githubtirthal](https://github.com/Githubtirthal)
- Email: tp7047044@gmail.com