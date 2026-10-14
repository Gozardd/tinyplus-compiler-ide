package ve.edu.unet.nodosAST;

public class NodoBooleano extends NodoBase {
	private boolean valor;

	public NodoBooleano(boolean valor) {
		super();
		this.valor = valor;
	}

	public boolean getValor() {
		return valor;
	}

}
