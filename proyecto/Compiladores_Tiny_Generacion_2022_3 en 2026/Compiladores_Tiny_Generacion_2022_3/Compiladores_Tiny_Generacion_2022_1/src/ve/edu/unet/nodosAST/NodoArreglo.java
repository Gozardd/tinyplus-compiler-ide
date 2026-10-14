package ve.edu.unet.nodosAST;

public class NodoArreglo extends NodoBase {
	private String nombre;
	private NodoBase indice;

	public NodoArreglo(String nombre, NodoBase indice) {
		super();
		this.nombre = nombre;
		this.indice = indice;
	}

	public String getNombre() {
		return nombre;
	}

	public NodoBase getIndice() {
		return indice;
	}

	public void setIndice(NodoBase indice) {
		this.indice = indice;
	}

}
