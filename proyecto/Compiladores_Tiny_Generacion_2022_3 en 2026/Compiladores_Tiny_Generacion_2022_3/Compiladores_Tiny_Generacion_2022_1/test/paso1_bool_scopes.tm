
*** Tabla de Simbolos ***
*      Compilacion TINY para el codigo objeto TM
*      Archivo: NOMBRE_ARREGLAR
*      Preludio estandar:
0:       LD       6,0(0)      cargar la maxima direccion desde la localidad 0
1:       ST       0,0(0)      limpio el registro de la localidad 0
*      -> asignacion
*      -> booleano
2:       LDC       0,1(0)      cargar constante booleana: true
*      <- booleano
3:       ST       0,0(5)      asignacion: almaceno el valor para el id activo [global activo en GP+0]
*      <- asignacion
*      -> if
*      -> identificador
4:       LD       0,0(5)      cargar valor de identificador: activo [global activo en GP+0]
*      <- identificador
*      If: el salto hacia el else debe estar aqui
*      -> asignacion
*      -> constante
6:       LDC       0,100(0)      cargar constante: 100
*      <- constante
7:       ST       0,1(5)      asignacion: almaceno el valor para el id resultado [global resultado en GP+1]
*      <- asignacion
*      If: el salto hacia el final debe estar aqui
5:       JEQ       0,3(7)      if: jmp hacia else
*      -> asignacion
*      -> constante
9:       LDC       0,200(0)      cargar constante: 200
*      <- constante
10:       ST       0,1(5)      asignacion: almaceno el valor para el id resultado [global resultado en GP+1]
*      <- asignacion
8:       LDA       7,2(7)      if: jmp hacia el final
*      <- if
*      -> escribir
*      -> identificador
11:       LD       0,1(5)      cargar valor de identificador: resultado [global resultado en GP+1]
*      <- identificador
12:       OUT       0,0,0      escribir: genero la salida de la expresion
*      <- escribir
*      Fin de la ejecucion.
13:       HALT       0,0,0      


