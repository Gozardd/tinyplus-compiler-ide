
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Salto al inicio del programa principal
2:       LDA       7,0(7)      salto al programa principal (main)
*      -> asignacion
*      -> booleano
3:       LDC       0,1(0)      cargar constante booleana: true
*      <- booleano
4:       ST       0,0(5)      asignacion: almaceno el valor para el id flag [global flag en GP+0]
*      <- asignacion
*      -> if
*      -> identificador
5:       LD       0,0(5)      cargar valor de identificador: flag [global flag en GP+0]
*      <- identificador
*      If: el salto hacia el else debe estar aqui
*      -> asignacion
*      -> constante
7:       LDC       0,1(0)      cargar constante: 1
*      <- constante
8:       ST       0,1(5)      asignacion: almaceno el valor para el id contador [global contador en GP+1]
*      <- asignacion
*      If: el salto hacia el final debe estar aqui
6:       JEQ       0,3(7)      if: jmp hacia else
*      -> asignacion
*      -> constante
10:       LDC       0,99(0)      cargar constante: 99
*      <- constante
11:       ST       0,1(5)      asignacion: almaceno el valor para el id contador [global contador en GP+1]
*      <- asignacion
9:       LDA       7,2(7)      if: jmp hacia el final
*      <- if
*      -> asignacion
*      -> constante
12:       LDC       0,0(0)      cargar constante: 0
*      <- constante
13:       ST       0,2(5)      asignacion: almaceno el valor para el id sumador [global sumador en GP+2]
*      <- asignacion
*      -> repeat
*      repeat: el salto hacia el inicio del repeat
*      -> asignacion
*      -> Operacion: mas
*      -> identificador
14:       LD       0,2(5)      cargar valor de identificador: sumador [global sumador en GP+2]
*      <- identificador
15:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> identificador
16:       LD       0,1(5)      cargar valor de identificador: contador [global contador en GP+1]
*      <- identificador
17:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
18:       ADD       0,1,0      op: +
*      <- Operacion: mas
19:       ST       0,2(5)      asignacion: almaceno el valor para el id sumador [global sumador en GP+2]
*      <- asignacion
*      -> asignacion
*      -> Operacion: mas
*      -> identificador
20:       LD       0,1(5)      cargar valor de identificador: contador [global contador en GP+1]
*      <- identificador
21:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
22:       LDC       0,1(0)      cargar constante: 1
*      <- constante
23:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
24:       ADD       0,1,0      op: +
*      <- Operacion: mas
25:       ST       0,1(5)      asignacion: almaceno el valor para el id contador [global contador en GP+1]
*      <- asignacion
*      -> Operacion: igual
*      -> identificador
26:       LD       0,1(5)      cargar valor de identificador: contador [global contador en GP+1]
*      <- identificador
27:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
28:       LDC       0,6(0)      cargar constante: 6
*      <- constante
29:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
30:       SUB       0,1,0      op: ==
31:       JEQ       0,2(7)      voy dos instrucciones mas alla if verdadero (AC==0)
32:       LDC       0,0(0)      caso de falso (AC=0)
33:       LDA       7,1(7)      Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)
34:       LDC       0,1(0)      caso de verdadero (AC=1)
*      <- Operacion: igual
35:       JEQ       0,-22(7)      repeat: jmp hacia el inicio del cuerpo
*      <- repeat
*      -> escribir
*      -> identificador
36:       LD       0,2(5)      cargar valor de identificador: sumador [global sumador en GP+2]
*      <- identificador
37:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
38:       HALT       0,0,0      


