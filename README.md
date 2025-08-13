## Realtime notifications

Socket.IO is enabled to notify admins when a new eligibility test is submitted. Configure allowed frontend origins via ENV:

```
FRONTEND_ORIGIN=http://localhost:5173,https://your-frontend.example.com
```

Client connects with admin JWT in auth and receives `form:submitted` events in the `admins` room.

# Tamkeen Backend API

API Node.js/Express pour les tests d'éligibilité aux programmes de subvention, avec MongoDB/Mongoose.

## Configuration

1. Copiez `.env.example` vers `.env` et configurez les variables:

- PORT=5000
- MONGODB_URI=mongodb://localhost:27017/tamkeen
- JWT_SECRET=<secret>
- OPENAI_API_KEY=sk-xxxx (optionnel, pour le chatbot)

2. Installation des dépendances

- Backend: npm install

3. Démarrage

- Dev: npm run dev
- Prod: npm start

## Endpoints principaux

- GET /api/health — statut du service

### Auth admin

- POST /api/admin/login — { email, password }
- POST /api/admin/register — { email, password }

### Programmes

- GET /api/programs — liste des programmes
- GET /api/programs/:id — détail
- POST /api/programs — [admin] créer
- PUT /api/programs/:id — [admin] modifier
- DELETE /api/programs/:id — [admin] supprimer
- PATCH /api/programs/:id/toggle — [admin] activer/désactiver

### Tests d'éligibilité

- POST /api/test/eligibilite — calcule les programmes éligibles
- GET /api/test/eligibilite — liste paginée des tests (filtres)
- GET /api/test/eligibilite/personne/:id — tests d'une personne

### Chatbot

- POST /api/chat — proxie OpenAI (si OPENAI_API_KEY)

## Conventions & qualité

- Middleware d'erreurs centralisé (`middlewares/errorHandler.js`).
- Handlers asynchrones enveloppés (`utils/asyncHandler.js`).
- Réponses standardisées (`utils/apiResponse.js`).
- Validation légère des requêtes (`middlewares/validate.js`).
- Variables d'environnement: `MONGODB_URI` (préférée) ou `DB_URL` (legacy).

## Développement

- Structure: routes -> controllers -> models -> utils/middlewares.
- Ajoutez des validations côté route pour les payloads critiques.
