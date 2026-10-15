
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Salto al inicio del programa principal
2:       LDA       7,0(7)      salto al programa principal (main)
*      -> asignacion
*      -> constante
3:       LDC       0,10(0)      cargar constante: 10
*      <- constante
4:       ST       0,0(5)      asignacion: almaceno el valor para el id a [global a en GP+0]
*      <- asignacion
*      -> asignacion
*      -> constante
5:       LDC       0,3(0)      cargar constante: 3
*      <- constante
6:       ST       0,1(5)      asignacion: almaceno el valor para el id b [global b en GP+1]
*      <- asignacion
*      -> asignacion
*      -> Operacion: menos
*      -> Operacion: mas
*      -> identificador
7:       LD       0,0(5)      cargar valor de identificador: a [global a en GP+0]
*      <- identificador
8:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> Operacion: por
*      -> identificador
9:       LD       0,1(5)      cargar valor de identificador: b [global b en GP+1]
*      <- identificador
10:       ST       0,-1(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
11:       LDC       0,2(0)      cargar constante: 2
*      <- constante
12:       LD       1,-1(6)      op: pop o cargo de la pila el valor izquierdo en AC1
13:       MUL       0,1,0      op: *
*      <- Operacion: por
14:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
15:       ADD       0,1,0      op: +
*      <- Operacion: mas
16:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> Operacion: entre
*      -> identificador
17:       LD       0,0(5)      cargar valor de identificador: a [global a en GP+0]
*      <- identificador
18:       ST       0,-1(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
19:       LDC       0,2(0)      cargar constante: 2
*      <- constante
20:       LD       1,-1(6)      op: pop o cargo de la pila el valor izquierdo en AC1
21:       DIV       0,1,0      op: /
*      <- Operacion: entre
22:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
23:       SUB       0,1,0      op: -
*      <- Operacion: menos
24:       ST       0,2(5)      asignacion: almaceno el valor para el id c [global c en GP+2]
*      <- asignacion
*      -> escribir
*      -> identificador
25:       LD       0,2(5)      cargar valor de identificador: c [global c en GP+2]
*      <- identificador
26:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
27:       HALT       0,0,0      


