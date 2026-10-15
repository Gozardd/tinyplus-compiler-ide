
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Salto al inicio del programa principal
*      -> funcion: llamaAdelante
*      -> return
*      -> llamada: adyacente
*      -> Operacion: mas
*      -> identificador
3:       LD       0,1(6)      cargar valor de identificador: x [param local x en MP+1]
*      <- identificador
4:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
5:       LDC       0,1(0)      cargar constante: 1
*      <- constante
6:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
7:       ADD       0,1,0      op: +
*      <- Operacion: mas
8:       ST       0,-2(6)      llamada adyacente: push arg 1
9:       ST       6,-3(6)      llamada adyacente: salvar Old MP en MP'-0
10:       LDA       2,3(7)      llamada adyacente: calcular direccion de retorno
11:       ST       2,-4(6)      llamada adyacente: salvar retorno en MP'-1
12:       LDA       6,-3(6)      llamada adyacente: activar nuevo marco MP'
*      <- llamada: adyacente
*      return: salir de funcion
14:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
15:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
16:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      epilogo por defecto de funcion/procedimiento llamaAdelante
17:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
18:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
19:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: llamaAdelante
*      -> funcion: adyacente
*      -> return
*      -> Operacion: por
*      -> identificador
20:       LD       0,1(6)      cargar valor de identificador: y [param local y en MP+1]
*      <- identificador
21:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
22:       LDC       0,10(0)      cargar constante: 10
*      <- constante
23:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
24:       MUL       0,1,0      op: *
*      <- Operacion: por
*      return: salir de funcion
25:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
26:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
27:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      epilogo por defecto de funcion/procedimiento adyacente
28:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
29:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
30:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: adyacente
*      -> funcion: suma
*      -> return
*      -> Operacion: mas
*      -> identificador
31:       LD       0,2(6)      cargar valor de identificador: a [param local a en MP+2]
*      <- identificador
32:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> identificador
33:       LD       0,1(6)      cargar valor de identificador: b [param local b en MP+1]
*      <- identificador
34:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
35:       ADD       0,1,0      op: +
*      <- Operacion: mas
*      return: salir de funcion
36:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
37:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
38:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      epilogo por defecto de funcion/procedimiento suma
39:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
40:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
41:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: suma
*      -> funcion: mostrarDoble
*      -> escribir
*      -> Operacion: por
*      -> identificador
42:       LD       0,1(6)      cargar valor de identificador: n [param local n en MP+1]
*      <- identificador
43:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
44:       LDC       0,2(0)      cargar constante: 2
*      <- constante
45:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
46:       MUL       0,1,0      op: *
*      <- Operacion: por
47:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      epilogo por defecto de funcion/procedimiento mostrarDoble
48:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
49:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
50:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: mostrarDoble
13:       LDA       7,6(7)      parchear llamada hacia adelante a adyacente
2:       LDA       7,48(7)      salto al programa principal (main)
*      -> asignacion
*      -> llamada: llamaAdelante
*      -> constante
51:       LDC       0,5(0)      cargar constante: 5
*      <- constante
52:       ST       0,0(6)      llamada llamaAdelante: push arg 1
53:       ST       6,-1(6)      llamada llamaAdelante: salvar Old MP en MP'-0
54:       LDA       2,3(7)      llamada llamaAdelante: calcular direccion de retorno
55:       ST       2,-2(6)      llamada llamaAdelante: salvar retorno en MP'-1
56:       LDA       6,-1(6)      llamada llamaAdelante: activar nuevo marco MP'
57:       LDA       7,-55(7)      llamada: saltar a funcion llamaAdelante
*      <- llamada: llamaAdelante
58:       ST       0,0(5)      asignacion: almaceno el valor para el id resA [global resA en GP+0]
*      <- asignacion
*      -> escribir
*      -> identificador
59:       LD       0,0(5)      cargar valor de identificador: resA [global resA en GP+0]
*      <- identificador
60:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> asignacion
*      -> llamada: suma
*      -> llamada: suma
*      -> constante
61:       LDC       0,1(0)      cargar constante: 1
*      <- constante
62:       ST       0,0(6)      llamada suma: push arg 1
*      -> constante
63:       LDC       0,2(0)      cargar constante: 2
*      <- constante
64:       ST       0,-1(6)      llamada suma: push arg 2
65:       ST       6,-2(6)      llamada suma: salvar Old MP en MP'-0
66:       LDA       2,3(7)      llamada suma: calcular direccion de retorno
67:       ST       2,-3(6)      llamada suma: salvar retorno en MP'-1
68:       LDA       6,-2(6)      llamada suma: activar nuevo marco MP'
69:       LDA       7,-39(7)      llamada: saltar a funcion suma
*      <- llamada: suma
70:       ST       0,0(6)      llamada suma: push arg 1
*      -> constante
71:       LDC       0,7(0)      cargar constante: 7
*      <- constante
72:       ST       0,-1(6)      llamada suma: push arg 2
73:       ST       6,-2(6)      llamada suma: salvar Old MP en MP'-0
74:       LDA       2,3(7)      llamada suma: calcular direccion de retorno
75:       ST       2,-3(6)      llamada suma: salvar retorno en MP'-1
76:       LDA       6,-2(6)      llamada suma: activar nuevo marco MP'
77:       LDA       7,-47(7)      llamada: saltar a funcion suma
*      <- llamada: suma
78:       ST       0,1(5)      asignacion: almaceno el valor para el id resB [global resB en GP+1]
*      <- asignacion
*      -> escribir
*      -> identificador
79:       LD       0,1(5)      cargar valor de identificador: resB [global resB en GP+1]
*      <- identificador
80:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> llamada: mostrarDoble
*      -> constante
81:       LDC       0,50(0)      cargar constante: 50
*      <- constante
82:       ST       0,0(6)      llamada mostrarDoble: push arg 1
83:       ST       6,-1(6)      llamada mostrarDoble: salvar Old MP en MP'-0
84:       LDA       2,3(7)      llamada mostrarDoble: calcular direccion de retorno
85:       ST       2,-2(6)      llamada mostrarDoble: salvar retorno en MP'-1
86:       LDA       6,-1(6)      llamada mostrarDoble: activar nuevo marco MP'
87:       LDA       7,-46(7)      llamada: saltar a funcion mostrarDoble
*      <- llamada: mostrarDoble
*      Fin de la ejecucion.
88:       HALT       0,0,0      


