# AR Campus · simulare arhitecturală R06

Tur 3D al corpului P+1 de 12,50 × 40 m, actualizat după **AR_Campus_R06.pdf**, planșele A01/A02 și detaliile D01/D02. Studiu conceptual; nu reprezintă proiect autorizat sau verificare de conformitate.

## Organizare

- Nucleu frontal identic pe niveluri: scară interioară S1, lift cu acces lateral din galerie, WC adaptat și cabine separate F/B.
- La parter, intrare dinspre stradă și coridor de personal pe latura estică, legat de distribuitorul anexelor. Nu se traversează ITP sau service-ul pentru acces la anexe.
- La etaj, coridor central de 2 m și acces la toate sălile. Fațada spre stradă nu are ușă în gol.
- Scara exterioară **S2** se leagă prin podestul superior de ușa din spate. Planșeul are gol real pentru scara interioară și lift.
- Seminar: **18 locuri** în fiecare sală. CAD: **8 posturi**; fabricația aditivă se află separat în E15.
- Suprafețele și locurile sunt propuneri geometrice, fără afirmații de acreditare ARACIS sau autorizare RAR/ISU.

Geometria, camerele, golurile și suprafețele de mers sunt definite împreună în `js/plan-r06.js`. Pozițiile obiectelor sunt în coordonatele PDF: `u` = lungime, `v` = spre vest. Conversie în model: `x = 12.5 - v`, `y = u`.

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

Verificarea construiește geometria Three.js și cele 102 obiecte, testează traseele către WC-uri/lift, coridoarele, accesibilitatea fiecărei încăperi prin propagare pe o grilă și continuitatea rampelor. Canvasul și încărcarea fișierelor GLB sunt înlocuite în test; acesta **nu verifică randarea WebGL**, aspectul texturilor sau încărcarea modelului auto. Pentru acestea este necesară verificarea în browser.

În mediul în care s-a pregătit R06, serviciul de previzualizare nu era disponibil; verificarea vizuală în browser rămâne de efectuat înainte de publicare.

## Rulare și publicare

Aplicație statică, fără build și fără dependențe CDN. Three.js și încărcătoarele sunt incluse în `lib/`. Local se poate servi rădăcina cu un server HTTP; deschiderea directă prin `file://` nu este suficientă pentru module ES.

GitHub Pages folosește rădăcina ramurii configurate în Settings → Pages. Propunerea R06 este pe o ramură separată; integrarea în ramura publicată actualizează site-ul existent.

## Limitele studiului

Lățimile sunt nominale, iar golurile din model includ rezerva tocurilor pentru WC și lift. Finisajele, pragurile, barele de sprijin, protecția scărilor, evacuarea, numărul obiectelor sanitare și sarcinile planșeelor trebuie detaliate și verificate de proiectanți. Documentele și imaginile vechi din `docs/` sau `img/concept/` rămân referințe vizuale și pot arăta compartimentarea anterioară.

## Atribuire și active

Autoturismele folosesc un model 3D real: „2020 Mazda 3 Hatchback” de OUTPISTON (Sketchfab), licență [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), în varianta fără sigle pregătită de proiectul freaxnx01/game-rhyflitzer (detalii în `models/hatchback.LICENSE.md`). Licența permite doar utilizare necomercială, cu atribuire. Cerul și reflexiile exterioare folosesc panorama HDR „Quarry 01” de la Poly Haven (CC0), iar gazonul folosește textura din exemplele three.js. Celelalte echipamente sunt modelate simplificat (volumetrie la scară reală, materiale PBR, lumină naturală și artificială). Nu sunt modele foto-realiste ale mărcilor concrete.
