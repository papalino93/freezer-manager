# 🧊 Il Mio Congelatore

Un'agenda intelligente per il congelatore di casa: cosa c'è, diviso per
categoria, e cosa conviene consumare prima — senza più il foglio di carta.

## Cosa fa

- **Vedere** cosa c'è nel congelatore, ordinato per scadenza o per categoria.
- **Aggiungere** un prodotto a mano oppure fotografando la confezione (il
  sistema propone nome, categoria, quantità e scadenza da confermare).
- **Consumare** un prodotto con un tocco (resta nello storico).
- **Controllare** cosa scade prima grazie a un semaforo 🟢🟠🔴 sempre visibile.
- **Importare** la prima lista fotografando il vecchio foglio cartaceo.
- **Condividere** il congelatore con la famiglia (link di invito da WhatsApp).
- **Installarsi** come app sulla schermata Home (PWA), su Android e iPhone.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL ·
Auth.js (Google + email/password) · Claude (Anthropic) per il riconoscimento
delle foto.

## Sviluppo locale

1. **Database**: serve un Postgres raggiungibile (va benissimo uno locale,
   oppure un progetto Neon/Vercel Postgres gratuito).
2. Copia `.env.example` in `.env` e compila almeno `DATABASE_URL` e
   `AUTH_SECRET` (generalo con `openssl rand -base64 32`).
3. Installa le dipendenze e applica le migrazioni:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

4. Apri [http://localhost:3000](http://localhost:3000).

Senza `ANTHROPIC_API_KEY` l'app funziona comunque: semplicemente "Fotografa
confezione" e "Importa lista" non saranno disponibili (l'inserimento manuale
sì). Senza `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` resta disponibile il login
con email e password.

## Variabili d'ambiente

Vedi `.env.example` per la lista completa e dove procurarsi ogni valore
(Postgres, chiave Anthropic, credenziali Google OAuth).

## Deploy su Vercel

1. Importa il repository su [vercel.com/new](https://vercel.com/new).
2. Nel progetto Vercel, tab **Storage** → **Create Database** → **Postgres**
   (piano gratuito): Vercel collega automaticamente `DATABASE_URL`.
3. In **Settings → Environment Variables** aggiungi `AUTH_SECRET`,
   `ANTHROPIC_API_KEY` (opzionale) e, per il login Google,
   `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (vedi `.env.example`).
4. Imposta `NEXT_PUBLIC_SITE_URL` con l'URL definitivo del deploy: viene
   usato per i metadata Open Graph (anteprima su WhatsApp) e come
   `redirect_uri` di riferimento per Google.
5. Dopo il primo deploy, esegui le migrazioni sul database di produzione:

   ```bash
   npx prisma migrate deploy
   ```

   (con `DATABASE_URL` puntata al Postgres di produzione).

## Struttura del progetto

```
src/
  app/               pagine e API route (App Router)
  components/        componenti React
  lib/                logica condivisa (date, congelatori, auth, validazione)
  services/ai/        adapter isolato verso il provider AI (Claude)
  generated/prisma/   client Prisma generato (non committato)
scripts/
  generate-icons.mjs      rigenera favicon/icone PWA dagli SVG sorgente
  generate-og-image.mjs   rigenera l'immagine di anteprima social
  brand-src/               SVG sorgente del logo
```
