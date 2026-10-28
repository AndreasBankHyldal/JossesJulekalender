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

Login kontrolleres på serveren. Sessionen gemmes i en underskrevet `HttpOnly`-cookie i syv dage, og der er en knap til at logge ud. Ændrer du en kontos login eller sessionsnøglen, bliver de berørte sessioner ugyldige. Der er ingen database eller ekstern logintjeneste.

**Login vises først, hver gang siden åbnes eller genindlæses**, også i en ny fane og selv med en eksisterende sessionscookie. Kalenderen vises og hilsnerne hentes først, når loginformularen er sendt og godkendt. Der er ingen automatisk genindlogning; gemte åbnede låger bevares efter næste login.

`.env` og `.env.local` er ignoreret af Git; kun den tomme `.env.example` må deles. Brug aldrig `VITE_` foran brugernavne, adgangskoder eller sessionsnøglen, da den type variabler bliver offentlige i browseren. Genstart `npm run dev`, når du har ændret loginoplysningerne.

## Gør kalenderen personlig

- Rediger de 24 beskeder, overskrifter og aktiviteter i `src/data/advent.ts`. De medfølgende hilsner er eksempler; erstat dem med dine egne minder, planer eller gaver.
- Låge 1 indeholder et velkomstbrev i en kuvert, som åbnes ved tryk. Tilpas hilsenen, afsnittene og underskriften i dagens `letter`-felt. Brevet kan foldes sammen og læses igen; det sendes kun efter login, ligesom de øvrige hilsner. Ved reduceret bevægelse åbner brevet uden bevægelseseffekterne.
- Indstil årstallet i `src/lib/calendar.ts`. Åbnede låger gemmes separat for hvert år.
- Rediger overskriften, dedikationen og navnet øverst på kalenderen i `src/components/Calendar.tsx`. Loginteksterne findes i `src/components/LoginPage.tsx`.
- Farver, layout og animationer findes i `src/App.css`. Skrifttyper og juleillustrationer følger med lokalt; siden henter ikke skrifttyper eller billeder fra tredjeparter.

Lågerne låses op ved midnat **i tidszonen på den besøgendes enhed**. Tidligere låger forbliver tilgængelige, også efter jul. Siden kontrollerer datoen hvert 30. sekund, når den får fokus, og hver gang der trykkes på en låge. Åbnede låger gemmes i browserens lokale lager og synkroniseres ikke mellem enheder. Fejl ved lagring vises på siden.

Dette er en enkel, personlig kalender med login, ikke en sikker tidslås: En indlogget person kan stadig ændre enhedens ur eller undersøge de hilsner, browseren har hentet. Hilsnerne sendes kun fra `/api` efter login og ligger ikke i den offentlige JavaScript-fil. Læg alligevel ikke adgangskoder, gavekortkoder eller andre hemmeligheder i kalenderen. Et `noindex`-metatag beder desuden søgemaskiner om ikke at indeksere siden.

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

De dækker login, udlogning, forkert adgangskode, private hilsner, administratorens adgang til alle låger, Josses datolåsning, adskilt lagring, alle 24 lågers indhold, datoskift ved midnat, tastaturbetjening, reduceret bevægelse, fejl og mobilvisning.

## GitHub og arbejdsgang

Lav ændringer på en separat gren, f.eks. `initial-calender`, og opret en pull request mod `main`. Skub ikke ændringer direkte til `main`.

GitHub Actions kører automatisk på PR'er mod `main` og efter sammenfletning til `main`:

- **Kvalitet:** installation fra låsefilen, lint uden advarsler, enhedstest, TypeScript-kontrol og produktionsbygning.
- **Browsertest:** produktionsbygning og Playwright-test på computer og mobil. Fejlspor gemmes i syv dage.

Kørsler har tidsgrænser, læseadgang til koden og ingen adgang til Vercel-hemmeligheder. Ældre kørsler annulleres, når der kommer nye ændringer til samme PR. Dependabot opretter ugentlige PR'er for npm- og GitHub Actions-opdateringer.

Regelsættet **Beskyt main** er aktiveret på GitHub for `main`; `.github/rulesets/main.json` indeholder samme opsætning til dokumentation og genbrug. Det kræver PR'er, godkendte `Kvalitet`- og `Browsertest`-kontroller, en opdateret PR-gren og afsluttede gennemgangstråde. Det forbyder direkte skub, tvungne skub og sletning af `main`, også for administratorer. Der kræves ikke godkendelse fra en ekstra person.

Ved genbrug i et andet repository skal JSON-filen importeres og aktiveres under **Settings → Rules → Rulesets**; filen håndhæver ikke reglerne alene. Et helt tomt repository skal have en indledende `main`-gren, før der kan oprettes PR'er mod den. Statuskontroller kræves ikke ved selve oprettelsen af grenen, så den første engangsopsætning er mulig.

## Vercel Hobby (gratis)

Login bruger én lille Node.js-funktion i `api/index.ts`, som kan køre på Hobby. Der kræves ingen database, API-nøgler eller betalte integrationer.

1. Skub dette lokale Git-repository til et GitHub-repository.
2. Importer repositoryet i Vercel, og vælg **Vite** som projektindstilling.
3. Behold `npm run build` som byggekommando og `dist` som outputmappe.
4. Tilføj alle fem variabler fra `.env.example` under **Settings → Environment Variables** i Vercel. Brug dine egne værdier som hemmelige variabler, uden `VITE_`-præfiks. Den ignorerede lokale `.env` følger ikke automatisk med til Vercel.
5. Udgiv siden. Udgiv igen, når du ændrer miljøvariablerne i Vercel.

Siden bruger rodruten og API-ruten `/api`, så der er ikke brug for en SPA-omskrivningskonfiguration. Kør `npm run build` efterfulgt af `npm run preview` for at se produktionsversionen lokalt; Vite-tilføjelsen bruger samme API-kode som Vercel-funktionen.
