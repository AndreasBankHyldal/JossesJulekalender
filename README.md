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
