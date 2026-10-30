# Corp Campus AR – explorare 3D (lot 21 + parcarea lotului 18)

Aplicație web 3D la persoana întâi pentru clădirea Corp Campus AR a Universității „Ovidius” din Constanța. Clădirea are regim P+1 și o amprentă de 12,50 × 40,00 m = 500 m². Este un bloc lung și alb, cu ferestre regulate și panouri fotovoltaice pe acoperiș, ca în masterplanul campusului. Latura scurtă e spre stradă, iar latura lungă de vest e spre curtea de manevră și lotul 18. Se pot explora:

* stația ITP (P01);
* Service-ul Student (P02);
* toate laboratoarele și cele două săli de seminar de 30 de locuri;
* scara exterioară S1 din spatele clădirii și liftul interior;
* împrejurimile: 3 corpuri gemene în continuarea lotului 18 (spre vest), o clădire de colț P+4 pe latura opusă parcării (spre est), strada, clădirea UMC de vis-a-vis și lacul.

![Exterior](docs/exterior.png)

## Comenzi

| Tastă / mouse | Acțiune |
|---|---|
| Săgeți ↑ ↓ ← → sau W A S D | deplasare (← → rotesc privirea) |
| Clic + trage cu mouse-ul | privire |
| Shift | mers rapid |
| Clic / privire pe un echipament | fișa echipamentului: disciplina, lucrările, sursa |
| E | liftul (parter ↔ etaj), din holul de intrare |
| 1 – 9 | teleport în încăperi (lista din dreapta) |
| M | harta mică · H ascunde panoul cu taste |
| C / N | mărește imaginea concept a încăperii / trece la următoarea |
| Q | comută calitatea înaltă (ocluzie ambientală), aplicată automat când stai pe loc; în mers se randează direct, fără post-procesare |

Pe scară se urcă mergând pe trepte. Ușile se deschid singure când te apropii.

Pentru deplasare fluidă, geometria statică se comasează la încărcare (`js/perf.js`): de la ≈ 25.000 la ≈ 2.400 de apeluri de desenare pe cadru. Umbrele soarelui se calculează o singură dată, iar cadrul se redesenează doar când te miști sau se deschide o ușă.

### Organizare (500 m² / nivel)

* **Parter** (de la stradă spre spate):
  * **P04 Hol de intrare** cu liftul și grupurile sanitare;
  * **P03 Laborator motoare, 141 m²:** standuri de motor pe latura de est, AVL DiTEST, bancuri cu piese, 10 bănci (20 de locuri);
  * **P01 Stație ITP clasa a II-a, 78 m²:** linie în lungul clădirii (canal 6,50 m, role de frânare, tester suspensie, ripaj, regloscop, analizor gaze), poartă 3,60 × 3,80 m pe latura de vest;
  * **P02 Service student, 116 m²:** 2 posturi, fiecare cu poarta lui pe latura de vest; bancuri, mașini de anvelope și echilibrare;
  * în spate: magazie piese, vestiar, cameră tehnică.
* **Etaj:** hol central de 2,00 m în lungul clădirii. Spre vest: E01 Diagnosticare + Mecatronică, E03 Dinamică, E05 HeV, E12 Laborator CAD și fabricație aditivă. Spre est: E14 Sală de seminar (30 de locuri), E13 Sală de seminar și protocol (masă ovală, 28 de locuri), E02 CCA, E04 Caroserii. WC-uri la capătul dinspre stradă.
* **Accese:** vehiculele ITP și service intră și ies prin curtea de manevră de pe latura de vest, legată direct de stradă. Pietonii intră pe ușa principală de la stradă. Scara S1 (în U, acoperită) e în spatele clădirii și se ajunge la ea pe aleea de est.
* **E12:** 9 posturi PC, 2 imprimante 3D FDM de format mare (1000 × 1000 × 1000 mm) și o imprimantă 3D cu gel întărit UV.

### Capacitate maximă conform ARACIS și locuri amenajate

Suprafața netă = suprafața încăperii − amprenta standurilor didactice și a echipamentelor de pe pardoseală (calculată din model). Catedra, steagurile și ecranele nu se scad. Numărul maxim de locuri = ⌊ netă / normă ⌋, după Metodologia ARACIS: laboratoare cu caracter tehnic 4 m²/loc, laborator de informatică 2,5 m²/loc, săli de seminar 1,4 m²/loc. Mesele se pun la pozițiile din `seatLabs()` (`js/equipment.js`) și se opresc la maximul ARACIS.

| Încăpere | Suprafață | Normă | Locuri max. | Amenajate |
|---|---|---|---|---|
| P01 Stație ITP | 78,0 m² | 4 | 14 | – (fără mese) |
| P02 Service student | 115,6 m² | 4 | 20 | – (fără mese) |
| P03 Laborator motoare | 141,0 m² | 4 | 31 | 20 |
| E01 Diagnosticare + Mecatronică | 45,3 m² | 4 | 9 | 8 |
| E02 CCA | 43,4 m² | 4 | 8 | 30 taburete la 5 mese mari |
| E03 Dinamică | 38,5 m² | 4 | 7 | 7 |
| E04 Caroserii | 45,3 m² | 4 | 8 | 7 |
| E05 HeV | 38,5 m² | 4 | 7 | 7 |
| E12 Laborator CAD | 34,5 m² | 2,5 | 11 | 9 |
| E14 Sală de seminar | 43,4 m² | 1,4 | 30 | 30 |
| E13 Sală de seminar și protocol | 43,4 m² | 1,4 | 30 | 28 (masă ovală) |

## Publicare pe GitHub Pages

1. Creează un repository nou (de ex. `corp-campus-ar-3d`).
2. Încarcă **tot conținutul acestui folder** în rădăcina repository-ului: `index.html`, `css/`, `js/`, `lib/`, `.nojekyll`.
3. Deschide **Settings → Pages → Build and deployment**, alege *Deploy from a branch*, apoi branch-ul `main` și folderul `/ (root)`, și apasă **Save**.
4. După 1–2 minute aplicația e disponibilă la `https://<utilizator>.github.io/corp-campus-ar-3d/`.

Aplicația nu are dependențe externe: Three.js r160 e inclus în `lib/`, iar texturile se generează procedural. Funcționează și offline. Local se rulează cu `python -m http.server`, apoi se deschide `http://localhost:8000`. Dublu clic pe `index.html` nu merge, pentru că modulele ES au nevoie de un server.

## Imagini concept

Aspectul exterior și cel interior urmează imaginile concept din `img/concept/`:

* fațada: bloc alb cu ferestre regulate, panouri fotovoltaice, porți secționale pe latura de vest, stâlpișori galben-negru (după masterplanul campusului);
* halele: soclu gri, marcaje galbene, corpuri LED liniare, tubulatură de ventilație, furtunuri de evacuare suspendate, bancuri cu panouri de scule;
* laboratoarele: mese cu blat de lemn.

În fiecare încăpere, imaginea concept corespunzătoare apare în colțul din stânga jos (clic sau tasta C o mărește).

## Sursa datelor

* **Geometria:** `Corp_Campus_Planuri_Editabile.dxf`, cu pereții, golurile, ușile, porțile și scara S1 la cotele din concept (parter +0,00, etaj +4,80, atic +8,60).
* **Echipamentele:** 82 de obiecte, amplasate după fișele de disciplină și materialele din folderul UOC 2026–2027. Printre surse:
  * caietul de sarcini pentru Laboratorul Motoare;
  * îndrumarele Diagnosticare și SAA;
  * inventarul de mecatronică;
  * standurile de diplomă.

  Fiecare obiect are fișa lui (disciplina, lucrările de laborator, documentul-sursă), afișată când îl privești.

| Încăpere | Discipline principale |
|---|---|
| P01 Linie ITP | Inspecție tehnică: frâne, suspensie, ripaj, faruri, analizor gaze, detector de jocuri |
| P02 Service student | Diagnosticare, practică, mentenanță: elevator 2 coloane, post la sol, X431, schimbător și echilibror de roți |
| P03 PCMAI + CCMAI | Motoare: stand Otto 1.4 MPI, Diesel 1.5 dCi, motor secționat, AVL DiTEST |
| E01 | Diagnosticare + Mecatronică: 4 standuri mobile de mecatronică și un stand de diagnoză (inserare defecte + breakout OBD), refăcute după proiectul propriu (cadru 1700×1000×800, tablă perforată, ST1–ST12, BB1–BB5); motor diesel F1C 3.0 pe stand rotativ, cu agregate și cablaj; mese de laborator cu laptop, osciloscop, placă de achiziție și multimetru; 2 cursanți la mese; rețea CAN, stand injectoare |
| E02 | Construcția autovehiculelor: ambreiaje și cutie de viteze secționate, McPherson, casetă de direcție, punte motoare, sisteme de frânare, raft pneuri |
| E03 | Dinamica autovehiculelor: post de simulare dinamică, cântare de roți, stand de frânare hidraulică instrumentat |
| E04 | Caroserii: caroserie în alb, ușă pe stand, braț de măsurare, crash-box-uri, post CAD |
| E05 | Autovehicule hibride și electrice: machetă baterie ≤ 60 V cu BMS, motor electric, wallbox, transmisie hibridă secționată |
| E12 | Grafică asistată și fabricație aditivă: posturi CAD, 2 imprimante 3D de format mare, imprimantă 3D cu gel |
| E13 / E14 | Seminarii (câte 30 de locuri); E13 servește și pentru protocol și videoconferințe |

Autoturismele folosesc un model 3D real: „2020 Mazda 3 Hatchback” de OUTPISTON (Sketchfab), licență [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), în varianta fără sigle pregătită de proiectul freaxnx01/game-rhyflitzer (detalii în `models/hatchback.LICENSE.md`). Licența permite doar utilizare necomercială, cu atribuire. Cerul și reflexiile exterioare folosesc panorama HDR „Quarry 01” de la Poly Haven (CC0), iar gazonul folosește textura din exemplele three.js. Celelalte echipamente sunt modelate simplificat (volumetrie la scară reală, materiale PBR, lumină naturală și artificială). Nu sunt modele foto-realiste ale mărcilor concrete.

![ITP](docs/itp.png)
