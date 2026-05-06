

- npm install
- npm run dev


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

   d) Rename the frontend directory:
      rename folder name from 'quiz-scorer-auto-frontend-only' to 'frontend'
      if not, you have to use 'quiz-scorer-auto-frontend-only' in the place of 'frontend' for the setup commands


3. INSTALL DEPENDENCIES
   =====================
   
   Frontend:
   ---------
   cd quiz-scorer-auto-frontend-only
   npm install
   npm run dev


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
   cd quiz-scorer-auto-frontend-only (or the folder name if changed)
   npm run dev
   # Frontend will run on http://localhost:5173


7. IMPORTANT NOTES
   ================
   
   - Make sure frontend/ (please rename 'quiz-scorer-auto-frontend-only' folder to 'frontend') folder is in the SAME directory as api.py and requirements.txt
   - The frontend must be from the 'updated-testing' branch, NOT main
   - Never commit .env or client_secrets.json to version control
   - Backend API must be running before frontend can connect to it
   - Update VITE_API_URL in .env if backend is on a different URL
   - For production, change DEBUG=false and SECRET_KEY in .env


8. VERIFY SETUP
   =============
   
   After running:
   - Open http://localhost in browser
   - You should see the Quiz Scorer frontend
   - Navigate to http://localhost:3000/docs to test API
   - Upload a test CSV file to verify grading works
