package ve.edu.unet.nodosAST;

public class NodoFuncion extends NodoBase {
	private String nombre;
	private TipoDato tipoRetorno;
	private NodoBase listaParametros;
	private NodoBase cuerpo;

	public NodoFuncion(String nombre, TipoDato tipoRetorno, NodoBase listaParametros, NodoBase cuerpo) {
		super();
		this.nombre = nombre;
		this.tipoRetorno = tipoRetorno;
		this.listaParametros = listaParametros;
		this.cuerpo = cuerpo;
	}

	public String getNombre() {
		return nombre;
	}

	public boolean esProcedimiento() {
		return tipoRetorno == null;
	}

	public TipoDato getTipoRetorno() {
		return tipoRetorno;
	}

	public NodoBase getListaParametros() {
		return listaParametros;
	}

	public NodoBase getCuerpo() {
		return cuerpo;
	}

}
