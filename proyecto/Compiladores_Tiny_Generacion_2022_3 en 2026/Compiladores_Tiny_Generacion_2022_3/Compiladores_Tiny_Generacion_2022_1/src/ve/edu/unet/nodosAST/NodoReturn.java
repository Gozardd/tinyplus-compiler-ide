package ve.edu.unet.nodosAST;

public class NodoReturn extends NodoBase {
	private NodoBase expresionRetorno;

	public NodoReturn(NodoBase expresionRetorno) {
		super();
		this.expresionRetorno = expresionRetorno;
	}

	public NodoBase getExpresionRetorno() {
		return expresionRetorno;
	}

}
