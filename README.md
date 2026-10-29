# Corp Campus AR – explorare 3D (lot 21 + lot 18)

Aplicație web 3D la persoana întâi pentru clădirea Corp Campus AR (20 × 20 m, P+1) a Universității „Ovidius” din Constanța. Clădirea e amplasată pe lotul 21, cu parcarea pe lotul 18, la capătul opus față de stradă și lac. Se pot explora:

* stația ITP (P01);
* Service-ul Student (P02);
* toate laboratoarele;
* scara exterioară S1 și liftul.

![Exterior](docs/exterior.png)

## Comenzi

| Tastă / mouse | Acțiune |
|---|---|
| Săgeți ↑ ↓ ← → sau W A S D | deplasare (← → rotesc privirea) |
| Mouse | privire (clic pe „Intră” blochează cursorul; Esc îl eliberează) |
| Shift | mers rapid |
| Clic / privire pe un echipament | fișa echipamentului: disciplina, lucrările, sursa |
| E | liftul (parter ↔ etaj) |
| 1 – 9 | teleport în încăperi (lista din dreapta) |
| M | harta mică · H ajutor |
| C / N | mărește imaginea concept a încăperii / trece la următoarea |

Pe scară se urcă mergând pe trepte.

## Publicare pe GitHub Pages

1. Creează un repository nou (de ex. `corp-campus-ar-3d`).
2. Încarcă **tot conținutul acestui folder** în rădăcina repository-ului: `index.html`, `css/`, `js/`, `lib/`, `.nojekyll`.
3. Deschide **Settings → Pages → Build and deployment**, alege *Deploy from a branch*, apoi branch-ul `main` și folderul `/ (root)`, și apasă **Save**.
4. După 1–2 minute aplicația e disponibilă la `https://<utilizator>.github.io/corp-campus-ar-3d/`.

Aplicația nu are dependențe externe: Three.js r160 e inclus în `lib/`, iar texturile se generează procedural. Funcționează și offline. Local se rulează cu `python -m http.server`, apoi se deschide `http://localhost:8000`. Dublu clic pe `index.html` nu merge, pentru că modulele ES au nevoie de un server.

## Imagini concept

Aspectul exterior și cel interior urmează imaginile concept din `img/concept/`:

* fațada: parter antracit și etaj gri deschis, ferestre în bandă, trei porți secționale (cea de la ITP deschisă), stâlpișori galben-negru, scară exterioară acoperită;
* parcarea pavată cu gard și arbuști;
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
| P03 PCMAI + CCMAI | Motoare: stand Otto 1.4 MPI, Diesel 1.5 dCi, AVL DiTEST, machetă secționată Smart |
| E01 | Diagnosticare + Mecatronică: 4 standuri de mecatronică, rețea CAN cu gateway OBD-II, stand injectoare, panou perforat cu senzori/actuatori |
| E02 | Construcția autovehiculelor: ambreiaje și cutie de viteze secționate, McPherson, casetă de direcție, punte motoare, sisteme de frânare, raft pneuri |
| E03 | Dinamica autovehiculelor: post de simulare dinamică, cântare de roți, stand de frânare hidraulică instrumentat |
| E04 | Caroserii: caroserie în alb, ușă pe stand, braț de măsurare, crash-box-uri, post CAD |
| E05 | Autovehicule hibride și electrice: machetă baterie ≤ 60 V cu BMS, motor electric, wallbox, transmisie hibridă secționată |

Modelele sunt simplificate (volumetrie la scară reală, materiale PBR, lumină naturală și artificială). Nu sunt modele foto-realiste ale mărcilor concrete.

![ITP](docs/itp.png)
