package ve.edu.unet;

import ve.edu.unet.nodosAST.*;

import java.util.*;

public class TablaSimbolos {

	private static class Ambito {
		Map<String, RegistroSimbolo> simbolos = new HashMap<String, RegistroSimbolo>();
		int siguienteDireccion = 0;
	}

	private Deque<Ambito> pila;

	public TablaSimbolos() {
		pila = new ArrayDeque<Ambito>();
		pila.push(new Ambito());
	}

	public void entrarAmbito() {
		pila.push(new Ambito());
	}

	public void salirAmbito() {
		if (pila.size() > 1) {
			pila.pop();
		}
	}

	private int nivelActual() {
		return pila.size() - 1;
	}

	public boolean existeEnAmbitoActual(String identificador) {
		return pila.peek().simbolos.containsKey(identificador);
	}

	//true: se inserto. false: ya existia en el ambito actual -> error semantico (redeclaracion)
	public boolean insertar(RegistroSimbolo simbolo) {
		Ambito actual = pila.peek();
		if (actual.simbolos.containsKey(simbolo.getIdentificador())) {
			System.out.println("ERROR SEMANTICO: '" + simbolo.getIdentificador() + "' ya fue declarado en este ambito.");
			return false;
		}
		simbolo.setNivelAmbito(nivelActual());
		if (!simbolo.isEsFuncion()) {
			simbolo.setDireccionMemoria(actual.siguienteDireccion);
			actual.siguienteDireccion += simbolo.isEsArreglo() ? simbolo.getTamanoArreglo() : 1;
		}
		actual.simbolos.put(simbolo.getIdentificador(), simbolo);
		return true;
	}

	public boolean declararVariable(String nombre, TipoDato tipo) {
		return insertar(new RegistroSimbolo(nombre, -1, tipo, false, 0));
	}

	public boolean declararArreglo(String nombre, TipoDato tipo, int tamanoArreglo) {
		return insertar(new RegistroSimbolo(nombre, -1, tipo, true, tamanoArreglo));
	}

	public boolean declararFuncion(String nombre, TipoDato tipoRetorno, List<TipoDato> parametros) {
		return insertar(new RegistroSimbolo(nombre, -1, tipoRetorno, parametros));
	}

	//Busca desde el ambito mas interno hacia el global (nivel 0). null si no existe en ningun ambito visible
	public RegistroSimbolo buscar(String identificador) {
		for (Ambito ambito : pila) {
			RegistroSimbolo simbolo = ambito.simbolos.get(identificador);
			if (simbolo != null) {
				return simbolo;
			}
		}
		return null;
	}

	//*** Contrato con Modulo 2 (Ismael) - generacion de codigo TM ***
	public int getDireccion(String identificador) {
		RegistroSimbolo simbolo = buscar(identificador);
		return simbolo != null ? simbolo.getDireccionMemoria() : -1;
	}

	public boolean esGlobal(String identificador) {
		RegistroSimbolo simbolo = buscar(identificador);
		return simbolo != null && simbolo.getNivelAmbito() == 0;
	}

	public TipoDato getTipo(String identificador) {
		RegistroSimbolo simbolo = buscar(identificador);
		return simbolo != null ? simbolo.getTipo() : null;
	}

	public int getTamanoArreglo(String identificador) {
		RegistroSimbolo simbolo = buscar(identificador);
		return simbolo != null ? simbolo.getTamanoArreglo() : 0;
	}

	public int getTamanoGlobal() {
		Ambito global = pila.peekLast();
		return global != null ? global.siguienteDireccion : 0;
	}

	/* Recorre el AST completo y registra cada declaracion en el ambito correspondiente.
	 * A diferencia del Tiny original, aqui NO se inserta al primer uso de un identificador:
	 * solo NodoDeclaracion (variables/arreglos) y NodoFuncion (funciones/procedimientos y
	 * sus parametros) crean entradas en la tabla. Usar un identificador no declarado es
	 * responsabilidad de Semantico.java (no se valida en esta clase). */
	public void cargarTabla(NodoBase raiz) {
		while (raiz != null) {
			if (raiz instanceof NodoDeclaracion) {
				NodoDeclaracion d = (NodoDeclaracion) raiz;
				if (d.isEsArreglo()) {
					declararArreglo(d.getVariable(), d.getTipo(), d.getTamanoArreglo());
				} else {
					declararVariable(d.getVariable(), d.getTipo());
				}
			} else if (raiz instanceof NodoFuncion) {
				NodoFuncion f = (NodoFuncion) raiz;
				List<TipoDato> tiposParametros = new ArrayList<TipoDato>();
				NodoBase p = f.getListaParametros();
				while (p != null) {
					tiposParametros.add(((NodoDeclaracion) p).getTipo());
					p = p.getHermanoDerecha();
				}
				declararFuncion(f.getNombre(), f.getTipoRetorno(), tiposParametros);

				entrarAmbito();
				NodoBase param = f.getListaParametros();
				while (param != null) {
					NodoDeclaracion pd = (NodoDeclaracion) param;
					declararVariable(pd.getVariable(), pd.getTipo());
					param = param.getHermanoDerecha();
				}
				cargarTabla(f.getCuerpo());
				salirAmbito();
			} else if (raiz instanceof NodoIf) {
				cargarTabla(((NodoIf) raiz).getPrueba());
				cargarTabla(((NodoIf) raiz).getParteThen());
				if (((NodoIf) raiz).getParteElse() != null) {
					cargarTabla(((NodoIf) raiz).getParteElse());
				}
			} else if (raiz instanceof NodoRepeat) {
				cargarTabla(((NodoRepeat) raiz).getCuerpo());
				cargarTabla(((NodoRepeat) raiz).getPrueba());
			} else if (raiz instanceof NodoAsignacion) {
				NodoAsignacion a = (NodoAsignacion) raiz;
				if (a.esArreglo()) {
					cargarTabla(a.getIndiceArreglo());
				}
				cargarTabla(a.getExpresion());
			} else if (raiz instanceof NodoEscribir) {
				cargarTabla(((NodoEscribir) raiz).getExpresion());
			} else if (raiz instanceof NodoReturn) {
				cargarTabla(((NodoReturn) raiz).getExpresionRetorno());
			} else if (raiz instanceof NodoOperacion) {
				cargarTabla(((NodoOperacion) raiz).getOpIzquierdo());
				cargarTabla(((NodoOperacion) raiz).getOpDerecho());
			} else if (raiz instanceof NodoArreglo) {
				cargarTabla(((NodoArreglo) raiz).getIndice());
			} else if (raiz instanceof NodoLlamada) {
				cargarTabla(((NodoLlamada) raiz).getListaArgumentos());
			}
			/* NodoLeer, NodoValor, NodoIdentificador, NodoBooleano y NodoCadena no tienen
			 * declaraciones ni subexpresiones propias que recorrer. */
			raiz = raiz.getHermanoDerecha();
		}
	}

	public void imprimirTabla() {
		System.out.println("*** Tabla de Simbolos ***");
		for (Ambito ambito : pila) {
			for (String clave : ambito.simbolos.keySet()) {
				RegistroSimbolo s = ambito.simbolos.get(clave);
				if (s.isEsFuncion()) {
					System.out.println("Nivel " + s.getNivelAmbito() + " - " + clave + " [funcion] tipoRetorno=" + s.getTipo());
				} else {
					System.out.println("Nivel " + s.getNivelAmbito() + " - " + clave + " tipo=" + s.getTipo()
							+ (s.isEsArreglo() ? "[" + s.getTamanoArreglo() + "]" : "") + " direccion=" + s.getDireccionMemoria());
				}
			}
		}
	}
}
