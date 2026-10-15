# Cómo funciona el compilador Tiny (código base) y qué cambió con Tiny++

Este documento explica, paso a paso, qué hace cada parte del compilador y cómo se maneja la memoria en todo el pipeline: desde que lees un `.tny` hasta que corre en la Tiny Machine (TM).

**Estado:** describe el diseño **original** de Tiny (el punto de partida), que sigue siendo la base conceptual de todo — el modelo de memoria de la TM, el AST con `HermanoDerecha`, el pipeline general, no cambiaron. Donde el Módulo 1 (Tiny++) reemplazó o extendió algo, lo marco con una nota **"🔁 Actualizado en Tiny++"** y un enlace a [`02-modulo1-tinyplus-paso-a-paso.md`](02-modulo1-tinyplus-paso-a-paso.md), que tiene el detalle completo de cada cambio. Si una sección no tiene esa nota, el comportamiento que describe sigue siendo exactamente así en el código actual (por ejemplo, `Generador.java` no se ha tocado todavía — eso es trabajo del Módulo 2).

Ubicación del código base: `proyecto/Compiladores_Tiny_Generacion_2022_3 en 2026/.../Compiladores_Tiny_Generacion_2022_1/src/`

## 1. Visión general del pipeline

```
código .tny
   │
   ▼
Lexico.java (generado desde lexico.flex con JFlex)   → convierte texto en tokens
   │
   ▼
parser.java (generado desde sintactico.cup con CUP)  → convierte tokens en un AST
   │
   ▼
TablaSimbolos.java                                   → recorre el AST, asigna direcciones de memoria a cada variable
   │
   ▼
Generador.java + UtGen.java                          → recorre el AST otra vez, emite instrucciones ensamblador TM
   │
   ▼
archivo .tm (texto plano con instrucciones)
   │
   ▼
TMSimulator (ide/js/tm-simulator.js)                 → ejecuta las instrucciones, instrucción por instrucción
```

Cada etapa recibe la salida de la anterior. El `parser.java` y `Lexico.java` que ves en el repo **no se escriben a mano** — se generan ejecutando JFlex sobre `lexico.flex` y CUP sobre `sintactico.cup`. Los archivos que tú vas a tocar son `lexico.flex` y `sintactico.cup` (las especificaciones), no los `.java` generados.

---

## 2. Análisis léxico (`lexico.flex` → `Lexico.java`)

`lexico.flex` es la especificación del analizador léxico. Define patrones con expresiones regulares y qué token devolver por cada uno:

```
digito        = [0-9]
numero        = {digito}+
letra         = [a-zA-Z]
identificador = {letra}+
```

Por cada patrón que coincide en el texto fuente, el lexer imprime un mensaje de depuración (`System.out.println("token IF")`, etc.) y devuelve un `Symbol` con `sf.newSymbol(nombre, codigo[, valor])`. El `codigo` viene de la clase `sym.java` (generada también, es una tabla de constantes enteras: `IF=2`, `NUM=16`, etc. — una por cada terminal).

Puntos clave sobre cómo agregar tokens nuevos (esto es justo lo que se usó para los tokens de Tiny++):
- Las palabras reservadas van **antes** que la regla de `identificador`, porque JFlex prioriza la regla que coincide con la cadena más larga, y si hay igualdad de longitud, gana la que aparece primero en el archivo. Por eso `"if"` matchea como `IF` y no como un `ID` de nombre "if".
- Los tokens con valor (como `NUM`, `ID`, y lo que será `STRING_LITERAL`) pasan el lexema como tercer argumento de `sf.newSymbol(...)`, y ese valor es lo que luego se recibe en la gramática como `variable` o `valor` en las reglas de CUP.
- Los comentarios `{ ... }` se descartan con una regla que no devuelve ningún token (`{"{"[^}]+"}"  { /* no hace nada */ }`).
- Los espacios y saltos de línea tampoco generan tokens; solo `{nuevalinea}` incrementa un contador interno `lineanum` (que hoy no se usa para nada, es un TODO pendiente de conectar con los mensajes de error).

El lexer **no usa memoria de datos del programa compilado** — es puramente sintáctico, transforma texto en una secuencia de tokens que el parser consume uno a uno (pidiendo el siguiente con `yylex()`, llamado internamente por CUP).

> 🔁 **Actualizado en Tiny++:** se agregaron los tokens `INT, BOOL, STRING_T, TRUE, FALSE, PROCEDURE, FUNCTION, RETURN, LBRACKET, RBRACKET, COMMA, COLON, STRING_LITERAL` siguiendo exactamente este patrón. Detalle completo: [doc 02, sección 1](02-modulo1-tinyplus-paso-a-paso.md#1-lexer-lexicoflex).

---

## 3. Análisis sintáctico y construcción del AST (`sintactico.cup` → `parser.java`)

`sintactico.cup` tiene tres partes:

1. **Terminales y no-terminales**: declara los tokens que vienen del lexer (`terminal IF, THEN, ...`) y los símbolos intermedios de la gramática (`non terminal NodoBase stmt`, etc.). Nota que casi todos los no-terminales tienen tipo `NodoBase` — cada regla gramatical, al reducirse, **construye un nodo del AST** y lo devuelve en `RESULT`.

2. **Precedencia**: `precedence left PLUS; precedence left MINUS; precedence left TIMES;` resuelve ambigüedades de asociatividad en expresiones aritméticas.

3. **Reglas**: cada regla tiene una acción semántica en `{: ... :}` que se ejecuta cuando CUP reduce esa producción. Por ejemplo:

```cup
assign_stmt ::= ID:variable ASSIGN exp:ex
    {: RESULT = new NodoAsignacion(variable.toString(), ex); :}
```

Aquí `variable` y `ex` son los valores semánticos de los símbolos ya reducidos (el lexema del ID, y el `NodoBase` devuelto por la regla `exp`). El resultado es un nuevo nodo `NodoAsignacion` que queda disponible para la regla que contiene a `assign_stmt`.

### Cómo se encadenan las sentencias (esto es importante y no es obvio)

Tiny no usa listas (`ArrayList`) para las secuencias de sentencias. Usa un **enlace de hermanos** (`HermanoDerecha`) definido en `NodoBase`:

```java
private NodoBase HermanoDerecha;
public boolean TieneHermano() { return (HermanoDerecha != null); }
```

La regla `stmt_seq ::= stmt_seq:ini SEMI stmt:sent` busca el último nodo de la cadena (`ini`) recorriendo `getHermanoDerecha()` hasta el final, y le cuelga `sent` como su hermano derecho. Es una lista enlazada simple implementada directamente sobre los nodos del AST, en vez de una lista aparte. Cuando extiendas el AST (por ejemplo para llevar una lista de parámetros de una función), puedes reutilizar este mismo patrón o usar `List<NodoBase>` — pero ten en cuenta que **todo el resto del código base (impresión del AST, tabla de símbolos, generador) recorre los nodos asumiendo este encadenamiento**, así que si lo cambias en una parte tienes que actualizarlo en todas.

### Jerarquía de nodos del AST

```
NodoBase (clase raíz, solo tiene el puntero HermanoDerecha)
 ├─ NodoIf            (prueba, parteThen, parteElse?)
 ├─ NodoRepeat         (cuerpo, prueba)
 ├─ NodoAsignacion     (identificador: String, expresion)
 ├─ NodoLeer           (identificador: String)
 ├─ NodoEscribir       (expresion)
 ├─ NodoOperacion      (opIzquierdo, operacion: tipoOp, opDerecho)
 ├─ NodoValor          (valor: Integer)        — literal numérico
 └─ NodoIdentificador  (nombre: String)        — uso de una variable en una expresión
```

`tipoOp` es un enum (`menor, igual, mas, menos, por, entre`) que representa el operador de un `NodoOperacion`. En este diseño original no hay nodos de tipo (no existen `int`/`bool`/`string` como concepto en el AST).

El parser no usa memoria "del programa compilado" tampoco; solo construye objetos Java (el AST) en el heap de la JVM que ejecuta el compilador. Memoria de la TM todavía no entra en juego aquí.

> 🔁 **Actualizado en Tiny++:** se agregó el enum `TipoDato` (`INT, BOOL, STRING`) y ocho nodos nuevos que sí cargan información de tipo: `NodoDeclaracion`, `NodoArreglo`, `NodoFuncion`, `NodoLlamada`, `NodoReturn`, `NodoCadena`, `NodoBooleano`, y una extensión de `NodoAsignacion` para soportar `A[i] := expr`. Todos siguen usando el mismo encadenamiento por `HermanoDerecha` que se explica arriba — ningún nodo nuevo rompe ese patrón. Detalle completo: [doc 02, secciones 2 y 3](02-modulo1-tinyplus-paso-a-paso.md#2-gramática-sintacticocup).

---

## 4. Tabla de símbolos (`TablaSimbolos.java`) — diseño original, ya reemplazado en Tiny++

> 🔁 **Esta sección entera describe el diseño ORIGINAL**, que ya no es el que corre en el código actual — se dejó aquí porque entender sus limitaciones es lo que explica por qué el rediseño de Tiny++ (más abajo) es como es. El diseño real y vigente está en [doc 02, sección 4](02-modulo1-tinyplus-paso-a-paso.md#4-tabla-de-símbolos-tablasimbolosjava--registrosimbolojava).

```java
private HashMap<String, RegistroSimbolo> tabla;
private int direccion;  // contador de direcciones de memoria ya asignadas
```

`cargarTabla(raiz)` recorre el AST completo (recursivamente, siguiendo los hijos de cada tipo de nodo y la cadena de hermanos) y, **cada vez que encuentra un `NodoIdentificador`**, llama a `InsertarSimbolo(nombre, -1)`.

```java
public boolean InsertarSimbolo(String identificador, int numLinea){
    if(tabla.containsKey(identificador)) return false;  // ya existe, no se reinserta
    RegistroSimbolo simbolo = new RegistroSimbolo(identificador, numLinea, direccion++);
    tabla.put(identificador, simbolo);
    return true;
}
```

Esto es clave: **la dirección de memoria de cada variable es simplemente el orden en que aparece por primera vez en el AST** (0, 1, 2, ...). No hay distinción entre variable usada y variable declarada (Tiny original no tiene declaraciones — por eso en Tiny++ vas a tener que cambiar esto por completo: necesitas que la dirección se asigne en la declaración, no en el primer uso, y que usar una variable no declarada sea un error).

`RegistroSimbolo` guarda: `identificador`, `NumLinea` (hoy siempre -1, es un TODO sin terminar), y `DireccionMemoria`. Es un registro plano, sin tipo, sin scope, sin tamaño de arreglo — todo eso lo vas a agregar tú.

`getDireccion(clave)` es el método que usará el `Generador` para saber en qué celda de memoria (offset desde `GP`) leer o escribir el valor de una variable.

**Lo que tenía que cambiar** (y ya se hizo): esta tabla era un único `HashMap` global, sin pila de ámbitos, e insertaba al primer *uso* de un identificador en vez de en su declaración. El rediseño real (`Deque<Ambito>` con `entrarAmbito()`/`salirAmbito()`, inserción solo en `NodoDeclaracion`/`NodoFuncion`, y un `RegistroSimbolo` con tipo/arreglo/nivel/función) está documentado paso a paso en [doc 02, sección 4](02-modulo1-tinyplus-paso-a-paso.md#4-tabla-de-símbolos-tablasimbolosjava--registrosimbolojava), junto con el contrato de métodos (`getDireccion`, `esGlobal`, `getTipo`, `getTamanoArreglo`) que `Generador.java` va a consumir.

También se agregó `Semantico.java` (clase nueva, no existía en el diseño original), que usa esta tabla para validar tipos y uso de identificadores — ver [doc 02, sección 5](02-modulo1-tinyplus-paso-a-paso.md#5-verificador-semántico-semanticojava-clase-nueva).

---

## 5. Generación de código (`Generador.java` + `UtGen.java`) — el modelo de memoria de la TM

> ℹ️ **Sin cambios todavía:** `Generador.java` sigue exactamente como se describe aquí — no reconoce los nodos nuevos de Tiny++ (`NodoDeclaracion`, `NodoFuncion`, `NodoArreglo`, etc.) y marca `BUG: tipo de nodo a generar desconocido` cuando los encuentra. Es trabajo del Módulo 2 (Ismael); `TablaSimbolos` ya expone el contrato que necesita (ver sección 4 y doc 02 §4.3).

Este es el núcleo de "cómo se maneja la memoria" en este proyecto. La Tiny Machine es una máquina virtual con:

- **8 registros** (`reg[0..7]`), de los cuales algunos tienen un rol fijo por convención:
  - `AC = reg[0]`: acumulador principal (resultado de operaciones).
  - `AC1 = reg[1]`: acumulador secundario (usado como operando temporal).
  - `GP = reg[5]`: *global pointer*, apunta a la base de la zona de variables globales.
  - `MP = reg[6]`: *memory pointer*, apunta al tope de la memoria, usado como base para temporales.
  - `PC = reg[7]`: *program counter*, dirección de la instrucción actual.
- **Memoria de datos (`dMem`)**: un arreglo de 1024 enteros. No hay distinción de tipos a nivel de máquina — todo es un entero de 32 bits.
- **Memoria de instrucciones (`iMem`)**: 1024 instrucciones, separada de `dMem` (arquitectura Harvard simplificada).

### Layout de memoria (comentario original de `Generador.java`)

```
|t1  | <- mp (dirección máxima de memoria de la TM, dMem[1023])
|t1  | <- desplazamientoTmp (tope actual de la pila de temporales)
|free|
|...  |
|x   |
|y   | <- gp (dirección 0, crece hacia arriba)
```

Hay **dos zonas que crecen en direcciones opuestas dentro del mismo arreglo `dMem`**:
- Las variables globales (`x`, `y`, ...) ocupan direcciones **bajas**, crecientes desde `GP=0` hacia arriba, una por cada entrada en `TablaSimbolos` (dirección = el contador `direccion` de la tabla).
- Los valores temporales de las subexpresiones (`t1`, `t2`, ...) ocupan direcciones **altas**, decrecientes desde `MP` (que al arrancar se carga con `dMem[0]`, inicializado en 1023 — ver preludio más abajo) hacia abajo. Esto es efectivamente **una pila** para evaluar expresiones con operandos anidados.

### El "contador" de temporales (`desplazamientoTmp`)

```java
private static int desplazamientoTmp = 0;
```

Esto funciona como el puntero de tope de una pila, pero sin pila real: es solo un contador compartido estático. En `generarOperacion` (evaluación de `a + b`, `a * b`, etc.):

1. Genera código para el operando izquierdo → el resultado queda en `AC`.
2. `ST AC, desplazamientoTmp--, MP` → "empuja" ese valor: lo guarda en `dMem[MP + desplazamientoTmp]` y decrementa el contador (próxima posición libre, más abajo en memoria).
3. Genera código para el operando derecho → el resultado queda en `AC` (pisando el valor anterior, por eso hubo que guardarlo en el paso 2).
4. `LD AC1, ++desplazamientoTmp, MP` → "hace pop": incrementa el contador de vuelta y carga el valor guardado en `AC1`.
5. Aplica la operación (`ADD`, `SUB`, `MUL`, `DIV`, o una secuencia de `SUB`+salto condicional para `<` y `=`) entre `AC` y `AC1`, dejando el resultado en `AC`.

Esto es exactamente una pila de evaluación de expresiones push/pop, implementada manualmente con aritmética de direcciones en vez de una estructura de datos. Si una expresión tiene operandos anidados (`(a+b)*(c-d)`), el contador baja y sube varias veces, anidando correctamente porque cada nivel de recursión usa su propia posición antes de restaurarla.

### Direcciones de variables (`generarAsignacion`, `generarIdentificador`, `generarLeer`)

Siempre usan `tablaSimbolos.getDireccion(nombre)` como **desplazamiento relativo a `GP`**:

```java
UtGen.emitirRM("ST", AC, direccion, GP, "...");  // dMem[GP + direccion] = AC
UtGen.emitirRM("LD", AC, direccion, GP, "...");  // AC = dMem[GP + direccion]
```

Como `GP` vale 0 durante toda la ejecución (no cambia nunca en este compilador base — no hay funciones ni marcos de activación), esto es equivalente a `dMem[direccion]`. Cuando implementes funciones en Tiny++, vas a necesitar que `GP` siga siendo la base de las globales pero que las variables **locales** se direccionen relativas a un nuevo puntero de marco de activación (ver la guía metodológica, Contrato 2: "la pila de ejecución usa MP, decreciendo desde 1023").

### `UtGen.java`: el ensamblador de salida

No calcula nada de la máquina — solo **imprime texto** en el formato `loc: OPCODE r,d(s) * comentario` (o `r,s,t` para instrucciones RR), y lleva la cuenta de en qué línea (`instruccionActual`) va escribiendo. Tiene tres tipos de emisión:

- `emitirRO(op, r, s, t, c)`: instrucciones registro-registro (`ADD`, `SUB`, `MUL`, `DIV`, `IN`, `OUT`, `HALT`).
- `emitirRM(op, r, d, s, c)`: instrucciones registro-memoria con desplazamiento+registro base (`LD`, `ST`).
- `emitirRM_Abs(op, r, a, c)`: igual que RM pero convierte una dirección absoluta `a` en un desplazamiento relativo al PC (`a - (instruccionActual+1)`), usado para saltos.

El mecanismo de **saltos hacia adelante** (`if`, por ejemplo, donde no sabes todavía a qué línea saltar porque el `then`/`else` no se ha generado) usa `emitirSalto(n)` para reservar `n` líneas vacías sin escribir nada todavía, y luego `cargarRespaldo(direccion)` / `restaurarRespaldo()` para "retroceder" el cursor de emisión, escribir la instrucción de salto que faltaba, y volver a la posición más adelantada. Es básicamente un parche de direcciones en dos pasadas simuladas con un solo cursor.

### Preludio estándar

Antes de generar el código del programa, `generarPreludioEstandar()` emite:

```
LD  MP, 0(AC)   ; MP = dMem[0]   (que vale 1023, la dirección máxima)
ST  AC, 0(AC)   ; dMem[0] = AC   (limpia esa celda para que no quede como variable "fantasma")
```

Esto es lo que inicializa `MP` al tope real de memoria antes de empezar a usar la pila de temporales.

---

## 6. Ejecución: la Tiny Machine (`ide/js/tm-simulator.js`)

El archivo `.tm` generado es texto plano. `TMSimulator.loadProgram(texto)` lo parsea línea por línea (`loc: OPCODE args * comentario`) y llena `iMem` (1024 slots, casilleros sin instrucción se llenan con `HALT` por defecto).

Estado de la máquina (clase `TMSimulator`):
- `dMem`: array de 1024 enteros, inicializado a 0 excepto `dMem[0] = 1023` (la dirección máxima, la que el preludio carga en `MP`).
- `reg`: array de 8 enteros (todos en 0 al reset). `PC=7, MP=6, GP=5, AC=0, AC1=1`.
- `iMem`: 1024 instrucciones decodificadas (`{iop, opcode, cls, a1, a2, a3, ...}`).

`step()` ejecuta **una sola instrucción**:
1. Lee `inst = iMem[PC]`.
2. **Incrementa el PC antes de ejecutar** (así los saltos relativos al PC, calculados por `emitirRM_Abs`, funcionan: la base para el desplazamiento ya es "la siguiente instrucción").
3. Según la clase de instrucción:
   - `RR` (registro-registro): opera directo sobre `reg[s]` y `reg[t]`.
   - `RM`/`RA`: calcula `m = desplazamiento + reg[registroBase]` — esta es la dirección efectiva de memoria o de salto.
4. Ejecuta el opcode con un `switch`: `LD`/`ST` leen/escriben `dMem[m]`; `LDA` carga la dirección `m` calculada (no el contenido); `LDC` carga una constante literal; `JLT/JLE/JGT/JGE/JEQ/JNE` comparan `reg[r]` contra 0 y si se cumple, saltan (`reg[PC] = m`); `IN`/`OUT` hacen entrada/salida; `HALT` detiene la máquina.
5. Valida límites: acceso a `dMem` fuera de `[0, 1024)` da `DMEM_ERR`; `PC` fuera de rango da `IMEM_ERR`; división por cero da `ZERO_DIV`.

Es exactamente la semántica formal de Louden para la TM, implementada instrucción por instrucción, con eventos (`emit('step', ...)`, `emit('output', ...)`, etc.) para que el depurador visual (Módulo 3/4) pueda reaccionar en cada paso.

---

## 7. Estado del Módulo 1: qué de esto ya está hecho

Lo que esta sección describía como "lo que vas a tener que cambiar" ya se implementó. Resumen de estado — para el detalle completo de cada pieza, ver [doc 02](02-modulo1-tinyplus-paso-a-paso.md):

- **Lexer** ✅ hecho — nuevos tokens: palabras reservadas de tipo, `true`/`false`, `procedure`/`function`/`return`, corchetes, coma, dos puntos, literales de string.
- **Parser** ✅ hecho — `program` ahora es `decl_list stmt_seq`; nodos nuevos `NodoDeclaracion`, `NodoArreglo`, `NodoFuncion`, `NodoLlamada`, `NodoReturn`, `NodoCadena`, `NodoBooleano`, reutilizando el encadenamiento por `HermanoDerecha` para parámetros y argumentos. Gramática validada con CUP real: 0 conflictos LALR. Dos limitaciones conocidas y documentadas: las funciones no admiten variables locales propias (solo parámetros), y no hay sintaxis para invocar un `procedure` como sentencia suelta.
- **Tabla de símbolos** ✅ hecho — pila de ámbitos (`entrarAmbito`/`salirAmbito`/`buscar`), inserción solo en la declaración (no en el primer uso), redeclaración en el mismo ámbito como error real, y el contrato completo para el Generador (`getDireccion`, `esGlobal`, `getTipo`, `getTamanoArreglo`).
- **Verificador semántico** ✅ hecho — `Semantico.java` (clase nueva), con chequeo de tipos en asignaciones, aritmética, comparaciones, condiciones y llamadas a función.
- **Generador** ⏳ pendiente, no es tu módulo — sigue usando el mismo modelo de memoria (`GP` para globales, `MP` + pila de temporales para subexpresiones) descrito en la sección 5, pero todavía no reconoce ninguno de los nodos nuevos. Ismael (Módulo 2) va a consumir el contrato de `TablaSimbolos` para calcular offsets de `A[i]` y marcos de activación de funciones (variables locales relativas a un nuevo puntero de pila, no a `GP`).
