# Josses julekalender

En julekalender lavet med React, TypeScript og Vite. Fireogtyve illustrerede låger låses op fra den 1. til den 24. december 2026. Hver låge åbner med en zoom- og lågeanimation og afslører en kærlig hilsen og en lille aktivitet.

## Kør lokalt

Brug Node.js 22.18+ (eller en aktuel Node.js 24 LTS-version).

```sh
npm install
npm run dev
```

Åbn den localhost-adresse, som Vite viser.

## Gør kalenderen personlig

- Rediger de 24 beskeder, overskrifter og aktiviteter i `src/data/advent.ts`. De medfølgende hilsner er eksempler; erstat dem med dine egne minder, planer eller gaver.
- Indstil årstallet i `src/lib/calendar.ts`. Åbnede låger gemmes separat for hvert år.
- Rediger overskriften, dedikationen og navnet øverst på siden i `src/App.tsx`.
- Farver, layout og animationer findes i `src/App.css`. Skrifttyper og juleillustrationer følger med lokalt; siden henter ikke skrifttyper eller billeder fra tredjeparter.

Lågerne låses op ved midnat **i tidszonen på den besøgendes enhed**. Tidligere låger forbliver tilgængelige, også efter jul. Siden kontrollerer datoen hvert 30. sekund, når den får fokus, og hver gang der trykkes på en låge. Åbnede låger gemmes i browserens lokale lager og synkroniseres ikke mellem enheder. Fejl ved lagring vises på siden.

Dette er en enkel, personlig kalender, ikke en sikker tidslås: Låger kan låses op ved at ændre enhedens ur, og alle hilsner er med i den JavaScript-kode, som browseren henter. Læg ikke adgangskoder, gavekortkoder eller andre hemmeligheder i kalenderen. Et `noindex`-metatag beder søgemaskiner om ikke at indeksere siden, men der er ingen adgangskontrol.

## Kontrol

```sh
npm test
npm run lint
npm run build
```

Browsertest bruger simulerede datoer; de tilføjer ikke en mulighed for at omgå datolåsen i appen:

```sh
npx playwright install chromium
npm run test:e2e
```

De dækker datolåsning, alle 24 lågers indhold, lagring af åbnede låger, datoskift ved midnat, lukning med tastaturet, reduceret bevægelse, lagringsfejl og mobilvisning.

## GitHub og arbejdsgang

Lav ændringer på en separat gren, f.eks. `initial-calender`, og opret en pull request mod `main`. Skub ikke ændringer direkte til `main`.

GitHub Actions kører automatisk på PR'er mod `main` og efter sammenfletning til `main`:

- **Kvalitet:** installation fra låsefilen, lint uden advarsler, enhedstest, TypeScript-kontrol og produktionsbygning.
- **Browsertest:** produktionsbygning og Playwright-test på computer og mobil. Fejlspor gemmes i syv dage.

Kørsler har tidsgrænser, læseadgang til koden og ingen adgang til Vercel-hemmeligheder. Ældre kørsler annulleres, når der kommer nye ændringer til samme PR. Dependabot opretter ugentlige PR'er for npm- og GitHub Actions-opdateringer.

Regelsættet **Beskyt main** er aktiveret på GitHub for `main`; `.github/rulesets/main.json` indeholder samme opsætning til dokumentation og genbrug. Det kræver PR'er, godkendte `Kvalitet`- og `Browsertest`-kontroller, en opdateret PR-gren og afsluttede gennemgangstråde. Det forbyder direkte skub, tvungne skub og sletning af `main`, også for administratorer. Der kræves ikke godkendelse fra en ekstra person.

Ved genbrug i et andet repository skal JSON-filen importeres og aktiveres under **Settings → Rules → Rulesets**; filen håndhæver ikke reglerne alene. Et helt tomt repository skal have en indledende `main`-gren, før der kan oprettes PR'er mod den. Statuskontroller kræves ikke ved selve oprettelsen af grenen, så den første engangsopsætning er mulig.

## Vercel Hobby (gratis)

Der kræves ingen database, serverfunktioner, API-nøgler eller betalte tjenester.

1. Skub dette lokale Git-repository til et GitHub-repository.
2. Importer repositoryet i Vercel, og vælg **Vite** som projektindstilling.
3. Behold `npm run build` som byggekommando og `dist` som outputmappe.
4. Udgiv siden. Der er ikke brug for miljøvariabler.

Siden bruger kun rodruten, så der er ikke brug for en SPA-omskrivningskonfiguration. Kør `npm run build` efterfulgt af `npm run preview` for at se produktionsversionen lokalt.
