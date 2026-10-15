# CONTEXTO Y AUDITORÍA — MÓDULO 2 (BACKEND TM), Tiny++ UNET
**Responsable:** Ismael Hidalgo · **Rama:** `feat/module-2` (= commit `d0968f9` de Theryan) · **Plan auditado:** `PLAN_ACCION_MODULO2_ISMAEL.md` (v3)
**Dictamen:** el plan v3 es **correcto en diseño**, pero la implementación está **BLOQUEADA por el Paso 0** (el frontend no compila).

> [!WARNING]
> La versión anterior de este documento marcaba "20/20 PASS" sin haber ejecutado nada. Esta auditoría
> sí compiló el proyecto y pasó los programas de prueba por el parser real. Varias de aquellas "aprobaciones" eran falsas.

---

## 1. Mapa del repositorio (qué es vinculante)

Raíz Java: `proyecto/Compiladores_Tiny_Generacion_2022_3 en 2026/Compiladores_Tiny_Generacion_2022_3/Compiladores_Tiny_Generacion_2022_1/`
(no renombrar en esta rama: rompería el merge con las demás).

| Ruta (desde la raíz Java) | Origen | ¿Vinculante? | Nota |
| :--- | :--- | :---: | :--- |
| `src/especificacion/sintactico.cup`, `lexico.flex` | Theryan | **Sí** | Gramática real de Tiny++ |
| `src/ve/edu/unet/parser.java`, `sym.java`, `Lexico.java` | Tiny 2022 | **Desactualizados** | No se regeneraron desde el `.cup`/`.flex` → no compila (H1) |
| `src/ve/edu/unet/TablaSimbolos.java`, `Semantico.java`, `nodosAST/*` | Theryan | Sí | Contrato del AST |
| `src/ve/edu/unet/Generador.java`, `UtGen.java` | Base 2022 | Sí | Lo que Módulo 2 amplía |
| `src/especificacion/tiny64.exe`, `../../../tmsimv1.html` | Profesor | Sí | Jueces del `.tm` |
| `ejemplo_fuente/*.tny` | Profesor 2022 | No | Tiny sin tipos; fallan en Tiny++ |
| `ide/js/tm-simulator.js` (raíz del repo) | Santiago | Sí (formato TM) | Emulador fiel a Louden |
| `ide/js/examples.js`, `validator.js`, `tm-presets.js` | Henyer | **No** | Maquetas (`while`, `begin`, `int a, b;`): no compilan con CUP. El botón "Compilar" carga `.tm` prefabricados |

---

## 2. Método de la auditoría

1. Se compiló el árbol Java tal como está en la rama → **falla** (`parser.java:214: ts.ImprimirClaves()` no existe).
2. Se regeneraron `Lexico/parser/sym` con JFlex 1.8.2 y CUP 11b **en `out/gen`** (ignorado por git; `src/` intacto) → compila.
3. Se pasaron por el parser los programas del plan y casos límite. Resultados:

| Programa | Resultado |
| :--- | :--- |
| Paso 1 (bool/if), Paso 2 (arreglos), Paso 3 (strings) | Parsean y pasan el semántico ✔ |
| Paso 4 v2 con `end;` (duplicar, fact) | **Syntax error** ✘ |
| Paso 4 sin `;` tras `end` | Parsea ✔ |
| `p(5);` (procedimiento como sentencia) | **Syntax error** ✘ — no existe esa producción |
| Llamada a función declarada más abajo | Aceptada por el semántico ✔ → el Generador debe soportarla |
| Salida estándar del parser | Contiene trazas `token …`/`regla …` → redirigirla a `.tm` produce un archivo que `tiny64` rechaza (*Bad location*, ver `TM.C: readInstructions`) |
| `tiny64.exe` desde PowerShell | Imprime `usage` (no recibe el argumento). Desde `cmd`, en el sandbox no pudo abrir archivos nuevos → **pendiente de confirmar en local** |

4. Se revisaron a mano los desplazamientos TM (PC se incrementa antes de ejecutar) y la aritmética del marco.

---

## 3. Hallazgos

### Críticos (impiden que funcione)
| ID | Hallazgo | Dónde se corrige |
| :--- | :--- | :--- |
| H1 | Frontend no compila: `parser/sym/Lexico.java` son de 2022 | Paso 0 (Theryan, o commit `fix(modulo1)`) |
| H2 | Pruebas con `end;` tras función → error sintáctico | Plan v3: quitado el `;` |
| H3 | No hay sentencia de llamada: los procedimientos no se pueden invocar | Paso 0: producción `stmt ::= ID ( arg_list )` + ajuste en `Semantico` |
| H4 | `java … > x.tm` mezcla trazas con código → `.tm` inválido | Plan v3: filtro `^\s*\d+:|^\*` (o salida a archivo) |
| H5 | Convención de llamada v2 escribía `arg_i` en `tmp-i` sin decrementar → temporales y llamadas anidadas pisan argumentos | Plan v3 §4.5: apilar con `desplazamientoTmp--` |
| H6 | `generar()` sigue hermanos; los argumentos están enlazados como hermanos → `generar(arg1)` emite todos | Plan v3 Paso 1: `generarNodo` vs `generarSecuencia` |
| H7 | Bucle de strings: `JEQ 0,4(7)` salta una instrucción de más | Plan v3: `JEQ 0,3(7)` |

### Altos (fallarían en casos concretos)
| ID | Hallazgo | Corrección |
| :--- | :--- | :--- |
| H8 | Tras el semántico la tabla solo tiene el ámbito global: parámetros no resolubles; con sombreado `buscar()` devuelve la global | Mapa de parámetros propio del Generador (§4.2) |
| H9 | Llamadas hacia adelante y recursión mutua sin dirección conocida | Lista de pendientes + backpatching (§4.3) |
| H10 | El Generador no conoce tipos para decidir `write` de string | Helper `tipoDe()` (Paso 3) |
| H11 | `TablaSimbolos` no expone dónde terminan las globales | Getter `getTamanoGlobal()` (Paso 3) |
| H12 | `desplazamientoTmp` debe guardarse/restaurarse (−2 en funciones, 0 en main) | §4.4 y §4.1 |
| H13 | Cálculo de la dirección de retorno no estaba especificado | `LDA 2,3(7)` con las 4 instrucciones contiguas (§4.5) |

### Medios / documentación
- La respuesta de defensa sobre límites de arreglos era falsa (no hay verificación) → corregida.
- `tiny64` imprime ASCII como enteros → la salida esperada del Paso 3 es `72 79 76 65 79 75`.
- Para reportar a Theryan: `=` entre strings compara direcciones; el lexer no procesa escapes; `read` sobre una variable `string` no da error semántico.
- `.gitignore` contiene `plan_*.md`, y en Windows git ignora mayúsculas/minúsculas → `PLAN_ACCION_MODULO2_ISMAEL.md` **está ignorado**; este archivo no. Decidir si ambos se versionan.

---

## 4. Verificación del diseño final (v3)

- **Marco:** con `d0` = `desplazamientoTmp` antes de la llamada y `MP' = MP + d0 − K`, `arg_i` está en `MP + d0 − i + 1 = MP' + K − i + 1`; el enlace en `MP'+0` y el retorno en `MP'−1`. Los temporales del llamador (≥ `d0+1` relativos) quedan por encima del marco ✔.
- **Traza `n * fact(n-1)` dentro de `fact`:** `n` se apila en `d0` → la llamada usa `d0−1` como base → el marco nuevo queda debajo del temporal → al volver, el pop recupera `n` intacto ✔.
- **Bucle de strings:** `i2: JEQ 0,3(7)` → i6; `i5: LDA 7,-6(7)` → i0 ✔.
- **Arreglos:** `ADD 2,0,5` + `LD/ST 0,base(2)` ✔ (no se toca GP).
- **Preludio:** `LD 6,0(0)` toma 1023 de `dMem[0]` y `ST 0,0(0)` limpia la celda antes de usarla como global 0 ✔.

---

## 5. Qué debe revisar el siguiente auditor
1. Que el Paso 0 esté hecho y comiteado (compilar sin `out/gen`).
2. Ejecutar en local `tiny64` con el comando de `cmd` del plan y confirmar `100`, `42`, ASCII, `42`, `120`.
3. Revisar que `generarLlamada` decremente `desplazamientoTmp` por cada argumento y lo restaure.
4. Que ningún sitio que genere expresiones llame a la versión que sigue hermanos.
5. Que el caso de sombreado (`05_shadowing.tny`) lea el parámetro por `MP` y deje la global intacta.
