SETUP INSTRUCTIONS
==================

If the backend folder is not included in this repository, follow these steps:

1. CLONE backend FROM SEPARATE REPOSITORY
   ========================================
   
   a) Clone the backend repository:
      git clone [backend repo]
   
   b) Navigate to the cloned directory:
      cd quiz-scorer-backend

   c) Clone the frontend repository:
      git clone https://github.com/ahmbilal-sudo/quiz-scorer-auto-frontend-only.git
   
   d) Checkout the updated-testing branch (NOT main):
      git checkout updated-testing

   e) Rename the frontend directory:
      rename folder name from 'quiz-scorer-auto-frontend-only' to 'frontend'


2. INSTALL DEPENDENCIES
   =====================
   
   Backend:
   --------
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   Frontend:
   ---------
   cd frontend
   npm install
   cd ..


3. SETUP ENVIRONMENT FILES
   =======================
   
   a) Create .env file from template:
      cp .env.example .env
   
   b) Create client_secrets.json from template:
      cp client_secrets.json.example client_secrets.json
   
   c) Edit both files and add your Google API credentials:
      - GOOGLE_GENAI_API_KEY (required - get from https://ai.google.dev/)
      - GOOGLE_CLIENT_ID (optional - for OAuth)
      - GOOGLE_CLIENT_SECRET (optional - for OAuth)


4. RUN WITH DOCKER COMPOSE (RECOMMENDED)
   =====================================
   
   # Make sure Docker and Docker Compose are installed
   
   # Build and start both backend and frontend:
   docker compose up
   
   # Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/docs
   
   # Stop services:
   docker compose down


5. RUN LOCALLY (WITHOUT DOCKER)
   ============================
   
   Terminal 1 (Backend):
   --------------------
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python api.py
   # Backend will run on http://localhost:3000
   
   Terminal 2 (Frontend):
   ----------------------
   cd frontend
   npm run dev
   # Frontend will run on http://localhost:5173


6. IMPORTANT NOTES
   ================
   
   - Make sure frontend/ folder is in the SAME directory as api.py and requirements.txt
   - The frontend must be from the 'updated-testing' branch, NOT main
   - Never commit .env or client_secrets.json to version control
   - Backend API must be running before frontend can connect to it
   - Update VITE_API_URL in .env if backend is on a different URL
   - For production, change DEBUG=false and SECRET_KEY in .env


7. VERIFY SETUP
   =============
   
   After running:
   - Open http://localhost in browser
   - You should see the Quiz Scorer frontend
   - Navigate to http://localhost:3000/docs to test API
   - Upload a test CSV file to verify grading works
