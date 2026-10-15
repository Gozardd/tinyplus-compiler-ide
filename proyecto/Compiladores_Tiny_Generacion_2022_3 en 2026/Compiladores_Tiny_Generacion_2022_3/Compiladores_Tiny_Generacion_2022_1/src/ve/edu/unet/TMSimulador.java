package ve.edu.unet;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Simulador de la Maquina Tiny (TM) de Kenneth C. Louden.
 * Permite ejecutar codigo ensamblador .tm de forma portatil e independiente
 * en cualquier entorno Java, tanto interactivamente como en pruebas automatizadas.
 */
public class TMSimulador {
    public static final int IADDR_SIZE = 1024;
    public static final int DADDR_SIZE = 1024;
    public static final int NO_REGS = 8;
    public static final int PC_REG = 7;

    public enum OpClass { RR, RM, RA }

    public static class Instruccion {
        public String opcode;
        public OpClass opclass;
        public int r;
        public int d;
        public int s;
        public int t;

        public Instruccion(String opcode, OpClass opclass, int r, int d, int s, int t) {
            this.opcode = opcode;
            this.opclass = opclass;
            this.r = r;
            this.d = d;
            this.s = s;
            this.t = t;
        }
    }

    private Instruccion[] iMem = new Instruccion[IADDR_SIZE];
    private int[] dMem = new int[DADDR_SIZE];
    private int[] reg = new int[NO_REGS];
    private List<Integer> salidas = new ArrayList<Integer>();
    private List<Integer> entradas = new ArrayList<Integer>();
    private int indiceEntradas = 0;
    private int instruccionesEjecutadas = 0;
    private boolean trace = false;

    public TMSimulador() {
        reiniciar();
    }

    public void reiniciar() {
        Arrays.fill(iMem, null);
        Arrays.fill(dMem, 0);
        Arrays.fill(reg, 0);
        dMem[0] = DADDR_SIZE - 1; // 1023
        salidas.clear();
        entradas.clear();
        indiceEntradas = 0;
        instruccionesEjecutadas = 0;
    }

    public void setTrace(boolean trace) {
        this.trace = trace;
    }

    public void agregarEntrada(int valor) {
        entradas.add(valor);
    }

    public List<Integer> getSalidas() {
        return salidas;
    }

    public int[] getDMem() {
        return dMem;
    }

    public int[] getReg() {
        return reg;
    }

    public int getInstruccionesEjecutadas() {
        return instruccionesEjecutadas;
    }

    /**
     * Carga un programa TM desde un archivo de texto.
     */
    public boolean cargarArchivo(String ruta) {
        reiniciar();
        try (BufferedReader br = new BufferedReader(new FileReader(ruta))) {
            String linea;
            while ((linea = br.readLine()) != null) {
                linea = linea.trim();
                if (linea.isEmpty() || linea.startsWith("*")) {
                    continue;
                }
                parsearLinea(linea);
            }
            return true;
        } catch (Exception e) {
            System.err.println("Error al cargar archivo TM: " + e.getMessage());
            return false;
        }
    }

    /**
     * Carga un programa TM desde una lista de lineas o salida de consola.
     */
    public void cargarLineas(List<String> lineas) {
        reiniciar();
        for (String linea : lineas) {
            linea = linea.trim();
            if (linea.isEmpty() || linea.startsWith("*")) {
                continue;
            }
            parsearLinea(linea);
        }
    }

    private void parsearLinea(String linea) {
        // Formato tipico:
        // 0: LD 6,0(0) comentario opcional
        // 12: OUT 0,0,0
        int colonIdx = linea.indexOf(':');
        if (colonIdx == -1) return;

        int loc = Integer.parseInt(linea.substring(0, colonIdx).trim());
        String rest = linea.substring(colonIdx + 1).trim();

        // Extraer opcode
        int spaceIdx = rest.indexOf(' ');
        if (spaceIdx == -1) spaceIdx = rest.indexOf('\t');
        if (spaceIdx == -1) return;

        String opcode = rest.substring(0, spaceIdx).trim().toUpperCase();
        String operands = rest.substring(spaceIdx + 1).trim();

        // Eliminar comentarios posteriores
        int commentIdx = operands.indexOf('*');
        if (commentIdx != -1) operands = operands.substring(0, commentIdx).trim();

        if (loc < 0 || loc >= IADDR_SIZE) return;

        // Clasificar opcode
        switch (opcode) {
            case "HALT":
            case "IN":
            case "OUT":
            case "ADD":
            case "SUB":
            case "MUL":
            case "DIV": {
                // RR: r, s, t
                String[] tokens = operands.trim().split("\\s+");
                String argStr = tokens.length > 0 ? tokens[0] : "";
                String[] parts = argStr.split(",");
                int r = parts.length > 0 && !parts[0].isEmpty() ? Integer.parseInt(parts[0].trim()) : 0;
                int s = parts.length > 1 && !parts[1].isEmpty() ? Integer.parseInt(parts[1].trim()) : 0;
                int t = parts.length > 2 && !parts[2].isEmpty() ? Integer.parseInt(parts[2].trim()) : 0;
                iMem[loc] = new Instruccion(opcode, OpClass.RR, r, 0, s, t);
                break;
            }
            case "LD":
            case "ST": {
                // RM: r, d(s)
                int commaIdx = operands.indexOf(',');
                int openParen = operands.indexOf('(');
                int closeParen = operands.indexOf(')');
                int r = Integer.parseInt(operands.substring(0, commaIdx).trim());
                int d = Integer.parseInt(operands.substring(commaIdx + 1, openParen).trim());
                int s = Integer.parseInt(operands.substring(openParen + 1, closeParen).trim());
                iMem[loc] = new Instruccion(opcode, OpClass.RM, r, d, s, 0);
                break;
            }
            case "LDA":
            case "LDC":
            case "JLT":
            case "JLE":
            case "JGT":
            case "JGE":
            case "JEQ":
            case "JNE": {
                // RA: r, d(s)
                int commaIdx = operands.indexOf(',');
                int openParen = operands.indexOf('(');
                int closeParen = operands.indexOf(')');
                int r = Integer.parseInt(operands.substring(0, commaIdx).trim());
                int d = Integer.parseInt(operands.substring(commaIdx + 1, openParen).trim());
                int s = Integer.parseInt(operands.substring(openParen + 1, closeParen).trim());
                iMem[loc] = new Instruccion(opcode, OpClass.RA, r, d, s, 0);
                break;
            }
            default:
                System.err.println("Opcode desconocido en TM: " + opcode);
        }
    }

    /**
     * Ejecuta el programa cargado hasta HALT o hasta un limite de pasos de seguridad.
     * Retorna verdadero si termino por HALT normalmente.
     */
    public boolean ejecutar(int maxPasos) {
        BufferedReader stdinReader = new BufferedReader(new InputStreamReader(System.in));
        while (instruccionesEjecutadas < maxPasos) {
            int pc = reg[PC_REG];
            if (pc < 0 || pc >= IADDR_SIZE) {
                System.err.println("TM Error: Fallo de memoria de instrucciones en PC=" + pc);
                return false;
            }
            Instruccion instr = iMem[pc];
            if (instr == null) {
                System.err.println("TM Error: Instruccion nula en PC=" + pc);
                return false;
            }

            reg[PC_REG] = pc + 1;
            instruccionesEjecutadas++;

            if (trace) {
                System.out.printf("[%4d] PC=%-3d Op=%-4s r=%d d=%d s=%d t=%d\n",
                    instruccionesEjecutadas, pc, instr.opcode, instr.r, instr.d, instr.s, instr.t);
            }

            switch (instr.opclass) {
                case RR:
                    switch (instr.opcode) {
                        case "HALT":
                            return true;
                        case "IN":
                            int valorIn = 0;
                            if (indiceEntradas < entradas.size()) {
                                valorIn = entradas.get(indiceEntradas++);
                            } else {
                                try {
                                    System.out.print("Entrada (IN): ");
                                    String line = stdinReader.readLine();
                                    valorIn = Integer.parseInt(line.trim());
                                } catch (Exception e) {
                                    valorIn = 0;
                                }
                            }
                            reg[instr.r] = valorIn;
                            break;
                        case "OUT":
                            int v = reg[instr.r];
                            salidas.add(v);
                            if (v >= 32 && v <= 126) {
                                System.out.println("SALIDA: " + v + " ('" + (char)v + "')");
                            } else {
                                System.out.println("SALIDA: " + v);
                            }
                            break;
                        case "ADD":
                            reg[instr.r] = reg[instr.s] + reg[instr.t];
                            break;
                        case "SUB":
                            reg[instr.r] = reg[instr.s] - reg[instr.t];
                            break;
                        case "MUL":
                            reg[instr.r] = reg[instr.s] * reg[instr.t];
                            break;
                        case "DIV":
                            if (reg[instr.t] == 0) {
                                System.err.println("TM Error: Division por cero en PC=" + pc);
                                return false;
                            }
                            reg[instr.r] = reg[instr.s] / reg[instr.t];
                            break;
                    }
                    break;

                case RM: {
                    int addr = instr.d + reg[instr.s];
                    if (addr < 0 || addr >= DADDR_SIZE) {
                        System.err.println("TM Error: Fallo de memoria de datos en addr=" + addr + " (PC=" + pc + ")");
                        return false;
                    }
                    if ("LD".equals(instr.opcode)) {
                        reg[instr.r] = dMem[addr];
                    } else if ("ST".equals(instr.opcode)) {
                        dMem[addr] = reg[instr.r];
                    }
                    break;
                }

                case RA: {
                    int target = instr.d + reg[instr.s];
                    switch (instr.opcode) {
                        case "LDA":
                            reg[instr.r] = target;
                            break;
                        case "LDC":
                            reg[instr.r] = instr.d;
                            break;
                        case "JLT":
                            if (reg[instr.r] < 0) reg[PC_REG] = target;
                            break;
                        case "JLE":
                            if (reg[instr.r] <= 0) reg[PC_REG] = target;
                            break;
                        case "JGT":
                            if (reg[instr.r] > 0) reg[PC_REG] = target;
                            break;
                        case "JGE":
                            if (reg[instr.r] >= 0) reg[PC_REG] = target;
                            break;
                        case "JEQ":
                            if (reg[instr.r] == 0) reg[PC_REG] = target;
                            break;
                        case "JNE":
                            if (reg[instr.r] != 0) reg[PC_REG] = target;
                            break;
                    }
                    break;
                }
            }
        }
        System.err.println("TM Error: Limite maximo de instrucciones alcanzado (" + maxPasos + ")");
        return false;
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Uso: java ve.edu.unet.TMSimulador <archivo.tm> [--trace]");
            return;
        }
        TMSimulador sim = new TMSimulador();
        if (args.length > 1 && "--trace".equals(args[1])) {
            sim.setTrace(true);
        }
        if (sim.cargarArchivo(args[0])) {
            System.out.println("Ejecutando simulador TM para: " + args[0]);
            boolean ok = sim.ejecutar(50000);
            System.out.println("Ejecucion terminada con exito: " + ok + ". Total instrucciones: " + sim.getInstruccionesEjecutadas());
        }
    }
}
