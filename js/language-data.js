// Offline translations. English is always the source; never translate a translation.
export const languages = [
  ['en','English'], ['de','Deutsch'], ['fr','Français'], ['it','Italiano'],
  ['es','Español'], ['pl','Polski'], ['ro','Română'], ['nl','Nederlands'],
  ['pt','Português'], ['el','Ελληνικά'], ['cs','Čeština'], ['hu','Magyar'], ['sv','Svenska'],
];
// Columns: German, French, Italian, Spanish, Polish, Romanian, Dutch,
// Portuguese, Greek, Czech, Hungarian, Swedish.
import { contentRows } from './language-content.js';
import { biographyRows } from './language-biography.js';
import { panelRows } from './language-panels.js';
import { serviceRows } from './language-services.js';
import { productionRows } from './language-production.js';
import { designRows } from './language-design.js';
import { webVideoRows } from './language-web-video.js';
import { summaryRows } from './language-summaries.js';
import { legalRows } from './language-legal.js';
import { labelRows } from './language-labels.js';
export const rows = [
 ['Home','Startseite','Accueil','Home','Inicio','Strona główna','Acasă','Home','Início','Αρχική','Domů','Kezdőlap','Hem'],
 ['About','Über mich','À propos','Chi sono','Acerca de mí','O mnie','Despre mine','Over mij','Sobre mim','Σχετικά με εμένα','O mně','Rólam','Om mig'],
 ['Portfolio','Portfolio','Portfolio','Portfolio','Portafolio','Portfolio','Portofoliu','Portfolio','Portfólio','Χαρτοφυλάκιο','Portfolio','Portfólió','Portfolio'],
 ['Services','Leistungen','Services','Servizi','Servicios','Usługi','Servicii','Diensten','Serviços','Υπηρεσίες','Služby','Szolgáltatások','Tjänster'],
 ['Social','Soziale Medien','Réseaux sociaux','Social','Redes sociales','Media społecznościowe','Rețele sociale','Sociale media','Redes sociais','Κοινωνικά δίκτυα','Sociální sítě','Közösségi média','Sociala medier'],
 ['Contact','Kontakt','Contact','Contatti','Contacto','Kontakt','Contact','Contact','Contato','Επικοινωνία','Kontakt','Kapcsolat','Kontakt'],
 ['Multimedia Creator','Multimedia-Gestalter','Créateur multimédia','Creatore multimediale','Creador multimedia','Twórca multimediów','Creator multimedia','Multimediacreator','Criador multimédia','Δημιουργός πολυμέσων','Multimediální tvůrce','Multimédiás alkotó','Multimediaskapare'],
 ['Privacy Policy','Datenschutzerklärung','Politique de confidentialité','Informativa sulla privacy','Política de privacidad','Polityka prywatności','Politica de confidențialitate','Privacybeleid','Política de privacidade','Πολιτική απορρήτου','Zásady ochrany osobních údajů','Adatvédelmi tájékoztató','Integritetspolicy'],
 ['Legal Notice','Impressum','Mentions légales','Note legali','Aviso legal','Informacje prawne','Informații juridice','Juridische kennisgeving','Aviso legal','Νομικές πληροφορίες','Právní informace','Jogi nyilatkozat','Juridisk information'],
 ['Skip to content','Zum Inhalt springen','Aller au contenu','Vai al contenuto','Ir al contenido','Przejdź do treści','Sari la conținut','Naar inhoud','Ir para o conteúdo','Μετάβαση στο περιεχόμενο','Přejít na obsah','Ugrás a tartalomra','Hoppa till innehållet'],
 ['All rights reserved.','Alle Rechte vorbehalten.','Tous droits réservés.','Tutti i diritti riservati.','Todos los derechos reservados.','Wszelkie prawa zastrzeżone.','Toate drepturile rezervate.','Alle rechten voorbehouden.','Todos os direitos reservados.','Με επιφύλαξη παντός δικαιώματος.','Všechna práva vyhrazena.','Minden jog fenntartva.','Alla rättigheter förbehållna.'],
 ['Dark','Dunkel','Sombre','Scuro','Oscuro','Ciemny','Întunecat','Donker','Escuro','Σκούρο','Tmavý','Sötét','Mörkt'],
 ['Light','Hell','Clair','Chiaro','Claro','Jasny','Luminos','Licht','Claro','Φωτεινό','Světlý','Világos','Ljust'],
 ['Theme','Darstellung','Thème','Tema','Tema','Motyw','Temă','Thema','Tema','Θέμα','Motiv','Téma','Tema'],
 ['My Story','Meine Geschichte','Mon histoire','La mia storia','Mi historia','Moja historia','Povestea mea','Mijn verhaal','A minha história','Η ιστορία μου','Můj příběh','A történetem','Min berättelse'],
 ['Short Biography','Kurzbiografie','Courte biographie','Breve biografia','Breve biografía','Krótka biografia','Scurtă biografie','Korte biografie','Breve biografia','Σύντομο βιογραφικό','Stručný životopis','Rövid életrajz','Kort biografi'],
 ['What I Do','Was ich mache','Ce que je fais','Cosa faccio','Lo que hago','Czym się zajmuję','Ce fac','Wat ik doe','O que faço','Τι κάνω','Co dělám','Amivel foglalkozom','Vad jag gör'],
 ['Creative Work','Kreative Arbeit','Travail créatif','Lavoro creativo','Trabajo creativo','Praca twórcza','Muncă creativă','Creatief werk','Trabalho criativo','Δημιουργική εργασία','Kreativní práce','Kreatív munka','Kreativt arbete'],
 ['What I Offer','Was ich anbiete','Ce que je propose','Cosa offro','Lo que ofrezco','Co oferuję','Ce ofer','Wat ik aanbied','O que ofereço','Τι προσφέρω','Co nabízím','Amit kínálok','Vad jag erbjuder'],
 ['AI Powered Multimedia','KI-gestützte Multimedia','Multimédia assisté par IA','Multimedia con IA','Multimedia con IA','Multimedia wspomagane AI','Multimedia cu IA','Multimedia met AI','Multimédia com IA','Πολυμέσα με τεχνητή νοημοσύνη','Multimédia s AI','MI-alapú multimédia','AI-drivna multimedia'],
 ['My Network','Mein Netzwerk','Mon réseau','La mia rete','Mi red','Moja sieć','Rețeaua mea','Mijn netwerk','A minha rede','Το δίκτυό μου','Moje síť','A hálózatom','Mitt nätverk'],
 ['SHIMTI Ecosystem','SHIMTI-Ökosystem','Écosystème SHIMTI','Ecosistema SHIMTI','Ecosistema SHIMTI','Ekosystem SHIMTI','Ecosistemul SHIMTI','SHIMTI-ecosysteem','Ecossistema SHIMTI','Οικοσύστημα SHIMTI','Ekosystém SHIMTI','SHIMTI-ökoszisztéma','SHIMTI-ekosystem'],
 ['Project brief','Projektbeschreibung','Brief du projet','Brief del progetto','Resumen del proyecto','Opis projektu','Rezumatul proiectului','Projectbrief','Resumo do projeto','Περιγραφή έργου','Zadání projektu','Projektleírás','Projektbeskrivning'],
 ['Service needed','Gewünschte Leistung','Service souhaité','Servizio richiesto','Servicio requerido','Potrzebna usługa','Serviciul dorit','Gewenste dienst','Serviço pretendido','Απαιτούμενη υπηρεσία','Požadovaná služba','Kért szolgáltatás','Önskad tjänst'],
 ['Project description','Projektbeschreibung','Description du projet','Descrizione del progetto','Descripción del proyecto','Opis projektu','Descrierea proiectului','Projectbeschrijving','Descrição do projeto','Περιγραφή έργου','Popis projektu','A projekt leírása','Beskrivning av projektet'],
 ['Target date','Zieltermin','Date souhaitée','Data prevista','Fecha prevista','Planowany termin','Data dorită','Streefdatum','Data prevista','Επιθυμητή ημερομηνία','Cílové datum','Tervezett dátum','Önskat datum'],
 ['(optional)','(optional)','(facultatif)','(facoltativo)','(opcional)','(opcjonalnie)','(opțional)','(optioneel)','(opcional)','(προαιρετικό)','(volitelné)','(nem kötelező)','(valfritt)'],
 ['Budget range','Budgetrahmen','Fourchette budgétaire','Fascia di budget','Rango de presupuesto','Zakres budżetu','Interval de buget','Budgetbereik','Intervalo de orçamento','Εύρος προϋπολογισμού','Rozsah rozpočtu','Költségkeret','Budgetintervall'],
 ['Not specified','Nicht angegeben','Non précisé','Non specificato','No especificado','Nie określono','Nespecificat','Niet opgegeven','Não especificado','Δεν καθορίστηκε','Neuvedeno','Nincs megadva','Inte angivet'],
 ['Needs discussion','Nach Absprache','À discuter','Da concordare','Por acordar','Do uzgodnienia','De discutat','Te bespreken','A discutir','Προς συζήτηση','K projednání','Egyeztetendő','Behöver diskuteras'],
 ['Preferred contact','Bevorzugter Kontakt','Contact préféré','Contatto preferito','Contacto preferido','Preferowany kontakt','Contact preferat','Voorkeurscontact','Contacto preferido','Προτιμώμενη επικοινωνία','Preferovaný kontakt','Előnyben részesített kapcsolat','Önskad kontaktväg'],
 ['Your email','Ihre E-Mail-Adresse','Votre adresse e-mail','La tua e-mail','Tu correo electrónico','Twój e-mail','Adresa ta de e-mail','Je e-mailadres','O seu e-mail','Το email σας','Váš e-mail','Az Ön e-mail-címe','Din e-postadress'],
 ['Your inquiry','Ihre Anfrage','Votre demande','La tua richiesta','Tu consulta','Twoje zapytanie','Solicitarea ta','Je aanvraag','O seu pedido','Το αίτημά σας','Váš dotaz','Az Ön megkeresése','Din förfrågan'],
 ['Prepare email','E-Mail vorbereiten','Préparer un e-mail','Prepara e-mail','Preparar correo','Przygotuj e-mail','Pregătește e-mailul','E-mail voorbereiden','Preparar e-mail','Προετοιμασία email','Připravit e-mail','E-mail előkészítése','Förbered e-post'],
 ['Copy inquiry','Anfrage kopieren','Copier la demande','Copia richiesta','Copiar consulta','Kopiuj zapytanie','Copiază solicitarea','Aanvraag kopiëren','Copiar pedido','Αντιγραφή αιτήματος','Kopírovat dotaz','Megkeresés másolása','Kopiera förfrågan'],
 ['What to expect','Was Sie erwartet','À quoi s’attendre','Cosa aspettarsi','Qué esperar','Czego się spodziewać','La ce să te aștepți','Wat je kunt verwachten','O que esperar','Τι να περιμένετε','Co očekávat','Mire számíthat','Vad du kan förvänta dig'],
 ['English','Englisch','Anglais','Inglese','Inglés','Angielski','Engleză','Engels','Inglês','Αγγλικά','Angličtina','Angol','Engelska'],
 ['Page not found','Seite nicht gefunden','Page introuvable','Pagina non trovata','Página no encontrada','Nie znaleziono strony','Pagina nu a fost găsită','Pagina niet gevonden','Página não encontrada','Η σελίδα δεν βρέθηκε','Stránka nenalezena','Az oldal nem található','Sidan hittades inte'],
 ['Back to home','Zur Startseite','Retour à l’accueil','Torna alla home','Volver al inicio','Powrót do strony głównej','Înapoi la pagina principală','Terug naar home','Voltar ao início','Επιστροφή στην αρχική','Zpět domů','Vissza a kezdőlapra','Tillbaka till startsidan'],
 ['All services','Alle Leistungen','Tous les services','Tutti i servizi','Todos los servicios','Wszystkie usługi','Toate serviciile','Alle diensten','Todos os serviços','Όλες οι υπηρεσίες','Všechny služby','Összes szolgáltatás','Alla tjänster'],
 ['What this covers','Leistungsumfang','Ce qui est inclus','Cosa comprende','Qué incluye','Zakres usługi','Ce include','Wat dit omvat','O que inclui','Τι περιλαμβάνει','Co zahrnuje','Mit tartalmaz','Vad det omfattar'],
 ['How it works','So funktioniert es','Comment ça fonctionne','Come funziona','Cómo funciona','Jak to działa','Cum funcționează','Hoe het werkt','Como funciona','Πώς λειτουργεί','Jak to funguje','Hogyan működik','Så fungerar det'],
 ['Deliverables','Ergebnisse','Livrables','Materiali consegnati','Entregables','Rezultaty','Livrabile','Op te leveren resultaten','Entregáveis','Παραδοτέα','Výstupy','Átadott anyagok','Leveranser'],
 ['Start a project','Projekt starten','Démarrer un projet','Avvia un progetto','Iniciar un proyecto','Rozpocznij projekt','Începe un proiect','Start een project','Iniciar um projeto','Έναρξη έργου','Zahájit projekt','Projekt indítása','Starta ett projekt'],
 ['Back to services','Zurück zu den Leistungen','Retour aux services','Torna ai servizi','Volver a servicios','Powrót do usług','Înapoi la servicii','Terug naar diensten','Voltar aos serviços','Επιστροφή στις υπηρεσίες','Zpět ke službám','Vissza a szolgáltatásokhoz','Tillbaka till tjänster'],
];
rows.push(...contentRows, ...biographyRows, ...panelRows, ...serviceRows,
  ...productionRows, ...designRows, ...webVideoRows, ...summaryRows, ...legalRows, ...labelRows);
rows.push(['← All services', ...rows.find(row => row[0] === 'All services').slice(1).map(value => '← ' + value)]);
