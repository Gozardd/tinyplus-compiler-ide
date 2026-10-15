
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      -> asignacion
*      -> constante
2:       LDC       0,0(0)      cargar constante: 0
*      <- constante
3:       ST       0,5(5)      asignacion: almaceno el valor para el id i [global i en GP+5]
*      <- asignacion
*      -> repeat
*      repeat: el salto hacia el inicio del repeat
*      -> asignacion
*      -> Operacion: por
*      -> Operacion: mas
*      -> identificador
4:       LD       0,5(5)      cargar valor de identificador: i [global i en GP+5]
*      <- identificador
5:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
6:       LDC       0,1(0)      cargar constante: 1
*      <- constante
7:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
8:       ADD       0,1,0      op: +
*      <- Operacion: mas
9:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
10:       LDC       0,10(0)      cargar constante: 10
*      <- constante
11:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
12:       MUL       0,1,0      op: *
*      <- Operacion: por
13:       ST       0,0(6)      asig arreglo: push RHS en pila tmp
*      -> identificador
14:       LD       0,5(5)      cargar valor de identificador: i [global i en GP+5]
*      <- identificador
15:       ADD       2,0,5      asig arreglo: reg[2] = index + GP
16:       LD       0,0(6)      asig arreglo: pop RHS de pila tmp a AC
17:       ST       0,0(2)      asig arreglo: dMem[0 + reg[2]] = reg[AC]
*      <- asignacion
*      -> asignacion
*      -> Operacion: mas
*      -> identificador
18:       LD       0,5(5)      cargar valor de identificador: i [global i en GP+5]
*      <- identificador
19:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
20:       LDC       0,1(0)      cargar constante: 1
*      <- constante
21:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
22:       ADD       0,1,0      op: +
*      <- Operacion: mas
23:       ST       0,5(5)      asignacion: almaceno el valor para el id i [global i en GP+5]
*      <- asignacion
*      -> Operacion: igual
*      -> identificador
24:       LD       0,5(5)      cargar valor de identificador: i [global i en GP+5]
*      <- identificador
25:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
26:       LDC       0,5(0)      cargar constante: 5
*      <- constante
27:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
28:       SUB       0,1,0      op: ==
29:       JEQ       0,2(7)      voy dos instrucciones mas alla if verdadero (AC==0)
30:       LDC       0,0(0)      caso de falso (AC=0)
31:       LDA       7,1(7)      Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)
32:       LDC       0,1(0)      caso de verdadero (AC=1)
*      <- Operacion: igual
33:       JEQ       0,-30(7)      repeat: jmp hacia el inicio del cuerpo
*      <- repeat
*      -> asignacion
*      -> Operacion: mas
*      -> Operacion: mas
*      -> Operacion: mas
*      -> Operacion: mas
*      -> arreglo: A
*      -> constante
34:       LDC       0,0(0)      cargar constante: 0
*      <- constante
35:       ADD       2,0,5      arreglo: reg[2] = index + GP
36:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: A
37:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: A
*      -> constante
38:       LDC       0,1(0)      cargar constante: 1
*      <- constante
39:       ADD       2,0,5      arreglo: reg[2] = index + GP
40:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: A
41:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
42:       ADD       0,1,0      op: +
*      <- Operacion: mas
43:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: A
*      -> constante
44:       LDC       0,2(0)      cargar constante: 2
*      <- constante
45:       ADD       2,0,5      arreglo: reg[2] = index + GP
46:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: A
47:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
48:       ADD       0,1,0      op: +
*      <- Operacion: mas
49:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: A
*      -> constante
50:       LDC       0,3(0)      cargar constante: 3
*      <- constante
51:       ADD       2,0,5      arreglo: reg[2] = index + GP
52:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: A
53:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
54:       ADD       0,1,0      op: +
*      <- Operacion: mas
55:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: A
*      -> constante
56:       LDC       0,4(0)      cargar constante: 4
*      <- constante
57:       ADD       2,0,5      arreglo: reg[2] = index + GP
58:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: A
59:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
60:       ADD       0,1,0      op: +
*      <- Operacion: mas
61:       ST       0,6(5)      asignacion: almaceno el valor para el id acum [global acum en GP+6]
*      <- asignacion
*      -> escribir
*      -> identificador
62:       LD       0,6(5)      cargar valor de identificador: acum [global acum en GP+6]
*      <- identificador
63:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> escribir
*      -> arreglo: A
*      -> constante
64:       LDC       0,3(0)      cargar constante: 3
*      <- constante
65:       ADD       2,0,5      arreglo: reg[2] = index + GP
66:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: A
67:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
68:       HALT       0,0,0      


