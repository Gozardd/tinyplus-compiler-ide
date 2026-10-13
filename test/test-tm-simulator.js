/**
 * =============================================================================
 * BATERÍA DE PRUEBAS AUTOMATIZADAS - MÓDULO 3: SIMULADOR TM
 * =============================================================================
 * Autor: Santiago Hernández (C.I. V-31.098.297)
 * Validación rigurosa de todas las instrucciones y contratos de la Tiny Machine.
 * =============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const TMSimulator = require('../simulator/tm-simulator.js');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
    try {
        fn();
        console.log(`  \x1b[32m✔ PASS\x1b[0m - ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  \x1b[31m✘ FAIL\x1b[0m - ${testName}`);
        console.error(`     \x1b[33mError: ${err.message}\x1b[0m`);
        failedTests++;
    }
}

console.log('\n======================================================');
console.log('   PRUEBAS UNITARIAS DEL SIMULADOR TM (SANTIAGO)');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// 1. HARDWARE INICIAL Y RESET
// -----------------------------------------------------------------------------
console.log('\x1b[36m[GRUPO 1: Estado Inicial y Reset de Hardware]\x1b[0m');

runTest('Registros y constantes de arquitectura de Louden', () => {
    const tm = new TMSimulator();
    assert.strictEqual(tm.ISIZE, 1024);
    assert.strictEqual(tm.DSIZE, 1024);
    assert.strictEqual(tm.NREGS, 8);
    assert.strictEqual(TMSimulator.PC, 7);
    assert.strictEqual(TMSimulator.MP, 6);
    assert.strictEqual(TMSimulator.GP, 5);
    assert.strictEqual(TMSimulator.AC, 0);
    assert.strictEqual(TMSimulator.AC1, 1);
});

runTest('Inicialización de dMem[0] = 1023 y registros en cero', () => {
    const tm = new TMSimulator();
    const state = tm.getState();
    assert.strictEqual(state.dMem[0], 1023, 'dMem[0] debe contener 1023 (tope de pila)');
    assert.strictEqual(state.dMem[1], 0);
    assert.strictEqual(state.dMem[1023], 0);
    assert.deepStrictEqual(state.regs, [0, 0, 0, 0, 0, 0, 0, 0]);
    assert.strictEqual(state.pc, 0);
    assert.strictEqual(state.lastWrite, -1);
});

// -----------------------------------------------------------------------------
// 2. PARSER ROBUSTO DE ENSAMBLADOR .TM
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 2: Parser Ensamblador .tm]\x1b[0m');

runTest('Parsea instrucciones RR, RM y RA con comentarios mixtos', () => {
    const tm = new TMSimulator();
    const code = `
        * Archivo de prueba
        0: LDC 6, 1023(0) * inicializar MP
        1: LDC 5, 0(0)    * inicializar GP
        2: IN  0, 0, 0    * leer valor
        3: ST  0, 10(5)   * guardar en GP+10
        4: LD  1, 10(5)   * cargar en AC1
        5: ADD 0, 0, 1    * sumar AC + AC1
        6: OUT 0, 0, 0    * emitir salida
        7: HALT 0, 0, 0   * fin
    `;
    const res = tm.loadProgram(code);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.count, 8);
    assert.strictEqual(res.maxLoc, 7);

    const insts = tm.getLoadedInstructions();
    assert.strictEqual(insts[0].opcode, 'LDC');
    assert.strictEqual(insts[0].a1, 6);
    assert.strictEqual(insts[0].a2, 1023);
    assert.strictEqual(insts[0].a3, 0);

    assert.strictEqual(insts[5].opcode, 'ADD');
    assert.strictEqual(insts[5].a1, 0);
    assert.strictEqual(insts[5].a2, 0);
    assert.strictEqual(insts[5].a3, 1);
});

runTest('Parsea formato con comas en desplazamientos y sin asteriscos', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 0, 42, 0  cargar constante directa
        1: ST  0, 5, 0   almacenar sin parentesis
    `;
    const res = tm.loadProgram(code);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.count, 2);
    assert.strictEqual(tm.iMem[0].a1, 0);
    assert.strictEqual(tm.iMem[0].a2, 42);
    assert.strictEqual(tm.iMem[1].a2, 5);
});

// -----------------------------------------------------------------------------
// 3. OPERACIONES ARITMÉTICAS Y CONTROL DE ERRORES
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 3: Aritmética y Detección de Fallos]\x1b[0m');

runTest('Ejecución de ADD, SUB, MUL y DIV paso a paso', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 1, 20(0)  * r1 = 20
        1: LDC 2, 4(0)   * r2 = 4
        2: ADD 0, 1, 2   * r0 = 20 + 4 = 24
        3: SUB 3, 1, 2   * r3 = 20 - 4 = 16
        4: MUL 4, 1, 2   * r4 = 20 * 4 = 80
        5: DIV 5, 1, 2   * r5 = 20 / 4 = 5
        6: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    while (tm.step() === 'OK') {}

    const s = tm.getState();
    assert.strictEqual(s.regs[0], 24, 'ADD incorrecto');
    assert.strictEqual(s.regs[3], 16, 'SUB incorrecto');
    assert.strictEqual(s.regs[4], 80, 'MUL incorrecto');
    assert.strictEqual(s.regs[5], 5,  'DIV incorrecto');
    assert.strictEqual(s.status, 'HALTED');
});

runTest('Detección de fallo por División por Cero (ZERO_DIV)', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 1, 100(0) * r1 = 100
        1: LDC 2, 0(0)   * r2 = 0
        2: DIV 0, 1, 2   * r0 = 100 / 0 -> ERROR
        3: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    let errorEmitted = false;
    tm.on('error', (err) => {
        if (err.error === 'ZERO_DIV') errorEmitted = true;
    });

    const s1 = tm.step(); // LDC
    const s2 = tm.step(); // LDC
    const s3 = tm.step(); // DIV -> ZERO_DIV

    assert.strictEqual(s3, 'ZERO_DIV');
    assert.strictEqual(tm.status, 'ZERO_DIV');
    assert.strictEqual(errorEmitted, true);
    assert.strictEqual(tm.getState().pc, 2, 'El PC debe permanecer en la instrucción que falló');
});

runTest('Detección de violación de memoria de datos (DMEM_ERR)', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 0, 99(0)
        1: ST  0, 2000(0) * fuera de rango (>1023)
    `;
    tm.loadProgram(code);

    tm.step(); // LDC
    const res = tm.step(); // ST fuera de rango
    assert.strictEqual(res, 'DMEM_ERR');
    assert.strictEqual(tm.status, 'DMEM_ERR');
});

// -----------------------------------------------------------------------------
// 4. MEMORIA DE DATOS Y RASTREO DE ÚLTIMA ESCRITURA
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 4: Memoria de Datos (DMem) y lastWrite]\x1b[0m');

runTest('Lectura y escritura en DMem con actualización de lastWrite', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 0, 777(0) * valor a guardar
        1: LDC 5, 10(0)  * base GP en r5
        2: ST  0, 5(5)   * dMem[15] = 777 (5 + reg[5] = 15)
        3: LD  1, 5(5)   * r1 = dMem[15] (5 + reg[5] = 15)
        4: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    tm.step(); // LDC r0
    tm.step(); // LDC r5
    assert.strictEqual(tm.lastWrite, -1);

    tm.step(); // ST
    assert.strictEqual(tm.lastWrite, 15, 'lastWrite debe apuntar a celda 15');
    assert.strictEqual(tm.getDMemValue(15), 777);

    tm.step(); // LD
    assert.strictEqual(tm.lastWrite, -1, 'lastWrite debe resetearse tras no escribir');
    assert.strictEqual(tm.getState().regs[1], 777);
});

// -----------------------------------------------------------------------------
// 5. SALTOS Y ESTRUCTURAS DE CONTROL (JLT, JGT, JEQ, JNE)
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 5: Saltos Condicionales y Bifurcación]\x1b[0m');

runTest('Bucle de cuenta regresiva con JGT (Salto condicional)', () => {
    const tm = new TMSimulator();
    // Bucle: suma de 1..5 = 15
    // Salto relativo al PC (r7): en loc 5, el PC se incrementó a 6. Salto a loc 3 es 6 - 3 = 3 (-3(7)).
    const code = `
        0: LDC 1, 5(0)   * i = 5 (contador)
        1: LDC 0, 0(0)   * acc = 0
        2: LDC 2, 1(0)   * constante 1
        3: ADD 0, 0, 1   * acc = acc + i (loc 3)
        4: SUB 1, 1, 2   * i = i - 1     (loc 4)
        5: JGT 1, -3(7)  * si i > 0 saltar a loc 3 (PC=6; 6-3=3)
        6: HALT 0, 0, 0  * fin
    `;
    tm.loadProgram(code);

    while (tm.step() === 'OK') {}

    const s = tm.getState();
    assert.strictEqual(s.regs[0], 15, 'La suma acumulada de 5+4+3+2+1 debe ser 15');
    assert.strictEqual(s.regs[1], 0,  'El contador final debe ser 0');
    assert.strictEqual(s.status, 'HALTED');
});

// -----------------------------------------------------------------------------
// 6. ENTRADA Y SALIDA ASÍNCRONA (IN y OUT)
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 6: Entrada/Salida Asíncrona (IN / OUT)]\x1b[0m');

runTest('Instrucción IN pausa en WAITING_INPUT y se reanuda con submitInput', () => {
    const tm = new TMSimulator();
    const code = `
        0: IN  0, 0, 0   * leer r0
        1: LDC 1, 10(0)  * constante 10
        2: ADD 0, 0, 1   * r0 = r0 + 10
        3: OUT 0, 0, 0   * imprimir r0
        4: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    let inputRequested = false;
    tm.on('inputNeeded', (info) => {
        inputRequested = true;
        assert.strictEqual(info.reg, 0);
        assert.strictEqual(info.pc, 0);
    });

    const s1 = tm.step(); // Ejecuta IN -> debe esperar
    assert.strictEqual(s1, 'WAITING_INPUT');
    assert.strictEqual(tm.status, 'WAITING_INPUT');
    assert.strictEqual(inputRequested, true);
    assert.strictEqual(tm.getState().pc, 0, 'PC no debe avanzar hasta tener el input');

    // Inyectar valor 25 del usuario
    const nextStatus = tm.submitInput(25);
    assert.strictEqual(nextStatus, 'OK');
    assert.strictEqual(tm.getState().regs[0], 25, 'r0 debe tener el valor inyectado');
    assert.strictEqual(tm.getState().pc, 1, 'PC debe avanzar a loc 1');

    // Continuar hasta el final
    while (tm.step() === 'OK') {}

    const state = tm.getState();
    assert.strictEqual(state.regs[0], 35, '25 + 10 = 35');
    assert.deepStrictEqual(state.output, [35]);
    assert.strictEqual(state.status, 'HALTED');
});

runTest('Captura múltiple en búfer de salida OUT', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 0, 100(0)
        1: OUT 0, 0, 0
        2: LDC 0, 200(0)
        3: OUT 0, 0, 0
        4: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    const emitted = [];
    tm.on('output', (entry) => emitted.push(entry.value));

    while (tm.step() === 'OK') {}

    assert.deepStrictEqual(emitted, [100, 200]);
    assert.deepStrictEqual(tm.getOutputBuffer(), [100, 200]);
});

// -----------------------------------------------------------------------------
// 7. PUNTOS DE INTERRUPCIÓN (BREAKPOINTS)
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 7: Breakpoints y Control Externo]\x1b[0m');

runTest('Interrupción precisa en dirección de Breakpoint', () => {
    const tm = new TMSimulator();
    const code = `
        0: LDC 0, 1(0)
        1: LDC 0, 2(0)
        2: LDC 0, 3(0)
        3: LDC 0, 4(0)
        4: HALT 0, 0, 0
    `;
    tm.loadProgram(code);
    tm.setBreakpoint(2, true);

    assert.strictEqual(tm.hasBreakpoint(2), true);
    assert.deepStrictEqual(tm.getBreakpoints(), [2]);

    const s0 = tm.step(); // loc 0 -> loc 1
    assert.strictEqual(s0, 'OK');

    const s1 = tm.step(); // loc 1 -> loc 2 (breakpoint!)
    assert.strictEqual(s1, 'BREAKPOINT');
    assert.strictEqual(tm.status, 'BREAKPOINT');
    assert.strictEqual(tm.getState().pc, 2);

    // Reanudar desde el breakpoint
    const s2 = tm.step(); // loc 2 -> loc 3
    assert.strictEqual(s2, 'OK');
    assert.strictEqual(tm.getState().pc, 3);
});

// -----------------------------------------------------------------------------
// 8. SOPORTE DE CADENAS EN MEMORIA (REQUERIMIENTO SANTIAGO)
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 8: Manejo e Inspección de Cadenas en DMem]\x1b[0m');

runTest('Lectura y escritura de cadenas terminadas en null (getStringAt)', () => {
    const tm = new TMSimulator();
    const texto = 'Tiny++ UNET 2026';
    tm.setStringAt(100, texto);

    // Verificar bytes en memoria
    for (let i = 0; i < texto.length; i++) {
        assert.strictEqual(tm.dMem[100 + i], texto.charCodeAt(i));
    }
    assert.strictEqual(tm.dMem[100 + texto.length], 0, 'Terminador nulo');

    // Recuperar cadena
    const recuperada = tm.getStringAt(100);
    assert.strictEqual(recuperada, texto);
});

// -----------------------------------------------------------------------------
// 9. SIMULACIÓN DE PROGRAMA REAL: FACTORIAL (facto.tm)
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 9: Programa Real Completo: facto.tm de Louden]\x1b[0m');

runTest('Cálculo de Factorial de 5 = 120 leyendo facto.tm', () => {
    const factoPath = path.join(__dirname, '../proyecto/Compiladores_Tiny_Generacion_2022_3 en 2026/Compiladores_Tiny_Generacion_2022_3/Compiladores_Tiny_Generacion_2022_1/ejemplo_generado/facto.tm');
    assert.strictEqual(fs.existsSync(factoPath), true, 'El archivo facto.tm debe existir');

    const source = fs.readFileSync(factoPath, 'utf8');
    const tm = new TMSimulator();
    const loadRes = tm.loadProgram(source);
    assert.strictEqual(loadRes.success, true);

    // Ejecutar hasta que solicite entrada del número n
    let status = tm.step();
    while (status === 'OK') {
        status = tm.step();
    }
    assert.strictEqual(status, 'WAITING_INPUT');

    // Ingresar n = 5
    tm.submitInput(5);

    // Ejecutar hasta el final
    let steps = 0;
    while (tm.status !== 'HALTED' && steps < 1000) {
        tm.step();
        steps++;
    }

    assert.strictEqual(tm.status, 'HALTED');
    const outputs = tm.getOutputBuffer();
    assert.strictEqual(outputs.length, 1);
    assert.strictEqual(outputs[0], 120, 'Factorial de 5 debe ser 120');
});

// -----------------------------------------------------------------------------
// 10. CONTRATO CON EL MÓDULO 2 (Vectores A[i] y Marcos de Pila con MP)
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 10: Contratos con Módulo 2 y Módulo 4]\x1b[0m');

runTest('Simulación de cálculo de offset de arreglos A[i*2+1] con GP', () => {
    const tm = new TMSimulator();
    // A es un arreglo en dMem[0..9] con base GP (r5=0). i está en dMem[10].
    // Expresión: i := 2; A[i*2+1] := 99; out A[5]
    const code = `
        0: LDC 5, 0(0)    * GP = 0 (base global)
        1: LDC 0, 2(0)    * i = 2
        2: ST  0, 10(5)   * dMem[10] = 2 (variable i)
        3: LD  0, 10(5)   * cargar i
        4: LDC 1, 2(0)    * factor 2
        5: MUL 0, 0, 1    * i * 2 = 4
        6: LDC 1, 1(0)    * + 1
        7: ADD 0, 0, 1    * indice calculado = 5
        8: ADD 2, 0, 5    * dir fisica = GP + 5 = 5
        9: LDC 0, 99(0)   * valor 99
        10: ST 0, 0(2)    * A[5] := 99 (dMem[5] = 99)
        11: LD 0, 5(5)    * leer A[5] directamente con GP
        12: OUT 0, 0, 0   * emitir 99
        13: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    while (tm.step() === 'OK') {}

    assert.strictEqual(tm.getDMemValue(5), 99);
    assert.deepStrictEqual(tm.getOutputBuffer(), [99]);
});

runTest('Simulación de marco de activación de función recursiva (Contrato MP)', () => {
    const tm = new TMSimulator();
    // Simular prólogo de función: guardar retorno en pila y decrementar MP
    const code = `
        0: LDC 6, 1023(0)  * MP inicial = 1023
        1: LDC 0, 42(0)    * parametro formal n = 42
        2: LDA 1, 3(7)     * return address (PC+3 = 5)
        3: ST  1, -1(6)    * salvar retorno en MP-1 (dMem[1022])
        4: ST  0, -2(6)    * salvar parametro n en MP-2 (dMem[1021])
        5: LDA 6, -3(6)    * MP := MP - 3 (nuevo marco local = 1020)
        6: LD  0, 1(6)     * cuerpo: leer parametro formal (MP+1 = 1021)
        7: OUT 0, 0, 0     * emitir 42
        8: HALT 0, 0, 0
    `;
    tm.loadProgram(code);

    while (tm.step() === 'OK') {}

    const s = tm.getState();
    assert.strictEqual(s.mp, 1020, 'MP debe decrementar a 1020');
    assert.strictEqual(tm.getDMemValue(1022), 6, 'Direccion de retorno debe estar en pila (loc 6)');
    assert.strictEqual(tm.getDMemValue(1021), 42, 'Parametro formal debe estar en pila');
    assert.deepStrictEqual(tm.getOutputBuffer(), [42]);
});

// -----------------------------------------------------------------------------
// 11. PRUEBAS ASÍNCRONAS: run() y pause()
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m[GRUPO 11: Ejecución Continua Asíncrona (run / pause)]\x1b[0m');

async function runAsyncTests() {
    await (async function testRunToHalt() {
        const tm = new TMSimulator();
        const code = `
            0: LDC 0, 10(0)
            1: LDC 1, 5(0)
            2: ADD 0, 0, 1
            3: OUT 0, 0, 0
            4: HALT 0, 0, 0
        `;
        tm.loadProgram(code);

        const finalStatus = await tm.run();
        assert.strictEqual(finalStatus, 'HALTED');
        assert.strictEqual(tm.status, 'HALTED');
        assert.deepStrictEqual(tm.getOutputBuffer(), [15]);
        console.log(`  \x1b[32m✔ PASS\x1b[0m - run() ejecuta de forma asíncrona hasta HALTED`);
        passedTests++;
    })();

    await (async function testRunToBreakpoint() {
        const tm = new TMSimulator();
        const code = `
            0: LDC 0, 1(0)
            1: LDC 0, 2(0)
            2: LDC 0, 3(0)
            3: HALT 0, 0, 0
        `;
        tm.loadProgram(code);
        tm.setBreakpoint(2, true);

        const finalStatus = await tm.run();
        assert.strictEqual(finalStatus, 'BREAKPOINT');
        assert.strictEqual(tm.getState().pc, 2);
        console.log(`  \x1b[32m✔ PASS\x1b[0m - run() se detiene automáticamente en BREAKPOINT`);
        passedTests++;
    })();

    await (async function testRunWaitsInputAndResumes() {
        const tm = new TMSimulator();
        const code = `
            0: IN  0, 0, 0
            1: LDC 1, 10(0)
            2: ADD 0, 0, 1
            3: OUT 0, 0, 0
            4: HALT 0, 0, 0
        `;
        tm.loadProgram(code);

        // Iniciar run()
        const runPromise = tm.run();

        // Esperar un tick para que el simulador alcance la instrucción IN
        await new Promise(r => setTimeout(r, 20));

        assert.strictEqual(tm.status, 'WAITING_INPUT');
        assert.strictEqual(tm.getState().pc, 0);

        // Inyectar entrada (esto debe reanudar el run() automáticamente)
        tm.submitInput(50);

        const endStatus = await runPromise;
        assert.strictEqual(endStatus, 'HALTED');
        assert.deepStrictEqual(tm.getOutputBuffer(), [60]);
        console.log(`  \x1b[32m✔ PASS\x1b[0m - run() pausa en IN, recibe submitInput() y se reanuda a HALTED`);
        passedTests++;
    })();

    // -----------------------------------------------------------------------------
    // RESUMEN FINAL
    // -----------------------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`TOTAL DE PRUEBAS: ${passedTests + failedTests}`);
    console.log(`PASARON: \x1b[32m${passedTests}\x1b[0m`);
    console.log(`FALLARON: \x1b[31m${failedTests}\x1b[0m`);
    console.log('======================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    } else {
        console.log('\x1b[32m✔ ¡Todas las pruebas (síncronas y asíncronas) pasaron al 100%!\x1b[0m\n');
    }
}

runAsyncTests().catch(err => {
    console.error('\x1b[31mError no capturado en pruebas asíncronas:\x1b[0m', err);
    process.exit(1);
});
