# Josses julekalender

En julekalender lavet med React, TypeScript og Vite. Fireogtyve illustrerede låger låses op fra den 1. til den 24. december 2026. Hver låge åbner med en zoom- og lågeanimation og afslører en kærlig hilsen og en lille aktivitet.

## Kør lokalt

Brug Node.js 22.18+ (eller en aktuel Node.js 24 LTS-version).

Udfyld først de to konti i den lokale `.env`-fil. `SESSION_SECRET` er allerede genereret; lad den være privat. På en ny kopi af projektet kan du kopiere `.env.example` til `.env` og generere en ny nøgle med `openssl rand -hex 32`.

```sh
npm install
npm run dev
```

Åbn den localhost-adresse, som Vite viser.

## Login og testadgang

Der findes kun to konti, som du selv vælger i `.env`:

| Variabel | Formål |
| --- | --- |
| `JOSSE_USERNAME` | Josses brugernavn |
| `JOSSE_PASSWORD` | Josses adgangskode |
| `ADMIN_USERNAME` | Dit brugernavn |
| `ADMIN_PASSWORD` | Din adgangskode |
| `SESSION_SECRET` | Tilfældig nøgle på mindst 32 tegn til at underskrive sessioner |

Brug forskellige brugernavne. Josse får den almindelige kalender med datolåste låger. Dit login får **testadgang til alle 24 låger på alle datoer**, så du kan kontrollere nye ændringer. Kontiene har hver deres gemte låger i browseren, så din afprøvning ikke åbner Josses låger.

Login kontrolleres på serveren. Sessionen gemmes i en underskrevet `HttpOnly`-cookie i syv dage, og der er en knap til at logge ud. Ændrer du en kontos login eller sessionsnøglen, bliver de berørte sessioner ugyldige. Login kræver ingen database eller ekstern logintjeneste. Fælles spilrekorder bruger Upstash Redis.

**Login vises først, hver gang siden åbnes eller genindlæses**, også i en ny fane og selv med en eksisterende sessionscookie. Kalenderen vises og hilsnerne hentes først, når loginformularen er sendt og godkendt. Der er ingen automatisk genindlogning; gemte åbnede låger bevares efter næste login.

`.env` og `.env.local` er ignoreret af Git; kun den tomme `.env.example` må deles. Brug aldrig `VITE_` foran brugernavne, adgangskoder eller sessionsnøglen, da den type variabler bliver offentlige i browseren. Genstart `npm run dev`, når du har ændret loginoplysningerne.

## Gør kalenderen personlig

- Rediger de 24 beskeder, overskrifter og aktiviteter i `src/data/advent.ts`. De medfølgende hilsner er eksempler; erstat dem med dine egne minder, planer eller gaver.
- Låge 1 indeholder et velkomstbrev i en kuvert, som åbnes ved tryk. Tilpas hilsenen, afsnittene og underskriften i dagens `letter`-felt. Brevet kan foldes sammen og læses igen; det sendes kun efter login, ligesom de øvrige hilsner. Ved reduceret bevægelse åbner brevet uden bevægelseseffekterne.
- Låge 2 viser dagens aktivitet direkte: en hyggelig aften med julefilm, dyner, snacks og varm kakao. Tilpas invitationen og beskrivelsen i dagens `message` og `littleJoy`, listen i `activity.essentials` og den fleksible aftale i `activity.timing`. Der er intet gavekort, ingen indløsning og ingen ekstra gemt aktivitetsstatus.
- Låge 3 indeholder **Julemandens kane**, et Canvas-spil uden tidsgrænse. Træk fingeren på banen, flyt musen, eller brug piletasterne/A og D for at styre til siderne. Saml gaver og undgå snemænd, biler, træer og sten, mens vejen bliver hurtigere. Startfarten er rolig; farten stiger jævnt til det dobbelte efter 20 sekunder og det tredobbelte efter 40 sekunder og fortsætter opad. To hjerter giver plads til ét sammenstød; efter det andet slutter turen. Et kortvarigt skjold forhindrer, at samme sammenstød tager begge liv. Tilpas vejledningen og sluthilsenen i dagens `sleighGame`-felt. Pauseknappen eller en skjult/inaktiv fane stopper både vej og overlevelsestid, indtil man fortsætter. Reduceret bevægelse fjerner ekstra sne/parallakse; vejens og forhindringernes bevægelse er en del af selve spillet og starter kun efter et aktivt valg.
- Låge 5 indeholder en invitation til en date med varm chokolade på Peter Beier, gemt under et skrabelod i guld. Skrab med fingeren eller musen; når over halvdelen er skrabet væk, forsvinder resten. Knappen **Vis hele invitationen** viser den med det samme og kan bruges med tastaturet. Teksten ligger altid under guldlaget, så skærmlæsere kan læse den uden at skrabe. Guldlaget kommer igen, næste gang lågen åbnes; der gemmes ingen ekstra status. Ved reduceret bevægelse forsvinder guldlaget uden overgang. Tilpas invitationen i dagens `littleJoy` og stedet, det frie valg af varm chokolade og den fleksible aftale i `dateInvitation.venue`, `dateInvitation.choice` og `dateInvitation.timing`.
- Låge 7 gemmer en fysisk gave med snacks og ansigtsmasker bag tre hints. Tryk på **Åbn første hint** og derefter **Åbn næste hint** for at læse ét ad gangen; tidligere hints bliver stående. Efter det tredje hint vises overraskelsen og invitationen til at åbne gaven. Der er intet køb, ingen indløsning og intet krav om at bruge gaven samme dag. Alle hints starter skjult igen, når lågen åbnes på ny; der gemmes ingen ekstra status. Forløbet virker også med tastatur og reduceret bevægelse, og indholdet sendes kun efter login. Tilpas de tre tekster i `giftSurprise.hints`, afsløringen i `giftSurprise.revealTitle` og `giftSurprise.revealMessage` og den fleksible hilsen i `littleJoy`. Køb og pak selv snacks og ansigtsmasker efter hendes præferencer og eventuelle kost- eller hudhensyn; tilføj eventuelt gavens placering til afsløringen.
- Indstil årstallet i `src/lib/calendar.ts`. Åbnede låger gemmes separat for hvert år.
- Rediger overskriften, dedikationen og navnet øverst på kalenderen i `src/components/Calendar.tsx`. Loginteksterne findes i `src/components/LoginPage.tsx`.
- Farver, layout og animationer findes i `src/App.css`. Skrifttyper og juleillustrationer følger med lokalt; siden henter ikke skrifttyper eller billeder fra tredjeparter.

Lågerne låses op ved midnat **i tidszonen på den besøgendes enhed**. Tidligere låger forbliver tilgængelige, også efter jul. Siden kontrollerer datoen hvert 30. sekund, når den får fokus, og hver gang der trykkes på en låge. Åbnede låger gemmes i browserens lokale lager og synkroniseres ikke mellem enheder. Fejl ved lagring vises på siden.

Dette er en enkel, personlig kalender med login, ikke en sikker tidslås: En indlogget person kan stadig ændre enhedens ur eller undersøge de hilsner, browseren har hentet. Hilsnerne sendes kun fra `/api` efter login og ligger ikke i den offentlige JavaScript-fil. Læg alligevel ikke adgangskoder, gavekortkoder eller andre hemmeligheder i kalenderen. Et `noindex`-metatag beder desuden søgemaskiner om ikke at indeksere siden.

### Fælles rekorder i låge 3

Hver afsluttet tur gemmer to uafhængige personlige rekorder: flest gaver og længste aktive overlevelsestid (i millisekunder). De behøver ikke komme fra samme tur. Spil på administratorkontoen for at sætte Andreas' rekorder; Josse ser dem sammen med sine egne i låge 3, også på en anden enhed. Lavere resultater erstatter aldrig en rekord. Rekorderne hentes ved åbning, ved fokus på fanen og hvert 15. sekund, mens siden er synlig. Fejl ved hentning eller lagring vises med en knap til at prøve igen.

Forbind Upstash Redis til Vercel-projektet. Serveren bruger `KV_REST_API_URL` og `KV_REST_API_TOKEN` (eller `UPSTASH_REDIS_REST_URL` og `UPSTASH_REDIS_REST_TOKEN`). Brug ikke en read-only-token til lagring, og tilføj aldrig `VITE_` til navnene. Production, Preview og Development får hver deres nøgle under `josses:sleigh-game:<miljø>:<år>`, så test ikke ændrer de rigtige rekorder. Begge værdier opdateres atomisk med Redis `ZADD GT`. Ingen oprydning eller udløbsdato nulstiller rekorderne. Kanespillet bruger en separat nøgle fra det tidligere snefnugspil, hvis der findes gamle testresultater.

Dette er en venskabelig konkurrence, ikke et snydesikkert ranglistesystem: Serveren kontrollerer login, spilleridentitet og at begge værdier er ikke-negative, sikre heltal; selve spillet kører i browseren.

### Lokal spiltest uden database

```sh
npm run dev:game
```

Åbn den localhost-adresse, Vite viser (normalt `http://127.0.0.1:5173`, eller næste ledige port). Brug de opdigtede konti `admin-test` / `admin-test-only-password` eller `josse-test` / `josse-test-only-password`. Administratorkontoen har adgang til alle låger; Josse følger stadig datolåsningen. Rekorderne gemmes atomisk i den Git-ignorerede `.local/sleigh-scores.json`, ikke i Redis, og bevares efter genstart. En tydelig tekst i spillet markerer lokal test. Ingen produktionsadgangskoder behøves. Det normale `npm run dev` bruger fortsat dine egne miljøvariabler og Redis; der er ingen automatisk lokal fallback på lagringsfejl.

## Kontrol

```sh
npm test
npm run lint
npm run build
```

Browsertest bruger opdigtede testkonti og simulerede datoer. De bruger ikke dine rigtige adgangskoder og ændrer ikke din `.env`:

```sh
npx playwright install chromium
npm run test:e2e
```

De dækker login, udlogning, forkert adgangskode, private hilsner, administratorens adgang til alle låger, Josses datolåsning, adskilt lagring, alle 24 lågers indhold, skrabeloddet i låge 5, de tre hints og gaveafsløringen i låge 7, datoskift ved midnat, tastaturbetjening, reduceret bevægelse, fejl og mobilvisning.

## GitHub og arbejdsgang

Lav ændringer på en separat gren, f.eks. `initial-calender`, og opret en pull request mod `main`. Skub ikke ændringer direkte til `main`.

GitHub Actions kører automatisk på PR'er mod `main` og efter sammenfletning til `main`:

- **Kvalitet:** installation fra låsefilen, lint uden advarsler, enhedstest, TypeScript-kontrol og produktionsbygning.
- **Browsertest:** produktionsbygning og Playwright-test på computer og mobil. Fejlspor gemmes i syv dage.

Kørsler har tidsgrænser, læseadgang til koden og ingen adgang til Vercel-hemmeligheder. Ældre kørsler annulleres, når der kommer nye ændringer til samme PR. Dependabot opretter ugentlige PR'er for npm- og GitHub Actions-opdateringer.

Regelsættet **Beskyt main** er aktiveret på GitHub for `main`; `.github/rulesets/main.json` indeholder samme opsætning til dokumentation og genbrug. Det kræver PR'er, godkendte `Kvalitet`- og `Browsertest`-kontroller, en opdateret PR-gren og afsluttede gennemgangstråde. Det forbyder direkte skub, tvungne skub og sletning af `main`, også for administratorer. Der kræves ikke godkendelse fra en ekstra person.

Ved genbrug i et andet repository skal JSON-filen importeres og aktiveres under **Settings → Rules → Rulesets**; filen håndhæver ikke reglerne alene. Et helt tomt repository skal have en indledende `main`-gren, før der kan oprettes PR'er mod den. Statuskontroller kræves ikke ved selve oprettelsen af grenen, så den første engangsopsætning er mulig.

## Vercel Hobby (gratis)

Login og spilrekorder bruger én lille Node.js-funktion i `api/index.ts`, som kan køre på Hobby. Kalenderen og login kræver ingen betalte integrationer; fælles rekorder kræver en tilsluttet Upstash Redis-database.

1. Skub dette lokale Git-repository til et GitHub-repository.
2. Importer repositoryet i Vercel, og vælg **Vite** som projektindstilling.
3. Behold `npm run build` som byggekommando og `dist` som outputmappe.
4. Tilføj alle fem variabler fra `.env.example` under **Settings → Environment Variables** i Vercel. Brug dine egne værdier som hemmelige variabler, uden `VITE_`-præfiks. Den ignorerede lokale `.env` følger ikke automatisk med til Vercel.
5. Udgiv siden. Udgiv igen, når du ændrer miljøvariablerne i Vercel.
6. For fælles spilrekorder: Forbind Upstash Redis fra Storage til Production og Preview, og kontrollér, at de to `KV_REST_API_*`-variabler er tilføjet. Tilføj Development til forbindelsen, hvis det normale lokale udviklingsmiljø også skal bruge Redis. Den særskilte `npm run dev:game` bruger kun lokale testrekorder.

Siden bruger rodruten og API-ruten `/api`, så der er ikke brug for en SPA-omskrivningskonfiguration. Kør `npm run build` efterfulgt af `npm run preview` for at se produktionsversionen lokalt; Vite-tilføjelsen bruger samme API-kode som Vercel-funktionen.
