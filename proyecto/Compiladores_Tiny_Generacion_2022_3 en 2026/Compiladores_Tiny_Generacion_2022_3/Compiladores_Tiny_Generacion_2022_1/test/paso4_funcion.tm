
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      Salto al inicio del programa principal
*      -> funcion: duplicar
*      -> return
*      -> Operacion: por
*      -> identificador
3:       LD       0,1(6)      cargar valor de identificador: n [param local n en MP+1]
*      <- identificador
4:       ST       0,-2(6)      op: push en la pila tmp el resultado expresion izquierda
*      -> constante
5:       LDC       0,2(0)      cargar constante: 2
*      <- constante
6:       LD       1,-2(6)      op: pop o cargo de la pila el valor izquierdo en AC1
7:       MUL       0,1,0      op: *
*      <- Operacion: por
*      return: salir de funcion
8:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
9:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
10:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- return
*      epilogo por defecto de funcion/procedimiento duplicar
11:       LD       2,-1(6)      epilogo: reg[2] = retorno desde MP-1
12:       LD       6,0(6)      epilogo: restaurar Old MP desde MP+0
13:       LDA       7,0(2)      epilogo: saltar a retorno reg[2]
*      <- funcion: duplicar
2:       LDA       7,11(7)      salto al programa principal (main)
*      -> asignacion
*      -> llamada: duplicar
*      -> constante
14:       LDC       0,21(0)      cargar constante: 21
*      <- constante
15:       ST       0,0(6)      llamada duplicar: push arg 1
16:       ST       6,-1(6)      llamada duplicar: salvar Old MP en MP'-0
17:       LDA       2,3(7)      llamada duplicar: calcular direccion de retorno
18:       ST       2,-2(6)      llamada duplicar: salvar retorno en MP'-1
19:       LDA       6,-1(6)      llamada duplicar: activar nuevo marco MP'
20:       LDA       7,-18(7)      llamada: saltar a funcion duplicar
*      <- llamada: duplicar
21:       ST       0,0(5)      asignacion: almaceno el valor para el id valor [global valor en GP+0]
*      <- asignacion
*      -> escribir
*      -> identificador
22:       LD       0,0(5)      cargar valor de identificador: valor [global valor en GP+0]
*      <- identificador
23:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
24:       HALT       0,0,0      


