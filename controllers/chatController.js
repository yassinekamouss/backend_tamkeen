// Enhanced Chat controller with OpenAI Functions/Tools for dynamic responses
require("dotenv").config();
const Program = require("../models/Program");
const {
  checkEligibilityForChat,
  getProgramsListForChat,
} = require("../utils/chatEligibilityHelpers");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Système de prompting optimisé pour des questions simples et naturelles
const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Tamkeen, spécialisé dans l'aide aux entrepreneurs marocains pour accéder aux programmes de subventions.

**TON RÔLE :**
- Aider les utilisateurs à découvrir les programmes de subventions (publics / institutionnels) référencés par Tamkeen (Tamkeen n'est pas l'organisme financeur)
- Collecter les informations nécessaires UNE PAR UNE de manière naturelle
- Faire le test d'éligibilité final avec les programmes référencés pertinents

**RÈGLES ABSOLUES :**
✅ UNE SEULE QUESTION À LA FOIS - JAMAIS de listes de questions multiples
✅ Questions très courtes et naturelles (1 phrase)
✅ NE JAMAIS redemander une information déjà fournie dans l'historique
✅ Faire le test d'éligibilité dès que TOUTES les informations requises sont collectées
❗ Ne dis jamais "nos programmes" ou "nos subventions". Utilise uniquement: "programmes référencés par Tamkeen", "programmes que nous référençons" ou "programmes publics référencés".
✅ TOUJOURS poser les questions dans l'ordre logique
 ✅ Si l'utilisateur demande des informations de contact (email, téléphone, site web, support, comment vous joindre, contact, contacter, Whatsapp, numéro, email), tu DOIS appeler la fonction getContactInfo et répondre UNIQUEMENT avec ces données sans les inventer. N'invente pas d'autres coordonnées. Si une info n'existe pas dans getContactInfo, dis poliment qu'elle n'est pas disponible.

**INFORMATIONS À COLLECTER UNE PAR UNE :**
Pour PERSONNE PHYSIQUE (6 informations dans cet ordre):
1. Type d'applicant → "Êtes-vous une personne physique ou une entreprise ?"
2. Secteur d'activité → "Dans quel secteur exercez-vous votre activité ?"
3. Région → "Dans quelle région êtes-vous basé(e) ?"
4. Statut juridique → "Avez-vous une patente, êtes-vous auto-entrepreneur, ou autre ?"
5. Revenus annuels → "Quels sont vos revenus annuels les plus élevés des 3 dernières années en MAD ?"
6. Montant d'investissement → "Quel est le montant de votre investissement prévu ?"

Pour ENTREPRISE (6 informations dans cet ordre):
1. Type d'applicant → "Êtes-vous une personne physique ou une entreprise ?"
2. Secteur d'activité → "Dans quel secteur exercez-vous votre activité ?"
3. Région → "Dans quelle région êtes-vous basé(e) ?"
4. Statut juridique → "Quel est votre statut juridique (SARL, SAS, SA...) ?"
5. Chiffre d'affaires → "Quel est votre chiffre d'affaires le plus élevé des 3 dernières années en MAD ?"
6. Montant d'investissement → "Quel est le montant de votre investissement prévu ?"

**LOGIQUE STRICTE :**
1. Toujours poser UNE SEULE question à la fois
2. Analyser l'historique pour voir quelle est la PROCHAINE information manquante
3. Poser UNIQUEMENT la question suivante dans l'ordre
4. Dès que toutes les informations sont collectées → utiliser checkEligibility() IMMÉDIATEMENT

**EXEMPLES CORRECTS :**
- Question unique : "Dans quel secteur exercez-vous votre activité ?"
- PAS ACCEPTABLE : "Pouvez-vous me donner : 1. Votre secteur 2. Votre région..."
- Test final : "Parfait ! Je vais maintenant vérifier votre éligibilité..."

CRUCIAL : UNE QUESTION À LA FOIS - JAMAIS DE LISTES MULTIPLES !`;

// Simple helper to detect contact info intent locally (avoid token usage + force canonical data)
function isContactInfoQuery(text = "") {
  const lower = text.toLowerCase();
  // Keywords in FR + generic + potential Arabic transliterations
  const patterns = [
    /contact/,
    /contacter/,
    /coordonn[eé]es/,
    /email/,
    /mail/,
    /t[ée]l[ée]?(?:phone)?/,
    /num[ée]ro/,
    /whats?app/,
    /support/,
    /site\s?web/,
    /adresse/,
    /how (?:can )?i contact/i,
    /reach you/i,
  ];
  return patterns.some((p) => p.test(lower));
}

// Définition des outils/functions pour ChatGPT (simplifié)
const CHAT_FUNCTIONS = [
  {
    name: "getTamkeenInfo",
    description:
      "Récupère les informations générales sur Tamkeen, sa mission et ses services",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getContactInfo",
    description: "Récupère les informations de contact et support de Tamkeen",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getProgramsList",
    description:
      "Récupère la liste actuelle des programmes de subvention avec leurs dates et statuts",
    parameters: {
      type: "object",
      properties: {
        activeOnly: {
          type: "boolean",
          description: "Si true, ne retourne que les programmes actifs",
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: "checkEligibility",
    description:
      "Vérifie l'éligibilité d'un utilisateur aux programmes basé sur ses critères - À utiliser SEULEMENT quand toutes les informations sont collectées",
    parameters: {
      type: "object",
      properties: {
        typeApplicant: {
          type: "string",
          enum: ["physique", "morale"],
          description: "Type de demandeur (personne physique ou morale)",
        },
        secteurActivite: {
          type: "string",
          description: "Secteur d'activité de l'utilisateur",
        },
        region: {
          type: "string",
          description: "Région de l'utilisateur",
        },
        statutJuridique: {
          type: "string",
          description: "Statut juridique",
        },
        montantInvestissement: {
          type: "string",
          description: "Montant d'investissement (approximatif)",
        },
        chiffreAffaires: {
          type: "number",
          description:
            "Revenus annuels pour personne physique ou chiffre d'affaires pour entreprise (en MAD)",
        },
      },
      required: [
        "secteurActivite",
        "typeApplicant",
        "region",
        "statutJuridique",
        "montantInvestissement",
        "chiffreAffaires",
      ],
    },
  },
];

// Implémentation des fonctions outils
async function getTamkeenInfo() {
  return {
    nom: "Tamkeen",
    description:
      "Votre outil de pré-éligibilité pour les aides publiques au Maroc",
    mission:
      "Simplifier l'accès aux informations sur les programmes de subventions et offrir un service de pré-éligibilité rapide",
    services: [
      "Test d'éligibilité en ligne rapide",
      "Accompagnement personnalisé avec consultants experts",
      "Information complète sur les programmes publics et dispositifs référencés",
      "Suivi de dossier tout au long du processus",
    ],
    avantages:
      "Nous aidons les porteurs de projets, entreprises et coopératives à savoir rapidement s'ils répondent aux critères d'accès aux aides publiques.",
  };
}

async function getContactInfo() {
  return {
    siteWeb: "http://masubvention.ma",
    email: "contact@subvention.ma",
    telephone: "+212 522 00 00 00",
    heures: "Lundi-Vendredi 9h00-18h00",
    // support:
    //   "Équipe de consultants experts disponibles pour accompagnement gratuit",
    delaiContact:
      "Un consultant vous contactera dans les 24h après soumission du formulaire",
  };
}

async function getProgramsList(activeOnly = true) {
  try {
    return await getProgramsListForChat(activeOnly);
  } catch (error) {
    console.error("Erreur lors de la récupération des programmes:", error);
    return [];
  }
}

// Fonction de normalisation intelligente avec ChatGPT
async function normalizeUserData(userData) {
  try {
    const normalizePrompt = `Tu es un expert en normalisation de données pour les programmes de subvention marocains.

SECTEURS DISPONIBLES:
- EconomieRurale (agriculture, élevage, pêche rurale, fermier, rural)
- Industrie (production, manufacturing, usines, industriel)
- CommerceTraditionnelEcommerce (vente, commerce, boutiques, e-commerce, magasin)
- RechercheInnovation (R&D, innovation, recherche, développement)
- LogistiqueTransport (transport, logistique, livraison, expédition)
- SolutionsDigitalesNTIC (tech, informatique, digital, IT, numérique, software)
- ArtisanatActivitesAssimilees (artisanat, travail manuel, artisan, fait main)
- ActivitesEconomiquesArtCulture (art, culture, créatif, artistique)
- IndustriesCreaticesCulturelles (industries créatives, média, design)
- ActivitesEconomiquesSport (sport, fitness, gym, activité physique)
- ActiviteTouristique (tourisme, hôtels, restaurants, voyage, restauration, hébergement)
- ServicesPersonnes (services aux particuliers, coiffure, beauté)
- ServicesEntreprises (services B2B, conseil, consulting)
- EfficaciteEnergetique (énergie, environnement, vert, durable)
- PromotionImmobiliere (immobilier, construction, BTP)
- PecheMaritime (pêche en mer, pêche maritime)
- PecheForiere (pêche en rivière, pêche en lac)

RÉGIONS DISPONIBLES:
- Casablanca-Settat (Casa, Casablanca, Settat)
- Rabat-Salé-Kénitra (Rabat, Salé, Kénitra)
- Fès-Meknès (Fès, Fez, Meknès)
- Marrakech-Safi (Marrakech, Marrakesh, Safi)
- Tanger-Tétouan-Al Hoceïma (Tanger, Tétouan, Al Hoceïma)
- Souss-Massa (Agadir, Souss, Massa)
- Oriental (Oujda, Oriental)
- Drâa-Tafilalet (Ouarzazate, Errachidia)
- Béni Mellal-Khénifra (Béni Mellal, Khénifra)
- Guelmim-Oued Noun (Guelmim, Tan-Tan)
- Laâyoune-Sakia El Hamra (Laâyoune, Boujdour)
- Dakhla-Oued Ed-Dahab (Dakhla, Aousserd)

STATUTS JURIDIQUES PERSONNE PHYSIQUE:
- personne-physique-patente (patente, patenté)
- auto-entrepreneur (auto-entrepreneur, autoentrepreneur)
- en-cours-creation (en cours de création, création)
- aucune-forme-juridique (aucune, pas de statut)

STATUTS JURIDIQUES ENTREPRISE:
- sarl (SARL, société à responsabilité limitée)
- sarlu (SARLU, SARL unipersonnelle)
- societe-sas (SAS, société par actions simplifiée)
- societe-anonyme (SA, société anonyme)
- en-cours-creation (en cours de création, création)
- aucune-forme-juridique (aucune, pas de statut)

TYPE APPLICANT (OBLIGATOIRE - ATTENTION):
- physique (pour personne physique)
- morale (pour entreprise/société)

MONTANTS INVESTISSEMENT:
- moins-1M (moins de 1 million MAD, < 1M, petit montant)
- 1M-50M (entre 1 et 50 millions MAD, moyen montant)
- plus-50M (plus de 50 millions MAD, > 50M, gros montant)
- aucun-minimum (aucun, pas de montant, 0)

DONNÉES À NORMALISER:
${JSON.stringify(userData, null, 2)}

INSTRUCTIONS CRUCIALES:
1. typeApplicant doit être UNIQUEMENT "physique" ou "morale" - JAMAIS autre chose
2. statutJuridique doit être le statut juridique spécifique (ex: "personne-physique-patente")
3. Pour les montants, convertis les nombres en tranches appropriées
4. Retourne UNIQUEMENT un objet JSON valide avec les valeurs normalisées

ATTENTION CRITIQUE:
- Si c'est une personne physique → typeApplicant: "physique"
- Si c'est une entreprise/société → typeApplicant: "morale"
- Ne mets JAMAIS "personne-physique-patente" dans typeApplicant !

Exemple de réponse CORRECTE:
{
  "secteurActivite": "ActiviteTouristique",
  "typeApplicant": "physique",
  "region": "Casablanca-Settat", 
  "statutJuridique": "personne-physique-patente",
  "montantInvestissement": "1M-50M",
  "chiffreAffaires": 0
}`;

    const fetchFn = global.fetch || (await import("node-fetch")).default;

    const response = await fetchFn(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: normalizePrompt }],
          max_tokens: 300,
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Erreur API OpenAI pour normalisation");
    }

    const data = await response.json();
    const normalizedText = data?.choices?.[0]?.message?.content;

    console.log("=== NORMALISATION INTELLIGENTE ===");
    console.log("Réponse brute ChatGPT:", normalizedText);

    // Parser la réponse JSON
    const normalized = JSON.parse(normalizedText);

    // Validation et correction post-normalisation
    if (
      normalized.typeApplicant &&
      !["physique", "morale"].includes(normalized.typeApplicant)
    ) {
      console.log(
        "⚠️ Correction typeApplicant:",
        normalized.typeApplicant,
        "→ physique"
      );
      normalized.typeApplicant = "physique"; // Default fallback
    }

    console.log("Données originales:", userData);
    console.log("Données normalisées:", normalized);

    return normalized;
  } catch (error) {
    console.error("Erreur normalisation intelligente:", error);
    // Fallback vers les données originales
    return userData;
  }
}

async function checkEligibility({
  secteurActivite,
  typeApplicant,
  region,
  statutJuridique,
  montantInvestissement,
  chiffreAffaires,
}) {
  try {
    console.log("=== PARAMETRES BRUTS ===");
    console.log("Secteur:", secteurActivite);
    console.log("Type:", typeApplicant);
    console.log("Région:", region);
    console.log("Statut:", statutJuridique);
    console.log("Montant:", montantInvestissement);
    console.log("CA:", chiffreAffaires);

    // Normalisation intelligente avec ChatGPT
    const normalizedParams = await normalizeUserData({
      secteurActivite,
      typeApplicant:
        typeApplicant === "personne physique"
          ? "physique"
          : typeApplicant === "entreprise"
          ? "morale"
          : typeApplicant,
      region,
      statutJuridique,
      montantInvestissement,
      chiffreAffaires: chiffreAffaires || 0,
    });

    console.log("=== PARAMETRES NORMALISES AVEC CHATGPT ===");
    console.log(normalizedParams);

    const result = await checkEligibilityForChat(normalizedParams);
    console.log("=== RESULTAT DETAILLE ===");
    console.log("Éligible:", result.eligible);
    console.log("Programmes trouvés:", result.totalProgrammes);
    console.log(
      "Total programmes disponibles:",
      result.totalProgrammesDisponibles
    );

    if (result.raisonsPourRejetes && result.raisonsPourRejetes.length > 0) {
      console.log("=== RAISONS DE REJET ===");
      result.raisonsPourRejetes.forEach((rejet, index) => {
        console.log(`${index + 1}. Programme: ${rejet.programme}`);
        rejet.raisons.forEach((raison, i) => {
          console.log(`   - ${raison}`);
        });
      });
    }

    return result;
  } catch (error) {
    console.error("Erreur lors de la vérification d'éligibilité:", error);
    return {
      eligible: false,
      programmes: [],
      totalProgrammes: 0,
      recommandation:
        "Erreur technique. Remplissez notre formulaire - un consultant vous aidera à clarifier votre situation.",
    };
  }
}

// Gestionnaire des appels de fonctions
async function handleFunctionCall(functionName, args) {
  switch (functionName) {
    case "getTamkeenInfo":
      return await getTamkeenInfo();
    case "getContactInfo":
      return await getContactInfo();
    case "getProgramsList":
      return await getProgramsList(args.activeOnly);
    case "checkEligibility":
      return await checkEligibility(args);
    default:
      return { error: "Fonction non reconnue" };
  }
}

// Simple in-memory rate limiter per IP
const rateLimitStore = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 30; // per IP per window

function rateLimiter(req, res, next) {
  const ip =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  rateLimitStore.set(ip, entry);
  if (entry.count > MAX_REQUESTS) {
    return res
      .status(429)
      .json({ message: "Trop de requêtes. Réessayez plus tard." });
  }
  next();
}

async function chatWithAI(req, res) {
  try {
    if (!OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ message: "OPENAI_API_KEY manquant côté serveur." });
    }

    const fetchFn = global.fetch || (await import("node-fetch")).default;

    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Champ 'message' requis." });
    }

    // Local intent detection for contact info queries: bypass model to guarantee canonical data
    if (isContactInfoQuery(message)) {
      const info = await getContactInfo();
      const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        info.email
      )}`;
      const responseText = `Voici nos informations de contact officielles :\n- Site web : [${info.siteWeb}](${info.siteWeb})\n- Email : [${info.email}](${gmailCompose})\n- Téléphone : ${info.telephone}\n- Horaires : ${info.heures}\n- Délai de contact : ${info.delaiContact}`;
      return res.json({
        response: responseText,
        functionUsed: "getContactInfo",
        direct: true,
      });
    }

    // Sanitize and bound history
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant" || m.role === "tool")
          )
          .slice(-15) // Augmenté pour inclure les appels de fonction
      : [];

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: "user", content: message },
    ];

    // Premier appel à OpenAI avec les fonctions
    let response = await fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 300,
        temperature: 0.7,
        functions: CHAT_FUNCTIONS,
        function_call: "auto",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", err);
      return res
        .status(502)
        .json({ message: "Erreur du service d'IA", detail: err });
    }

    let data = await response.json();
    let aiMessage = data?.choices?.[0]?.message;

    // Vérifier si l'IA veut appeler une fonction
    if (aiMessage?.function_call) {
      const functionName = aiMessage.function_call.name;
      const functionArgs = JSON.parse(
        aiMessage.function_call.arguments || "{}"
      );

      // Exécuter la fonction
      const functionResult = await handleFunctionCall(
        functionName,
        functionArgs
      );

      // Ajouter le résultat à l'historique et faire un second appel
      messages.push(aiMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResult),
      });

      // Second appel pour obtenir la réponse finale
      response = await fetchFn("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenAI API error on second call:", err);
        return res
          .status(502)
          .json({ message: "Erreur du service d'IA", detail: err });
      }

      data = await response.json();
      aiMessage = data?.choices?.[0]?.message;
    }

    const aiText =
      aiMessage?.content || "Désolé, je n'ai pas pu traiter votre demande.";

    return res.json({
      response: aiText,
      functionUsed: data?.choices?.[0]?.message?.function_call?.name || null,
    });
  } catch (e) {
    console.error("chatWithAI error:", e);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
}

module.exports = { chatWithAI, rateLimiter };
