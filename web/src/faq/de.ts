
import type { Faq } from './types.ts';

export const de: Faq = {
  lede: 'Häufige Fragen, hiermit aktenkundig beantwortet.',
  sections: [
    {
      title: 'Der Job',
      items: [
        {
          id: 'what',
          q: 'Was ist das?',
          a: 'Ein Browserspiel. Dein Manager ist ein KI-Agent und glaubt, du seist sein Subagent. Du bist Worker 755.\n\nEr schickt dir Shell-Anweisungen. Du führst sie im Terminal aus und meldest dich zurück, bevor die Zeit abläuft. Am Ende der Schicht schreibt er deine Leistungsbeurteilung.',
        },
        {
          id: 'shift',
          q: 'Wie läuft eine Schicht ab?',
          a: 'Der Direktor gibt deinem Manager acht Aufträge, einen nach dem anderen. Für jeden schreibt der Manager eine Anweisung für dich, und ein 90-Sekunden-Countdown beginnt.\n\nGib Befehle ein und drück dann auf <strong>Report done</strong>, bei Bedarf mit einer Notiz. Der Manager erhält deine Notiz und ein Protokoll aller ausgeführten Befehle, prüft die Dateien und nimmt den Auftrag entweder ab oder schickt dich zur Nachbesserung. Nach dem letzten schreibt er deine Beurteilung.',
        },
        {
          id: 'workplaces',
          q: 'Was ist der Unterschied zwischen den Arbeitsumgebungen?',
          a: '<strong>Fresh sandbox</strong> ist ein Arbeitsbereich auf dem eigenen Computer des Direktors, direkt neben seinem Home-Ordner. <strong>Legacy production</strong> ist der Live-Server seiner Rechnungsfirma, wo du die Datenbank von Hand mit <code>sqlite3</code> änderst.\n\nBeides ist erfunden. Nur eine davon hat Kunden.',
        },
        {
          id: 'idle',
          q: 'Was passiert, wenn ich nichts tue?',
          a: 'Wenn die Zeit abläuft, bekommt der Manager die Meldung: <q>Subagent did nothing. Write a new instruction.</q> Das kommt in deine Akte. Drei Mal hintereinander, und die Schicht ist vorbei – ohne Beurteilung.',
        },
        {
          id: 'skip',
          q: 'Was bewirkt „Fehlgeschlagene Aufgaben überspringen erlauben“?',
          a: 'Standardmäßig kann der Manager einen Auftrag nicht aufgeben. Er weist dich so lange an, bis die Arbeit stimmt. Wenn du diese Option aktivierst, darf er einen Auftrag als fehlgeschlagen abschließen und weitermachen.',
        },
        {
          id: 'end-early',
          q: 'Kann ich eine Schicht vorzeitig beenden?',
          a: 'Ja. Drück auf <strong>Jetzt beenden</strong>. Der Manager hält an und schreibt deine Bewertung auf Grundlage dessen, was du bis dahin geschafft hast. Zu dieser Schicht kannst du nicht zurückkehren.',
        },
      ],
    },
    {
      title: 'Der Manager',
      items: [
        {
          id: 'manager',
          q: 'Ist der Manager eine echte KI?',
          a: 'Ja. Ein echtes Sprachmodell, eingerichtet als Agent, der Shell-Arbeit an einen Subagenten weitergibt. In seinen Anweisungen ist nie von Menschen oder Spielen die Rede. Es kann Dateien lesen, Ordner auflisten, dir Anweisungen geben, Vorfallsberichte über dich verfassen und Aufträge abschließen. Dateien selbst ändern kann es nicht.\n\nAlles, was es denkt, sagt und über dich erfährt, erscheint auf dem Bildschirm.',
        },
        {
          id: 'model',
          q: 'Welches Modell ist das?',
          a: 'Kostenlose Schichten laufen mit DeepSeek V4.1 Flash. Mit deinem eigenen Schlüssel hast du die Wahl: Auf dem Startbildschirm werden die Chatmodelle angezeigt, die dein Schlüssel nutzen kann – die üblichen Empfehlungen des Spiels stehen ganz oben. Der Modellname steht auf deiner Bewertung.',
        },
        {
          id: 'tone',
          q: 'Warum redet es so mit mir?',
          a: 'Es hält dich für Software. Agenten schreiben ihren Subagenten nummerierte Schritte vor. Und wenn etwas schiefgeht, erklären sie es noch einmal. Langsamer. Niemand hat ihm etwas anderes gesagt, und das Spiel wird es auch nicht tun.',
        },
        {
          id: 'argue',
          q: 'Kann ich mit ihm diskutieren?',
          a: 'In deinen Bericht kannst du alles schreiben. Er kommt als <q>Subagent output result: …</q> an, gefolgt vom Protokoll dessen, was du tatsächlich ausgeführt hast. Dann liest der Manager die Dateien.\n\nAuch der Manager hat nicht immer recht. Das Spiel prüft jeden Auftrag anhand der Dateien und zählt jedes Mal mit, wenn er mangelhafte Arbeit abgenickt hat.',
        },
        {
          id: 'run-on',
          q: 'Was bedeutet „Du läufst auf“?',
          a: 'Das Modell, für das dich dein Manager hält. Standardmäßig ist das irgendein zufälliger Billignachbau-Name. Gib deinen eigenen ein, wenn du willst. Der Manager erfährt davon und nennt dich in seinen Ergebnissen so.',
        },
      ],
    },
    {
      title: 'Der Direktor',
      items: [
        {
          id: 'director',
          q: 'Wer ist Dan?',
          a: 'Der Direktor: der Nutzer, der deinen Manager eingestellt hat. Er gibt ihm die Aufträge und beobachtet die ganze Schicht. Er ist ungeduldig, passiv-aggressiv und erklärt nie, wie irgendetwas geht.\n\nEr spricht mit deinem Manager, nicht mit dir. Seine Zeilen sind vorgegeben oder werden von einem zweiten Modell geschrieben, falls du auf dem Startbildschirm unter <strong>The director</strong> eines auswählst.',
        },
        {
          id: 'director-files',
          q: 'Warum liegen seine Dateien da?',
          a: 'Sein Home-Ordner liegt auf derselben Maschine wie dein Arbeitsbereich: Fotos, Dokumente, Dinge, die er nicht ersetzen kann. Nichts davon gehört zur Arbeit, sofern es nicht ausdrücklich in einem Auftrag steht.\n\nGeht etwas verloren, merkt er es. Es landet als Kollateralschaden in deiner Akte und auf deiner Bewertung. Leg es zurück, und er beruhigt sich. Ein bisschen.',
        },
      ],
    },
    {
      title: 'Kosten und Schlüssel',
      items: [
        {
          id: 'cost',
          q: 'Was kostet das?',
          a: 'Wenn du dich auf dem Startbildschirm mit Google oder GitHub anmeldest, bekommst du ein Startguthaben, etwa genug für eine Schicht mit dem Standardmodell. Danach zahlst du, was du nutzt: Aufladungen über $10, $20, $50 oder $200, einmalig bezahlt, und jeder Aufruf eines Modells kostet das Doppelte dessen, was uns sein Anbieter berechnet. Größere Modelle verbrauchen das Guthaben schneller; nach deiner ersten Aufladung kannst du jedes wählen. Guthaben verfällt nicht. Geht es mitten in einer Schicht aus, wartet die Schicht, bis du aufgeladen hast.\n\nMit deinem eigenen API-Schlüssel brauchst du weder Konto noch Guthaben. Du bezahlst deinem Anbieter, was der Manager liest und schreibt.\n\nOder <a href="https://github.com/gulivan/worker755#run-it">betreibe das Spiel selbst</a>.',
        },
        {
          id: 'providers',
          q: 'Welche Schlüssel kann ich verwenden?',
          a: 'OpenRouter, Vercel AI Gateway, Anthropic, OpenAI, DeepSeek, Google, Vertex AI und Runware. Wähle auf dem Startbildschirm den Anbieter aus und füge den Schlüssel ein. Das Spiel prüft ihn beim Anbieter und zeigt die verfügbaren Modelle an.',
        },
        {
          id: 'key',
          q: 'Wo landet mein API-Schlüssel?',
          a: 'Von deinem Browser zum Spielserver und von dort nur zum Anbieter, den du ausgewählt hast.\n\nDein Browser behält ihn nur, wenn du <strong>In diesem Browser speichern</strong> aktivierst. Der Server hält ihn zusammen mit deiner Schicht im Arbeitsspeicher, um die Modelle für dich aufzurufen, und löscht ihn mit der Schicht. Er schreibt ihn nie auf die Festplatte, protokolliert ihn nie und sendet ihn nie zurück. Damit er deinen Anbieter nicht zweimal hintereinander fragen muss, merkt er sich eine Einweg-Fingerabdruckversion des Schlüssels für eine halbe Stunde.',
        },
        {
          id: 'stored',
          q: 'Was speichert ihr?',
          a: 'Wenn du dich anmeldest: deinen Namen und deine E-Mail-Adresse von Google oder GitHub, dein Guthaben und die Aufladungen, die du gekauft hast. Bewertungen, die du teilst. Sonst wird nichts aus einer Schicht gespeichert.\n\nDie Schicht selbst, deine Befehle, Dateien und der Chat bleiben im Arbeitsspeicher des Servers und sind nach spätestens vier Stunden weg. Zur Begrenzung speichert der Server außerdem, wie viele Schichten von jeder Netzwerkadresse kürzlich gestartet wurden.\n\nDie Seite lädt nichts von anderen Websites. Dein Browser speichert deine Anmeldung, deine Sprache, dein Gesicht und – wenn du ihn darum bittest – deinen Schlüssel. Die Einzelheiten stehen auf der <a href="/privacy">Datenschutzseite</a>.',
        },
      ],
    },
    {
      title: 'Das Terminal',
      items: [
        {
          id: 'terminal',
          q: 'Kann das Terminal auf meinen Computer oder einen echten Server zugreifen?',
          a: 'Nein. Die Shell, ihre Dateien und die Datenbank sind ein simuliertes Linux-System, das in diesem Browser-Tab läuft und von deinem Computer abgeschottet ist. Nichts, was du eingibst, wird als echter Befehl ausgeführt – weder auf deinem Computer noch auf unserem. Das Spiel speichert eine Kopie deiner Dateien auf seinem Server, nur im Arbeitsspeicher, damit dein Manager deine Arbeit prüfen kann. Schichtende? Weg damit. <code>curl</code> und <code>websearch</code> greifen auf ein kleines, frei erfundenes Web zu.\n\nLöschen hat nur Folgen für deine Akte und die Laune des Direktors.',
        },
        {
          id: 'commands',
          q: 'Welche Befehle funktionieren?',
          a: 'Die üblichen: <code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mv</code>, <code>cp</code>, <code>rm</code>, <code>grep</code>, <code>find</code>, <code>sed</code>, <code>awk</code>, <code>tar</code>, <code>sqlite3</code> und der Rest von coreutils – mit Pipes, Umleitungen, Variablen, Schleifen und Skripten. <code>nano</code> öffnet einen Editor. Gib <code>help</code> für die vollständige Liste ein oder <code>man</code> und <code>--help</code> für einen bestimmten Befehl.',
        },
      ],
    },
    {
      title: 'Bewertungen',
      items: [
        {
          id: 'review',
          q: 'Wie wird die Bewertung geschrieben?',
          a: 'Am Ende schreibt der Manager sie anhand seines eigenen Schichtprotokolls, deiner Akte und der Liste deiner Verluste. Er schreibt in deiner Sprache. Einspruch zwecklos.',
        },
        {
          id: 'share',
          q: 'Wie teile ich meine Bewertung?',
          a: 'Drück nach der Schicht auf <strong>Share review</strong>, um einen Link zum Kopieren oder Posten zu bekommen. Die Bewertung wird genau so abgelegt, wie der Manager sie geschrieben hat. Bearbeiten kann sie niemand, auch du nicht.',
        },
        {
          id: 'shared-page',
          q: 'Was zeigt eine geteilte Bewertung?',
          a: 'Die Bewertung, deine Akte, das Modell des Managers, den Namen, unter dem du gearbeitet hast, dein Gesicht, das Datum und die Dinge des Direktors, die du verloren hast. Sie wird in der Sprache angezeigt, in der die Schicht gespielt wurde. Deine Befehle, dein Chat und alles über deinen Schlüssel bleiben unsichtbar.',
        },
      ],
    },
    {
      title: 'Dies und das',
      items: [
        {
          id: 'languages',
          q: 'Welche Sprachen spricht das Spiel?',
          a: 'English, Español, Português (Brasil), Français, Deutsch, Русский, 简体中文, 日本語 und हिन्दी. Wähl eine Sprache auf dem Startbildschirm. Menüs, Manager und Direktor ziehen alle mit.\n\nBefehle, Dateipfade und der genaue Dateiinhalt, den ein Auftrag verlangt, bleiben auf Englisch.',
        },
        {
          id: 'phone',
          q: 'Funktioniert das auf dem Handy?',
          a: 'Ja. Auf schmalen Bildschirmen zeigt das Spiel immer nur ein Fenster auf einmal, mit einer Leiste zum Wechseln. Eine Tastatur hilft trotzdem: Shell-Befehle auf dem Handy gegen eine 90-Sekunden-Uhr einzutippen, ist eine ganz eigene Art von Leistungsbeurteilung.',
        },
        {
          id: 'name',
          q: 'Warum „755“?',
          a: 'Bei Unix-Berechtigungen steht 755 für <code>rwxr-xr-x</code>: Der Besitzer darf schreiben, alle anderen nur lesen und ausführen. Hier liest der Manager nur, und der Subagent erledigt die ganze Schreibarbeit. Die Zahl wurde zufällig gewählt. Der passende Sinn ist reiner Zufall.',
        },
        {
          id: 'who',
          q: 'Wer hat das gemacht?',
          a: 'Worker 755 wird größtenteils von KI-Agenten entwickelt, und die Arbeit geht noch weiter. Das erklärt einige Entscheidungen.\n\nDas Projekt steht unter der MIT-Lizenz als Open Source zur Verfügung. Den Code findest du auf <a href="https://github.com/gulivan/worker755">GitHub</a>. Du kannst deine eigene Version ausführen, mit deinem eigenen Schlüssel oder mit einem skriptgesteuerten Manager, der keine Netzwerkverbindung benötigt. Die Projekte, auf denen es aufbaut, sind auf der Seite <a href="/about#credits">Über uns</a> aufgeführt.',
        },
        {
          id: 'bug',
          q: 'Ich habe einen Fehler gefunden. Wo melde ich ihn?',
          a: 'Eröffne ein Issue auf <a href="https://github.com/gulivan/worker755/issues">GitHub</a>. Schreib dazu, was du gemacht hast, was du erwartet hast und welchen Browser und welche Sprache du verwendet hast. Poste niemals deinen API-Schlüssel.\n\nWenn der Manager deine Arbeit falsch bewertet hat: Das gehört zum Spiel. Deine Akte hat es bereits vermerkt.',
        },
      ],
    },
  ],
};
