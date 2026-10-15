package ve.edu.unet;

import ve.edu.unet.nodosAST.*;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ArrayList;

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
	private static Map<String, TipoDato> tiposParamsActuales = new HashMap<String, TipoDato>();

	/* Tabla de literales de cadena en dMem:
	 * Asocia texto -> direccion fija en dMem despues de variables globales
	 */
	private static Map<String, Integer> tablaCadenas = new LinkedHashMap<String, Integer>();
	private static int siguienteDirCadena = 0;

	/* Registro de direcciones de entrada (PC) de cada funcion */
	private static Map<String, Integer> direccionesFunciones = new HashMap<String, Integer>();

	/* Estructura para resolver llamadas hacia adelante (backpatching) */
	private static class LlamadaPendiente {
		int locSalto;
		String nombreFuncion;
		public LlamadaPendiente(int locSalto, String nombreFuncion) {
			this.locSalto = locSalto;
			this.nombreFuncion = nombreFuncion;
		}
	}
	private static List<LlamadaPendiente> llamadasPendientes = new ArrayList<LlamadaPendiente>();
	
	public static void setTablaSimbolos(TablaSimbolos tabla){
		tablaSimbolos = tabla;
	}

	public static Map<String, Integer> getParamsActuales() {
		return paramsActuales;
	}

	public static Map<String, TipoDato> getTiposParamsActuales() {
		return tiposParamsActuales;
	}

	public static Map<String, Integer> getTablaCadenas() {
		return tablaCadenas;
	}

	public static Map<String, Integer> getDireccionesFunciones() {
		return direccionesFunciones;
	}

	public static TipoDato inferirTipo(NodoBase nodo) {
		if (nodo == null) return null;
		if (nodo instanceof NodoValor) return TipoDato.INT;
		if (nodo instanceof NodoBooleano) return TipoDato.BOOL;
		if (nodo instanceof NodoCadena) return TipoDato.STRING;
		if (nodo instanceof NodoIdentificador) {
			String nombreId = ((NodoIdentificador) nodo).getNombre();
			if (tiposParamsActuales.containsKey(nombreId)) {
				return tiposParamsActuales.get(nombreId);
			}
			return tablaSimbolos != null ? tablaSimbolos.getTipo(nombreId) : null;
		}
		if (nodo instanceof NodoArreglo) {
			return tablaSimbolos != null ? tablaSimbolos.getTipo(((NodoArreglo) nodo).getNombre()) : null;
		}
		if (nodo instanceof NodoLlamada) {
			return tablaSimbolos != null ? tablaSimbolos.getTipo(((NodoLlamada) nodo).getNombreFuncion()) : null;
		}
		if (nodo instanceof NodoOperacion) {
			NodoOperacion op = (NodoOperacion) nodo;
			if (op.getOperacion() == tipoOp.menor || op.getOperacion() == tipoOp.igual) {
				return TipoDato.BOOL;
			}
			return TipoDato.INT;
		}
		return null;
	}

	private static void recolectarCadenas(NodoBase nodo) {
		while (nodo != null) {
			if (nodo instanceof NodoCadena) {
				String texto = ((NodoCadena) nodo).getValor();
				if (!tablaCadenas.containsKey(texto)) {
					tablaCadenas.put(texto, siguienteDirCadena);
					siguienteDirCadena += texto.length() + 1;
				}
			} else if (nodo instanceof NodoIf) {
				recolectarCadenas(((NodoIf) nodo).getPrueba());
				recolectarCadenas(((NodoIf) nodo).getParteThen());
				recolectarCadenas(((NodoIf) nodo).getParteElse());
			} else if (nodo instanceof NodoRepeat) {
				recolectarCadenas(((NodoRepeat) nodo).getCuerpo());
				recolectarCadenas(((NodoRepeat) nodo).getPrueba());
			} else if (nodo instanceof NodoAsignacion) {
				recolectarCadenas(((NodoAsignacion) nodo).getIndiceArreglo());
				recolectarCadenas(((NodoAsignacion) nodo).getExpresion());
			} else if (nodo instanceof NodoEscribir) {
				recolectarCadenas(((NodoEscribir) nodo).getExpresion());
			} else if (nodo instanceof NodoOperacion) {
				recolectarCadenas(((NodoOperacion) nodo).getOpIzquierdo());
				recolectarCadenas(((NodoOperacion) nodo).getOpDerecho());
			} else if (nodo instanceof NodoFuncion) {
				recolectarCadenas(((NodoFuncion) nodo).getCuerpo());
			} else if (nodo instanceof NodoLlamada) {
				recolectarCadenas(((NodoLlamada) nodo).getListaArgumentos());
			} else if (nodo instanceof NodoReturn) {
				recolectarCadenas(((NodoReturn) nodo).getExpresionRetorno());
			} else if (nodo instanceof NodoArreglo) {
				recolectarCadenas(((NodoArreglo) nodo).getIndice());
			}
			nodo = nodo.getHermanoDerecha();
		}
	}
	
	public static void generarCodigoObjeto(NodoBase raiz){
		System.out.println();
		System.out.println();
		System.out.println("------ CODIGO OBJETO DEL LENGUAJE TINY GENERADO PARA LA TM ------");
		System.out.println();
		System.out.println();
		UtGen.reiniciar();
		desplazamientoTmp = 0;
		paramsActuales.clear();
		tablaCadenas.clear();
		siguienteDirCadena = tablaSimbolos != null ? tablaSimbolos.getTamanoGlobal() : 0;
		recolectarCadenas(raiz);
		generarPreludioEstandar();

		// Salto inicial para evitar ejecutar funciones de manera secuencial
		int saltoMain = UtGen.emitirSalto(1);
		UtGen.emitirComentario("Salto al inicio del programa principal");

		// Fase A: Compilar todas las funciones y procedimientos declarados a nivel raiz
		direccionesFunciones.clear();
		llamadasPendientes.clear();

		NodoBase actual = raiz;
		while (actual != null) {
			if (actual instanceof NodoFuncion) {
				generarFuncion((NodoFuncion) actual);
			}
			actual = actual.getHermanoDerecha();
		}

		// Parchear llamadas hacia adelante pendientes
		parchearLlamadasPendientes();

		// Parchear saltoMain hacia la primera instruccion del programa principal (main)
		int dirMain = UtGen.emitirSalto(0);
		UtGen.cargarRespaldo(saltoMain);
		UtGen.emitirRM_Abs("LDA", UtGen.PC, dirMain, "salto al programa principal (main)");
		UtGen.restaurarRespaldo();

		// Fase B: Generar sentencias del main (todo lo que no sea declaracion ni funcion)
		desplazamientoTmp = 0;
		paramsActuales.clear();
		actual = raiz;
		while (actual != null) {
			if (!(actual instanceof NodoDeclaracion) && !(actual instanceof NodoFuncion)) {
				generarNodo(actual);
			}
			actual = actual.getHermanoDerecha();
		}

		/* Genero el codigo de finalizacion de ejecucion del codigo */
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
		}else if (nodo instanceof NodoCadena){
			generarCadena(nodo);
		}else if (nodo instanceof NodoIdentificador){
			generarIdentificador(nodo);
		}else if (nodo instanceof NodoArreglo){
			generarArreglo(nodo);
		}else if (nodo instanceof NodoFuncion){
			/* Las funciones se compilan en la Fase A de generarCodigoObjeto */
		}else if (nodo instanceof NodoLlamada){
			generarLlamada(nodo);
		}else if (nodo instanceof NodoReturn){
			generarReturn(nodo);
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
		TipoDato tipoExp = inferirTipo(n.getExpresion());
		if (tipoExp == TipoDato.STRING) {
			/* Bucle de salida para cadenas: imprime caracter a caracter hasta terminador 0 */
			UtGen.emitirComentario("escribir cadena: bucle caracter a caracter");
			UtGen.emitirRM("LD", UtGen.AC1, 0, UtGen.AC, "str: cargar char actual dMem[reg[0]] en AC1");
			UtGen.emitirRM("JEQ", UtGen.AC1, 3, UtGen.PC, "str: si char==0 saltar al fin del bucle");
			UtGen.emitirRO("OUT", UtGen.AC1, 0, 0, "str: imprimir caracter");
			UtGen.emitirRM("LDA", UtGen.AC, 1, UtGen.AC, "str: avanzar puntero p = p + 1");
			UtGen.emitirRM("LDA", UtGen.PC, -5, UtGen.PC, "str: repetir bucle");
			UtGen.emitirComentario("escribir cadena: fin del bucle");
		} else {
			/* Ahora genero la salida numerica/booleana normal */
			UtGen.emitirRO("OUT", UtGen.AC, 0, 0, "escribir: genero la salida de la expresion");
		}
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

	private static void generarCadena(NodoBase nodo){
		NodoCadena n = (NodoCadena)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> cadena literal");
		int dir = tablaCadenas.containsKey(n.getValor()) ? tablaCadenas.get(n.getValor()) : 0;
		UtGen.emitirRM("LDC", UtGen.AC, dir, 0, "cargar direccion de cadena: \"" + n.getValor() + "\"");
		if(UtGen.debug) UtGen.emitirComentario("<- cadena literal");
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
	
	private static void generarFuncion(NodoFuncion f){
		if(UtGen.debug) UtGen.emitirComentario("-> funcion: " + f.getNombre());
		int entryPC = UtGen.emitirSalto(0);
		direccionesFunciones.put(f.getNombre(), entryPC);

		// Guardar estado del llamador
		int prevDesplazamientoTmp = desplazamientoTmp;
		Map<String, Integer> prevParams = paramsActuales;
		Map<String, TipoDato> prevTipos = tiposParamsActuales;

		// Contar parametros formales K
		List<String> nombresParams = new ArrayList<String>();
		tiposParamsActuales = new HashMap<String, TipoDato>();
		NodoBase p = f.getListaParametros();
		while (p != null) {
			if (p instanceof NodoDeclaracion) {
				NodoDeclaracion nd = (NodoDeclaracion) p;
				nombresParams.add(nd.getVariable());
				tiposParamsActuales.put(nd.getVariable(), nd.getTipo());
			}
			p = p.getHermanoDerecha();
		}
		int K = nombresParams.size();

		// Mapear cada parametro: param_i (1-indexed) esta en MP + (K - i + 1)
		paramsActuales = new HashMap<String, Integer>();
		for (int i = 0; i < K; i++) {
			int offset = K - (i + 1) + 1; // K - i
			paramsActuales.put(nombresParams.get(i), offset);
		}

		// Temporales locales de la funcion comienzan en MP - 2
		// (MP+0 es Old MP, MP-1 es Return PC)
		desplazamientoTmp = -2;

		// Generar cuerpo de la funcion
		generarSecuencia(f.getCuerpo());

		// Epilogo obligatorio (procedimientos o funciones sin return explícito al final)
		emitirEpilogoFuncion("epilogo por defecto de funcion/procedimiento " + f.getNombre());

		// Restaurar estado del llamador
		desplazamientoTmp = prevDesplazamientoTmp;
		paramsActuales = prevParams;
		tiposParamsActuales = prevTipos;

		if(UtGen.debug) UtGen.emitirComentario("<- funcion: " + f.getNombre());
	}

	private static void emitirEpilogoFuncion(String comentario){
		UtGen.emitirComentario(comentario);
		UtGen.emitirRM("LD", 2, -1, UtGen.MP, "epilogo: reg[2] = retorno desde MP-1");
		UtGen.emitirRM("LD", UtGen.MP, 0, UtGen.MP, "epilogo: restaurar Old MP desde MP+0");
		UtGen.emitirRM("LDA", UtGen.PC, 0, 2, "epilogo: saltar a retorno reg[2]");
	}

	private static void generarReturn(NodoBase nodo){
		NodoReturn n = (NodoReturn)nodo;
		if(UtGen.debug) UtGen.emitirComentario("-> return");
		if (n.getExpresionRetorno() != null) {
			generarNodo(n.getExpresionRetorno()); // el valor a retornar queda en AC (reg 0)
		}
		emitirEpilogoFuncion("return: salir de funcion");
		if(UtGen.debug) UtGen.emitirComentario("<- return");
	}

	private static void generarLlamada(NodoBase nodo){
		NodoLlamada n = (NodoLlamada)nodo;
		String nombre = n.getNombreFuncion();
		if(UtGen.debug) UtGen.emitirComentario("-> llamada: " + nombre);

		int d0 = desplazamientoTmp;

		// 1. Evaluar y apilar cada argumento (en orden de izquierda a derecha)
		NodoBase arg = n.getListaArgumentos();
		int K = 0;
		while (arg != null) {
			generarNodo(arg);
			UtGen.emitirRM("ST", UtGen.AC, desplazamientoTmp--, UtGen.MP, "llamada " + nombre + ": push arg " + (K + 1));
			K++;
			arg = arg.getHermanoDerecha();
		}

		// 2. Salvar enlace de control (Old MP) en d0 - K
		UtGen.emitirRM("ST", UtGen.MP, d0 - K, UtGen.MP, "llamada " + nombre + ": salvar Old MP en MP'-0");

		// 3. Salvar direccion de retorno y activar nuevo MP'
		// LDA 2, 3(PC): calcula direccion de instruccion de retorno (3 instrucciones abajo)
		UtGen.emitirRM("LDA", 2, 3, UtGen.PC, "llamada " + nombre + ": calcular direccion de retorno");
		UtGen.emitirRM("ST", 2, d0 - K - 1, UtGen.MP, "llamada " + nombre + ": salvar retorno en MP'-1");
		UtGen.emitirRM("LDA", UtGen.MP, d0 - K, UtGen.MP, "llamada " + nombre + ": activar nuevo marco MP'");

		// 4. Salto a la funcion (directo o con registro de salto pendiente)
		if (direccionesFunciones.containsKey(nombre)) {
			int target = direccionesFunciones.get(nombre);
			UtGen.emitirRM_Abs("LDA", UtGen.PC, target, "llamada: saltar a funcion " + nombre);
		} else {
			int locSalto = UtGen.emitirSalto(1);
			llamadasPendientes.add(new LlamadaPendiente(locSalto, nombre));
		}

		// 5. Restaurar desplazamientoTmp al volver
		desplazamientoTmp = d0;

		if(UtGen.debug) UtGen.emitirComentario("<- llamada: " + nombre);
	}

	private static void parchearLlamadasPendientes(){
		for (LlamadaPendiente lp : llamadasPendientes) {
			if (direccionesFunciones.containsKey(lp.nombreFuncion)) {
				int target = direccionesFunciones.get(lp.nombreFuncion);
				UtGen.cargarRespaldo(lp.locSalto);
				UtGen.emitirRM_Abs("LDA", UtGen.PC, target, "parchear llamada hacia adelante a " + lp.nombreFuncion);
				UtGen.restaurarRespaldo();
			} else {
				System.err.println("ERROR: Funcion '" + lp.nombreFuncion + "' invocada pero no definida.");
			}
		}
	}

	//TODO: enviar preludio a archivo de salida, obtener antes su nombre
	private static void generarPreludioEstandar(){
		UtGen.emitirComentario("Compilacion TINY para el codigo objeto TM");
		UtGen.emitirComentario("Archivo: "+ "NOMBRE_ARREGLAR");
		/* Genero inicializaciones del preludio estandar */
		UtGen.emitirComentario("Preludio estandar:");
		UtGen.emitirRM("LD", UtGen.MP, 0, UtGen.AC, "cargar la maxima direccion desde la localidad 0");
		UtGen.emitirRM("ST", UtGen.AC, 0, UtGen.AC, "limpio el registro de la localidad 0");
		if (!tablaCadenas.isEmpty()) {
			UtGen.emitirComentario("Inicializacion de literales de cadena en dMem:");
			for (Map.Entry<String, Integer> entrada : tablaCadenas.entrySet()) {
				String texto = entrada.getKey();
				int base = entrada.getValue();
				for (int i = 0; i < texto.length(); i++) {
					int c = (int) texto.charAt(i);
					UtGen.emitirRM("LDC", UtGen.AC, c, 0, "char '" + texto.charAt(i) + "'");
					UtGen.emitirRM("ST", UtGen.AC, base + i, UtGen.GP, "dMem[" + (base + i) + "] = '" + texto.charAt(i) + "'");
				}
				UtGen.emitirRM("LDC", UtGen.AC, 0, 0, "terminador nulo 0");
				UtGen.emitirRM("ST", UtGen.AC, base + texto.length(), UtGen.GP, "dMem[" + (base + texto.length()) + "] = 0");
			}
		}
	}

}
