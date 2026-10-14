package ve.edu.unet;

import ve.edu.unet.nodosAST.TipoDato;
import java.util.List;

public class RegistroSimbolo {
	private String identificador;
	private int numLinea;
	private int direccionMemoria;
	private TipoDato tipo;
	private boolean esArreglo;
	private int tamanoArreglo;
	private int nivelAmbito;
	private boolean esFuncion;
	private List<TipoDato> parametros;

	public RegistroSimbolo(String identificador, int numLinea, TipoDato tipo, boolean esArreglo, int tamanoArreglo) {
		this.identificador = identificador;
		this.numLinea = numLinea;
		this.tipo = tipo;
		this.esArreglo = esArreglo;
		this.tamanoArreglo = tamanoArreglo;
		this.esFuncion = false;
		this.parametros = null;
		this.direccionMemoria = -1;
		this.nivelAmbito = -1;
	}

	public RegistroSimbolo(String identificador, int numLinea, TipoDato tipoRetorno, List<TipoDato> parametros) {
		this.identificador = identificador;
		this.numLinea = numLinea;
		this.tipo = tipoRetorno;
		this.esArreglo = false;
		this.tamanoArreglo = 0;
		this.esFuncion = true;
		this.parametros = parametros;
		this.direccionMemoria = -1;
		this.nivelAmbito = -1;
	}

	public String getIdentificador() {
		return identificador;
	}

	public int getNumLinea() {
		return numLinea;
	}

	public int getDireccionMemoria() {
		return direccionMemoria;
	}

	public void setDireccionMemoria(int direccionMemoria) {
		this.direccionMemoria = direccionMemoria;
	}

	public TipoDato getTipo() {
		return tipo;
	}

	public boolean isEsArreglo() {
		return esArreglo;
	}

	public int getTamanoArreglo() {
		return tamanoArreglo;
	}

	public int getNivelAmbito() {
		return nivelAmbito;
	}

	public void setNivelAmbito(int nivelAmbito) {
		this.nivelAmbito = nivelAmbito;
	}

	public boolean isEsFuncion() {
		return esFuncion;
	}

	public List<TipoDato> getParametros() {
		return parametros;
	}
}
