
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Inicializacion de literales de cadena en dMem:
2:       LDC       0,72(0)      char 'H'
3:       ST       0,1(5)      dMem[1] = 'H'
4:       LDC       0,111(0)      char 'o'
5:       ST       0,2(5)      dMem[2] = 'o'
6:       LDC       0,108(0)      char 'l'
7:       ST       0,3(5)      dMem[3] = 'l'
8:       LDC       0,97(0)      char 'a'
9:       ST       0,4(5)      dMem[4] = 'a'
10:       LDC       0,32(0)      char ' '
11:       ST       0,5(5)      dMem[5] = ' '
12:       LDC       0,84(0)      char 'T'
13:       ST       0,6(5)      dMem[6] = 'T'
14:       LDC       0,105(0)      char 'i'
15:       ST       0,7(5)      dMem[7] = 'i'
16:       LDC       0,110(0)      char 'n'
17:       ST       0,8(5)      dMem[8] = 'n'
18:       LDC       0,121(0)      char 'y'
19:       ST       0,9(5)      dMem[9] = 'y'
20:       LDC       0,0(0)      terminador nulo 0
21:       ST       0,10(5)      dMem[10] = 0
22:       LDC       0,33(0)      char '!'
23:       ST       0,11(5)      dMem[11] = '!'
24:       LDC       0,0(0)      terminador nulo 0
25:       ST       0,12(5)      dMem[12] = 0
*      -> asignacion
*      -> cadena literal
26:       LDC       0,1(0)      cargar direccion de cadena: "Hola Tiny"
*      <- cadena literal
27:       ST       0,0(5)      asignacion: almaceno el valor para el id msg [global msg en GP+0]
*      <- asignacion
*      -> escribir
*      -> identificador
28:       LD       0,0(5)      cargar valor de identificador: msg [global msg en GP+0]
*      <- identificador
*      escribir cadena: bucle caracter a caracter
29:       LD       1,0(0)      str: cargar char actual dMem[reg[0]] en AC1
30:       JEQ       1,3(7)      str: si char==0 saltar al fin del bucle
31:       OUT       1,0,0      str: imprimir caracter
32:       LDA       0,1(0)      str: avanzar puntero p = p + 1
33:       LDA       7,-5(7)      str: repetir bucle
*      escribir cadena: fin del bucle
*      <- escribir
*      -> escribir
*      -> cadena literal
34:       LDC       0,11(0)      cargar direccion de cadena: "!"
*      <- cadena literal
*      escribir cadena: bucle caracter a caracter
35:       LD       1,0(0)      str: cargar char actual dMem[reg[0]] en AC1
36:       JEQ       1,3(7)      str: si char==0 saltar al fin del bucle
37:       OUT       1,0,0      str: imprimir caracter
38:       LDA       0,1(0)      str: avanzar puntero p = p + 1
39:       LDA       7,-5(7)      str: repetir bucle
*      escribir cadena: fin del bucle
*      <- escribir
*      -> escribir
*      -> constante
40:       LDC       0,2026(0)      cargar constante: 2026
*      <- constante
41:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
42:       HALT       0,0,0      


