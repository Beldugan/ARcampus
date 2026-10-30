# R10 — apparatus and teaching models

R09 room areas, partitions, door openings and circulation remain the architectural source. R10 changes the equipment appearance and selected floor finishes.

The models are project-authored, illustrative assemblies inspired by the concept photographs, not certified manufacturer CAD. Detailed original parts include the cutaway gearbox, ventilated disc brake, optical headlight tester, emissions cart with flexible sampling line, stamped sheet-metal samples, open body-in-white frame and fallback teaching wheel. Complete engines reuse the project's detailed F1C model; source assets retain their existing licenses.

HeV tables include handheld instruments, the motor stator has an open section, dynamics equipment includes brake and sensor details, and CAD desks include printed prototypes. Body-in-white openings have no door skins. Caster wheels, fasteners and gear teeth use shared materials or instanced meshes where appropriate. Cast-metal grain is a small shared data texture. No external asset service or API key is required.

WebGL is disabled by the hosted QA browser. The geometric preview used CPU projection of the actual meshes, without claiming to reproduce WebGL lighting, transparency or optical materials. Browser visual quality remains unverified.

Validation:

- `node --experimental-loader ./tests/module-loader.mjs tests/mechanical.mjs`: dimensions and finite mesh/instance attributes.
- `node --experimental-loader ./tests/module-loader.mjs tests/geometry.mjs`: clear access, 1.20 m work aisles, architectural bounds and static merging.
- `node --experimental-loader ./tests/runtime-loader.mjs tests/runtime.mjs`: application initialization and switching plan/tour with a mock GPU.

The import map versions all modified runtime modules so a returning browser receives the R10 equipment together, while retaining one equipment-module instance across the site and tour.
