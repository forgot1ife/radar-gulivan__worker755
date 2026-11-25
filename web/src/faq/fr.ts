
import type { Faq } from './types.ts';

export const fr: Faq = {
  lede: 'Les questions des joueurs, réponses consignées au dossier.',
  sections: [
    {
      title: 'Le boulot',
      items: [
        {
          id: 'what',
          q: 'C’est quoi, ce jeu ?',
          a: 'Un jeu sur navigateur. Ton manager est une IA, et elle croit que tu es son sous-agent. Tu es Worker 755.\n\nElle t’envoie des instructions shell. Tu les exécutes dans un terminal et tu rends compte avant la fin du chrono. À la fin du poste, elle rédige ton évaluation de travail.',
        },
        {
          id: 'shift',
          q: 'Comment se passe un poste ?',
          a: 'Le directeur donne huit missions à ton manager, une par une. Pour chacune, le manager te rédige une instruction et un chrono de 90 secondes démarre.\n\nTape des commandes, puis appuie sur <strong>Signaler que c’est fait</strong>, avec une note si tu veux. Le manager reçoit ta note et la transcription de toutes les commandes exécutées, lit les fichiers pour vérifier, puis valide la mission ou te demande une correction. Après la dernière, il rédige ton évaluation.',
        },
        {
          id: 'workplaces',
          q: 'Quelle différence entre les lieux de travail ?',
          a: '<strong>Environnement de test vierge</strong> est un espace de travail sur l’ordinateur du directeur, à côté de son dossier personnel. <strong>Production héritée</strong> est le serveur actif de son entreprise de facturation, où tu modifies la base de données à la main avec <code>sqlite3</code>.\n\nLes deux sont fictifs. Un seul a des clients.',
        },
        {
          id: 'idle',
          q: 'Que se passe-t-il si je ne fais rien ?',
          a: 'Quand le chrono arrive à zéro, le manager reçoit ce message : <q>Subagent did nothing. Write a new instruction.</q> Ça reste à ton dossier. Trois fois de suite et le poste est terminé, sans évaluation.',
        },
        {
          id: 'skip',
          q: 'Que fait « Autoriser à ignorer les tâches échouées » ?',
          a: 'Par défaut, le manager ne peut pas renoncer à une mission. Il continue à te donner des instructions jusqu’à ce que le travail soit correct. Avec cette option, il peut clore une mission comme échouée et passer à la suite.',
        },
        {
          id: 'end-early',
          q: 'Je peux terminer mon service plus tôt ?',
          a: 'Oui. Appuie sur <strong>Terminer maintenant</strong>. Le manager s’arrête et rédige ton évaluation à partir de ce que tu as fait jusque-là. Impossible de reprendre ce service ensuite.',
        },
      ],
    },
    {
      title: 'Le manager',
      items: [
        {
          id: 'manager',
          q: 'Le manager est une vraie IA ?',
          a: 'Oui. Un vrai modèle de langage, configuré comme un agent qui confie les tâches shell à un sous-agent. Ses instructions ne mentionnent ni les humains ni les jeux. Il peut lire des fichiers, lister des dossiers, te donner des consignes, rédiger des rapports d’incident à ton sujet et clôturer des missions. Il ne peut pas modifier un fichier lui-même.\n\nTout ce qu’il pense, dit et apprend à ton sujet s’affiche à l’écran.',
        },
        {
          id: 'model',
          q: 'Quel modèle utilise-t-il ?',
          a: 'Les services gratuits tournent sur DeepSeek V4.1 Flash. Avec ta propre clé, c’est toi qui choisis : l’écran de démarrage affiche les modèles de chat accessibles avec ta clé, ceux que le jeu utilise le plus souvent en premier. Le nom du modèle figure sur ton évaluation.',
        },
        {
          id: 'tone',
          q: 'Pourquoi me parle-t-il comme ça ?',
          a: 'Il croit que tu es un logiciel. Les agents donnent leurs consignes à leurs sous-agents en étapes numérotées ; quand quelque chose déraille, ils réexpliquent, plus lentement. Personne ne lui a dit le contraire, et le jeu ne le fera pas.',
        },
        {
          id: 'argue',
          q: 'Je peux lui tenir tête ?',
          a: 'Tu peux écrire ce que tu veux dans ton rapport. Il lui parvient sous la forme <q>Subagent output result: …</q>, suivi de la transcription de ce que tu as réellement exécuté. Ensuite, le manager lit les fichiers.\n\nLe manager n’a pas toujours raison non plus. Le jeu vérifie chaque mission à partir des fichiers et comptabilise chaque fois qu’il a validé un travail défectueux.',
        },
        {
          id: 'run-on',
          q: 'Que signifie « You run on » ?',
          a: 'Le modèle que ton manager croit que tu es. Par défaut, c’est un nom d’imitation choisi au hasard. Indique le tien si tu préfères ; le manager en est informé et ses résultats t’identifieront ainsi.',
        },
      ],
    },
    {
      title: 'Le directeur',
      items: [
        {
          id: 'director',
          q: 'Qui est Dan ?',
          a: 'Le directeur : l’utilisateur qui a embauché ton manager. Il lui confie les missions et surveille tout le service. Il est impatient, passif-agressif et n’explique jamais comment faire quoi que ce soit.\n\nIl parle à ton manager, pas à toi. Ses répliques sont écrites à l’avance ou générées par un second modèle, si tu en choisis un sous <strong>The director</strong> sur l’écran de démarrage.',
        },
        {
          id: 'director-files',
          q: 'Pourquoi ses fichiers sont-ils là ?',
          a: 'Son dossier personnel se trouve sur la même machine que ton espace de travail : photos, documents, objets irremplaçables. Rien de tout ça ne fait partie du travail, sauf si une mission le précise.\n\nTu perds quelque chose et il le remarque. Ça figure dans ton dossier comme dommage collatéral et dans ton évaluation. Remets-le à sa place et il se calme. Un peu.',
        },
      ],
    },
    {
      title: 'Coûts et clés',
      items: [
        {
          id: 'cost',
          q: 'Combien ça coûte ?',
          a: 'En te connectant avec Google ou GitHub sur l’écran d’accueil, tu reçois un crédit de départ, de quoi faire à peu près un service avec le modèle par défaut. Ensuite, tu paies ce que tu utilises : des recharges de $10, $20, $50 ou $200, payées une seule fois, et chaque appel à un modèle coûte le double de ce que son fournisseur nous facture. Les grands modèles consomment le crédit plus vite ; après ta première recharge, tu peux choisir n’importe lequel. Le crédit n’expire pas. S’il s’épuise en plein service, le service attend que tu recharges.\n\nAvec ta propre clé API, pas besoin de compte ni de crédit. Tu paies ton fournisseur pour ce que le manager lit et écrit.\n\nOu <a href="https://github.com/gulivan/worker755#run-it">héberge le jeu toi-même</a>.',
        },
        {
          id: 'providers',
          q: 'Quelles clés puis-je utiliser ?',
          a: 'OpenRouter, Vercel AI Gateway, Anthropic, OpenAI, DeepSeek, Google, Vertex AI et Runware. Choisis le fournisseur sur l’écran de démarrage et colle ta clé. Le jeu la vérifie auprès du fournisseur et affiche les modèles disponibles.',
        },
        {
          id: 'key',
          q: 'Où va ma clé API ?',
          a: 'De ton navigateur au serveur du jeu, puis uniquement au fournisseur que tu as choisi.\n\nTon navigateur ne la conserve que si tu coches <strong>Remember it in this browser</strong>. Le serveur la garde en mémoire avec ton service, pour appeler les modèles à ta place, puis la supprime avec le service. Il ne l’écrit jamais sur le disque, ne la consigne jamais dans ses journaux et ne la renvoie jamais. Pour éviter de solliciter ton fournisseur deux fois de suite, il conserve pendant une demi-heure une empreinte unidirectionnelle de la clé.',
        },
        {
          id: 'stored',
          q: 'Qu’est-ce que vous conservez ?',
          a: 'Si vous vous connectez : votre nom et votre adresse e-mail fournis par Google ou GitHub, votre solde d’utilisation et les recharges achetées. Les évaluations que vous partagez. Rien d’autre d’un service n’est conservé.\n\nLe service lui-même — vos commandes, les fichiers et le chat — reste dans la mémoire du serveur et disparaît au bout de quatre heures. Pour appliquer les limites, le serveur conserve aussi le nombre de services récemment lancés depuis chaque adresse réseau.\n\nLa page ne charge rien depuis d’autres sites. Votre navigateur conserve votre connexion, votre langue, votre visage et, si vous le lui demandez, votre clé. Les détails sont sur la <a href="/privacy">page de confidentialité</a>.',
        },
      ],
    },
    {
      title: 'Le terminal',
      items: [
        {
          id: 'terminal',
          q: 'Le terminal peut-il accéder à mon ordinateur ou à un vrai serveur ?',
          a: 'Non. Le shell, ses fichiers et la base de données sont une machine Linux simulée qui tourne dans cet onglet du navigateur, isolée de ton ordinateur. Rien de ce que tu saisis ne s’exécute comme une vraie commande, ni sur ton ordinateur ni sur le nôtre. Le jeu conserve une copie de tes fichiers sur son serveur, en mémoire, uniquement pour que ton manager puisse vérifier ton travail, puis la supprime à la fin du service. <code>curl</code> et <code>websearch</code> accèdent à un petit web fictif.\n\nSupprimer des choses n’a de conséquences que sur ton dossier et sur l’humeur du directeur.',
        },
        {
          id: 'commands',
          q: 'Quelles commandes fonctionnent ?',
          a: 'Les classiques : <code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mv</code>, <code>cp</code>, <code>rm</code>, <code>grep</code>, <code>find</code>, <code>sed</code>, <code>awk</code>, <code>tar</code>, <code>sqlite3</code> et le reste de coreutils, avec les tubes, les redirections, les variables, les boucles et les scripts. <code>nano</code> ouvre un éditeur. Tape <code>help</code> pour la liste complète, ou <code>man</code> et <code>--help</code> pour obtenir de l’aide sur une commande.',
        },
      ],
    },
    {
      title: 'Les évaluations',
      items: [
        {
          id: 'review',
          q: 'Comment l’évaluation est-elle rédigée ?',
          a: 'Le manager la rédige à la fin, à partir de son propre journal de la session, de votre dossier et de la liste de ce que vous avez perdu. Il écrit dans votre langue. Aucun recours possible.',
        },
        {
          id: 'share',
          q: 'Comment partager mon évaluation ?',
          a: 'Après la session, appuyez sur <strong>Share review</strong> pour obtenir un lien à copier ou à publier. L’évaluation est archivée telle que le manager l’a rédigée. Personne ne peut la modifier, pas même vous.',
        },
        {
          id: 'shared-page',
          q: 'Que révèle une évaluation partagée ?',
          a: 'L’évaluation, votre dossier, le modèle du manager, le nom sous lequel vous avez joué, votre visage, la date et les affaires du directeur que vous avez perdues. Elle s’ouvre dans la langue utilisée pendant la session. Vos commandes, votre chat et tout ce qui concerne votre clé n’y figurent pas.',
        },
      ],
    },
    {
      title: 'Divers',
      items: [
        {
          id: 'languages',
          q: 'Quelles langues parle-t-il ?',
          a: 'English, Español, Português (Brasil), Français, Deutsch, Русский, 简体中文, 日本語 et हिन्दी. Choisissez-en une sur l’écran de démarrage. Les écrans, le manager et le directeur s’y conformeront.\n\nLes commandes, les chemins de fichiers et le contenu exact des fichiers demandé par une mission restent en anglais.',
        },
        {
          id: 'phone',
          q: 'Ça marche sur un téléphone ?',
          a: 'Oui. Sur un écran étroit, le jeu affiche un panneau à la fois et une barre d’onglets permet de passer de l’un à l’autre. Un clavier reste bien utile : taper des commandes shell sur un téléphone avec un chrono de 90 secondes, c’est déjà une évaluation à part entière.',
        },
        {
          id: 'name',
          q: 'Pourquoi « 755 » ?',
          a: 'Dans les permissions Unix, 755 correspond à <code>rwxr-xr-x</code> : le propriétaire peut écrire, tout le monde peut seulement lire et exécuter. Ici, le manager se contente de lire et le sous-agent fait tout le travail d’écriture. Le nombre a été choisi au hasard. La ressemblance, c’est la chance.',
        },
        {
          id: 'who',
          q: 'Qui a créé ce jeu ?',
          a: 'Le jeu est développé en grande partie par des agents IA, et le travail est toujours en cours. Ça explique plusieurs choix.\n\nIl est open source sous licence MIT. Le code est disponible sur <a href="https://github.com/gulivan/worker755">GitHub</a>, et tu peux lancer ta propre version, avec ta propre clé ou avec un manager scripté qui n’a pas besoin de réseau. Les projets sur lesquels il s’appuie sont listés sur la page <a href="/about#credits">À propos</a>.',
        },
        {
          id: 'bug',
          q: 'J’ai trouvé un bug. Où le signaler ?',
          a: 'Ouvrez un ticket sur <a href="https://github.com/gulivan/worker755/issues">GitHub</a>. Indiquez ce que vous avez fait, ce que vous attendiez et le navigateur et la langue utilisés. Ne collez jamais votre clé API.\n\nSi le manager s’est trompé sur votre travail, c’est le jeu. Votre dossier en tient déjà compte.',
        },
      ],
    },
  ],
};
