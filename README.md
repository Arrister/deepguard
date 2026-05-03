# DeepGuard-IDS

An AI-powered Intrusion Detection System (IDS) that monitors network traffic in real-time and detects malicious activities using machine learning.

## Features

- 🛡️ **Real-time Network Monitoring** - Live packet capture and analysis
- 🤖 **AI-Powered Detection** - Random Forest model trained on NSL-KDD dataset (99.8% accuracy)
- 📊 **Interactive Dashboard** - Real-time visualizations and statistics
- 🔐 **Secure Authentication** - JWT-based user authentication
- 📝 **Comprehensive Logging** - Detailed attack logs with export capabilities
- 📈 **Data Visualization** - Charts and graphs for network traffic analysis
- 💾 **Export Functionality** - Export logs to CSV for reporting

## Tech Stack

### Backend
- **Python 3.x**
- **FastAPI** - High-performance web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database
- **Scapy** - Packet sniffing
- **Scikit-learn** - Machine learning
- **JWT** - Authentication

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Recharts** - Data visualization
- **React Router** - Navigation

## Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Administrator/Root privileges (for packet capture)

## Installation

### 1. Clone the Repository

```bash
cd deepguard
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure database
# Edit backend/.env with your PostgreSQL credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/deepguard

# Train the AI model
cd ml_model
python train.py
cd ..
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
# Edit frontend/.env if needed
# VITE_API_URL=http://localhost:8000
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb deepguard

# Or using psql
psql -U postgres
CREATE DATABASE deepguard;
\q
```

## Running the Application

### Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Sign Up** - Create a new account at `/signup`
2. **Login** - Sign in at `/login`
3. **Dashboard** - View real-time network statistics
4. **Start Monitoring** - Click "Start Monitoring" to begin packet capture
   - ⚠️ **Note**: Requires administrator/root privileges
5. **View Logs** - Navigate to the Logs page to see detailed network activity
6. **Export Data** - Export logs to CSV for reporting

## Network Monitoring

The IDS captures network packets and analyzes them using the trained ML model. To start monitoring:

1. Ensure you have administrator/root privileges
2. Click "Start Monitoring" on the dashboard
3. The system will begin capturing and analyzing packets in real-time
4. Detected attacks will appear in the "Recent Attacks" section

### Running with Admin Privileges

**Windows (PowerShell as Administrator):**
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/Mac:**
```bash
cd backend
sudo uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login

### Logs & Stats
- `GET /api/logs` - Get network logs
- `GET /api/stats` - Get network statistics

### Sniffer Control
- `POST /api/sniffer/start` - Start packet capture
- `POST /api/sniffer/stop` - Stop packet capture
- `GET /api/sniffer/status` - Get sniffer status

## Model Information

The AI model is a Random Forest classifier trained on the NSL-KDD dataset:
- **Accuracy**: 99.86%
- **Dataset**: NSL-KDD (improved version of KDD Cup 99)
- **Features**: 41 network traffic features
- **Classes**: Binary (Normal vs Attack)

## Project Structure

```
deepguard/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Config & security
│   │   ├── db/           # Database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # ML engine & sniffer
│   │   └── main.py       # FastAPI app
│   ├── ml_model/
│   │   ├── train.py      # Model training script
│   │   └── saved_models/ # Trained models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities
│   │   └── App.tsx       # Main app
│   └── package.json
└── data/                 # NSL-KDD dataset
```

## Security Considerations

- Change the `SECRET_KEY` in `backend/.env` for production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Regularly update dependencies
- Use strong passwords for database and user accounts

## Troubleshooting

### Packet Capture Not Working
- Ensure you're running with administrator/root privileges
- Check firewall settings
- Verify network interface is accessible

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Frontend Can't Connect to Backend
- Verify backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify `VITE_API_URL` in `frontend/.env`

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- NSL-KDD Dataset
- Shadcn UI for beautiful components
- FastAPI for the excellent framework
