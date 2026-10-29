export type ChristmasArtKind = 'bow' | 'star' | 'tree' | 'heart' | 'ornament' | 'snowflake' | 'gift' | 'sprig'
type Theme = 'cranberry' | 'pine' | 'cream' | 'olive'
type Pattern = 'stars' | 'stripes' | 'snow' | 'plain'

export type AdventLetter = {
  greeting: string
  paragraphs: string[]
  signature: string
}

export type AdventActivity = {
  essentials: string[]
  timing: string
}

export type AdventDay = {
  day: number
  theme: Theme
  pattern: Pattern
  art: ChristmasArtKind
  title: string
  message: string
  littleJoy: string
  letter?: AdventLetter
  activity?: AdventActivity
}

export const adventDays: AdventDay[] = [
  {
    day: 1,
    theme: 'cranberry',
    pattern: 'stars',
    art: 'bow',
    title: 'Velkommen til december',
    message: 'Jeg har gemt et lille brev til dig. Åbn det, og lad vores december begynde.',
    littleJoy: 'Én lille ting fra mig hver dag. Ingen krav, intet du skal nå. Bare lidt ekstra kærlighed.',
    letter: {
      greeting: 'Hej Mousis',
      paragraphs: [
        'Velkommen til din julekalender hehe. Jeg har lavet en lille kalender til dig, fordi jeg gerne vil give dig lidt ekstra kærlighed midt i alt det, december også rummer.',
        'Bag hver låge venter en lille ting fra mig: en kærlig hilsen, en hyggelig stund, lidt sjov eller en overraskelse. Nogle ting er til os sammen, og andre er bare til dig.',
        'Du skal ikke nå noget bestemt. Der er ingen opgaver, du skal leve op til, og du behøver ikke åbne en låge hver dag. Kig ind, når du har lyst og overskud. Alt det hyggelige kan vente, til det passer dig.',
        'Jeg glæder mig til at dele de små øjeblikke med dig. Du er mit yndlingsmenneske, i december og alle årets andre måneder.',
      ],
      signature: 'Altid med kærlighed',
    },
  },
  {
    day: 2,
    theme: 'cream',
    pattern: 'plain',
    art: 'sprig',
    title: 'En hyggelig aften',
    message: 'I dag inviterer jeg dig til en aften med julefilm og masser af hygge. Bare dig og mig, pakket ind i dyner, mens december bliver lidt varmere.',
    littleJoy: 'Vi finder en julefilm, fylder skålene med dine yndlingssnacks og laver varm kakao. Så kravler vi under dynen og nyder en aften sammen.',
    activity: {
      essentials: ['Julefilm', 'Dyner og tæpper', 'Dine yndlingssnacks', 'Varm kakao'],
      timing: 'Har vi ikke tid i dag, gemmer vi hyggen til en aften, der passer os begge.',
    },
  },
  { day: 3, theme: 'pine', pattern: 'snow', art: 'star', title: 'Du lyser min verden op', message: 'Nogle mennesker gør en helt almindelig dag særlig bare ved at være en del af den. Sådan er du for mig. Min lille smule jul i hverdagen.', littleJoy: 'Lad os gå en tur og finde de smukkeste julelys.' },
  { day: 4, theme: 'olive', pattern: 'stripes', art: 'ornament', title: 'Perfekt på vores måde', message: 'En perfekt planlagt aften er dejlig. Men en aften uden planer sammen med dig? Det er som regel min favorit. Det bedste er at være sammen.', littleJoy: 'Du vælger aftensmaden i dag. Jeg tager mig af resten.' },
  { day: 5, theme: 'cranberry', pattern: 'plain', art: 'tree', title: 'Lidt plads til glæde', message: 'Lad os hylde de små ting: dit smil, en god sang, varme hænder og at komme hjem til hinanden. Det er dem, der gør livet stort.', littleJoy: 'Lad os sætte julemusik på og lave absolut ingenting nyttigt.' },
  { day: 6, theme: 'cream', pattern: 'stars', art: 'gift', title: 'Den sødeste gave', message: 'Hvis jeg kunne pakke den følelse ind, som du giver mig, ville det være den bedste gave under træet. Tak, fordi du er helt og vidunderligt dig selv.', littleJoy: 'Der skal noget sødt til. Skal vi bage julesmåkager?' },
  { day: 7, theme: 'olive', pattern: 'snow', art: 'snowflake', title: 'Helt din egen', message: 'Ligesom et snefnug findes der ingen helt som dig. Og blandt alle mennesker i verden er jeg så glad for, at netop vi fandt hinanden.', littleJoy: 'Fortæl mig én lille ting, du godt kunne tænke dig, at vi laver sammen denne vinter.' },
  { day: 8, theme: 'pine', pattern: 'plain', art: 'bow', title: 'En dag til hygge', message: 'Verden må beholde sine travle planer i dag. Jeg vil hellere være et varmt sted sammen med dig og gøre en helt almindelig aften til et lille minde.', littleJoy: 'Filmaften i en tæppehule. Ekstra tæpper og ekstra lækkerier.' },
  { day: 9, theme: 'cream', pattern: 'stripes', art: 'heart', title: 'Bare en lille påmindelse', message: 'På de gode dage og på de knap så gode dage er du elsket. Ikke på grund af det, du gør, eller hvor meget du når. Bare fordi du er dig.', littleJoy: 'Et rigtig langt kram. Helt uden nogen særlig grund.' },
  { day: 10, theme: 'cranberry', pattern: 'snow', art: 'star', title: 'Et ønske for dig', message: 'Jeg håber, at denne december giver dig den samme varme og glæde, som du bringer ind i mit liv. Og en lille smule magi, du ikke havde set komme.', littleJoy: 'Lad os hver skrive et ønske ned for det kommende år.' },
  { day: 11, theme: 'olive', pattern: 'plain', art: 'sprig', title: 'Et lille eventyr', message: 'Vi behøver ikke rejse langt for at skabe et minde. En ny lille gade, en varm kop kaffe og din hånd i min. Det er et ret dejligt eventyr.', littleJoy: 'Lad os finde en hyggelig café og bestille noget, vi ikke har prøvet før.' },
  { day: 12, theme: 'pine', pattern: 'stars', art: 'ornament', title: 'Halvvejs til jul', message: 'Tolv små låger og stadig så mange grunde til at smile. Her er én mere: Der er ingen, jeg hellere vil tælle ned sammen med end dig.', littleJoy: 'Tid til to julefilm i træk. Du vælger den første.' },
  { day: 13, theme: 'cranberry', pattern: 'stripes', art: 'gift', title: 'Din tid er en gave', message: 'Den bedste gave, du giver mig, har ingen sløjfe på. Det er din tid, din opmærksomhed og den måde, du virkelig lytter på. Det betyder mere, end du aner.', littleJoy: 'En aften, hvor vi lægger telefonerne væk. Bare os to.' },
  { day: 14, theme: 'cream', pattern: 'snow', art: 'tree', title: 'Vores egne traditioner', message: 'Jeg elsker, at vi samler på små traditioner, der er helt vores egne. De ting, der vil få os til at sige: »Kan du huske dengang?« i mange år fremover.', littleJoy: 'Lad os vælge en lille juletradition, vi vil begynde på i år.' },
  { day: 15, theme: 'pine', pattern: 'plain', art: 'heart', title: 'Mit yndlingssted', message: 'Hjem er ikke altid et sted. Nogle gange er det et menneske, der får dig til at føle dig tryg, forstået og lidt mere som dig selv. For mig er det dig.', littleJoy: 'Hjemmelavet aftensmad og ingen andre steder, vi skal være.' },
  { day: 16, theme: 'olive', pattern: 'stars', art: 'bow', title: 'Lidt ekstra sødme', message: 'Livet er sødere med dig. Også på de helt almindelige hverdage, hvor vi har glemt at købe mælk. Faktisk især på dem.', littleJoy: 'Lad os gå på jagt efter den allerbedste julelækkerbisken.' },
  { day: 17, theme: 'cream', pattern: 'plain', art: 'ornament', title: 'De smukke små ting', message: 'Den måde, du griner på. De ting, du bliver begejstret for. Alle de små detaljer, der gør dig til dig. Jeg lægger mærke til dem. Og jeg elsker dem.', littleJoy: 'Lad os tage et billede sammen i dag. Et lille minde at gemme.' },
  { day: 18, theme: 'cranberry', pattern: 'stars', art: 'snowflake', title: 'Der må godt være plads til fjolleri', message: 'Tak, fordi du er én, jeg kan være fuldstændig fjollet sammen med. Den bedste slags kærlighed har plads til masser af latter.', littleJoy: 'Julekaraoke i køkkenet. Begejstring er vigtigere end talent.' },
  { day: 19, theme: 'pine', pattern: 'stripes', art: 'sprig', title: 'Et strejf af vinterluft', message: 'Lad os lægge huskelisterne fra os et øjeblik. Lidt frisk luft, lidt godt selskab og et varmt sted at komme tilbage til.', littleJoy: 'En vintertur efterfulgt af de største krus med noget varmt.' },
  { day: 20, theme: 'cream', pattern: 'stars', art: 'star', title: 'Fire nætter endnu', message: 'Julen nærmer sig, men jeg har ikke lyst til at ønske dagene væk. Denne lille ventetid sammen med dig er også ret vidunderlig.', littleJoy: 'Lad os pakke gaver ind sammen med musik og en rigtig god pause med lækkerier.' },
  { day: 21, theme: 'olive', pattern: 'plain', art: 'tree', title: 'Du fortjener lidt ro', message: 'Du gør så meget. Lad dette være din tilladelse til at sætte farten ned, finde dig godt til rette og lade en anden tage sig af dig for en gangs skyld.', littleJoy: 'En hyggelig friaften. Din eneste opgave er at slappe af.' },
  { day: 22, theme: 'pine', pattern: 'snow', art: 'gift', title: 'Mere end en årstid', message: 'På et tidspunkt bliver lysene taget ned, og pynten bliver pakket væk. Men den følelse, jeg har, når jeg er sammen med dig? Den varer hele året.', littleJoy: 'Lad os vælge et lille eventyr, vi kan glæde os til i det nye år.' },
  { day: 23, theme: 'cranberry', pattern: 'plain', art: 'bow', title: 'Nu er det næsten jul', message: 'Kun én nat endnu. Tak, fordi du åbner de små låger sammen med mig og gør hele denne tid til noget, der er værd at fejre.', littleJoy: 'Julenattøj, noget sødt og en sidste julefilm.' },
  { day: 24, theme: 'pine', pattern: 'stars', art: 'heart', title: 'Alt, jeg ønsker mig, er dig', message: 'Fireogtyve låger, og de fører alle tilbage til det samme: Jeg elsker dig. Tak, fordi du er mit yndlingsmenneske, min glæde i hverdagen og det bedste ved alle årstider. Glædelig jul, min skat.', littleJoy: 'Det største julekram. Og et helt nyt år med små øjeblikke sammen.' },
]
