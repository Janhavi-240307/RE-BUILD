# RE:BUILD — React + Vite frontend

## Run
1. Install Node.js 20.19+ or 22.12+.
2. Extract this ZIP and open the folder containing `package.json` in VS Code.
3. In the terminal run `npm install` then `npm run dev`.
4. Open the localhost URL printed by Vite (usually http://localhost:5173).

## Included
Landing page, login/signup, dashboard, building registration, AI scan demo, material inventory, digital passports, recovery planner, recycler marketplace, impact charts, reports/CSV export and settings.

## Demo limitations
Authentication is localStorage-only; project/material data is frontend sample data and resets on refresh. AI detection displays illustrative sample results and does not call a trained model. Uploads remain local; no backend, database, live maps or real partner matching is connected. All impact metrics and partner details are illustrative. Connect the FastAPI, model, PostgreSQL and mapping services before production use.

Demo login: create an account with a name, valid email and password of at least 6 characters. Any email/password meeting those basic checks can also log in.
