package ve.edu.unet;

import ve.edu.unet.nodosAST.*;

import java.util.*;

/* Verificador semantico de Tiny++: recorrido post-orden sobre el AST ya cargado
 * en TablaSimbolos (TablaSimbolos.cargarTabla debe haberse ejecutado antes).
 *
 * La redeclaracion en el mismo ambito ya la detecta TablaSimbolos.insertar(); esta
 * clase se encarga del resto de las reglas de la especificacion:
 * - Identificadores no declarados (ni en el ambito actual ni en sus ancestros).
 * - Compatibilidad de tipos en asignaciones.
 * - Operandos enteros en expresiones aritmeticas (+, -, *, /).
 * - Tipos homogeneos en comparaciones (<, =) y condiciones booleanas (if, until).
 * - Cantidad y tipos de argumentos al invocar funciones/procedimientos.
 */
public class Semantico {

	private TablaSimbolos tabla;
	private int errores;
	private NodoFuncion funcionActual;

	public Semantico(TablaSimbolos tabla) {
		this.tabla = tabla;
		this.errores = 0;
		this.funcionActual = null;
	}

	public int getErrores() {
		return errores;
	}

	private void error(String mensaje) {
		errores++;
		System.out.println("ERROR SEMANTICO: " + mensaje);
	}

	public void verificar(NodoBase raiz) {
		verificarSecuencia(raiz);
	}

	private void verificarSecuencia(NodoBase raiz) {
		while (raiz != null) {
			verificarNodo(raiz);
			raiz = raiz.getHermanoDerecha();
		}
	}

	private void verificarNodo(NodoBase nodo) {
		if (nodo instanceof NodoDeclaracion) {
			/* ya validada por TablaSimbolos al cargar la tabla */
		} else if (nodo instanceof NodoFuncion) {
			verificarFuncion((NodoFuncion) nodo);
		} else if (nodo instanceof NodoIf) {
			verificarIf((NodoIf) nodo);
		} else if (nodo instanceof NodoRepeat) {
			verificarRepeat((NodoRepeat) nodo);
		} else if (nodo instanceof NodoAsignacion) {
			verificarAsignacion((NodoAsignacion) nodo);
		} else if (nodo instanceof NodoLeer) {
			verificarLeer((NodoLeer) nodo);
		} else if (nodo instanceof NodoEscribir) {
			tipoDe(((NodoEscribir) nodo).getExpresion());
		} else if (nodo instanceof NodoReturn) {
			verificarReturn((NodoReturn) nodo);
		} else if (nodo instanceof NodoLlamada) {
			verificarLlamadaSentencia((NodoLlamada) nodo);
		} else {
			tipoDe(nodo);
		}
	}

	private void verificarFuncion(NodoFuncion f) {
		tabla.entrarAmbito();
		NodoBase p = f.getListaParametros();
		while (p != null) {
			NodoDeclaracion pd = (NodoDeclaracion) p;
			tabla.declararVariable(pd.getVariable(), pd.getTipo());
			p = p.getHermanoDerecha();
		}
		NodoFuncion anterior = funcionActual;
		funcionActual = f;
		verificarSecuencia(f.getCuerpo());
		funcionActual = anterior;
		tabla.salirAmbito();
	}

	private void verificarIf(NodoIf n) {
		exigirBooleano(n.getPrueba(), "la condicion del if");
		verificarSecuencia(n.getParteThen());
		if (n.getParteElse() != null) {
			verificarSecuencia(n.getParteElse());
		}
	}

	private void verificarRepeat(NodoRepeat n) {
		verificarSecuencia(n.getCuerpo());
		exigirBooleano(n.getPrueba(), "la condicion del until");
	}

	private void exigirBooleano(NodoBase prueba, String descripcion) {
		TipoDato tipo = tipoDe(prueba);
		if (tipo != null && tipo != TipoDato.BOOL) {
			error(descripcion + " debe ser booleana (se obtuvo " + tipo + ")");
		}
	}

	private void verificarAsignacion(NodoAsignacion n) {
		RegistroSimbolo simbolo = tabla.buscar(n.getIdentificador());
		TipoDato tipoExpresion = tipoDe(n.getExpresion());
		TipoDato tipoIndice = n.esArreglo() ? tipoDe(n.getIndiceArreglo()) : null;

		if (simbolo == null) {
			error("identificador '" + n.getIdentificador() + "' no declarado");
			return;
		}
		if (simbolo.isEsFuncion()) {
			error("'" + n.getIdentificador() + "' es una funcion/procedimiento, no se le puede asignar un valor");
			return;
		}

		if (n.esArreglo()) {
			if (!simbolo.isEsArreglo()) {
				error("'" + n.getIdentificador() + "' no es un arreglo, no se puede indexar");
			}
			if (tipoIndice != null && tipoIndice != TipoDato.INT) {
				error("el indice de '" + n.getIdentificador() + "' debe ser entero (se obtuvo " + tipoIndice + ")");
			}
		} else if (simbolo.isEsArreglo()) {
			error("'" + n.getIdentificador() + "' es un arreglo, debe indexarse para asignarle un valor");
		}

		if (tipoExpresion != null && tipoExpresion != simbolo.getTipo()) {
			error("no se puede asignar un valor de tipo " + tipoExpresion + " a '" + n.getIdentificador()
					+ "' de tipo " + simbolo.getTipo());
		}
	}

	private void verificarLeer(NodoLeer n) {
		RegistroSimbolo simbolo = tabla.buscar(n.getIdentificador());
		if (simbolo == null) {
			error("identificador '" + n.getIdentificador() + "' no declarado");
		} else if (simbolo.isEsFuncion()) {
			error("'" + n.getIdentificador() + "' es una funcion/procedimiento, no se puede leer sobre el");
		} else if (simbolo.isEsArreglo()) {
			error("'" + n.getIdentificador() + "' es un arreglo, debe indexarse para leer un elemento");
		}
	}

	private void verificarReturn(NodoReturn n) {
		TipoDato tipoExpresion = tipoDe(n.getExpresionRetorno());
		if (funcionActual == null) {
			error("'return' solo es valido dentro de una funcion o procedimiento");
		} else if (funcionActual.esProcedimiento()) {
			error("'" + funcionActual.getNombre() + "' es un procedimiento y no puede retornar un valor");
		} else if (tipoExpresion != null && tipoExpresion != funcionActual.getTipoRetorno()) {
			error("'" + funcionActual.getNombre() + "' debe retornar " + funcionActual.getTipoRetorno()
					+ ", no " + tipoExpresion);
		}
	}

	/* Calcula el tipo de una (sub)expresion, reportando los errores que encuentre en el camino.
	 * Devuelve null cuando el tipo no pudo determinarse (identificador no declarado, uso
	 * invalido, etc.) para evitar que el error se repita en cascada hacia los nodos padres. */
	private TipoDato tipoDe(NodoBase nodo) {
		if (nodo == null) {
			return null;
		}
		if (nodo instanceof NodoValor) {
			return TipoDato.INT;
		}
		if (nodo instanceof NodoBooleano) {
			return TipoDato.BOOL;
		}
		if (nodo instanceof NodoCadena) {
			return TipoDato.STRING;
		}
		if (nodo instanceof NodoIdentificador) {
			return tipoDeIdentificador(((NodoIdentificador) nodo).getNombre());
		}
		if (nodo instanceof NodoArreglo) {
			return tipoDeArreglo((NodoArreglo) nodo);
		}
		if (nodo instanceof NodoLlamada) {
			return tipoDeLlamada((NodoLlamada) nodo);
		}
		if (nodo instanceof NodoOperacion) {
			return tipoDeOperacion((NodoOperacion) nodo);
		}
		error("BUG interno: no se pudo determinar el tipo del nodo " + nodo.getClass().getSimpleName());
		return null;
	}

	private TipoDato tipoDeIdentificador(String nombre) {
		RegistroSimbolo simbolo = tabla.buscar(nombre);
		if (simbolo == null) {
			error("identificador '" + nombre + "' no declarado");
			return null;
		}
		if (simbolo.isEsFuncion()) {
			error("'" + nombre + "' es una funcion/procedimiento, no se puede usar como valor directamente");
			return null;
		}
		if (simbolo.isEsArreglo()) {
			error("'" + nombre + "' es un arreglo, debe indexarse para obtener un valor");
			return null;
		}
		return simbolo.getTipo();
	}

	private TipoDato tipoDeArreglo(NodoArreglo n) {
		TipoDato tipoIndice = tipoDe(n.getIndice());
		if (tipoIndice != null && tipoIndice != TipoDato.INT) {
			error("el indice de '" + n.getNombre() + "' debe ser entero (se obtuvo " + tipoIndice + ")");
		}
		RegistroSimbolo simbolo = tabla.buscar(n.getNombre());
		if (simbolo == null) {
			error("identificador '" + n.getNombre() + "' no declarado");
			return null;
		}
		if (!simbolo.isEsArreglo()) {
			error("'" + n.getNombre() + "' no es un arreglo, no se puede indexar");
			return null;
		}
		return simbolo.getTipo();
	}

	private RegistroSimbolo validarArgumentosLlamada(NodoLlamada n) {
		List<TipoDato> tiposArgumentos = new ArrayList<TipoDato>();
		NodoBase arg = n.getListaArgumentos();
		while (arg != null) {
			tiposArgumentos.add(tipoDe(arg));
			arg = arg.getHermanoDerecha();
		}

		RegistroSimbolo simbolo = tabla.buscar(n.getNombreFuncion());
		if (simbolo == null) {
			error("funcion/procedimiento '" + n.getNombreFuncion() + "' no declarado");
			return null;
		}
		if (!simbolo.isEsFuncion()) {
			error("'" + n.getNombreFuncion() + "' no es una funcion ni un procedimiento, no se puede invocar");
			return null;
		}

		List<TipoDato> tiposFormales = simbolo.getParametros();
		if (tiposFormales.size() != tiposArgumentos.size()) {
			error("'" + n.getNombreFuncion() + "' espera " + tiposFormales.size() + " argumento(s), se pasaron "
					+ tiposArgumentos.size());
		} else {
			for (int i = 0; i < tiposFormales.size(); i++) {
				TipoDato esperado = tiposFormales.get(i);
				TipoDato recibido = tiposArgumentos.get(i);
				if (recibido != null && recibido != esperado) {
					error("argumento " + (i + 1) + " de '" + n.getNombreFuncion() + "' debe ser " + esperado
							+ ", se recibio " + recibido);
				}
			}
		}
		return simbolo;
	}

	private void verificarLlamadaSentencia(NodoLlamada n) {
		validarArgumentosLlamada(n);
	}

	private TipoDato tipoDeLlamada(NodoLlamada n) {
		RegistroSimbolo simbolo = validarArgumentosLlamada(n);
		if (simbolo == null) {
			return null;
		}
		if (simbolo.getTipo() == null) {
			error("'" + n.getNombreFuncion() + "' es un procedimiento y no retorna un valor, no puede usarse en una expresion");
			return null;
		}
		return simbolo.getTipo();
	}

	private TipoDato tipoDeOperacion(NodoOperacion n) {
		TipoDato tIzq = tipoDe(n.getOpIzquierdo());
		TipoDato tDer = tipoDe(n.getOpDerecho());
		String simbolo = simboloDe(n.getOperacion());

		switch (n.getOperacion()) {
			case mas:
			case menos:
			case por:
			case entre:
				if (tIzq != null && tIzq != TipoDato.INT) {
					error("el operador '" + simbolo + "' requiere operandos enteros (izquierdo es " + tIzq + ")");
				}
				if (tDer != null && tDer != TipoDato.INT) {
					error("el operador '" + simbolo + "' requiere operandos enteros (derecho es " + tDer + ")");
				}
				return TipoDato.INT;
			case menor:
				if (tIzq != null && tIzq != TipoDato.INT) {
					error("el operador '<' requiere operandos enteros (izquierdo es " + tIzq + ")");
				}
				if (tDer != null && tDer != TipoDato.INT) {
					error("el operador '<' requiere operandos enteros (derecho es " + tDer + ")");
				}
				return TipoDato.BOOL;
			case igual:
				if (tIzq != null && tDer != null && tIzq != tDer) {
					error("el operador '=' requiere operandos del mismo tipo (se comparo " + tIzq + " con " + tDer + ")");
				}
				return TipoDato.BOOL;
			default:
				error("BUG interno: operador desconocido " + n.getOperacion());
				return null;
		}
	}

	private String simboloDe(tipoOp op) {
		switch (op) {
			case mas: return "+";
			case menos: return "-";
			case por: return "*";
			case entre: return "/";
			case menor: return "<";
			case igual: return "=";
			default: return "?";
		}
	}
}
