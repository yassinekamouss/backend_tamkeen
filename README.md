# backend_tamkeen

## Chatbot API

- Route: POST /api/chat
- Body:
  - message (string, required): message utilisateur
  - history (array, optional): [{ role: "user"|"assistant", content: string }]
- Réponse: { response: string }

Configuration requise:

- Créez un fichier .env à partir de .env.example et renseignez OPENAI_API_KEY
