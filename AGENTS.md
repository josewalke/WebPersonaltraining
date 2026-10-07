# WebPersonaltraining

Sitio de entrenamiento personal con frontend React en `frontend/` y API Node.js en `backend/`. Mantén UI y API separadas. Sigue los manifiestos y convenciones reales de cada carpeta cuando exista el scaffolding; no importes supuestos de otros proyectos.

## Forma de trabajar

- Responde en español salvo que el usuario use otro idioma. La UI es en español.
- Inspecciona la implementación y los patrones relacionados antes de editar. Reutiliza lo existente y realiza el menor cambio coherente con la tarea.
- Evita refactors ajenos, capas innecesarias, dependencias y documentación sin necesidad.
- Conserva contratos de API y comportamiento salvo que el cambio solicitado requiera modificarlos.
- Las instrucciones del usuario y las del entorno de ejecución prevalecen sobre estas convenciones; este archivo prevalece sobre las reglas y skills locales si discrepan.
- Una petición explícita autoriza las decisiones normales necesarias para completarla. No repitas permisos ya concedidos. Pregunta si falta una decisión esencial o hay una acción destructiva, pérdida de datos o un efecto externo fuera del alcance autorizado.
- Haz commits solo cuando el usuario los solicite o haya autorizado ese flujo. No incluyas cambios ajenos ni descartes trabajo previo para resolver errores. Publica o despliega únicamente dentro de un alcance autorizado por el usuario.

## Calidad y seguridad

- No desactives tipos, lint, validación, autenticación, autorización ni tests para ocultar errores.
- Valida entradas externas en el backend, comprueba permisos y evita exponer secretos o trazas internas.
- Guarda secretos en el entorno o en archivos `.env` ignorados. Los `.env.example` solo contienen nombres y valores ficticios seguros. Nunca registres credenciales en código, logs o Git.
- Mantén responsive y coherencia visual. En marketing: misma composición en escritorio (`desk` / `.page-shell`), fluidizar tamaños; fondo full-bleed; no escalar toda la página ni generar bandas. Detalle en `.cursor/rules/23-responsive-layout.mdc`. Usa HTML semántico, controles con nombres accesibles, navegación por teclado, foco visible, contraste legible y respeto por `prefers-reduced-motion`. Comunica errores de formularios de forma accesible.

## Frontend: React, 21st.dev y React Bits

- Usa React en `frontend/`; para código nuevo, prefiere TypeScript y componentes funcionales con hooks. Sigue el scaffolding y las dependencias reales cuando existan.
- Antes de crear UI, reutiliza los componentes del proyecto. Para nuevas secciones o componentes relevantes sin equivalente local, consulta **21st.dev**; para textos animados, fondos, efectos e interacciones visuales, prioriza **React Bits**. Elige el catálogo pertinente sin buscar obligatoriamente en ambos y adapta lo que encaje con la marca, accesibilidad y stack.
- Consulta `.cursor/skills/21st-cli-use/SKILL.md` cuando uses el catálogo. Usa shadcn/ui y Tailwind si el componente elegido y la configuración del proyecto lo requieren; no impongas una migración para incorporar un componente.
- Si no hay una opción adecuada o el catálogo no está disponible, implementa el componente en React y explica brevemente la decisión. No consultes el catálogo para cada arreglo de texto, estilo o componente existente.
- Revisa el código y las dependencias antes de incorporar componentes externos. No añadas claves al frontend ni publiques componentes, contrates servicios o uses generación de pago sin autorización para ese alcance.
- Para React Bits, usa la documentación oficial de `https://reactbits.dev` y prefiere la variante TypeScript + Tailwind cuando esté disponible y encaje. Incorpora solo los componentes elegidos y sus dependencias necesarias; respeta movimiento reducido y rendimiento en móvil.
- Las instrucciones detalladas están en `.cursor/rules/21-react-and-21st.mdc` y `.cursor/rules/22-react-bits.mdc`.

## Verificación

- Revisa los cambios y ejecuta comprobaciones proporcionales al riesgo: tests relevantes, typecheck, lint, build o revisión manual, según lo que exista y afecte la tarea.
- Añade tests de regresión para bugs reproducibles cuando exista un entorno adecuado. No instales un framework de tests solo para cambios menores de texto o configuración.
- Descubre los comandos en los `package.json` y el gestor en los lockfiles. No inventes scripts ni declares comprobaciones exitosas sin ejecutarlas.
- Desarrollo: `npm run dev --prefix frontend` y `npm run dev --prefix backend`. Build del front: `npm run build --prefix frontend`. Base de datos: `backend/db/apply.sh`.
- Al finalizar, informa brevemente de los cambios, la verificación realizada y cualquier limitación pendiente.

## Reglas, skills y Graphify

Las reglas específicas están en `.cursor/rules/`. Consulta las skills de `.cursor/skills/` solo cuando sean pertinentes a una tarea grande, especializada o de riesgo, o el usuario las invoque. Prefiere la copia local sobre una copia global equivalente; no cargues todo el catálogo.

Graphify está preparado mediante `.graphifyignore`, pero solo es utilizable cuando existe `graphify-out/graph.json`. Consúltalo para exploración amplia o cambios transversales; usa búsqueda directa para cambios locales. Si falta el grafo o está desactualizado, inspecciona el código sin bloquear la tarea. Nunca uses el grafo de otro repositorio.
