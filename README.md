# AR Campus · simulare arhitecturală R06

Tur 3D al corpului P+1 de 12,50 × 40 m, actualizat conform reviziei R09, planșele A01/A02 și detaliile nucleului. Studiu conceptual; nu reprezintă proiect autorizat sau verificare de conformitate.

## Organizare R09 - etaj pentru laboratoare

Seminarele au fost eliminate de la etaj. CCA și Dinamica împart o sală zonată, astfel încât cele șase funcțiuni folosesc cinci laboratoare mai mari.

| Laborator | Suprafață nominală | Posturi propuse |
|---|---:|---:|
| Diagnosticare + Mecatronică | 59,3 m² | 8 |
| HeV | 47,3 m² | 6 |
| CAD + imprimare 3D | 49,7 m² | 8 CAD |
| Caroserii | 64,1 m² | 8 |
| CCA + Dinamică | 92,9 m² | 12 partajate |

CAD include o incintă de imprimare de aproximativ 15,4 m², cu ventilare dedicată de proiectat. Coridorul central de 2,00 m, scările S1/S2, liftul și grupurile sanitare sunt păstrate. Parterul și accesele sale sunt păstrate.

Mobilarea este reamplasată; testele verifică benzi principale de lucru de 1,20 m, accesul la imprimante și evitarea trecerii obiectelor prin pereții laboratoarelor. Aceasta este verificare geometrică, nu certificare ergonomică sau normativă. Efectivele, utilajele, vibrațiile și activitățile simultane se validează în proiectul de specialitate. CCA și Dinamica folosesc posturile în comun; lucrările zgomotoase se programează separat.

Datele actuale sunt în `js/plan-r06.js` (nume păstrat pentru compatibilitate, revizie exportată R09).

## Utilizare

Butoanele **Tur 3D / Plan parter / Plan etaj** permit verificarea organizării și acceselor. Planurile sunt vederi 3D secționate la 1,15 m deasupra nivelului selectat.

| Comandă | Acțiune |
|---|---|
| W/S, săgeți sus/jos | Mers înainte/înapoi |
| A/D | Pas lateral |
| Săgeți stânga/dreapta | Rotire |
| Clic + trage | Privire |
| Shift | Mers rapid |
| E | Lift, din zona liberă din fața ușii |
| M / H | Hartă / panou de comenzi |
| 1–9 sau lista din dreapta | Puncte de navigare |
| C / N | Imagine concept / următoarea imagine |
| Q | Calitate randare |

Ușile batante și cele glisante se deschid automat la apropiere. Pe scări se urcă prin deplasare pe rampe, fără teleportare.

## Verificare

Din rădăcina repository-ului:

```sh
node --experimental-loader ./tests/module-loader.mjs tests/geometry.mjs
```

Verificarea construiește geometria Three.js și echipamentele actuale, testează traseele către WC-uri/lift, coridoarele, accesibilitatea fiecărei încăperi prin propagare pe o grilă și continuitatea rampelor. Canvasul și încărcarea fișierelor GLB sunt înlocuite în test; acesta **nu verifică randarea WebGL**, aspectul texturilor sau încărcarea modelului auto. Pentru acestea este necesară verificarea în browser.

În mediul în care s-a pregătit R06, serviciul de previzualizare nu era disponibil; verificarea vizuală în browser rămâne de efectuat înainte de publicare.

## Rulare și publicare

Aplicație statică, fără build și fără dependențe CDN. Three.js și încărcătoarele sunt incluse în `lib/`. Local se poate servi rădăcina cu un server HTTP; deschiderea directă prin `file://` nu este suficientă pentru module ES.

GitHub Pages folosește rădăcina ramurii configurate în Settings → Pages. Propunerea R06 este pe o ramură separată; integrarea în ramura publicată actualizează site-ul existent.

## Limitele studiului

Lățimile sunt nominale, iar golurile din model includ rezerva tocurilor pentru WC și lift. Finisajele, pragurile, barele de sprijin, protecția scărilor, evacuarea, numărul obiectelor sanitare și sarcinile planșeelor trebuie detaliate și verificate de proiectanți. Documentele și imaginile vechi din `docs/` sau `img/concept/` rămân referințe vizuale și pot arăta compartimentarea anterioară.

## Aspect după imaginile concept

Referințele existente `img/concept/ext-fata.jpg`, `ext-spate.jpg`, `itp-1.jpg`, `srv-1.jpg`, `p03.jpg`, `e01.jpg` și `sala.jpg` ghidează finisajele: parter antracit / etaj alb cald, rosturi de placare, vitraje late cu rame închise, beton satinat în ateliere și dale neutre în laboratoare, soclu interior gri, grinzi și tubulatură aparente, LED-uri liniare, marcaje galbene și protecții la porți. Bancurile cu subansamble P03 și panoul de scule din service folosesc modelele detaliate existente. P03 păstrează accesul pietonal; porțile de hală rămân exclusiv la ITP și service.

Acestea sunt adaptări 3D ale limbajului vizual, fără promisiunea unei reproduceri fotografice identice. Amprenta, compartimentarea, accesele și circulațiile R06 sunt păstrate; vitrajele sunt extinse în interiorul traveilor camerelor. Validarea randării rămâne limitată de lipsa WebGL în browserul de verificare.

## Atribuire și active

Autoturismele folosesc un model 3D real: „2020 Mazda 3 Hatchback” de OUTPISTON (Sketchfab), licență [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), în varianta fără sigle pregătită de proiectul freaxnx01/game-rhyflitzer (detalii în `models/hatchback.LICENSE.md`). Licența permite doar utilizare necomercială, cu atribuire. Cerul și reflexiile exterioare folosesc panorama HDR „Quarry 01” de la Poly Haven (CC0), iar gazonul folosește textura din exemplele three.js. Celelalte echipamente sunt modelate simplificat (volumetrie la scară reală, materiale PBR, lumină naturală și artificială). Nu sunt modele foto-realiste ale mărcilor concrete.

### Revizie vizuală după referințele încărcate

`js/visual-detail.js` adaugă geometrie pentru tablă cutată, ferme metalice, suporturi și coliere de tubulatură, trasee de cabluri, lămpi suspendate P03, grile de tavan, ghidaje la porți și copertina S2. Betonul are relief și variație de rugozitate; plafonul nu mai funcționează ca o suprafață luminoasă uniformă. Au fost adăugate planșe tehnice și cursanți la mesele de laborator. Perspectiva inițială arată fațada lungă din curte, cu un câmp vizual de 58°. Forma clădirii și circulațiile sunt păstrate. Aspectul final WebGL nu a putut fi validat în mediul de lucru, unde accelerarea grafică este indisponibilă.

### Flotă variată și cursanți

Turul include modelul Mazda existent și cinci geometrii proprii simplificate în `js/vehicles.js`, inspirate de Volkswagen Golf, Renault Clio, Dacia Logan, Dacia Duster și Tesla Model 3. Nu sunt modele CAD oficiale ale producătorilor și nu reproduc toate detaliile unei anumite generații. Siluetele, ampatamentele, vitrajele, jantele și luminile diferă; service-ul include SUV pe elevator și hatchback cu capota deschisă. Modelul Mazda păstrează atribuirea și licența inițiale. Cursanții sunt distribuiți în laboratoare, seminare și pe laturile posturilor service/ITP.
