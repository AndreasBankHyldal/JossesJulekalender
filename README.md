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

## Vercel Hobby (gratis)

Der kræves ingen database, serverfunktioner, API-nøgler eller betalte tjenester.

1. Skub dette lokale Git-repository til et GitHub-repository.
2. Importer repositoryet i Vercel, og vælg **Vite** som projektindstilling.
3. Behold `npm run build` som byggekommando og `dist` som outputmappe.
4. Udgiv siden. Der er ikke brug for miljøvariabler.

Siden bruger kun rodruten, så der er ikke brug for en SPA-omskrivningskonfiguration. Kør `npm run build` efterfulgt af `npm run preview` for at se produktionsversionen lokalt.
