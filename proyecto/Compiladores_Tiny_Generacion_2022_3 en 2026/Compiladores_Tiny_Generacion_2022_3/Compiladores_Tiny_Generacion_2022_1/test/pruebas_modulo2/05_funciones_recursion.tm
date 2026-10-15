
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Salto al inicio del programa principal
*      -> funcion: potencia
*      -> if
*      -> Operacion: igual
*      -> identificador
3:       LD       0,1(6)      cargar valor de identificador: exp [param local exp en MP+1]
*      <- identificador
4:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
5:       LDC       0,0(0)      cargar constante: 0
*      <- constante
6:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
7:       SUB       0,1,0      op: ==
8:       JEQ       0,2(7)      voy dos instrucciones mas alla if verdadero (AC==0)
9:       LDC       0,0(0)      caso de falso (AC=0)
10:       LDA       7,1(7)      Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)
11:       LDC       0,1(0)      caso de verdadero (AC=1)
*      <- Operacion: igual
*      If: el salto hacia el else debe estar aqui
*      -> return
*      -> constante
13:       LDC       0,1(0)      cargar constante: 1
*      <- constante
*      return: salir de funcion
14:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
15:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
16:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      If: el salto hacia el final debe estar aqui
12:       JEQ       0,5(7)      if: jmp hacia else
*      -> return
*      -> Operacion: por
*      -> identificador
18:       LD       0,2(6)      cargar valor de identificador: base [param local base en MP+2]
*      <- identificador
19:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> llamada: potencia
*      -> identificador
20:       LD       0,2(6)      cargar valor de identificador: base [param local base en MP+2]
*      <- identificador
21:       ST       0,-3(6)      llamada potencia: push arg 1
*      -> Operacion: menos
*      -> identificador
22:       LD       0,1(6)      cargar valor de identificador: exp [param local exp en MP+1]
*      <- identificador
23:       ST       0,-4(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
24:       LDC       0,1(0)      cargar constante: 1
*      <- constante
25:       LD       1,-4(6)      op: pop o cargo de la pila el valor izquierdo en AC1
26:       SUB       0,1,0      op: -
*      <- Operacion: menos
27:       ST       0,-4(6)      llamada potencia: push arg 2
28:       ST       6,-5(6)      llamada potencia: salvar Old MP en MP'-0
29:       LDA       2,3(7)      llamada potencia: calcular direccion de retorno
30:       ST       2,-6(6)      llamada potencia: salvar retorno en MP'-1
31:       LDA       6,-5(6)      llamada potencia: activar nuevo marco MP'
32:       LDA       7,-30(7)      llamada: saltar a funcion potencia
*      <- llamada: potencia
33:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
34:       MUL       0,1,0      op: *
*      <- Operacion: por
*      return: salir de funcion
35:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
36:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
37:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
17:       LDA       7,20(7)      if: jmp hacia el final
*      <- if
*      epilogo por defecto de funcion/procedimiento potencia
38:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
39:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
40:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: potencia
*      -> funcion: sumaTres
*      -> return
*      -> Operacion: mas
*      -> Operacion: mas
*      -> identificador
41:       LD       0,3(6)      cargar valor de identificador: a [param local a en MP+3]
*      <- identificador
42:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> identificador
43:       LD       0,2(6)      cargar valor de identificador: b [param local b en MP+2]
*      <- identificador
44:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
45:       ADD       0,1,0      op: +
*      <- Operacion: mas
46:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> identificador
47:       LD       0,1(6)      cargar valor de identificador: c [param local c en MP+1]
*      <- identificador
48:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
49:       ADD       0,1,0      op: +
*      <- Operacion: mas
*      return: salir de funcion
50:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
51:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
52:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      epilogo por defecto de funcion/procedimiento sumaTres
53:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
54:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
55:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: sumaTres
2:       LDA       7,53(7)      salto al programa principal (main)
*      -> asignacion
*      -> llamada: potencia
*      -> constante
56:       LDC       0,2(0)      cargar constante: 2
*      <- constante
57:       ST       0,0(6)      llamada potencia: push arg 1
*      -> constante
58:       LDC       0,5(0)      cargar constante: 5
*      <- constante
59:       ST       0,-1(6)      llamada potencia: push arg 2
60:       ST       6,-2(6)      llamada potencia: salvar Old MP en MP'-0
61:       LDA       2,3(7)      llamada potencia: calcular direccion de retorno
62:       ST       2,-3(6)      llamada potencia: salvar retorno en MP'-1
63:       LDA       6,-2(6)      llamada potencia: activar nuevo marco MP'
64:       LDA       7,-62(7)      llamada: saltar a funcion potencia
*      <- llamada: potencia
65:       ST       0,0(5)      asignacion: almaceno el valor para el id resPot [global resPot en GP+0]
*      <- asignacion
*      -> escribir
*      -> identificador
66:       LD       0,0(5)      cargar valor de identificador: resPot [global resPot en GP+0]
*      <- identificador
67:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      -> asignacion
*      -> llamada: sumaTres
*      -> constante
68:       LDC       0,10(0)      cargar constante: 10
*      <- constante
69:       ST       0,0(6)      llamada sumaTres: push arg 1
*      -> constante
70:       LDC       0,20(0)      cargar constante: 20
*      <- constante
71:       ST       0,-1(6)      llamada sumaTres: push arg 2
*      -> constante
72:       LDC       0,30(0)      cargar constante: 30
*      <- constante
73:       ST       0,-2(6)      llamada sumaTres: push arg 3
74:       ST       6,-3(6)      llamada sumaTres: salvar Old MP en MP'-0
75:       LDA       2,3(7)      llamada sumaTres: calcular direccion de retorno
76:       ST       2,-4(6)      llamada sumaTres: salvar retorno en MP'-1
77:       LDA       6,-3(6)      llamada sumaTres: activar nuevo marco MP'
78:       LDA       7,-38(7)      llamada: saltar a funcion sumaTres
*      <- llamada: sumaTres
79:       ST       0,1(5)      asignacion: almaceno el valor para el id resSum [global resSum en GP+1]
*      <- asignacion
*      -> escribir
*      -> identificador
80:       LD       0,1(5)      cargar valor de identificador: resSum [global resSum en GP+1]
*      <- identificador
81:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
82:       HALT       0,0,0      


