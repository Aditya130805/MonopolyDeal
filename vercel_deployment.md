## When deploying to Vercel:

1. Go to vercel.com and sign up/login with GitHub

2. Click "Add New Project"

3. Import your MonopolyDeal repository

4. In the project settings:

   - Root Directory: ./ (default)
   - Framework Preset: Create React App
   - Build Command: cd frontend && npm install && npm run build
   - Output Directory: frontend/build
   - Install Command: cd frontend && npm install

5. Under "Environment Variables":

   - Add REACT_APP_API_BASE_URL with value https://deal-backend.up.railway.app/api

6. Click "Deploy"
