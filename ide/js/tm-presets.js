/**
 * Tiny++ Studio IDE - Programas Objeto TM Precargados
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Catálogo de programas objeto de la Tiny Machine (Kenneth Louden)
 * para demostración y evaluación de los casos requeridos por la cátedra.
 */

const TinyTMPresets = {
    factorial: {
        title: 'Factorial Recursivo',
        filename: 'factorial_recursivo.tny',
        registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
        dmem: { 0: 0, 1: 0 },
        instructions: [
            '0:  LDC  6, 1023(0)  * inicializar mp en 1023 (tope de pila)',
            '1:  LDC  5, 0(0)     * inicializar gp en 0 (base global)',
            '2:  IN   0, 0, 0     * leer valor de entrada n al acumulador ac',
            '3:  ST   0, 0(5)     * guardar n en dMem[0] (variable global n)',
            '4:  LD   0, 0(5)     * cargar n para preparar llamada',
            '5:  LDA  1, 3(7)     * return address (PC+3) en ac1',
            '6:  ST   1, -1(6)    * apilar direccion de retorno en pila',
            '7:  ST   0, -2(6)    * apilar parametro formal n en pila',
            '8:  LDA  6, -3(6)    * decrementar mp para marco de activacion',
            '9:  LD   1, 1(6)     * cuerpo funcion: cargar parametro formal n en ac1',
            '10: LDC  0, 1(0)     * inicializar acumulador fact := 1 en ac',
            '11: LDC  2, 1(0)     * constante 1 en r2 para comparar y decrementar',
            '12: SUB  3, 1, 2     * r3 := n - 1',
            '13: JLE  3, 3(7)     * si n <= 1 saltar a emision final (dir 17)',
            '14: MUL  0, 0, 1     * ac := ac * n (multiplicacion real)',
            '15: SUB  1, 1, 2     * n := n - 1',
            '16: LDA  7, -5(7)    * repetir bucle multiplicativo (saltar a dir 12)',
            '17: OUT  0, 0, 0     * emitir resultado final calculado por OUT',
            '18: HALT 0, 0, 0     * fin de ejecucion de la Tiny Machine'
        ]
    },

    arreglos: {
        title: 'Arreglos y Expresiones',
        filename: 'arreglos_expresiones.tny',
        registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
        dmem: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 },
        instructions: [
            '0:  LDC  6, 1023(0)  * inicializar mp en 1023',
            '1:  LDC  5, 0(0)     * base del vector A[10] en dMem[0..9]',
            '2:  LDC  0, 0(0)     * i := 0',
            '3:  ST   0, 10(5)    * almacenar i en dMem[10]',
            '4:  LD   0, 10(5)    * cargar i en AC',
            '5:  LDC  1, 2(0)     * constante 2 en AC1',
            '6:  MUL  0, 0, 1     * AC = i * 2',
            '7:  LDC  1, 1(0)     * constante 1 en AC1',
            '8:  ADD  0, 0, 1     * AC = i * 2 + 1 (indice calculado)',
            '9:  ADD  2, 0, 5     * r2 = indice + GP (direccion fisica)',
            '10: LD   0, 10(5)    * cargar i en AC',
            '11: LDC  1, 1(0)     * constante 1 en AC1',
            '12: ADD  0, 0, 1     * AC = i + 1',
            '13: LDC  1, 10(0)    * constante 10 en AC1',
            '14: MUL  0, 0, 1     * AC = (i + 1) * 10 (valor calculado)',
            '15: ST   0, 0(2)     * guardar en A[i*2+1] (dMem[r2])',
            '16: LD   0, 10(5)    * cargar i',
            '17: LDC  1, 1(0)     * constante 1',
            '18: ADD  0, 0, 1     * i = i + 1',
            '19: ST   0, 10(5)    * guardar nuevo i en dMem[10]',
            '20: LDC  1, 5(0)     * constante 5',
            '21: SUB  3, 0, 1     * r3 = i - 5',
            '22: JEQ  3, 1(7)     * si i == 5 salir del bucle (salta a 24)',
            '23: LDA  7, -20(7)   * repetir bucle repeat (salta a dir 4)',
            '24: LD   0, 1(5)     * cargar A[1] (valor 10)',
            '25: LD   1, 3(5)     * cargar A[3] (valor 20)',
            '26: ADD  0, 0, 1     * AC = A[1] + A[3] = 30',
            '27: LD   1, 5(5)     * cargar A[5] (valor 30)',
            '28: ADD  0, 0, 1     * AC = A[1] + A[3] + A[5] = 60',
            '29: ST   0, 11(5)    * guardar en acumulador (dMem[11])',
            '30: OUT  0, 0, 0     * write acumulador (emite 60)',
            '31: HALT 0, 0, 0     * fin del programa de vectores'
        ]
    },

    ambitos: {
        title: 'Ámbitos y Variables Locales',
        filename: 'ambitos_locales.tny',
        registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
        dmem: { 0: 100, 1: 50, 1022: 25 },
        instructions: [
            '0:  LDC  6, 1023(0)  * inicializar mp',
            '1:  LDC  5, 0(0)     * inicializar gp',
            '2:  LDC  0, 100(0)   * variable global x := 100',
            '3:  ST   0, 0(5)     * guardar x en dMem[0]',
            '4:  LDC  0, 25(0)    * parametro formal valor := 25',
            '5:  LDA  1, 3(7)     * return address',
            '6:  ST   1, -1(6)    * salvar retorno en marco de pila',
            '7:  ST   0, -2(6)    * pasar parametro en pila',
            '8:  LDA  6, -3(6)    * activar marco local',
            '9:  LD   0, 1(6)     * acceder a parametro formal',
            '10: LDC  1, 2(0)     * constante 2',
            '11: MUL  0, 0, 1     * x local := valor * 2 = 50',
            '12: ST   0, 0(6)     * guardar en variable local x (sombra)',
            '13: LD   0, 0(5)     * verificar que x global sigue intacta (100)',
            '14: OUT  0, 0, 0     * write x global',
            '15: HALT 0, 0, 0     * fin'
        ]
    },

    strings: {
        title: 'Cadenas Literales en Memoria',
        filename: '04_strings_en_memoria.tny',
        registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
        dmem: { 0: 2, 1: 7, 2: 67, 3: 111, 4: 109, 5: 112, 6: 0, 7: 69, 8: 120, 9: 105, 10: 116, 11: 111, 12: 0 },
        instructions: [
            '0:  LD   6, 0(0)     * inicializar mp en 1023',
            '1:  ST   0, 0(0)     * limpiar celda 0',
            '2:  LDC  0, 67(0)    * char "C"',
            '3:  ST   0, 2(5)     * dMem[2] = "C"',
            '4:  LDC  0, 111(0)   * char "o"',
            '5:  ST   0, 3(5)     * dMem[3] = "o"',
            '6:  LDC  0, 109(0)   * char "m"',
            '7:  ST   0, 4(5)     * dMem[4] = "m"',
            '8:  LDC  0, 112(0)   * char "p"',
            '9:  ST   0, 5(5)     * dMem[5] = "p"',
            '10: LDC  0, 0(0)     * terminador nulo',
            '11: ST   0, 6(5)     * fin cadena "Comp"',
            '12: LDC  0, 2(0)     * dir inicio cadena saludo en GP+2',
            '13: ST   0, 0(5)     * guardar puntero en saludo (dMem[0])',
            '14: LD   0, 0(5)     * cargar puntero a saludo en ac',
            '15: LD   1, 0(0)     * bucle write: cargar char en ac1',
            '16: JEQ  1, 3(7)     * si char == 0 fin bucle',
            '17: OUT  1, 0, 0     * imprimir caracter',
            '18: LDA  0, 1(0)     * avanzar puntero p++',
            '19: LDA  7, -5(7)    * repetir bucle',
            '20: LDC  0, 2026(0)  * constante 2026',
            '21: OUT  0, 0, 0     * imprimir 2026',
            '22: HALT 0, 0, 0     * fin'
        ]
    },

    completo: {
        title: 'Programa Completo Tiny++',
        filename: '06_programa_completo_tinyplus.tny',
        registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
        dmem: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        instructions: [
            '0:  LDC  6, 1023(0)  * mp = 1023',
            '1:  LDC  5, 0(0)     * gp = 0',
            '2:  LDA  7, 5(7)     * saltar al main (dir 8)',
            '3:  LD   0, 1(6)     * funcion cuadrado: arg x en MP+1',
            '4:  MUL  0, 0, 0     * retorno = x * x',
            '5:  LD   2, -1(6)    * retorno desde MP-1',
            '6:  LD   6, 0(6)     * restaurar MP',
            '7:  LDA  7, 0(2)     * volver al llamador',
            '8:  LDC  0, 0(0)     * k := 0',
            '9:  ST   0, 4(5)     * guardar k en dMem[4]',
            '10: LD   0, 4(5)     * cargar k',
            '11: LDC  1, 1(0)     * constante 1',
            '12: ADD  0, 0, 1     * AC = k + 1',
            '13: ST   0, -2(6)    * pasar parametro formal k+1 en MP-2',
            '14: ST   6, 0(6)     * salvar Old MP en MP-0',
            '15: LDA  1, 3(7)     * return address (dir 19) en AC1',
            '16: ST   1, -1(6)    * salvar retorno en MP-1',
            '17: LDA  6, -3(6)    * activar nuevo marco local MP',
            '18: LDA  7, -16(7)   * llamar cuadrado (saltar a dir 3)',
            '19: LD   1, 4(5)     * cargar k en AC1',
            '20: ADD  2, 1, 5     * r2 = k + GP',
            '21: ST   0, 0(2)     * datos[k] := cuadrado(k+1)',
            '22: LD   0, 4(5)     * cargar k',
            '23: LDC  1, 1(0)     * constante 1',
            '24: ADD  0, 0, 1     * k = k + 1',
            '25: ST   0, 4(5)     * guardar nuevo k',
            '26: LDC  1, 4(0)     * constante 4',
            '27: SUB  3, 0, 1     * r3 = k - 4',
            '28: JEQ  3, 1(7)     * si k == 4 salir del bucle (salta a 30)',
            '29: LDA  7, -20(7)   * repetir bucle (salta a dir 10)',
            '30: LD   0, 0(5)     * cargar datos[0] (1)',
            '31: LD   1, 1(5)     * cargar datos[1] (4)',
            '32: ADD  0, 0, 1     * AC = 1 + 4 = 5',
            '33: LD   1, 2(5)     * cargar datos[2] (9)',
            '34: ADD  0, 0, 1     * AC = 5 + 9 = 14',
            '35: LD   1, 3(5)     * cargar datos[3] (16)',
            '36: ADD  0, 0, 1     * AC = 14 + 16 = 30',
            '37: ST   0, 5(5)     * guardar total := 30 en dMem[5]',
            '38: LDC  1, 50(0)    * constante 50',
            '39: SUB  3, 0, 1     * r3 = total - 50',
            '40: JLT  3, 2(7)     * si total < 50 saltar a dir 43',
            '41: LDC  0, 0(0)     * caso falso (0)',
            '42: LDA  7, 1(7)     * saltar a dir 44',
            '43: LDC  0, 1(0)     * caso verdadero procesado := 1',
            '44: ST   0, 6(5)     * guardar procesado en dMem[6]',
            '45: LD   0, 5(5)     * cargar total',
            '46: OUT  0, 0, 0     * write total (30)',
            '47: HALT 0, 0, 0     * fin programa completo'
        ]
    },

    get(key) {
        return this[key] || null;
    }
};

window.TinyTMPresets = TinyTMPresets;
