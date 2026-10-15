package ve.edu.unet;

import ve.edu.unet.nodosAST.*;
import java.util.Map;
import java.util.HashMap;

public class Generador {
	/* Ilustracion de la disposicion de la memoria en
	 * este ambiente de ejecucion para el lenguaje Tiny
	 *
	 * |t1	|<- mp (Maxima posicion de memoria de la TM)
	 * |t1	|<- desplazamientoTmp (tope actual)
	 * |free|
	 * |free|
	 * |...	|
	 * |x	|
	 * |y	|<- gp
	 * 
	 * */
	
	/* desplazamientoTmp es una variable inicializada en 0
	 * y empleada como el desplazamiento de la siguiente localidad
	 * temporal disponible desde la parte superior o tope de la memoria
	 * (la que apunta el registro MP).
	 */
	private static int desplazamientoTmp = 0;
	private static TablaSimbolos tablaSimbolos = null;

	/* Mapa de parametros formales de la funcion activa (vacio en el main)
	 * Asocia nombre_parametro -> offset positivo relativo a MP (K - i + 1)
	 */
	private static Map<String, Integer> paramsActuales = new HashMap<String, Integer>();
	
	public static void setTablaSimbolos(TablaSimbolos tabla){
		tablaSimbolos = tabla;
	}

	public static Map<String, Integer> getParamsActuales() {
		return paramsActuales;
	}
	
	public static void generarCodigoObjeto(NodoBase raiz){
		System.out.println();
		System.out.println();
		System.out.println("------ CODIGO OBJETO DEL LENGUAJE TINY GENERADO PARA LA TM ------");
		System.out.println();
		System.out.println();
		generarPreludioEstandar();
		generarSecuencia(raiz);
		/*Genero el codigo de finalizacion de ejecucion del codigo*/   
		UtGen.emitirComentario("Fin de la ejecucion.");
		UtGen.emitirRO("HALT", 0, 0, 0, "");
		System.out.println();
		System.out.println();
		System.out.println("------ FIN DEL CODIGO OBJETO DEL LENGUAJE TINY GENERADO PARA LA TM ------");
	}

	// Recorre una secuencia enlazada de sentencias u operaciones (hermanos a la derecha)
	public static void generarSecuencia(NodoBase nodo){
		while (nodo != null) {
			generarNodo(nodo);
			nodo = nodo.getHermanoDerecha();
		}
	}
	
	// Metodo de compatibilidad hacia atras
	private static void generar(NodoBase nodo){
		generarSecuencia(nodo);
	}

	// Despacha la generacion de un nodo individual SIN seguir a sus hermanos
	private static void generarNodo(NodoBase nodo){
		if(nodo == null) return;
		if(tablaSimbolos == null){
			System.out.println("ERROR: por favor fije la tabla de simbolos a usar antes de generar codigo objeto!!!");
			return;
		}

		if (nodo instanceof NodoIf){
			generarIf(nodo);
		}else if (nodo instanceof NodoRepeat){
			generarRepeat(nodo);
		}else if (nodo instanceof NodoAsignacion){
			generarAsignacion(nodo);
		}else if (nodo instanceof NodoLeer){
			generarLeer(nodo);
		}else if (nodo instanceof NodoEscribir){
			generarEscribir(nodo);
		}else if (nodo instanceof NodoValor){
			generarValor(nodo);
		}else if (nodo instanceof NodoBooleano){
			generarBooleano(nodo);
		}else if (nodo instanceof NodoIdentificador){
			generarIdentificador(nodo);
		}else if (nodo instanceof NodoArreglo){
			generarArreglo(nodo);
		}else if (nodo instanceof NodoOperacion){
			generarOperacion(nodo);
		}else if (nodo instanceof NodoDeclaracion){
			/* Las declaraciones reservan espacio en la tabla de simbolos;
			 * no emiten codigo ejecutable en tiempo de corrida. */
		}else{
			System.out.println("BUG: Tipo de nodo a generar desconocido: " + nodo.getClass().getSimpleName());
		}
	}

	/* Helpers de acceso a variables escalares: consulta primero parametros locales (MP)
	 * y luego la tabla de simbolos global (GP). */
	public static void emitirCargaVar(String nombre, String comentario) {
		if (paramsActuales.containsKey(nombre)) {
			int offset = paramsActuales.get(nombre);
			UtGen.emitirRM("LD", UtGen.AC, offset, UtGen.MP, comentario + " [param local " + nombre + " en MP+" + offset + "]");
		} else {
			int direccion = tablaSimbolos.getDireccion(nombre);
			UtGen.emitirRM("LD", UtGen.AC, direccion, UtGen.GP, comentario + " [global " + nombre + " en GP+" + direccion + "]");
		}
	}

	public static void emitirGuardaVar(String nombre, String comentario) {
		if (paramsActuales.containsKey(nombre)) {
			int offset = paramsActuales.get(nombre);
			UtGen.emitirRM("ST", UtGen.AC, offset, UtGen.MP, comentario + " [param local " + nombre + " en MP+" + offset + "]");
		} else {
			int direccion = tablaSimbolos.getDireccion(nombre);
			UtGen.emitirRM("ST", UtGen.AC, direccion, UtGen.GP, comentario + " [global " + nombre + " en GP+" + direccion + "]");
		}
	}

	private static void generarIf(NodoBase nodo){
		NodoIf n = (NodoIf)nodo;
		int localidadSaltoElse, localidadSaltoEnd, localidadActual;
		if(UtGen.debug) UtGen.emitirComentario("-> if");
		/* Genero el codigo para la expresion de prueba del IF */
		generarNodo(n.getPrueba());
		localidadSaltoElse = UtGen.emitirSalto(1);
		UtGen.emitirComentario("If: el salto hacia el else debe estar aqui");
		/* Genero la secuencia THEN */
		generarSecuencia(n.getParteThen());
		localidadSaltoEnd = UtGen.emitirSalto(1);
		UtGen.emitirComentario("If: el salto hacia el final debe estar aqui");
		localidadActual = UtGen.emitirSalto(0);
		UtGen.cargarRespaldo(localidadSaltoElse);
		UtGen.emitirRM_Abs("JEQ", UtGen.AC, localidadActual, "if: jmp hacia else");
		UtGen.restaurarRespaldo();
		/* Genero la secuencia ELSE */
		if(n.getParteElse() != null){
			generarSecuencia(n.getParteElse());
			localidadActual = UtGen.emitirSalto(0);
			UtGen.cargarRespaldo(localidadSaltoEnd);
			UtGen.emitirRM_Abs("LDA", UtGen.PC, localidadActual, "if: jmp hacia el final");
			UtGen.restaurarRespaldo();
		}
		
		if(UtGen.debug) UtGen.emitirComentario("<- if");
	}
	
	private static void generarRepeat(NodoBase nodo){
		NodoRepeat n = (NodoRepeat)nodo;
		int localidadSaltoInicio;
		if(UtGen.debug) UtGen.emitirComentario("-> repeat");
		localidadSaltoInicio = UtGen.emitirSalto(0);
		UtGen.emitirComentario("repeat: el salto hacia el inicio del repeat");
		/* Genero el cuerpo del repeat (secuencia de sentencias) */
		generarSecuencia(n.getCuerpo());
		/* Genero el codigo de la prueba del repeat (expresion individual) */
		generarNodo(n.getPrueba());
		UtGen.emitirRM_Abs("JEQ", UtGen.AC, localidadSaltoInicio, "repeat: jmp hacia el inicio del cuerpo");
		if(UtGen.debug) UtGen.emitirComentario("<- repeat");
	}		
	
	private static void generarAsignacion(NodoBase nodo){
		NodoAsignacion n = (NodoAsignacion)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> asignacion");		
		if (n.esArreglo()) {
			/* Asignacion a elemento de arreglo: id[indice] := expr */
			/* 1. Evaluar la expresion RHS (queda en AC) */
			generarNodo(n.getExpresion());
			/* 2. Guardar el valor RHS en la pseudo pila temporal */
			UtGen.emitirRM("ST", UtGen.AC, desplazamientoTmp--, UtGen.MP, "asig arreglo: push RHS en pila tmp");
			/* 3. Evaluar la expresion del indice (queda en AC) */
			generarNodo(n.getIndiceArreglo());
			/* 4. Calcular direccion efectiva en reg[2] = index (AC) + GP */
			UtGen.emitirRO("ADD", 2, UtGen.AC, UtGen.GP, "asig arreglo: reg[2] = index + GP");
			/* 5. Restaurar valor RHS de la pseudo pila a AC */
			UtGen.emitirRM("LD", UtGen.AC, ++desplazamientoTmp, UtGen.MP, "asig arreglo: pop RHS de pila tmp a AC");
			/* 6. Almacenar el valor en dMem[dirBase + reg[2]] */
			int dirBase = tablaSimbolos.getDireccion(n.getIdentificador());
			UtGen.emitirRM("ST", UtGen.AC, dirBase, 2, "asig arreglo: dMem[" + dirBase + " + reg[2]] = reg[AC]");
		} else {
			/* Genero el codigo para la expresion a la derecha de la asignacion */
			generarNodo(n.getExpresion());
			/* Ahora almaceno el valor resultante */
			emitirGuardaVar(n.getIdentificador(), "asignacion: almaceno el valor para el id " + n.getIdentificador());
		}
		if(UtGen.debug) UtGen.emitirComentario("<- asignacion");
	}
	
	private static void generarLeer(NodoBase nodo){
		NodoLeer n = (NodoLeer)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> leer");
		UtGen.emitirRO("IN", UtGen.AC, 0, 0, "leer: lee un valor entero ");
		emitirGuardaVar(n.getIdentificador(), "leer: almaceno el valor entero leido en el id " + n.getIdentificador());
		if(UtGen.debug) UtGen.emitirComentario("<- leer");
	}
	
	private static void generarEscribir(NodoBase nodo){
		NodoEscribir n = (NodoEscribir)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> escribir");
		/* Genero el codigo de la expresion que va a ser escrita en pantalla */
		generarNodo(n.getExpresion());
		/* Ahora genero la salida */
		UtGen.emitirRO("OUT", UtGen.AC, 0, 0, "escribir: genero la salida de la expresion");
		if(UtGen.debug) UtGen.emitirComentario("<- escribir");
	}
	
	private static void generarValor(NodoBase nodo){
		NodoValor n = (NodoValor)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> constante");
		UtGen.emitirRM("LDC", UtGen.AC, n.getValor(), 0, "cargar constante: " + n.getValor());
		if(UtGen.debug) UtGen.emitirComentario("<- constante");
	}

	private static void generarBooleano(NodoBase nodo){
		NodoBooleano n = (NodoBooleano)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> booleano");
		int val = n.getValor() ? 1 : 0;
		UtGen.emitirRM("LDC", UtGen.AC, val, 0, "cargar constante booleana: " + n.getValor());
		if(UtGen.debug) UtGen.emitirComentario("<- booleano");
	}
	
	private static void generarIdentificador(NodoBase nodo){
		NodoIdentificador n = (NodoIdentificador)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> identificador");
		emitirCargaVar(n.getNombre(), "cargar valor de identificador: " + n.getNombre());
		if(UtGen.debug) UtGen.emitirComentario("<- identificador");
	}

	private static void generarArreglo(NodoBase nodo){
		NodoArreglo n = (NodoArreglo)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> arreglo: " + n.getNombre());
		/* Evaluar la expresion del indice (queda en AC) */
		generarNodo(n.getIndice());
		/* Calcular direccion efectiva en reg[2] = index (AC) + GP */
		UtGen.emitirRO("ADD", 2, UtGen.AC, UtGen.GP, "arreglo: reg[2] = index + GP");
		/* Cargar valor desde dMem[dirBase + reg[2]] en AC */
		int dirBase = tablaSimbolos.getDireccion(n.getNombre());
		UtGen.emitirRM("LD", UtGen.AC, dirBase, 2, "arreglo: cargar dMem[" + dirBase + " + reg[2]] en AC");
		if(UtGen.debug) UtGen.emitirComentario("<- arreglo: " + n.getNombre());
	}

	private static void generarOperacion(NodoBase nodo){
		NodoOperacion n = (NodoOperacion) nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> Operacion: " + n.getOperacion());
		/* Genero la expresion izquierda de la operacion */
		generarNodo(n.getOpIzquierdo());
		/* Almaceno en la pseudo pila de valores temporales el valor de la operacion izquierda */
		UtGen.emitirRM("ST", UtGen.AC, desplazamientoTmp--, UtGen.MP, "op: push en la pila tmp el resultado expresion izquierda");
		/* Genero la expresion derecha de la operacion */
		generarNodo(n.getOpDerecho());
		/* Ahora cargo/saco de la pila el valor izquierdo */
		UtGen.emitirRM("LD", UtGen.AC1, ++desplazamientoTmp, UtGen.MP, "op: pop o cargo de la pila el valor izquierdo en AC1");
		switch(n.getOperacion()){
			case mas:   UtGen.emitirRO("ADD", UtGen.AC, UtGen.AC1, UtGen.AC, "op: +");		
						break;
			case menos: UtGen.emitirRO("SUB", UtGen.AC, UtGen.AC1, UtGen.AC, "op: -");
						break;
			case por:   UtGen.emitirRO("MUL", UtGen.AC, UtGen.AC1, UtGen.AC, "op: *");
						break;
			case entre: UtGen.emitirRO("DIV", UtGen.AC, UtGen.AC1, UtGen.AC, "op: /");
						break;		
			case menor: UtGen.emitirRO("SUB", UtGen.AC, UtGen.AC1, UtGen.AC, "op: <");
						UtGen.emitirRM("JLT", UtGen.AC, 2, UtGen.PC, "voy dos instrucciones mas alla if verdadero (AC<0)");
						UtGen.emitirRM("LDC", UtGen.AC, 0, UtGen.AC, "caso de falso (AC=0)");
						UtGen.emitirRM("LDA", UtGen.PC, 1, UtGen.PC, "Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)");
						UtGen.emitirRM("LDC", UtGen.AC, 1, UtGen.AC, "caso de verdadero (AC=1)");
						break;
			case igual: UtGen.emitirRO("SUB", UtGen.AC, UtGen.AC1, UtGen.AC, "op: ==");
						UtGen.emitirRM("JEQ", UtGen.AC, 2, UtGen.PC, "voy dos instrucciones mas alla if verdadero (AC==0)");
						UtGen.emitirRM("LDC", UtGen.AC, 0, UtGen.AC, "caso de falso (AC=0)");
						UtGen.emitirRM("LDA", UtGen.PC, 1, UtGen.PC, "Salto incondicional a direccion: PC+1 (es falso evito colocarlo verdadero)");
						UtGen.emitirRM("LDC", UtGen.AC, 1, UtGen.AC, "caso de verdadero (AC=1)");
						break;	
			default:
						UtGen.emitirComentario("BUG: tipo de operacion desconocida");
		}
		if(UtGen.debug) UtGen.emitirComentario("<- Operacion: " + n.getOperacion());
	}
	
	//TODO: enviar preludio a archivo de salida, obtener antes su nombre
	private static void generarPreludioEstandar(){
		UtGen.emitirComentario("Compilacion TINY para el codigo objeto TM");
		UtGen.emitirComentario("Archivo: "+ "NOMBRE_ARREGLAR");
		/* Genero inicializaciones del preludio estandar */
		UtGen.emitirComentario("Preludio estandar:");
		UtGen.emitirRM("LD", UtGen.MP, 0, UtGen.AC, "cargar la maxima direccion desde la localidad 0");
		UtGen.emitirRM("ST", UtGen.AC, 0, UtGen.AC, "limpio el registro de la localidad 0");
	}

}
