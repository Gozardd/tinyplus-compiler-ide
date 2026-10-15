
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Inicializacion de literales de cadena en dMem:
2:       LDC       0,67(0)      char 'C'
3:       ST       0,2(5)      dMem[2] = 'C'
4:       LDC       0,111(0)      char 'o'
5:       ST       0,3(5)      dMem[3] = 'o'
6:       LDC       0,109(0)      char 'm'
7:       ST       0,4(5)      dMem[4] = 'm'
8:       LDC       0,112(0)      char 'p'
9:       ST       0,5(5)      dMem[5] = 'p'
10:       LDC       0,105(0)      char 'i'
11:       ST       0,6(5)      dMem[6] = 'i'
12:       LDC       0,108(0)      char 'l'
13:       ST       0,7(5)      dMem[7] = 'l'
14:       LDC       0,97(0)      char 'a'
15:       ST       0,8(5)      dMem[8] = 'a'
16:       LDC       0,100(0)      char 'd'
17:       ST       0,9(5)      dMem[9] = 'd'
18:       LDC       0,111(0)      char 'o'
19:       ST       0,10(5)      dMem[10] = 'o'
20:       LDC       0,114(0)      char 'r'
21:       ST       0,11(5)      dMem[11] = 'r'
22:       LDC       0,101(0)      char 'e'
23:       ST       0,12(5)      dMem[12] = 'e'
24:       LDC       0,115(0)      char 's'
25:       ST       0,13(5)      dMem[13] = 's'
26:       LDC       0,0(0)      terminador nulo 0
27:       ST       0,14(5)      dMem[14] = 0
28:       LDC       0,69(0)      char 'E'
29:       ST       0,15(5)      dMem[15] = 'E'
30:       LDC       0,120(0)      char 'x'
31:       ST       0,16(5)      dMem[16] = 'x'
32:       LDC       0,105(0)      char 'i'
33:       ST       0,17(5)      dMem[17] = 'i'
34:       LDC       0,116(0)      char 't'
35:       ST       0,18(5)      dMem[18] = 't'
36:       LDC       0,111(0)      char 'o'
37:       ST       0,19(5)      dMem[19] = 'o'
38:       LDC       0,0(0)      terminador nulo 0
39:       ST       0,20(5)      dMem[20] = 0
40:       LDC       0,32(0)      char ' '
41:       ST       0,21(5)      dMem[21] = ' '
42:       LDC       0,0(0)      terminador nulo 0
43:       ST       0,22(5)      dMem[22] = 0
*      Salto al inicio del programa principal
44:       LDA       7,0(7)      salto al programa principal (main)
*      -> asignacion
*      -> cadena literal
45:       LDC       0,2(0)      cargar direccion de cadena: "Compiladores"
*      <- cadena literal
46:       ST       0,0(5)      asignacion: almaceno el valor para el id saludo [global saludo en GP+0]
*      <- asignacion
*      -> asignacion
*      -> cadena literal
47:       LDC       0,15(0)      cargar direccion de cadena: "Exito"
*      <- cadena literal
48:       ST       0,1(5)      asignacion: almaceno el valor para el id despedida [global despedida en GP+1]
*      <- asignacion
*      -> escribir
*      -> identificador
49:       LD       0,0(5)      cargar valor de identificador: saludo [global saludo en GP+0]
*      <- identificador
*      escribir cadena: bucle caracter a caracter
50:       LD       1,0(0)      str: cargar char actual dMem[reg[0]] en AC1
51:       JEQ       1,3(7)      str: si char==0 saltar al fin del bucle
52:       OUT       1,0,0      str: imprimir caracter
53:       LDA       0,1(0)      str: avanzar puntero p = p + 1
54:       LDA       7,-5(7)      str: repetir bucle
*      escribir cadena: fin del bucle
*      <- escribir
*      -> escribir
*      -> cadena literal
55:       LDC       0,21(0)      cargar direccion de cadena: " "
*      <- cadena literal
*      escribir cadena: bucle caracter a caracter
56:       LD       1,0(0)      str: cargar char actual dMem[reg[0]] en AC1
57:       JEQ       1,3(7)      str: si char==0 saltar al fin del bucle
58:       OUT       1,0,0      str: imprimir caracter
59:       LDA       0,1(0)      str: avanzar puntero p = p + 1
60:       LDA       7,-5(7)      str: repetir bucle
*      escribir cadena: fin del bucle
*      <- escribir
*      -> escribir
*      -> identificador
61:       LD       0,1(5)      cargar valor de identificador: despedida [global despedida en GP+1]
*      <- identificador
*      escribir cadena: bucle caracter a caracter
62:       LD       1,0(0)      str: cargar char actual dMem[reg[0]] en AC1
63:       JEQ       1,3(7)      str: si char==0 saltar al fin del bucle
64:       OUT       1,0,0      str: imprimir caracter
65:       LDA       0,1(0)      str: avanzar puntero p = p + 1
66:       LDA       7,-5(7)      str: repetir bucle
*      escribir cadena: fin del bucle
*      <- escribir
*      -> escribir
*      -> constante
67:       LDC       0,2026(0)      cargar constante: 2026
*      <- constante
68:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
69:       HALT       0,0,0      


