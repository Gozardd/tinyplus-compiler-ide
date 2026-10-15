# Módulo 2 (Tiny++): Generador de Código Objeto para la Tiny Machine (TM)

**Autor responsable:** Ismael Hidalgo (V-31.470.047)  
**Asignatura:** Compiladores e Intérpretes — UNET (Semestre 2026-1 Intensivo)  
**Arquitectura de destino:** Kenneth C. Louden *Tiny Machine* (TM)  
**Ruta del código fuente:** `proyecto/Compiladores_Tiny_Generacion_2022_3 en 2026/.../Compiladores_Tiny_Generacion_2022_1/src/ve/edu/unet/`

---

## 1. Visión General del Módulo 2

El Módulo 2 es el **Backend (Fase de Síntesis)** del compilador Tiny++. Su responsabilidad fundamental es transformar el Árbol de Sintaxis Abstracta (AST) decorado y validado por el Módulo 1 en un programa ejecutable en lenguaje ensamblador para la máquina virtual hipotética **Tiny Machine (TM)** diseñada por Kenneth C. Louden en *Compiler Construction: Principles and Practice* (1997).

En el compilador original de la UNET, el generador solo soportaba números enteros positivos, variables escalares globales, operaciones aritméticas básicas (`+`, `-`, `*`, `/`), comparación menor/igual (`<`, `=`), y estructuras de control `if-then-else` y `repeat-until`.

Para **Tiny++**, el Módulo 2 extendió la arquitectura para soportar completamente:
1. **Constantes booleanas (`true`, `false`)** y saltos condicionales limpios sin mensajes espurios de error.
2. **Arreglos unidimensionales** con cálculo en tiempo de corrida de dirección efectiva (`base + index + GP`) tanto para lectura en expresiones como para asignación en LHS.
3. **Cadenas de caracteres (strings)** almacenadas secuencialmente en memoria de datos (`dMem`) con terminador nulo `0`, emitidas en el preludio del programa y leídas/impresas carácter a carácter en la sentencia `write`.
4. **Funciones y Procedimientos con Marcos de Activación (Stack Frames)**, resolución de parámetros formales por valor, variables locales/temporales aisladas, soporte para recursión directa y mutua, y resolución de llamadas hacia adelante (*forward calls*) mediante retroparcheo (*backpatching*).
5. **Simulador de la Máquina Tiny en Java (`TMSimulador.java`)**, herramienta portátil y autónoma que reproduce el comportamiento de `tiny64.exe` sin depender de ejecutables nativos ni de emuladores externos.

---

## 2. Arquitectura de la Tiny Machine (TM) y Uso de Registros

La TM dispone de una memoria de código (`iMem`) de 1024 instrucciones, una memoria de datos (`dMem`) de 1024 palabras, y 8 registros de propósito específico:

| Registro | Mnemónico en `UtGen` | Función en Tiny++ |
|---|---|---|
| `reg[0]` | `AC` (Acumulador 0) | Acumulador principal de expresiones, retorno de funciones y paso de direcciones base |
| `reg[1]` | `AC1` (Acumulador 1) | Segundo acumulador para operaciones binarias y extracción de caracteres en strings |
| `reg[2]` | *Scratch / Temp* | Registro temporal para cálculo de direcciones efectivas de arreglos y dirección de retorno en llamadas |
| `reg[3]` | *Libre* | Reservado para extensiones futuras del compilador |
| `reg[4]` | *Libre* | Reservado para extensiones futuras del compilador |
| `reg[5]` | `GP` (*Global Pointer*) | Puntero a variables globales y literales estáticos (fijo en la dirección `0`) |
| `reg[6]` | `MP` (*Memory Pointer*) | Puntero de pila / marco de activación actual (inicia en la dirección máxima `1023`) |
| `reg[7]` | `PC` (*Program Counter*) | Contador de programa (apunta a la instrucción actual; se incrementa antes de ejecutar) |

### 2.1 Disposición de la Memoria de Datos (`dMem`)

```
Dirección       Contenido
--------------------------------------------------------------------------------
dMem[0]         1023 (Tope de pila inicial, configurado por preludio Louden)
dMem[1..N-1]    Variables globales y arreglos declarados en el ámbito raíz
dMem[N..M-1]    Literales string estáticos (secuencias ASCII + byte 0 terminador)
...             Memoria libre (crecimiento dinámico de la pila hacia abajo)
dMem[MP - 2]    Temporales locales de la función activa (t1, t2...)
dMem[MP - 1]    Dirección de retorno (PC del llamador)
dMem[MP + 0]    Enlace dinámico (Old MP del llamador)
dMem[MP + 1]    Último parámetro formal p_K
...             ...
dMem[MP + K]    Primer parámetro formal p_1
--------------------------------------------------------------------------------
dMem[1023]      Marco de activación inicial del programa principal
```

---

## 3. Implementación Detallada por Componentes

### 3.1 Soporte de Booleanos y Direccionamiento Condicional GP vs MP

1. **Constante Booleana (`NodoBooleano`):** Se emite `LDC AC, 1(0)` para `true` y `LDC AC, 0(0)` para `false`.
2. **Declaraciones (`NodoDeclaracion`):** En el compilador original causaban un `BUG: Tipo de nodo a generar desconocido`. En Tiny++, las declaraciones solo reservan espacio en la tabla de símbolos y no emiten instrucciones ejecutables.
3. **Resolución de Variables (`emitirCargaVar` / `emitirGuardaVar`):** Antes de consultar la tabla global (`GP`), el generador verifica si el identificador pertenece al mapa `paramsActuales`. Si coincide, emite acceso relativo a `MP` con offset positivo; si no, emite acceso relativo a `GP`.

### 3.2 Arreglos Unidimensionales y Dirección Efectiva

En Tiny++, los arreglos se declaran como `type_spec ID[NUM];`. La tabla de símbolos reserva `tamanoArreglo` localidades consecutivas a partir de `dirBase`.

#### A. Lectura de Arreglo (`NodoArreglo` en expresiones):
1. Se evalúa la expresión del índice (`n.getIndice()`). El resultado entero queda en `AC` (`reg[0]`).
2. Se suma el `GP` al índice en el registro 2: `ADD 2, AC, GP`.
3. Se carga el valor en `AC` con direccionamiento indirecto indexado: `LD AC, dirBase(2)`. En la TM, la dirección resultante es `dirBase + reg[2] = dirBase + index + GP`.

#### B. Asignación a Arreglo (`NodoAsignacion` con `n.esArreglo() == true`):
Para evitar que la evaluación del índice sobreescriba el valor a asignar:
1. Se evalúa la expresión derecha (RHS) → queda en `AC`.
2. Se salva el valor en la pila temporal: `ST AC, desplazamientoTmp--, MP`.
3. Se evalúa la expresión del índice → queda en `AC`.
4. Se calcula el desplazamiento efectivo: `ADD 2, AC, GP`.
5. Se recupera el valor RHS a `AC`: `LD AC, ++desplazamientoTmp, MP`.
6. Se almacena en la celda del arreglo: `ST AC, dirBase(2)`.

### 3.3 Literales String en `dMem` y Sentencia `write`

1. **Pre-pasada de recolección:** Antes de emitir el preludio estándar, el generador recorre el AST completo (`recolectarCadenas`) identificando cada `NodoCadena`. A cada texto único se le asigna una dirección contigua a partir de `tablaSimbolos.getTamanoGlobal()`.
2. **Inicialización en el Preludio:** En el arranque de la TM, se emite una secuencia de instrucciones `LDC` y `ST` para almacenar los códigos ASCII de cada carácter en `dMem`, seguidos por un terminador `0`.
3. **Evaluación de `NodoCadena`:** Emite `LDC AC, dir(0)`, cargando la dirección inicial de la cadena en `AC`.
4. **Bucle de Salida en `write`:** Cuando `inferirTipo(n.getExpresion()) == TipoDato.STRING`, se emite un bucle de 5 instrucciones en ensamblador TM:
   ```asm
   * escribir cadena: bucle caracter a caracter
   LD   1, 0(0)       * cargar char actual dMem[reg[0]] en AC1
   JEQ  1, 3(7)       * si char == 0 saltar al final del bucle (PC + 1 + 3)
   OUT  1, 0, 0       * imprimir caracter ASCII
   LDA  0, 1(0)       * avanzar puntero p = p + 1
   LDA  7, -5(7)      * saltar al inicio del bucle (PC + 1 - 5)
   * escribir cadena: fin del bucle
   ```

### 3.4 Funciones, Marcos de Pila y Recursión

#### A. Estructura Bifásica en `generarCodigoObjeto`:
1. **Preludio:** Configuración de `MP = dMem[0]` y carga de cadenas.
2. **Salto Inicial:** Se emite `saltoMain = emitirSalto(1)` para saltar sobre las definiciones de funciones y no ejecutarlas linealmente.
3. **Fase A (Compilación de Subrutinas):** Se recorren los nodos de la raíz que sean `NodoFuncion` y se emite su código.
4. **Retroparcheo:** Se resuelven las llamadas hacia adelante pendientes y se parchea `saltoMain` para saltar a la primera instrucción del `main`.
5. **Fase B (Programa Principal):** Se recorren las sentencias ejecutables de la raíz.
6. **Fin:** Se emite `HALT 0,0,0`.

#### B. Protocolo del Llamador (*Caller Protocol*) en `generarLlamada`:
Dados $K$ argumentos y `d0 = desplazamientoTmp`:
1. Por cada argumento $i = 1 \ldots K$, se evalúa la expresión y se apila: `ST AC, desplazamientoTmp--, MP`.
2. Se salva el enlace dinámico (*Old MP*): `ST MP, (d0 - K)(MP)`.
3. Se calcula y almacena la dirección de retorno:
   - `LDA 2, 3(PC)` (apunta a la instrucción de retorno tras el salto).
   - `ST 2, (d0 - K - 1)(MP)`.
4. Se activa el nuevo marco: `LDA MP, (d0 - K)(MP)`.
5. Se salta a la función: `LDA PC, target(PC)`.
6. Al retornar, se restaura `desplazamientoTmp = d0`. El valor de retorno queda en `AC`.

#### C. Protocolo del Callee (*Callee Protocol*) en `generarFuncion`:
1. Se registra el `entryPC` en `direccionesFunciones`.
2. Se calcula el mapeo de parámetros formales: para cada parámetro $i$ (con $i \in [0, K-1]$), su offset relativo al nuevo `MP` es `offset = K - i`.
3. Se aísla el tope de temporales locales: `desplazamientoTmp = -2`.
4. Se genera el cuerpo de la función.
5. Se emite el epílogo incondicional:
   ```asm
   LD  2, -1(6)       * reg[2] = direccion de retorno desde MP-1
   LD  6,  0(6)       * restaurar Old MP desde MP+0
   LDA 7,  0(2)       * saltar a direccion de retorno reg[2]
   ```
6. En `NodoReturn`: se evalúa la expresión de retorno en `AC` y se ejecutan estas mismas 3 instrucciones.

---

## 4. Simulador TM en Java (`TMSimulador.java`)

Para evitar problemas de compatibilidad con binarios nativos de 32 o 64 bits en Windows/Linux/Mac, se implementó `TMSimulador.java`, un emulador estricto de la máquina virtual de Kenneth Louden que:
- Carga archivos `.tm` e ignora comentarios iniciados por `*`.
- Interpreta todas las instrucciones de clase RR (`HALT`, `IN`, `OUT`, `ADD`, `SUB`, `MUL`, `DIV`), RM (`LD`, `ST`) y RA (`LDA`, `LDC`, `JLT`, `JLE`, `JGT`, `JGE`, `JEQ`, `JNE`).
- Formatea la salida de `OUT` indicando tanto el valor numérico como el carácter ASCII imprimible (ej. `SALIDA: 65 ('A')`).
- Puede ejecutarse por línea de comandos: `java -cp bin ve.edu.unet.TMSimulador archivo.tm`.

---

## 5. Batería Oficial de Pruebas y Resultados de Ejecución

Todos los casos de prueba están ubicados en `test/pruebas_modulo2/` y son ejecutables mediante el script `test/ejecutar_pruebas.ps1`:

| Caso de Prueba | Funcionalidad Evaluada | Salida Esperada en TM | Estado |
|---|---|---|---|
| `01_expresiones_enteras.tny` | Operaciones aritméticas enteras `+`, `-`, `*`, `/`, precedencia y asignación | `11` | **APROBADA** (28 instr) |
| `02_booleanos_y_control.tny` | Literales booleanos `true`/`false`, `if-then-else`, ciclo `repeat-until` | `15` | **APROBADA** (119 instr) |
| `03_arreglos_unidimensionales.tny` | Arreglos unidimensionales, cálculo de dirección efectiva `base + i + GP`, lecturas/escrituras indexadas | `3`, `9`, `15`, `18` | **APROBADA** (172 instr) |
| `04_strings_en_memoria.tny` | Strings literales y variables en `dMem`, bucle de impresión de caracteres ASCII en `write` | "Compiladores", " ", "Exito", `2026` | **APROBADA** (151 instr) |
| `05_funciones_recursion.tny` | Funciones recursivas (`potencia`), múltiples argumentos formales (`sumaTres`), marcos de pila y retornos | `32`, `60` | **APROBADA** (199 instr) |
| `06_programa_completo_tinyplus.tny` | Integración total: arreglos, llamadas a funciones en expresiones, procedimientos como sentencias, control y strings | "SumaCuadrados: ", `30` | **APROBADA** (336 instr) |

---

## 6. Conclusión y Estado de Entrega

El Módulo 2 cumple con el 100% de los requisitos estipulados para la síntesis de código objeto en Tiny++. Todos los casos de prueba pasan satisfactoriamente tanto en el compilador como en el simulador TM, respetando el contrato de datos con el Módulo 1 (Frontend) y dejando las bases listas para su integración con el Módulo 3 (Santiago - Web/API) y el Módulo 4 (Henyer - IDE/Visualización).
