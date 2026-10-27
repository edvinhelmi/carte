# 🃏 Briscola Club • Tracciatore Vittorie per Casa

Un'applicazione web moderna e reattiva progettata specificamente per tracciare le partite e le vittorie a **Briscola** giocate in casa con amici e famiglia.
Ottimizzata per l'uso immediato sia da **smartphone** (come Progressive Web App a tutto schermo con comandi touch ampi) che da **computer desktop** (con dashboard ricca, calendario interattivo e statistiche dettagliate).

---

## 🌟 Funzionalità Principali

- **⚡ Registrazione Vittoria in 1 Tocco**:
  - Modalità pensata per il tavolo da gioco: basta un tocco sulla squadra vincitrice per salvare la partita con animazione festiva di coriandoli 🎉.
  - Possibilità opzionale di inserire i punti esatti della mano (es. 68 a 52) e note veloci (*"Capotto!"*, *"Rimonta epica"*, *"Asso all'ultima mano"*).

- **📅 Calendario & Storico per Serata**:
  - Distingui le partite giorno per giorno sul calendario mensile interattivo.
  - Cliccando su qualsiasi giorno vedi il riassunto completo di quella serata: chi ha giocato, le partite disputate e chi è stato il **Campione della Serata** 👑.
  - Scorciatoie rapide per *Oggi*, *Ieri* o qualsiasi data passata.

- **🏆 Classifiche & Statistiche Complete**:
  - **Classifica Squadre**: Vittorie, sconfitte, win rate percentuale (%) e striscia vincente attuale (streak 🔥).
  - **Classifica Giocatori Singoli**: Statistiche individuali calcolate su tutti i team di cui fa parte ciascun giocatore.
  - **Testa a Testa (H2H)**: Seleziona due squadre per scoprire lo storico degli scontri diretti e chi è in vantaggio.

- **👥 Gestione Squadre & Giocatori**:
  - Aggiungi amici e familiari con il loro seme delle carte italiane preferito (**Coppe 🏆, Denari 🪙, Spade ⚔️, Bastoni 🪵**) e soprannomi.
  - Componi le formazioni (coppie per la classica briscola 2v2 o singolo giocatore per 1v1).

- **💾 Backup & Ripristino Sicuro**:
  - Esporta l'intero storico in formato `.json` con un clic per tenerlo al sicuro.
  - Ripristina facilmente i dati su un nuovo telefono o computer caricando il file.

- **📱 Installabile come App Mobile (PWA)**:
  - Funziona a schermo intero senza barre del browser su iOS e Android.

---

## 🚀 Avvio Locale (Sul tuo computer)

Assicurati di avere Node.js installato, poi apri il terminale nella cartella del progetto:

```bash
# Installa le dipendenze (se non già fatto)
npm install

# Avvia il server di sviluppo
npm run dev
```

Apri il browser su [http://localhost:3000](http://localhost:3000) per iniziare a usare il sito!

---

## 🐙 Guida: Pubblicare su GitHub

Per mettere il codice su GitHub, segui questi semplici passaggi:

1. Vai su [github.com](https://github.com) e accedi al tuo account.
2. Clicca sul pulsante **New** (in alto a destra o nella barra laterale sinistra) per creare un nuovo repository.
3. Assegna un nome al repository (ad esempio `briscola-tracker` o `carte`).
4. **IMPORTANTE**: Lascia il repository senza spuntare *"Initialize this repository with a README"* (perché il README e i file li abbiamo già preparati qui).
5. Premi **Create repository**.
6. Nel tuo terminale, all'interno della cartella del progetto `/Users/edvinhelmi/Desktop/coding/carte`, esegui i seguenti comandi (sostituendo `TUO_USERNAME` e `NOME_REPO` con i tuoi):

```bash
git add .
git commit -m "feat: Briscola Club tracker completo con calendario e statistiche"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/NOME_REPO.git
git push -u origin main
```

Il tuo codice sarà ora al sicuro sul tuo account GitHub!

---

## ☁️ Guida: Hosting Gratuito su Vercel

Vercel è la piattaforma ideale per ospitare applicazioni Next.js in modo veloce e 100% gratuito:

1. Vai su [vercel.com](https://vercel.com) e accedi con il tuo account GitHub.
2. Nella dashboard di Vercel, clicca su **"Add New..."** → **"Project"**.
3. Nella lista dei tuoi repository GitHub, seleziona il repository appena creato (`briscola-tracker`) e clicca su **Import**.
4. Lascia tutte le impostazioni predefinite (Next.js viene rilevato automaticamente con zero configurazioni).
5. Clicca su **Deploy**.

In meno di un minuto riceverai il link pubblico del tuo sito (es. `https://briscola-tracker.vercel.app`), utilizzabile subito da qualsiasi telefono o computer della casa!

---

## 📲 Come Aggiungere l'App alla Schermata Home dello Smartphone

Per usare il sito come una vera app nativa:

- **Su iPhone (Safari)**:
  1. Apri il link di Vercel con Safari.
  2. Tocca l'icona di **Condivisione** in basso (il quadrato con la freccia verso l'alto).
  3. Scorri e tocca **"Aggiungi alla schermata Home"**.
- **Su Android (Chrome)**:
  1. Apri il link di Vercel con Google Chrome.
  2. Tocca i tre puntini in alto a destra.
  3. Seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.

---

## 🔄 Sincronizzazione Multi-Dispositivo di Casa

Attualmente l'app salva i dati localmente nel browser (offline-first).
- **Metodo Rapido**: Puoi usare la funzione **"Esporta Backup (JSON)"** nelle Impostazioni e inviare il file `.json` su WhatsApp o AirDrop all'altro dispositivo, per poi toccare **"Ripristina da Backup"**.
- **Metodo Cloud in Tempo Reale (Opzionale)**: Se desideri che le partite segnate dal telefono appaiano all'istante anche sul computer di casa senza importare file, puoi collegare gratuitamente un database come [Supabase](https://supabase.com) o [Firebase Firestore](https://firebase.google.com). Il codice dell'adattatore storage è già strutturato per supportare la sincronizzazione remota.

---

## 🛠️ Tecnologie Utilizzate

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript, App Router, Turbopack)
- **Stile & Layout**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icone**: [Lucide React](https://lucide.dev/) + Semi delle carte italiane SVG personalizzati
- **Effetti**: `canvas-confetti` per celebrazione delle vittorie
- **Architettura**: Conforme alle linee guida di modern-web-guidance (dialog HTML5, accessibilità, PWA)
