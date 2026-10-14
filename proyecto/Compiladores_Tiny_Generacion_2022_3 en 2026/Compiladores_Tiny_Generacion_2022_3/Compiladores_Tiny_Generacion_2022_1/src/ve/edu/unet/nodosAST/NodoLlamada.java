package ve.edu.unet.nodosAST;

public class NodoLlamada extends NodoBase {
	private String nombreFuncion;
	private NodoBase listaArgumentos;

	public NodoLlamada(String nombreFuncion, NodoBase listaArgumentos) {
		super();
		this.nombreFuncion = nombreFuncion;
		this.listaArgumentos = listaArgumentos;
	}

	public String getNombreFuncion() {
		return nombreFuncion;
	}

	public NodoBase getListaArgumentos() {
		return listaArgumentos;
	}

}
