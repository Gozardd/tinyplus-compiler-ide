package ve.edu.unet.nodosAST;

public class NodoAsignacion extends NodoBase {
	private String identificador;
	private NodoBase expresion;
	private NodoBase indiceArreglo;

	public NodoAsignacion(String identificador) {
		super();
		this.identificador = identificador;
		this.expresion = null;
		this.indiceArreglo = null;
	}

	public NodoAsignacion(String identificador, NodoBase expresion) {
		super();
		this.identificador = identificador;
		this.expresion = expresion;
		this.indiceArreglo = null;
	}

	public NodoAsignacion(String identificador, NodoBase indiceArreglo, NodoBase expresion) {
		super();
		this.identificador = identificador;
		this.indiceArreglo = indiceArreglo;
		this.expresion = expresion;
	}

	public String getIdentificador() {
		return identificador;
	}

	public void setIdentificador(String identificador) {
		this.identificador = identificador;
	}

	public NodoBase getExpresion() {
		return expresion;
	}

	public void setExpresion(NodoBase expresion) {
		this.expresion = expresion;
	}

	public boolean esArreglo() {
		return indiceArreglo != null;
	}

	public NodoBase getIndiceArreglo() {
		return indiceArreglo;
	}

}
