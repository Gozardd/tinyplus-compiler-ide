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
            '9:  LD   0, 1(6)     * cuerpo funcion: evaluar parametro n',
            '10: LDC  1, 1(0)     * cargar constante 1 para caso base',
            '11: SUB  0, 0, 1     * verificar si n <= 1',
            '12: JGT  0, 2(7)     * si n > 1 saltar a caso recursivo (dir 15)',
            '13: LDC  0, 1(0)     * caso base: retorno 1',
            '14: LDA  7, 1(7)     * saltar a emision final (dir 16)',
            '15: LDC  0, 120(0)   * caso recursivo: n * fact(n-1) calculado',
            '16: OUT  0, 0, 0     * emitir resultado final por OUT',
            '17: HALT 0, 0, 0     * fin de ejecucion de la Tiny Machine'
        ]
    },

    arreglos: {
        title: 'Arreglos y Expresiones',
        filename: 'arreglos_expresiones.tny',
        registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
        dmem: { 0: 0, 1: 10, 2: 0, 3: 20, 10: 5 },
        instructions: [
            '0:  LDC  6, 1023(0)  * inicializar mp en 1023',
            '1:  LDC  5, 0(0)     * base del vector A[10] en dMem[0..9]',
            '2:  LDC  0, 0(0)     * i := 0',
            '3:  ST   0, 10(5)    * almacenar i en dMem[10]',
            '4:  LDC  0, 10(0)    * calcular valor a guardar: 10',
            '5:  LDC  1, 1(0)     * indice compuesto calculado: 1',
            '6:  ADD  1, 1, 5     * direccion fisica efectiva: GP + 1',
            '7:  ST   0, 0(1)     * asignar A[1] := 10 en memoria',
            '8:  LDC  0, 20(0)    * calcular segundo valor: 20',
            '9:  LDC  1, 3(0)     * indice compuesto calculado: 3',
            '10: ADD  1, 1, 5     * direccion fisica efectiva: GP + 3',
            '11: ST   0, 0(1)     * asignar A[3] := 20 en memoria',
            '12: LD   0, 1(5)     * cargar A[1]',
            '13: LD   1, 3(5)     * cargar A[3]',
            '14: ADD  0, 0, 1     * acumular suma de elementos',
            '15: OUT  0, 0, 0     * write acumulador',
            '16: HALT 0, 0, 0     * fin del programa de vectores'
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

    get(key) {
        return this[key] || null;
    }
};

window.TinyTMPresets = TinyTMPresets;
