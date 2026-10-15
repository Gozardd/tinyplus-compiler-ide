package ve.edu.unet.nodosAST;

public class NodoDeclaracion extends NodoBase {
	private String variable;
	private TipoDato tipo;
	private boolean esArreglo;
	private int tamanoArreglo;

	public NodoDeclaracion(String variable, TipoDato tipo) {
		super();
		this.variable = variable;
		this.tipo = tipo;
		this.esArreglo = false;
		this.tamanoArreglo = 0;
	}

	public NodoDeclaracion(String variable, TipoDato tipo, int tamanoArreglo) {
		super();
		this.variable = variable;
		this.tipo = tipo;
		this.esArreglo = true;
		this.tamanoArreglo = tamanoArreglo;
	}

	public String getVariable() {
		return variable;
	}

	public void setVariable(String variable) {
		this.variable = variable;
	}

	public TipoDato getTipo() {
		return tipo;
	}

	public void setTipo(TipoDato tipo) {
		this.tipo = tipo;
	}

	public boolean isEsArreglo() {
		return esArreglo;
	}

	public int getTamanoArreglo() {
		return tamanoArreglo;
	}

}
