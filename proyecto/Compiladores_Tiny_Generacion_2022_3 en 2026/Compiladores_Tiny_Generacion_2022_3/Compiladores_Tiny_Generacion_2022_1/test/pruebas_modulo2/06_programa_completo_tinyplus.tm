
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Inicializacion de literales de cadena en dMem:
2:       LDC       0,83(0)      char 'S'
3:       ST       0,7(5)      dMem[7] = 'S'
4:       LDC       0,117(0)      char 'u'
5:       ST       0,8(5)      dMem[8] = 'u'
6:       LDC       0,109(0)      char 'm'
7:       ST       0,9(5)      dMem[9] = 'm'
8:       LDC       0,97(0)      char 'a'
9:       ST       0,10(5)      dMem[10] = 'a'
10:       LDC       0,67(0)      char 'C'
11:       ST       0,11(5)      dMem[11] = 'C'
12:       LDC       0,117(0)      char 'u'
13:       ST       0,12(5)      dMem[12] = 'u'
14:       LDC       0,97(0)      char 'a'
15:       ST       0,13(5)      dMem[13] = 'a'
16:       LDC       0,100(0)      char 'd'
17:       ST       0,14(5)      dMem[14] = 'd'
18:       LDC       0,114(0)      char 'r'
19:       ST       0,15(5)      dMem[15] = 'r'
20:       LDC       0,97(0)      char 'a'
21:       ST       0,16(5)      dMem[16] = 'a'
22:       LDC       0,100(0)      char 'd'
23:       ST       0,17(5)      dMem[17] = 'd'
24:       LDC       0,111(0)      char 'o'
25:       ST       0,18(5)      dMem[18] = 'o'
26:       LDC       0,115(0)      char 's'
27:       ST       0,19(5)      dMem[19] = 's'
28:       LDC       0,58(0)      char ':'
29:       ST       0,20(5)      dMem[20] = ':'
30:       LDC       0,32(0)      char ' '
31:       ST       0,21(5)      dMem[21] = ' '
32:       LDC       0,0(0)      terminador nulo 0
33:       ST       0,22(5)      dMem[22] = 0
34:       LDC       0,69(0)      char 'E'
35:       ST       0,23(5)      dMem[23] = 'E'
36:       LDC       0,120(0)      char 'x'
37:       ST       0,24(5)      dMem[24] = 'x'
38:       LDC       0,99(0)      char 'c'
39:       ST       0,25(5)      dMem[25] = 'c'
40:       LDC       0,101(0)      char 'e'
41:       ST       0,26(5)      dMem[26] = 'e'
42:       LDC       0,100(0)      char 'd'
43:       ST       0,27(5)      dMem[27] = 'd'
44:       LDC       0,101(0)      char 'e'
45:       ST       0,28(5)      dMem[28] = 'e'
46:       LDC       0,58(0)      char ':'
47:       ST       0,29(5)      dMem[29] = ':'
48:       LDC       0,32(0)      char ' '
49:       ST       0,30(5)      dMem[30] = ' '
50:       LDC       0,0(0)      terminador nulo 0
51:       ST       0,31(5)      dMem[31] = 0
*      Salto al inicio del programa principal
*      -> funcion: cuadrado
*      -> return
*      -> Operacion: por
*      -> identificador
53:       LD       0,1(6)      cargar valor de identificador: x [param local x en MP+1]
*      <- identificador
54:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> identificador
55:       LD       0,1(6)      cargar valor de identificador: x [param local x en MP+1]
*      <- identificador
56:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
57:       MUL       0,1,0      op: *
*      <- Operacion: por
*      return: salir de funcion
58:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
59:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
60:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      epilogo por defecto de funcion/procedimiento cuadrado
61:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
62:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
63:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: cuadrado
*      -> funcion: reportar
*      -> escribir
*      -> identificador
64:       LD       0,2(6)      cargar valor de identificador: msg [param local msg en MP+2]
*      <- identificador
*      escribir cadena: bucle caracter a caracter
65:       LD       1,0(0)      str: cargar char actual dMem[reg[0]] en AC1
66:       JEQ       1,3(7)      str: si char==0 saltar al fin del bucle
67:       OUT       1,0,0      str: imprimir caracter
68:       LDA       0,1(0)      str: avanzar puntero p = p + 1
69:       LDA       7,-5(7)      str: repetir bucle
*      escribir cadena: fin del bucle
*      <- escribir
*      -> escribir
*      -> identificador
70:       LD       0,1(6)      cargar valor de identificador: valor [param local valor en MP+1]
*      <- identificador
71:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      epilogo por defecto de funcion/procedimiento reportar
72:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
73:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
74:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: reportar
52:       LDA       7,22(7)      salto al programa principal (main)
*      -> asignacion
*      -> constante
75:       LDC       0,0(0)      cargar constante: 0
*      <- constante
76:       ST       0,4(5)      asignacion: almaceno el valor para el id k [global k en GP+4]
*      <- asignacion
*      -> repeat
*      repeat: el salto hacia el inicio del repeat
*      -> asignacion
*      -> llamada: cuadrado
*      -> Operacion: mas
*      -> identificador
77:       LD       0,4(5)      cargar valor de identificador: k [global k en GP+4]
*      <- identificador
78:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
79:       LDC       0,1(0)      cargar constante: 1
*      <- constante
80:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
81:       ADD       0,1,0      op: +
*      <- Operacion: mas
82:       ST       0,0(6)      llamada cuadrado: push arg 1
83:       ST       6,-1(6)      llamada cuadrado: salvar Old MP en MP'-0
84:       LDA       2,3(7)      llamada cuadrado: calcular direccion de retorno
85:       ST       2,-2(6)      llamada cuadrado: salvar retorno en MP'-1
86:       LDA       6,-1(6)      llamada cuadrado: activar nuevo marco MP'
87:       LDA       7,-35(7)      llamada: saltar a funcion cuadrado
*      <- llamada: cuadrado
88:       ST       0,0(6)      asig arreglo: push RHS en pila tmp
*      -> identificador
89:       LD       0,4(5)      cargar valor de identificador: k [global k en GP+4]
*      <- identificador
90:       ADD       2,0,5      asig arreglo: reg[2] = index + GP
91:       LD       0,0(6)      asig arreglo: pop RHS de pila tmp a AC
92:       ST       0,0(2)      asig arreglo: dMem[0 + reg[2]] = reg[AC]
*      <- asignacion
*      -> asignacion
*      -> Operacion: mas
*      -> identificador
93:       LD       0,4(5)      cargar valor de identificador: k [global k en GP+4]
*      <- identificador
94:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
95:       LDC       0,1(0)      cargar constante: 1
*      <- constante
96:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
97:       ADD       0,1,0      op: +
*      <- Operacion: mas
98:       ST       0,4(5)      asignacion: almaceno el valor para el id k [global k en GP+4]
*      <- asignacion
*      -> Operacion: igual
*      -> identificador
99:       LD       0,4(5)      cargar valor de identificador: k [global k en GP+4]
*      <- identificador
100:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
101:       LDC       0,4(0)      cargar constante: 4
*      <- constante
102:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
103:       SUB       0,1,0      op: ==
104:       JEQ       0,2(7)      voy dos instrucciones mas alla if verdadero (AC==0)
105:       LDC       0,0(0)      caso de falso (AC=0)
106:       LDA       7,1(7)      Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)
107:       LDC       0,1(0)      caso de verdadero (AC=1)
*      <- Operacion: igual
108:       JEQ       0,-32(7)      repeat: jmp hacia el inicio del cuerpo
*      <- repeat
*      -> asignacion
*      -> Operacion: mas
*      -> Operacion: mas
*      -> Operacion: mas
*      -> arreglo: datos
*      -> constante
109:       LDC       0,0(0)      cargar constante: 0
*      <- constante
110:       ADD       2,0,5      arreglo: reg[2] = index + GP
111:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: datos
112:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: datos
*      -> constante
113:       LDC       0,1(0)      cargar constante: 1
*      <- constante
114:       ADD       2,0,5      arreglo: reg[2] = index + GP
115:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: datos
116:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
117:       ADD       0,1,0      op: +
*      <- Operacion: mas
118:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: datos
*      -> constante
119:       LDC       0,2(0)      cargar constante: 2
*      <- constante
120:       ADD       2,0,5      arreglo: reg[2] = index + GP
121:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: datos
122:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
123:       ADD       0,1,0      op: +
*      <- Operacion: mas
124:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> arreglo: datos
*      -> constante
125:       LDC       0,3(0)      cargar constante: 3
*      <- constante
126:       ADD       2,0,5      arreglo: reg[2] = index + GP
127:       LD       0,0(2)      arreglo: cargar dMem[0 + reg[2]] en AC
*      <- arreglo: datos
128:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
129:       ADD       0,1,0      op: +
*      <- Operacion: mas
130:       ST       0,5(5)      asignacion: almaceno el valor para el id total [global total en GP+5]
*      <- asignacion
*      -> asignacion
*      -> Operacion: menor
*      -> identificador
131:       LD       0,5(5)      cargar valor de identificador: total [global total en GP+5]
*      <- identificador
132:       ST       0,0(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
133:       LDC       0,50(0)      cargar constante: 50
*      <- constante
134:       LD       1,0(6)      op: pop o cargo de la pila el valor izquierdo en AC1
135:       SUB       0,1,0      op: <
136:       JLT       0,2(7)      voy dos instrucciones mas alla if verdadero (AC<0)
137:       LDC       0,0(0)      caso de falso (AC=0)
138:       LDA       7,1(7)      Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)
139:       LDC       0,1(0)      caso de verdadero (AC=1)
*      <- Operacion: menor
140:       ST       0,6(5)      asignacion: almaceno el valor para el id procesado [global procesado en GP+6]
*      <- asignacion
*      -> if
*      -> identificador
141:       LD       0,6(5)      cargar valor de identificador: procesado [global procesado en GP+6]
*      <- identificador
*      If: el salto hacia el else debe estar aqui
*      -> llamada: reportar
*      -> cadena literal
143:       LDC       0,7(0)      cargar direccion de cadena: "SumaCuadrados: "
*      <- cadena literal
144:       ST       0,0(6)      llamada reportar: push arg 1
*      -> identificador
145:       LD       0,5(5)      cargar valor de identificador: total [global total en GP+5]
*      <- identificador
146:       ST       0,-1(6)      llamada reportar: push arg 2
147:       ST       6,-2(6)      llamada reportar: salvar Old MP en MP'-0
148:       LDA       2,3(7)      llamada reportar: calcular direccion de retorno
149:       ST       2,-3(6)      llamada reportar: salvar retorno en MP'-1
150:       LDA       6,-2(6)      llamada reportar: activar nuevo marco MP'
151:       LDA       7,-88(7)      llamada: saltar a funcion reportar
*      <- llamada: reportar
*      If: el salto hacia el final debe estar aqui
142:       JEQ       0,10(7)      if: jmp hacia else
*      -> llamada: reportar
*      -> cadena literal
153:       LDC       0,23(0)      cargar direccion de cadena: "Excede: "
*      <- cadena literal
154:       ST       0,0(6)      llamada reportar: push arg 1
*      -> identificador
155:       LD       0,5(5)      cargar valor de identificador: total [global total en GP+5]
*      <- identificador
156:       ST       0,-1(6)      llamada reportar: push arg 2
157:       ST       6,-2(6)      llamada reportar: salvar Old MP en MP'-0
158:       LDA       2,3(7)      llamada reportar: calcular direccion de retorno
159:       ST       2,-3(6)      llamada reportar: salvar retorno en MP'-1
160:       LDA       6,-2(6)      llamada reportar: activar nuevo marco MP'
161:       LDA       7,-98(7)      llamada: saltar a funcion reportar
*      <- llamada: reportar
152:       LDA       7,9(7)      if: jmp hacia el final
*      <- if
*      Fin de la ejecucion.
162:       HALT       0,0,0      


