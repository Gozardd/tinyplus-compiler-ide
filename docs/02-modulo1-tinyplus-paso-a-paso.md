# Módulo 1 (Tiny++): qué se implementó, paso a paso

Este documento detalla los cambios hechos sobre el compilador base para llegar a Tiny++ (Módulo 1: Frontend y Verificador Semántico). Está pensado para que entiendas exactamente qué cambió en cada archivo y por qué, no solo que "ya funciona".

Todos los archivos están en: `proyecto/Compiladores_Tiny_Generacion_2022_3 en 2026/.../Compiladores_Tiny_Generacion_2022_1/src/`

Para el modelo general del pipeline (lexer → parser → AST → tabla de símbolos → generador → TM) y cómo se maneja la memoria, ver primero [`01-funcionamiento-compilador-base-tiny.md`](01-funcionamiento-compilador-base-tiny.md). Este documento asume que ya leíste eso.

---

## 1. Lexer (`lexico.flex`)

Se agregaron, en este orden (el orden importa por las reglas de JFlex explicadas en el doc 01):

**Palabras reservadas** (antes de la regla `{identificador}`, para que no se confundan con nombres de variables):

| Lexema | Token | Notas |
|---|---|---|
| `int` | `INT` | |
| `bool` | `BOOL` | |
| `string` | `STRING_T` | se llamó `STRING_T` y no `STRING` porque ese nombre ya lo usa el tipo `TipoDato.STRING` del AST; usar el mismo nombre para el token y el tipo de dato hubiera sido confuso |
| `true` / `false` | `TRUE` / `FALSE` | |
| `procedure` | `PROCEDURE` | |
| `function` | `FUNCTION` | |
| `return` | `RETURN` | |

**Puntuación nueva:**

| Lexema | Token |
|---|---|
| `[` | `LBRACKET` |
| `]` | `RBRACKET` |
| `,` | `COMMA` |
| `:` | `COLON` |

El `:` no choca con `:=` (ya existía como `ASSIGN`) porque JFlex siempre elige la coincidencia más larga, sin importar el orden de las reglas en el archivo.

**Literales de cadena** — nueva definición:

```
cadena = \"([^\"\\]|\\.)*\"
```

Acepta comillas escapadas dentro del string (`\"`). El token `STRING_LITERAL` lleva como valor el contenido **sin las comillas**:

```java
String lexema = yytext();
return sf.newSymbol("STRING_LITERAL", sym.STRING_LITERAL, lexema.substring(1, lexema.length()-1));
```

---

## 2. Gramática (`sintactico.cup`)

### 2.1 Terminales y no-terminales nuevos

Terminales: `INT, BOOL, STRING_T, TRUE, FALSE, PROCEDURE, FUNCTION, RETURN, LBRACKET, RBRACKET, COMMA, COLON`, y `STRING_LITERAL` (con valor `String`).

No-terminales: `decl_list, decl, var_decl, func_decl, param_list, param, type_spec, arg_list, return_stmt`. `type_spec` es especial: en vez de devolver un `NodoBase` como el resto, devuelve directamente un `ve.edu.unet.nodosAST.TipoDato` (el enum), porque no necesita ser un nodo del AST — solo es información para construir otros nodos.

### 2.2 `program` ahora tiene dos partes

Antes: `program ::= stmt_seq`. Ahora: `program ::= decl_list stmt_seq`.

`decl_list` puede estar vacía — así un programa sin ninguna variable que declarar (por ejemplo, uno que solo escribe literales) no está obligado a empezar con una declaración inútil. Cuando no está vacía, la acción semántica busca el último nodo de la cadena de declaraciones y le cuelga la secuencia de sentencias principal como `HermanoDerecha` — así todo el programa (declaraciones + sentencias) queda en una sola lista enlazada, igual que ya hacía el resto del AST.

**Ojo con esto:** que `decl_list` pueda estar vacía es solo una flexibilidad *sintáctica* — no significa que los `.tny` clásicos de Tiny original (como `ejemplo_fuente/factorial.tny`, que usa `x` y `fact` sin declararlas) ahora compilen. Lo comprobé corriendo ese archivo contra el pipeline completo: el parser lo acepta sin error de sintaxis, pero `Semantico.java` lo rechaza con `ERROR SEMANTICO: identificador 'x' no declarado` (y lo mismo para `fact`) — correctamente, porque Tiny++ exige declaración previa de toda variable. Es el comportamiento esperado, no un bug: los ejemplos viejos de Tiny ya no son programas Tiny++ válidos tal cual están.

**Otro detalle no obvio:** a diferencia de `decl_list`, `stmt_seq` (la secuencia de sentencias) **no tiene alternativa vacía** — nunca la tuvo, ni en el Tiny original. Eso significa que un archivo con *solo* declaraciones y funciones, sin ninguna sentencia ejecutable al final, no es un programa Tiny++ válido (el parser lo detecta como error de sintaxis, recuperable gracias a la regla `stmt ::= error` que ya traía el Tiny original, pero el resultado es basura). Lo descubrí probando un archivo con solo una función y nada más — hay que terminar siempre con al menos una sentencia en el cuerpo principal.

```cup
program ::= decl_list:dl stmt_seq:s
    {: if(dl!=null){
           NodoBase ultimaDecl = dl;
           while(ultimaDecl.TieneHermano()) ultimaDecl = ultimaDecl.getHermanoDerecha();
           ultimaDecl.setHermanoDerecha(s);
           ast = dl;
       } else { ast = s; }
    :}
```

### 2.3 Declaración de variables (`var_decl`)

```cup
var_decl ::= type_spec:t ID:nombre SEMI                                  {: RESULT = new NodoDeclaracion(nombre,t); :}
         |   type_spec:t ID:nombre LBRACKET NUM:tam RBRACKET SEMI        {: RESULT = new NodoDeclaracion(nombre,t,Integer.parseInt(tam)); :}
```

El tamaño del arreglo tiene que ser un `NUM` (constante literal) directamente en la gramática — no se puede declarar `int A[n];` con `n` una variable, tal como pide el enunciado ("tamaño constante").

### 2.4 Funciones y procedimientos (`func_decl`, `param_list`, `param`)

```cup
func_decl ::= PROCEDURE ID:nombre LPAREN param_list:params RPAREN stmt_seq:cuerpo END
          {: RESULT = new NodoFuncion(nombre,null,params,cuerpo); :}
          | FUNCTION ID:nombre LPAREN param_list:params RPAREN COLON type_spec:tipoRet stmt_seq:cuerpo END
          {: RESULT = new NodoFuncion(nombre,tipoRet,params,cuerpo); :}
```

Un procedimiento se distingue de una función porque su `tipoRetorno` es `null`. Los parámetros se reutiliza `NodoDeclaracion` (misma clase que usan las variables), encadenados por `HermanoDerecha` como cualquier otra lista del AST — no se creó una clase `NodoParametro` aparte porque sería idéntica a `NodoDeclaracion` sin el campo de arreglo.

**Limitación consciente:** el cuerpo de una función es `stmt_seq`, no `decl_list stmt_seq`. Es decir, **una función no puede declarar variables locales propias**, solo puede usar sus parámetros y las variables globales. Esto no estaba en el alcance pedido por la ficha (que solo habla de parámetros formales tipados), pero es algo a tener en cuenta si más adelante el enunciado pide variables locales dentro de funciones — habría que cambiar `func_decl` para usar `decl_list stmt_seq` como cuerpo, y esto afectaría también a `TablaSimbolos` y `Semantico` (que ya están preparados para manejar scopes anidados en general, así que el cambio sería localizado).

### 2.5 Acceso y asignación a arreglos

```cup
factor      ::= ... | ID:variable LBRACKET exp:indice RBRACKET   {: RESULT = new NodoArreglo(variable.toString(),indice); :}
assign_stmt ::= ... | ID:variable LBRACKET exp:indice RBRACKET ASSIGN exp:ex
            {: RESULT = new NodoAsignacion(variable.toString(),indice,ex); :}
```

`A[i]` como **lectura** (dentro de una expresión) se vuelve un `NodoArreglo`. `A[i] := x` como **escritura** (target de asignación) usa el nuevo constructor de tres argumentos de `NodoAsignacion` — no se creó un nodo separado para "asignación a arreglo" porque sería casi idéntico a `NodoAsignacion`, solo con un campo extra (`indiceArreglo`).

### 2.6 Llamadas a función y literales (`factor`)

```cup
factor ::= ... | ID:nombreFuncion LPAREN arg_list:args RPAREN  {: RESULT = new NodoLlamada(nombreFuncion.toString(),args); :}
       | TRUE             {: RESULT = new NodoBooleano(true); :}
       | FALSE             {: RESULT = new NodoBooleano(false); :}
       | STRING_LITERAL:valor  {: RESULT = new NodoCadena(valor); :}
```

`arg_list` (los argumentos de una llamada) y `param_list` (los parámetros formales de una declaración) son gramaticalmente independientes aunque se parezcan: `param_list` espera `type_spec ID` repetido, `arg_list` espera `exp` repetido. No hay ambigüedad entre ellas porque aparecen en producciones distintas (`func_decl` vs. `factor`).

### 2.7 `return` como sentencia

```cup
stmt        ::= ... | return_stmt:sret {: RESULT=sret; :}
return_stmt ::= RETURN exp:ex {: RESULT = new NodoReturn(ex); :}
```

**Limitación conocida (no es un bug, es un hueco real de la gramática):** un procedimiento (`procedure`, sin retorno) **nunca se puede invocar** en este lenguaje, porque la única producción que permite `ID(args)` es dentro de `factor` — es decir, solo en contexto de **expresión** (donde se espera un valor). No existe una producción `stmt ::= ID LPAREN arg_list RPAREN` que permita "llamar a un procedimiento como sentencia suelta". Si en algún momento el equipo necesita que los procedimientos sirvan para algo (no solo existir), hay que agregar esa alternativa a `stmt`. `Semantico.java` ya detecta y rechaza el caso contrario (usar un procedimiento donde se espera un valor), pero no hay forma sintáctica de ejecutarlo como una orden independiente todavía.

### 2.8 Validación de la gramática

Se corrió CUP real (el jar que ya estaba en `src/especificacion/`) contra el archivo final: **0 errores, 0 conflictos LALR**, 56 producciones, 109 estados. Esto garantiza que la gramática es determinística (no hay ambigüedad que CUP tenga que resolver "a ciegas").

---

## 3. Nodos del AST nuevos (`nodosAST/`)

| Clase | Campos | Para qué |
|---|---|---|
| `TipoDato` (enum) | `INT, BOOL, STRING` | el "tipo" de cualquier valor en Tiny++ |
| `NodoDeclaracion` | `variable, tipo, esArreglo, tamanoArreglo` | declarar una variable o un arreglo; también se reutiliza para parámetros de función |
| `NodoArreglo` | `nombre, indice` | **uso** de `A[i]` dentro de una expresión (lectura) |
| `NodoFuncion` | `nombre, tipoRetorno (null=procedimiento), listaParametros, cuerpo` | declaración completa de función/procedimiento |
| `NodoLlamada` | `nombreFuncion, listaArgumentos` | invocar una función dentro de una expresión |
| `NodoReturn` | `expresionRetorno` | sentencia `return expr;` |
| `NodoCadena` | `valor (String)` | literal de cadena |
| `NodoBooleano` | `valor (boolean)` | literal `true`/`false` |

`NodoAsignacion` (ya existía) se extendió con un campo `indiceArreglo` (nullable) y un tercer constructor `NodoAsignacion(identificador, indiceArreglo, expresion)`. El método `esArreglo()` dice si esa asignación concreta es sobre un elemento de arreglo o sobre una variable simple.

Ningún nodo nuevo tiene lógica propia más allá de getters/setters — siguiendo el mismo estilo minimalista que ya tenía el resto de `nodosAST` (son contenedores de datos; toda la lógica vive en quien los recorre: `TablaSimbolos`, `Semantico`, y eventualmente `Generador`).

---

## 4. Tabla de símbolos (`TablaSimbolos.java` + `RegistroSimbolo.java`)

### 4.1 Qué cambió del diseño original

El original tenía **un solo `HashMap` global** y asignaba direcciones de memoria la primera vez que veía un identificador **usado** (no declarado). Tiny++ exige declaración explícita, así que el diseño cambió por completo:

- **Pila de ámbitos** en vez de un mapa plano: `Deque<Ambito>`, donde cada `Ambito` (clase interna privada) tiene su propio `Map<String, RegistroSimbolo>` **y su propio contador de direcciones** (`siguienteDireccion`), que arranca en 0. Esto es importante: las direcciones de variables **locales** de una función empiezan en 0 dentro de su propio ámbito, no siguen el contador de las globales — eso es correcto porque en la TM las locales no viven en direcciones fijas junto a las globales, sino relativas a un marco de activación (que es justo lo que Ismael tiene que construir en el Generador usando esta información).
- **Inserción solo en el punto de declaración**: `cargarTabla` ya no inserta al encontrar un `NodoIdentificador` (uso); inserta únicamente al encontrar un `NodoDeclaracion` o un `NodoFuncion` (la función en el ámbito que la contiene, sus parámetros en un ámbito nuevo).
- **Redeclaración en el mismo ámbito es un error** (no se sobreescribe, no se ignora silenciosamente): `insertar()` imprime `ERROR SEMANTICO: '<nombre>' ya fue declarado en este ambito.` y devuelve `false`.

### 4.2 Métodos clave

```java
public void entrarAmbito()      // push de un Ambito nuevo (vacío, contador en 0)
public void salirAmbito()       // pop (nunca cierra el ámbito global, nivel 0)
public boolean insertar(RegistroSimbolo s)   // inserta en el ámbito ACTUAL; false si ya existe ahí
public RegistroSimbolo buscar(String nombre) // busca del ámbito más interno al global; null si no existe en ninguno
```

`buscar()` es lo que implementa shadowing correctamente: si un parámetro se llama igual que una variable global, `buscar()` desde dentro de la función encuentra primero el parámetro (está en el ámbito de arriba de la pila) sin que eso choque con la global (que sigue en su propio ámbito, nivel 0).

### 4.3 El contrato con Ismael (Módulo 2)

Tal como pide la guía metodológica, se exponen cuatro métodos que Ismael va a usar desde `Generador.java` para calcular direcciones TM:

```java
public int getDireccion(String nombre)       // offset de memoria asignado
public boolean esGlobal(String nombre)       // true si vive en el ámbito 0 (relativo a GP)
public TipoDato getTipo(String nombre)       // INT, BOOL o STRING
public int getTamanoArreglo(String nombre)   // 0 si no es arreglo
```

Importante para Ismael: hoy `getDireccion` devuelve un offset **relativo al ámbito donde fue declarada la variable** (0, 1, 2... dentro de ese ámbito), no una dirección absoluta de `dMem`. Para variables globales (`esGlobal == true`) ese offset coincide con el offset real relativo a `GP` (igual que en el Generador original). Para variables **locales** (`esGlobal == false`), ese offset es relativo al marco de activación de la función — Ismael tiene que sumarlo a donde sea que decida ubicar el marco (relativo a `MP` o a un nuevo puntero de frame), no a `GP`.

### 4.4 `RegistroSimbolo` — qué guarda ahora

Antes: `identificador, numLinea, direccionMemoria`. Ahora además: `tipo, esArreglo, tamanoArreglo, nivelAmbito, esFuncion, parametros` (esta última es una `List<TipoDato>`, solo para funciones — es la lista de tipos de los parámetros formales, usada por `Semantico` para chequear llamadas).

---

## 5. Verificador semántico (`Semantico.java`, clase nueva)

### 5.1 Idea general

Recorrido **post-orden** del AST (como pide la ficha): para evaluar si una sentencia es válida, primero hay que saber el tipo de sus sub-expresiones, así que siempre se calcula el tipo de las hojas antes que el de los nodos que las contienen.

Se apoya en la misma `TablaSimbolos` que ya construyó `cargarTabla`, pero necesita **reabrir los ámbitos de cada función** durante su propio recorrido (porque `cargarTabla` ya cerró y descartó esos ámbitos al terminar). Por eso, cuando `Semantico` visita un `NodoFuncion`, hace exactamente lo mismo que hacía `TablaSimbolos.cargarTabla` en su momento: `entrarAmbito()`, declara cada parámetro, revisa el cuerpo, `salirAmbito()`. Es una pequeña duplicación de trabajo entre las dos clases, pero mantiene a `Semantico` simple (no necesita guardar su propio árbol de ámbitos en paralelo).

### 5.2 `tipoDe(nodo)`: el corazón de la clase

Devuelve el `TipoDato` de cualquier sub-expresión, reportando errores en el camino:

- `NodoValor` → `INT`, `NodoBooleano` → `BOOL`, `NodoCadena` → `STRING` (literales, tipo directo).
- `NodoIdentificador` → busca el símbolo; error si no existe, si es función, o si es un arreglo sin índice.
- `NodoArreglo` → valida que el índice sea `INT`, busca el símbolo, error si no existe o no es arreglo; devuelve el tipo **base** del arreglo (no "arreglo de X", sino `X`).
- `NodoLlamada` → valida aridad y tipo de cada argumento contra `RegistroSimbolo.getParametros()`; error si el nombre no existe, no es función, o es un procedimiento (tipo `null`) usado donde se espera un valor.
- `NodoOperacion` → según el operador: aritméticos (`+ - * /`) exigen `INT` en ambos lados y devuelven `INT`; `<` exige `INT` en ambos lados y devuelve `BOOL`; `=` exige que ambos lados sean del **mismo** tipo (sea cual sea) y devuelve `BOOL`.

**Importante:** cuando un error ya se reportó para una sub-expresión, `tipoDe` devuelve `null` en vez de seguir intentando inferir un tipo. Los chequeos de más arriba (`if (tipo != null && tipo != esperado)`) ignoran los `null` a propósito — así un solo error real (p. ej. una variable no declarada) no genera una cascada de 5 errores más sobre la misma expresión.

### 5.3 Chequeos a nivel de sentencia

- **Asignación** (`verificarAsignacion`): el identificador debe existir, no ser función; si es `A[i] := x`, el índice debe ser `INT` y el símbolo debe ser arreglo; el tipo de la expresión debe coincidir con el tipo declarado de la variable (o del arreglo).
- **`read`** (`verificarLeer`): el identificador debe existir, no ser función, no ser un arreglo completo (no se puede `read A;` sin índice — la gramática actual de `read_stmt` no soporta `read A[i];` tampoco, así que leer sobre un arreglo siempre es un error con el diseño actual).
- **`if` / `until`**: la condición debe ser de tipo `BOOL`.
- **`return`**: solo válido dentro de una función/procedimiento; un procedimiento no puede retornar valor; el tipo retornado debe coincidir con el tipo declarado de la función.
- **Redeclaración en el mismo ámbito**: no la revisa `Semantico` — ya la atrapa `TablaSimbolos.insertar()` durante `cargarTabla` (y también durante el propio recorrido de `Semantico`, al reabrir el ámbito de cada función — por eso un parámetro duplicado hoy imprime el mismo error dos veces; es ruido cosmético, no un error funcional).

### 5.4 Pipeline final en `sintactico.cup` (`main`)

```java
ts.cargarTabla(root);
ts.imprimirTabla();
Semantico semantico = new Semantico(ts);
semantico.verificar(root);
if (semantico.getErrores() > 0) {
    System.out.println("Compilacion abortada: " + semantico.getErrores() + " error(es) semantico(s).");
    return;   // no se genera código objeto si hay errores semanticos
}
Generador.setTablaSimbolos(ts);
Generador.generarCodigoObjeto(root);
```

Esto es exactamente el comportamiento esperado de un compilador real: si el programa tiene errores semánticos, no se genera código objeto.

---

## 6. Cómo se probó todo (sin tocar el repo)

Para cada etapa se regeneró `Lexico.java` (con `jflex-full-1.8.2.jar`) y `parser.java`/`sym.java` (con `java-cup-11b.jar`) hacia un directorio temporal fuera del proyecto, se compiló todo junto con `javac -encoding ISO-8859-1` (la codificación que ya usaba la ficha original, por los comentarios en español con tildes de los archivos base), y se corrió `ve.edu.unet.parser <archivo.tny>` con programas de prueba escritos a mano.

Casos verificados:
- Programa válido con tipos, arreglo, función con parámetros y `if`/`else` → **0 errores**, llega a generar código objeto (con los `BUG: tipo de nodo desconocido` esperados en `Generador.java`, que todavía no conoce los nodos nuevos — eso es trabajo de Ismael).
- Redeclaración de una variable global → detectada.
- Parámetro que sombrea (shadowing) una variable global del mismo nombre → resuelto correctamente sin colisión.
- 8 errores semánticos deliberados en un mismo archivo (identificador no declarado, asignación de tipo incompatible, aritmética con `bool`, comparación `int` con `string`, condición `if` no booleana, aridad de llamada incorrecta, tipo de argumento incorrecto, `read` sobre un arreglo sin índice) → **los 8 se reportaron exactamente**, con mensajes específicos.

Un hallazgo en el camino que **no fue un bug**: en Tiny, `;` es separador entre sentencias, no terminador — no va `;` antes del `end`/`until` que cierra un bloque (se confirmó comparando contra `ejemplo_fuente/factorial.tny`, el ejemplo original del profesor). Mis primeros archivos de prueba tenían ese error de sintaxis, no la gramática.

---

## 7. Lo que queda fuera de este módulo (y de quién es)

- **`Generador.java` / `UtGen.java`** (Módulo 2, Ismael): hoy siguen sin reconocer `NodoDeclaracion`, `NodoFuncion`, `NodoLlamada`, `NodoArreglo`, `NodoBooleano`, `NodoCadena` — imprimen `BUG: tipo de nodo a generar desconocido` y no generan código para ellos. Es esperado: la tabla de símbolos ya expone todo lo que el contrato pide (dirección, si es global, tipo, tamaño de arreglo) para que Ismael los consuma.
- **`Util.java`** (impresión de debug del AST): tampoco conoce los nodos nuevos (imprime "Tipo de nodo desconocido"). No se tocó porque no está en el alcance de tu ficha ni bloquea nada — es solo una herramienta de depuración. Se puede actualizar más adelante si molesta para debuggear.
- **Variables locales dentro de funciones** (sección 2.4): la gramática no las soporta todavía, solo parámetros.
- **Invocar un procedimiento como sentencia** (sección 2.7): no hay sintaxis para eso hoy.
