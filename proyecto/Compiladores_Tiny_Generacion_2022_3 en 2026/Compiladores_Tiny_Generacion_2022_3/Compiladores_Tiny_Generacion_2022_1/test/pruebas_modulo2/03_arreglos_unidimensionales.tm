
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
3:       LDC       0,0(0)      cargar constante: 0
*      <- constante
4:       ST       0,5(5)      asignacion: almaceno el valor para el id idx [global idx en GP+5]
*      <- asignacion
*      -> repeat
*      repeat: el salto hacia el inicio del repeat
*      -> asignacion
*      -> Operacion: por
*      -> Operacion: mas
*      -> identificador
5:       LD       0,5(5)      cargar valor de identificador: idx [global idx en GP+5]
*      <- identificador
6:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
7:       LDC       0,1(0)      cargar constante: 1
*      <- constante
8:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
9:       ADD       0,1,0      op: +
*      <- Operacion: mas
10:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
11:       LDC       0,3(0)      cargar constante: 3
*      <- constante
12:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
13:       MUL       0,1,0      op: *
*      <- Operacion: por
14:       ST       0,0(6)      asig arreglo: push RHS en pila tmp
*      -> identificador
15:       LD       0,5(5)      cargar valor de identificador: idx [global idx en GP+5]
*      <- identificador
16:       ADD       2,0,5      asig arreglo: reg[2] = index + GP
17:       LD       0,0(6)      asig arreglo: pop RHS de pila tmp a AC
18:       ST       0,0(2)      asig arreglo: dMem[0 + reg[2]] = reg[AC]
*      <- asignacion
*      -> asignacion
*      -> Operacion: mas
*      -> identificador
19:       LD       0,5(5)      cargar valor de identificador: idx [global idx en GP+5]
*      <- identificador
20:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
21:       LDC       0,1(0)      cargar constante: 1
*      <- constante
22:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
23:       ADD       0,1,0      op: +
*      <- Operacion: mas
24:       ST       0,5(5)      asignacion: almaceno el valor para el id idx [global idx en GP+5]
*      <- asignacion
*      -> Operacion: igual
*      -> identificador
25:       LD       0,5(5)      cargar valor de identificador: idx [global idx en GP+5]
*      <- identificador
26:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
27:       LDC       0,5(0)      cargar constante: 5
*      <- constante
28:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
29:       SUB       0,1,0      op: ==
30:       JEQ       0,2(7)      voy dos instrucciones mas alla if verdadero (AC==0)
31:       LDC       0,0(0)      caso de falso (AC=0)
32:       LDA       7,1(7)      Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)
33:       LDC       0,1(0)      caso de verdadero (AC=1)
*      <- Operacion: igual
34:       JEQ       0,-30(7)      repeat: jmp hacia el inicio del cuerpo
*      <- repeat
*      -> escribir
*      -> arreglo: arr
*      -> constante
35:       LDC       0,0(0)      cargar constante: 0
*      <- constante
36:       ADD       2,0,5      arreglo: reg[2] = index + GP
37:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: arr
38:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> escribir
*      -> arreglo: arr
*      -> constante
39:       LDC       0,2(0)      cargar constante: 2
*      <- constante
40:       ADD       2,0,5      arreglo: reg[2] = index + GP
41:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: arr
42:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> escribir
*      -> arreglo: arr
*      -> constante
43:       LDC       0,4(0)      cargar constante: 4
*      <- constante
44:       ADD       2,0,5      arreglo: reg[2] = index + GP
45:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: arr
46:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> escribir
*      -> Operacion: mas
*      -> arreglo: arr
*      -> constante
47:       LDC       0,1(0)      cargar constante: 1
*      <- constante
48:       ADD       2,0,5      arreglo: reg[2] = index + GP
49:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: arr
50:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: arr
*      -> constante
51:       LDC       0,3(0)      cargar constante: 3
*      <- constante
52:       ADD       2,0,5      arreglo: reg[2] = index + GP
53:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: arr
54:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
55:       ADD       0,1,0      op: +
*      <- Operacion: mas
56:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
57:       HALT       0,0,0      


