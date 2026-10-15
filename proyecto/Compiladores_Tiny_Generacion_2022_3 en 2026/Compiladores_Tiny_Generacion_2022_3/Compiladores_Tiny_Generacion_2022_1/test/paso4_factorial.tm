
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Salto al inicio del programa principal
*      -> funcion: fact
*      -> if
*      -> Operacion: igual
*      -> identificador
3:       LD       0,1(6)      cargar valor de identificador: n [param local n en MP+1]
*      <- identificador
4:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
5:       LDC       0,1(0)      cargar constante: 1
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
18:       LD       0,1(6)      cargar valor de identificador: n [param local n en MP+1]
*      <- identificador
19:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> llamada: fact
*      -> Operacion: menos
*      -> identificador
20:       LD       0,1(6)      cargar valor de identificador: n [param local n en MP+1]
*      <- identificador
21:       ST       0,-3(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
22:       LDC       0,1(0)      cargar constante: 1
*      <- constante
23:       LD       1,-3(6)      op: pop o cargo de la pila el valor izquierdo en AC1
24:       SUB       0,1,0      op: -
*      <- Operacion: menos
25:       ST       0,-3(6)      llamada fact: push arg 1
26:       ST       6,-4(6)      llamada fact: salvar Old MP en MP'-0
27:       LDA       2,3(7)      llamada fact: calcular direccion de retorno
28:       ST       2,-5(6)      llamada fact: salvar retorno en MP'-1
29:       LDA       6,-4(6)      llamada fact: activar nuevo marco MP'
30:       LDA       7,-28(7)      llamada: saltar a funcion fact
*      <- llamada: fact
31:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
32:       MUL       0,1,0      op: *
*      <- Operacion: por
*      return: salir de funcion
33:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
34:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
35:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
17:       LDA       7,18(7)      if: jmp hacia el final
*      <- if
*      epilogo por defecto de funcion/procedimiento fact
36:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
37:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
38:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: fact
2:       LDA       7,36(7)      salto al programa principal (main)
*      -> escribir
*      -> llamada: fact
*      -> constante
39:       LDC       0,5(0)      cargar constante: 5
*      <- constante
40:       ST       0,0(6)      llamada fact: push arg 1
41:       ST       6,-1(6)      llamada fact: salvar Old MP en MP'-0
42:       LDA       2,3(7)      llamada fact: calcular direccion de retorno
43:       ST       2,-2(6)      llamada fact: salvar retorno en MP'-1
44:       LDA       6,-1(6)      llamada fact: activar nuevo marco MP'
45:       LDA       7,-43(7)      llamada: saltar a funcion fact
*      <- llamada: fact
46:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
47:       HALT       0,0,0      


