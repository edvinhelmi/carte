export interface LegalSection {
  title: string;
  content: string[];
}

export const LEGAL_METADATA = {
  appName: 'Briscola Club',
  lastUpdated: '29 Ottobre 2026',
  contactEmail: 'privacy@briscolaclub.app',
  jurisdiction: 'Italia / Unione Europea (GDPR - Regolamento UE 2016/679)',
};

export const PRIVACY_POLICY: {
  title: string;
  intro: string;
  sections: LegalSection[];
} = {
  title: 'Informativa sulla Privacy (GDPR)',
  intro:
    'La presente informativa descrive le modalità di trattamento dei dati personali degli utenti che consultano e utilizzano l’applicazione web "Briscola Club", in conformità all\'art. 13 e 14 del Regolamento (UE) 2016/679 (General Data Protection Regulation - GDPR) e alla normativa italiana vigente in materia di protezione dei dati personali.',
  sections: [
    {
      title: '1. Titolare del Trattamento dei Dati',
      content: [
        'Il Titolare del trattamento dei dati è il gestore e sviluppatore dell\'applicazione Briscola Club.',
        'Per qualsiasi richiesta di chiarimento, esercizio dei propri diritti di accesso, rettifica o cancellazione, l\'utente può inviare una comunicazione via email all\'indirizzo: privacy@briscolaclub.app.',
      ],
    },
    {
      title: '2. Tipologia di Dati Trattati e Modalità di Raccolta',
      content: [
        'Briscola Club adotta il principio di minimizzazione dei dati (Privacy by Design e Privacy by Default):',
        '• Dati di Gioco e Profilo Locale: nomi delle squadre, nickname dei partecipanti, membri della casa, punteggi e vittorie registrati durante le partite e i tornei. Questi dati sono memorizzati prioritariamente nella memoria locale (LocalStorage) del dispositivo dell\'utente.',
        '• Dati di Autenticazione Google OAuth (Opzionali): qualora l\'utente scelga volontariamente di autenticarsi tramite Google, vengono acquisiti esclusivamente l\'identificativo univoco utente (Google User ID), l\'indirizzo email, il nome visualizzato e l\'URL dell\'immagine del profilo pubblico forniti da Google.',
        '• Dati Tecnici di Navigazione e Sincronizzazione: indirizzo IP (trattato in forma anonimizzata/pseudonimizzata), log tecnici di connessione e token di sessione generati dall\'infrastruttura Supabase per consentire la sincronizzazione multi-dispositivo in tempo reale.',
        '• Nessun Dato Particolare: non vengono in alcun caso trattati dati sensibili o particolari (dati sanitari, biometrici, opinioni politiche o religiose).',
      ],
    },
    {
      title: '3. Finalità del Trattamento e Base Giuridica',
      content: [
        'I dati personali sono trattati esclusivamente per le seguenti finalità:',
        'a) Erogazione del Servizio (Base giuridica: Art. 6, par. 1, lett. b, GDPR - esecuzione di misure precontrattuali o contrattuali su richiesta dell\'utente): gestione del segnapunti delle partite, calcolo delle classifiche di casa, storico dei tornei e sincronizzazione tra telefoni allo stesso tavolo di gioco.',
        'b) Sicurezza e Prevenzione Malfunzionamenti (Base giuridica: Art. 6, par. 1, lett. f, GDPR - legittimo interesse del titolare): garantire il corretto funzionamento tecnico dell\'applicazione, prevenire abusi o attacchi informatici.',
        'c) Assenza di Finalità di Marketing o Profilazione: Briscola Club NON effettua profilazione commerciale, non traccia gli utenti per scopi pubblicitari e non vende o cede alcun dato a terzi.',
      ],
    },
    {
      title: '4. Luogo di Conservazione e Trasferimento dei Dati',
      content: [
        '• Conservazione Locale: i dati delle partite e le preferenze di interfaccia risiedono principalmente nel browser dell\'utente (LocalStorage).',
        '• Conservazione Cloud: per gli utenti che utilizzano la sincronizzazione online o l\'accesso Google, i dati sono elaborati tramite l\'infrastruttura backend Supabase ospitata su data center conformi agli standard GDPR e ISO/IEC 27001 situati all\'interno dell\'Unione Europea.',
        '• Crittografia: tutte le comunicazioni tra il browser dell\'utente e i server avvengono mediante protocolli crittografici sicuri HTTPS e WSS (TLS 1.3).',
      ],
    },
    {
      title: '5. Periodo di Conservazione dei Dati',
      content: [
        '• Dati Locali: rimangono memorizzati nel browser dell\'utente fino a cancellazione manuale della cronologia/dati del sito, oppure fino all\'utilizzo dell\'apposito tasto "Azzera Tutti i Dati" presente nelle Impostazioni.',
        '• Dati Cloud di Casa e Account: rimangono attivi finché la casa o il profilo rimangono registrati. L\'utente può eliminare in qualunque momento un membro, una casa o l\'intero storico direttamente dall\'interfaccia di gioco.',
      ],
    },
    {
      title: '6. Diritti dell\'Interessato (Artt. 15-22 GDPR)',
      content: [
        'In qualunque momento, l\'utente ha il pieno diritto di:',
        '• Diritto di Accesso (Art. 15): conoscere quali dati sono trattati e ottenerne copia.',
        '• Diritto di Portabilità (Art. 20): esportare tutti i propri dati in formato strutturato e leggibile da dispositivo automatico. Questa funzione è direttamente accessibile dall\'app tramite il tasto "Esporta Backup (Scarica JSON)".',
        '• Diritto di Rettifica e Modifica (Art. 16): correggere nickname, nomi squadra e partite errate.',
        '• Diritto alla Cancellazione / Diritto all\'Oblio (Art. 17): cancellare tutti i dati memorizzati tramite la funzione "Azzera Tutti i Dati" o facendone richiesta al Titolare.',
        '• Diritto di Reclamo (Art. 77): qualora ritenga che il trattamento violi il GDPR, l\'utente ha il diritto di proporre reclamo all\'Autorità Garante per la Protezione dei Dati Personali (Piazza Venezia 11, 00187 Roma - www.garanteprivacy.it).',
      ],
    },
  ],
};

export const COOKIE_POLICY: {
  title: string;
  intro: string;
  sections: LegalSection[];
  cookieTable: { name: string; provider: string; purpose: string; duration: string; type: string }[];
} = {
  title: 'Informativa sui Cookie & Archiviazione Locale',
  intro:
    'La presente Cookie Policy descrive l\'utilizzo dei cookie e delle tecnologie affini di memorizzazione locale (HTML5 LocalStorage) adottate da Briscola Club, redatta ai sensi della Direttiva 2002/58/CE (ePrivacy), come modificata dalla Direttiva 2009/136/CE, e delle Linee Guida del Garante Privacy italiano del 10 giugno 2021 (G.U. n. 163 del 9 luglio 2021).',
  sections: [
    {
      title: '1. Cosa sono i Cookie e il LocalStorage?',
      content: [
        'I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell\'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva.',
        'La memoria locale (LocalStorage) è una tecnologia standard del browser web che consente di salvare in modo persistente e sicuro sul dispositivo dell\'utente informazioni operative necessarie per il funzionamento offline e la rapidità dell\'applicazione.',
      ],
    },
    {
      title: '2. Solo Cookie e Tecnologie Strettamente Tecniche',
      content: [
        'Briscola Club utilizza ESCLUSIVAMENTE cookie tecnici e chiavi di memorizzazione locale indispensabili per consentire la navigazione e l\'erogazione del servizio di segnapunti.',
        'NON vengono in alcun modo impiegati:',
        '• Nessun cookie di profilazione o comportamentale;',
        '• Nessun cookie pubblicitario o di retargeting;',
        '• Nessun cookie di tracciamento commerciale di terze parti (no Google Analytics, no Meta Pixel, no tracker esterni).',
        'Ai sensi delle Linee Guida del Garante Privacy, per i cookie strettamente tecnici non è richiesto il preventivo consenso bloccante, ma vige l\'obbligo di rendere disponibile una chiara informativa all\'utente.',
      ],
    },
    {
      title: '3. Gestione e Revoca del Consenso',
      content: [
        'L\'utente può in qualsiasi momento rivedere le preferenze sui cookie, cancellare i dati memorizzati o disabilitare l\'archiviazione locale direttamente dalle impostazioni del proprio browser:',
        '• Chrome: Impostazioni > Privacy e sicurezza > Cookie e altri dati dei siti',
        '• Safari (iOS / Mac): Impostazioni > Safari > Privacy e sicurezza',
        '• Firefox: Impostazioni > Privacy e sicurezza > Cookie e dati dei siti web',
        'È inoltre possibile cliccare sul tasto "Reimposta Consenso Cookie" nella schermata Impostazioni dell\'app per visualizzare nuovamente il banner di scelta.',
      ],
    },
  ],
  cookieTable: [
    {
      name: 'carte_active_house_id',
      provider: 'Briscola Club (Prima Parte - Locale)',
      purpose: 'Memorizza l\'identificativo della casa attualmente selezionata dall\'utente.',
      duration: 'Persistente (fino a cancellazione)',
      type: 'Tecnico / Funzionale',
    },
    {
      name: 'carte_houses_data',
      provider: 'Briscola Club (Prima Parte - Locale)',
      purpose: 'Conserva lo storico locale di partite, membri, squadre e tornei giocati.',
      duration: 'Persistente (fino a reset/esportazione)',
      type: 'Tecnico / Funzionale',
    },
    {
      name: 'carte_user_profile',
      provider: 'Briscola Club (Prima Parte - Locale)',
      purpose: 'Memorizza il nickname scelto e il profilo locale del giocatore.',
      duration: 'Persistente',
      type: 'Tecnico / Preferenze',
    },
    {
      name: 'carte_cookie_consent',
      provider: 'Briscola Club (Prima Parte - Locale)',
      purpose: 'Registra la presa visione dell\'informativa legale e l\'accettazione dei cookie tecnici.',
      duration: '12 Mesi',
      type: 'Tecnico / Consenso',
    },
    {
      name: 'sb-*-auth-token',
      provider: 'Supabase Auth (Infrastruttura di Sistema)',
      purpose: 'Token crittografato per mantenere la sessione attiva qualora l\'utente acceda con Google.',
      duration: 'Durata della sessione utente',
      type: 'Tecnico / Autenticazione',
    },
  ],
};

export const TERMS_OF_SERVICE: {
  title: string;
  intro: string;
  sections: LegalSection[];
} = {
  title: 'Termini di Servizio & Note Legali',
  intro:
    'L\'accesso e l\'utilizzo di "Briscola Club" sono subordinati all\'accettazione dei presenti Termini e Condizioni di Utilizzo. Utilizzando l\'applicazione web, l\'utente dichiara di aver compreso e accettato integralmente quanto segue.',
  sections: [
    {
      title: '1. Natura del Servizio ed Esclusione del Gioco d\'Azzardo',
      content: [
        'Briscola Club è un\'applicazione software gratuita e amatoriale sviluppata come segnapunti digitale e tracker statistico per partite di carte fisiche tra amici, coinquilini e famiglie (Briscola tradizionale, Briscola a chiamata / a 5, 1vs1, 1vs1vs1, 2vs2).',
        'DIVIETO ASSOLUTO DI GIOCO D\'AZZARDO: ai sensi dell\'art. 718 e seguenti del Codice Penale italiano e delle normative vigenti:',
        '• L\'applicazione non gestisce denaro reale, monete virtuali scambiabili né puntate;',
        '• L\'applicazione non consente in alcun modo di scommettere, depositare o prelevare somme economiche;',
        '• Briscola Club è un mero strumento di calcolo del punteggio e archiviazione statistica.',
      ],
    },
    {
      title: '2. Condizioni di Accesso e Gratuità',
      content: [
        'Il servizio è reso accessibile a titolo gratuito. L\'utente è l\'unico responsabile della sicurezza dei propri dispositivi e dell\'eventuale condivisione dei link di invito alle proprie case o stanze di gioco.',
        'Il Titolare si riserva la facoltà di aggiornare, modificare o sospendere temporaneamente il servizio per esigenze tecniche o manutentive.',
      ],
    },
    {
      title: '3. Proprietà Intellettuale',
      content: [
        'Tutti i testi, il codice sorgente, l\'interfaccia grafica e i marchi dell\'applicazione Briscola Club sono protetti dalla normativa vigente sul diritto d\'autore e sulla proprietà intellettuale.',
        'È vietata la riproduzione, la decompilazione o la distribuzione non autorizzata per fini commerciali.',
      ],
    },
    {
      title: '4. Limitazione di Responsabilità',
      content: [
        'L\'applicazione è fornita nello stato di fatto e di diritto in cui si trova ("AS IS"), senza garanzie di alcun tipo, esplicite o implicite.',
        'In nessun caso il Titolare potrà essere ritenuto responsabile per perdita accidentale di dati, interruzioni di connettività internet o malfunzionamenti derivanti da browser non aggiornati o incompatibili.',
        'Si consiglia agli utenti di utilizzare periodicamente la funzione "Esporta Backup (Scarica JSON)" per custodire una copia di sicurezza del proprio storico di partite.',
      ],
    },
    {
      title: '5. Legge Applicabile e Foro Competente',
      content: [
        'I presenti Termini di Servizio sono regolati e interpretati secondo la legge italiana e il diritto dell\'Unione Europea.',
        'Per qualunque controversia dovesse sorgere in merito all\'interpretazione o esecuzione dei presenti termini, sarà competente in via esclusiva il Foro territorialmente competente ai sensi di legge.',
      ],
    },
  ],
};
