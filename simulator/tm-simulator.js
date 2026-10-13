/**
 * =============================================================================
 * MÓDULO 3: SIMULADOR Y DEPURADOR DESACOPLADO DE LA TINY MACHINE (TM)
 * =============================================================================
 * Universidad Nacional Experimental del Táchira (UNET)
 * Asignatura: Compiladores e Intérpretes (2026)
 * Autor: Santiago Hernández (C.I. V-31.098.297)
 * Rama: feature/modulo3-debugger-santiago
 *
 * Basado en la especificación formal de Kenneth C. Louden (1997).
 * Provee API externa completa para integración con el IDE (Módulo 4):
 * - Ejecución paso a paso (step-by-step)
 * - Ejecución continua configurable y pausado (run/pause)
 * - Puntos de interrupción interactivos (breakpoints)
 * - Manejo asíncrono y gráfico de E/S (IN / OUT) sin congelar la interfaz
 * - Exposición en vivo de estado (PC, GP, MP, AC, AC1, DMem 1024, IMem 1024)
 * - Detección de fallos (ZERO_DIV, DMEM_ERR, IMEM_ERR, HALT)
 * - Soporte para lectura e inspección de cadenas en memoria (getStringAt)
 * =============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TMSimulator = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    /**
     * Códigos de estado oficial de la máquina y depurador
     */
    const STATUS = {
        OK: 'OK',                         // Paso ejecutado correctamente
        READY: 'READY',                   // Programa cargado y listo para iniciar
        RUNNING: 'RUNNING',               // Ejecutando continuamente
        PAUSED: 'PAUSED',                 // Pausado por el usuario
        HALTED: 'HALTED',                 // Llegó a instrucción HALT
        WAITING_INPUT: 'WAITING_INPUT',   // Instrucción IN esperando entrada del usuario
        NEEDS_IN: 'WAITING_INPUT',        // Alias para compatibilidad con contratos de la UI
        BREAKPOINT: 'BREAKPOINT',         // Detenido por punto de interrupción
        ZERO_DIV: 'ZERO_DIV',             // Error: División por cero
        IMEM_ERR: 'IMEM_ERR',             // Error: Contador de programa fuera de rango
        DMEM_ERR: 'DMEM_ERR'              // Error: Acceso a memoria de datos fuera de rango
    };

    /**
     * Diccionario de Opcodes estándar de la Tiny Machine de Louden
     */
    const OPCODES = {
        // Instrucciones Registro-Registro (RR)
        HALT: { code: 0,  cls: 'RR', name: 'HALT' },
        IN:   { code: 1,  cls: 'RR', name: 'IN'   },
        OUT:  { code: 2,  cls: 'RR', name: 'OUT'  },
        ADD:  { code: 3,  cls: 'RR', name: 'ADD'  },
        SUB:  { code: 4,  cls: 'RR', name: 'SUB'  },
        MUL:  { code: 5,  cls: 'RR', name: 'MUL'  },
        DIV:  { code: 6,  cls: 'RR', name: 'DIV'  },

        // Instrucciones Registro-Memoria (RM)
        LD:   { code: 8,  cls: 'RM', name: 'LD'   },
        ST:   { code: 9,  cls: 'RM', name: 'ST'   },

        // Instrucciones Registro-Dirección (RA)
        LDA:  { code: 11, cls: 'RA', name: 'LDA'  },
        LDC:  { code: 12, cls: 'RA', name: 'LDC'  },
        JLT:  { code: 13, cls: 'RA', name: 'JLT'  },
        JLE:  { code: 14, cls: 'RA', name: 'JLE'  },
        JGT:  { code: 15, cls: 'RA', name: 'JGT'  },
        JGE:  { code: 16, cls: 'RA', name: 'JGE'  },
        JEQ:  { code: 17, cls: 'RA', name: 'JEQ'  },
        JNE:  { code: 18, cls: 'RA', name: 'JNE'  }
    };

    /**
     * Mapeo inverso de código numérico a información de opcode
     */
    const OP_BY_CODE = {};
    for (const [name, info] of Object.entries(OPCODES)) {
        OP_BY_CODE[info.code] = info;
    }

    class TMSimulator {
        /**
         * Constantes de arquitectura de hardware virtual
         */
        static ISIZE = 1024; // Tamaño de memoria de instrucciones
        static DSIZE = 1024; // Tamaño de memoria de datos
        static NREGS = 8;    // Número de registros (r0 .. r7)

        // Asignación de registros estándar
        static PC  = 7;      // r7: Program Counter
        static MP  = 6;      // r6: Memory / Stack Pointer (tope de pila)
        static GP  = 5;      // r5: Global Pointer (base de datos globales)
        static AC  = 0;      // r0: Acumulador principal (valor retorno función)
        static AC1 = 1;      // r1: Acumulador secundario

        static STATUS = STATUS;
        static OPCODES = OPCODES;

        constructor() {
            // Dimensiones de hardware
            this.ISIZE = TMSimulator.ISIZE;
            this.DSIZE = TMSimulator.DSIZE;
            this.NREGS = TMSimulator.NREGS;
            this.PC    = TMSimulator.PC;
            this.MP    = TMSimulator.MP;
            this.GP    = TMSimulator.GP;
            this.AC    = TMSimulator.AC;
            this.AC1   = TMSimulator.AC1;

            // Almacenamiento de memorias
            this.iMem = [];
            this.dMem = new Array(this.DSIZE).fill(0);
            this.reg  = new Array(this.NREGS).fill(0);

            // Registro de historial para detección de cambios
            this.prevReg = new Array(this.NREGS).fill(0);
            this.lastWrite = -1; // Dirección de última celda dMem modificada

            // Control de ejecución
            this.stepCount = 0;
            this.status = STATUS.READY;
            this.breakpoints = new Set();
            this.ioLog = [];
            this.programLoaded = false;
            this.maxLoadedLoc = -1;

            // Control de ejecución asíncrona continua
            this.isRunning = false;
            this.timerId = null;
            this.runResolve = null;

            // Control de entrada interactiva pendiente
            this.pendingInputReg = null;
            this.pendingInputPC = null;
            this.wasRunningBeforeInput = false;

            // Manejador de eventos (pub/sub ligero)
            this.listeners = {
                step: [],
                statusChange: [],
                output: [],
                inputNeeded: [],
                input: [],
                memoryWrite: [],
                breakpoint: [],
                halt: [],
                error: []
            };

            // Inicializar estado de hardware
            this.reset();
        }

        // =====================================================================
        // SISTEMA DE SUSCRIPCIÓN DE EVENTOS
        // =====================================================================
        on(event, callback) {
            if (this.listeners[event]) {
                this.listeners[event].push(callback);
            }
            return this;
        }

        off(event, callback) {
            if (this.listeners[event]) {
                this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
            }
            return this;
        }

        emit(event, ...args) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(cb => {
                    try { cb(...args); } catch (err) { console.error(`Error en listener de '${event}':`, err); }
                });
            }
        }

        setStatus(newStatus) {
            const oldStatus = this.status;
            if (oldStatus !== newStatus) {
                this.status = newStatus;
                this.emit('statusChange', newStatus, oldStatus);
            }
        }

        // =====================================================================
        // RESET Y REINICIALIZACIÓN DE LA MÁQUINA
        // =====================================================================
        /**
         * Reinicializa registros y memoria de datos a su estado inicial de hardware.
         * La memoria de datos ubica en dMem[0] el tope de memoria (1023) según Louden.
         * Mantiene el programa cargado en iMem y los breakpoints establecidos.
         */
        reset() {
            this.pause();

            // Memoria de datos limpia; dMem[0] apunta a la máxima dirección (1023)
            this.dMem = new Array(this.DSIZE).fill(0);
            this.dMem[0] = this.DSIZE - 1; // 1023

            // Todos los registros r0 .. r7 en 0
            this.reg = new Array(this.NREGS).fill(0);
            this.prevReg = [...this.reg];

            this.stepCount = 0;
            this.lastWrite = -1;
            this.ioLog = [];
            this.pendingInputReg = null;
            this.pendingInputPC = null;
            this.wasRunningBeforeInput = false;

            this.setStatus(this.programLoaded ? STATUS.READY : 'NO_PROGRAM');
            return this.getState();
        }

        // =====================================================================
        // PARSER DE ARCHIVOS ENSAMBLADOR .TM
        // =====================================================================
        /**
         * Parsea y carga un archivo de texto en formato ensamblador de la TM.
         * Soporta:
         * - Formato estándar: "loc: OPCODE r, d(s) * comentario"
         * - Formato alternativo: "loc: OPCODE r, s, t"
         * - Comentarios sueltos iniciados con '*', '#', ';'
         * - Espaciado arbitrario y mayúsculas/minúsculas.
         *
         * @param {string} assemblyText - Contenido del archivo .tm
         * @returns {{ success: boolean, count: number, errors: string[] }}
         */
        loadProgram(assemblyText) {
            this.reset();

            // Inicializar iMem con instrucciones NOP / HALT por defecto
            this.iMem = Array.from({ length: this.ISIZE }, (_, loc) => ({
                iop: OPCODES.HALT.code,
                opcode: 'HALT',
                cls: 'RR',
                a1: 0,
                a2: 0,
                a3: 0,
                comment: '',
                loc: loc,
                raw: '',
                has: false
            }));

            const errors = [];
            let maxLoc = -1;
            let loadedCount = 0;

            if (typeof assemblyText !== 'string' || !assemblyText.trim()) {
                this.programLoaded = false;
                this.maxLoadedLoc = -1;
                return { success: false, count: 0, errors: ['El texto del programa está vacío.'] };
            }

            const lines = assemblyText.split(/\r?\n/);

            for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const lineNum = lineIdx + 1;
                const fullLine = lines[lineIdx].trimEnd();
                const trimmed = fullLine.trim();

                // Ignorar líneas vacías o de comentario completo
                if (!trimmed || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed.startsWith(';')) {
                    continue;
                }

                const colonIndex = fullLine.indexOf(':');
                if (colonIndex < 0) {
                    errors.push(`Línea ${lineNum}: Formato inválido, falta ':' separador de dirección.`);
                    continue;
                }

                const locStr = fullLine.slice(0, colonIndex).trim();
                const loc = parseInt(locStr, 10);
                if (isNaN(loc) || loc < 0 || loc >= this.ISIZE) {
                    errors.push(`Línea ${lineNum}: Dirección de memoria [${locStr}] fuera de rango (0-${this.ISIZE - 1}).`);
                    continue;
                }

                let rest = fullLine.slice(colonIndex + 1).trim();

                // Extraer comentario si existe indicador '*'
                let comment = '';
                const starIndex = rest.indexOf('*');
                if (starIndex >= 0) {
                    comment = rest.slice(starIndex + 1).trim();
                    rest = rest.slice(0, starIndex).trim();
                }

                // Extraer nombre del Opcode
                const firstSpace = rest.search(/[\s,]/);
                let opName = (firstSpace < 0 ? rest : rest.slice(0, firstSpace)).toUpperCase().trim();
                let argString = firstSpace < 0 ? '' : rest.slice(firstSpace).trim();

                // Identificar información del Opcode
                const opInfo = OPCODES[opName];
                if (!opInfo) {
                    errors.push(`Línea ${lineNum}: Opcode desconocido '${opName}' en loc ${loc}.`);
                    continue;
                }

                let a1 = 0, a2 = 0, a3 = 0;

                if (opInfo.cls === 'RR') {
                    // Formato RR: r, s, t
                    const parts = argString.split(',').map(s => s.trim());
                    a1 = parseInt(parts[0], 10) || 0;
                    a2 = parseInt(parts[1], 10) || 0;
                    a3 = parseInt(parts[2], 10) || 0;

                    // Si hay comentario residual sin '*' (ej: texto suelto al final)
                    if (parts.length > 3 && !comment) {
                        comment = parts.slice(3).join(',').trim();
                    }
                } else {
                    // Formato RM o RA: r, d(s) o r, d, s
                    // RegEx para: reg, disp(sReg)
                    const parenMatch = argString.match(/^([0-7])\s*,\s*(-?\d+)\s*\(\s*([0-7])\s*\)(.*)$/);
                    if (parenMatch) {
                        a1 = parseInt(parenMatch[1], 10);
                        a2 = parseInt(parenMatch[2], 10);
                        a3 = parseInt(parenMatch[3], 10);
                        const trailing = parenMatch[4].trim();
                        if (trailing && !comment) {
                            comment = trailing.startsWith('*') ? trailing.slice(1).trim() : trailing;
                        }
                    } else {
                        // Intentar formato separado por comas: r, d, s
                        const commaMatch = argString.match(/^([0-7])\s*,\s*(-?\d+)\s*,\s*([0-7])(.*)$/);
                        if (commaMatch) {
                            a1 = parseInt(commaMatch[1], 10);
                            a2 = parseInt(commaMatch[2], 10);
                            a3 = parseInt(commaMatch[3], 10);
                            const trailing = commaMatch[4].trim();
                            if (trailing && !comment) {
                                comment = trailing.startsWith('*') ? trailing.slice(1).trim() : trailing;
                            }
                        } else {
                            // Intento de fallback más tolerante
                            const parts = argString.split(',').map(s => s.trim());
                            a1 = parseInt(parts[0], 10) || 0;
                            if (parts[1]) {
                                const subParts = parts[1].match(/(-?\d+)(?:\(([0-7])\))?/);
                                if (subParts) {
                                    a2 = parseInt(subParts[1], 10) || 0;
                                    a3 = subParts[2] !== undefined ? parseInt(subParts[2], 10) : (parseInt(parts[2], 10) || 0);
                                }
                            }
                        }
                    }
                }

                // Validar números de registro
                if (a1 < 0 || a1 >= this.NREGS || a3 < 0 || a3 >= this.NREGS) {
                    errors.push(`Línea ${lineNum}: Registro fuera de rango en loc ${loc} (esperado 0-${this.NREGS - 1}).`);
                    continue;
                }

                this.iMem[loc] = {
                    iop: opInfo.code,
                    opcode: opInfo.name,
                    cls: opInfo.cls,
                    a1,
                    a2,
                    a3,
                    comment,
                    loc,
                    raw: fullLine,
                    has: true
                };

                loadedCount++;
                if (loc > maxLoc) maxLoc = loc;
            }

            this.programLoaded = loadedCount > 0;
            this.maxLoadedLoc = maxLoc;
            this.setStatus(this.programLoaded ? STATUS.READY : 'NO_PROGRAM');

            return {
                success: errors.length === 0 && this.programLoaded,
                count: loadedCount,
                maxLoc: maxLoc,
                errors: errors
            };
        }

        // =====================================================================
        // EJECUCIÓN PASO A PASO (STEP-BY-STEP)
        // =====================================================================
        /**
         * Ejecuta exactamente una instrucción en la Tiny Machine.
         * Retorna el estado resultante (OK, HALTED, WAITING_INPUT, BREAKPOINT, etc.)
         *
         * @returns {string} Código de estado resultante
         */
        step() {
            // Si no hay programa cargado
            if (!this.programLoaded) {
                return 'NO_PROGRAM';
            }

            // Si la máquina ya está detenida
            if (this.status === STATUS.HALTED) {
                return STATUS.HALTED;
            }

            // Si está esperando entrada del usuario
            if (this.status === STATUS.WAITING_INPUT) {
                return STATUS.WAITING_INPUT;
            }

            const currentPC = this.reg[this.PC];

            // 1. Validar límites de memoria de instrucciones
            if (currentPC < 0 || currentPC >= this.ISIZE) {
                this.setStatus(STATUS.IMEM_ERR);
                this.emit('error', { error: STATUS.IMEM_ERR, pc: currentPC, step: this.stepCount });
                return STATUS.IMEM_ERR;
            }

            const inst = this.iMem[currentPC];

            // Si la dirección no contiene una instrucción válida, se asume HALT
            if (!inst || !inst.has) {
                this.setStatus(STATUS.HALTED);
                this.ioLog.push({ type: 'HALT', pc: currentPC, step: this.stepCount });
                this.emit('halt', { pc: currentPC, step: this.stepCount });
                return STATUS.HALTED;
            }

            // Según la especificación oficial de Louden:
            // El PC se incrementa ANTES de evaluar operandos y saltos relativos
            this.reg[this.PC] = currentPC + 1;

            // Preparar valores y registros
            this.prevReg = [...this.reg];
            this.lastWrite = -1;

            const r = inst.a1;
            let s, t, m;

            // Decodificar direcciones y operandos según clase
            if (inst.cls === 'RR') {
                s = inst.a2;
                t = inst.a3;
            } else {
                s = inst.a3;
                m = inst.a2 + this.reg[s];

                // Las instrucciones RM interactúan con memoria de datos física
                if (inst.cls === 'RM') {
                    if (m < 0 || m >= this.DSIZE) {
                        this.reg[this.PC] = currentPC; // Restaurar PC por error
                        this.setStatus(STATUS.DMEM_ERR);
                        this.emit('error', { error: STATUS.DMEM_ERR, pc: currentPC, addr: m, step: this.stepCount });
                        return STATUS.DMEM_ERR;
                    }
                }
            }

            let resultStatus = STATUS.OK;

            // Ejecución semántica del Opcode
            switch (inst.iop) {
                // RR: HALT
                case 0:
                    this.reg[this.PC] = currentPC; // PC permanece en HALT
                    resultStatus = STATUS.HALTED;
                    this.ioLog.push({ type: 'HALT', pc: currentPC, step: this.stepCount });
                    this.emit('halt', { pc: currentPC, step: this.stepCount });
                    this.stepCount++;
                    this.setStatus(resultStatus);
                    this.emit('step', this.getState());
                    return STATUS.HALTED;

                // RR: IN (Lectura asíncrona)
                case 1:
                    // En instrucción IN restauramos PC hasta recibir submitInput(val)
                    this.reg[this.PC] = currentPC;
                    this.pendingInputReg = r;
                    this.pendingInputPC = currentPC;
                    this.wasRunningBeforeInput = this.isRunning;
                    this.stopTimer(); // Suspender timer sin finalizar la promesa de run()
                    this.isRunning = false;
                    this.setStatus(STATUS.WAITING_INPUT);
                    this.emit('inputNeeded', { reg: r, pc: currentPC, step: this.stepCount });
                    return STATUS.WAITING_INPUT;

                // RR: OUT (Escritura hacia la salida gráfica)
                case 2:
                    const outVal = this.reg[r];
                    const outEntry = {
                        type: 'OUT',
                        value: outVal,
                        reg: r,
                        pc: currentPC,
                        step: this.stepCount,
                        timestamp: Date.now()
                    };
                    this.ioLog.push(outEntry);
                    this.emit('output', outEntry);
                    break;

                // RR: ADD
                case 3:
                    this.reg[r] = (this.reg[s] + this.reg[t]) | 0;
                    break;

                // RR: SUB
                case 4:
                    this.reg[r] = (this.reg[s] - this.reg[t]) | 0;
                    break;

                // RR: MUL
                case 5:
                    this.reg[r] = Math.imul(this.reg[s], this.reg[t]) | 0;
                    break;

                // RR: DIV
                case 6:
                    if (this.reg[t] === 0) {
                        this.reg[this.PC] = currentPC; // Restaurar PC en fallo
                        this.setStatus(STATUS.ZERO_DIV);
                        this.emit('error', { error: STATUS.ZERO_DIV, pc: currentPC, step: this.stepCount });
                        return STATUS.ZERO_DIV;
                    }
                    this.reg[r] = Math.trunc(this.reg[s] / this.reg[t]) | 0;
                    break;

                // RM: LD
                case 8:
                    this.reg[r] = this.dMem[m];
                    break;

                // RM: ST
                case 9:
                    const prevVal = this.dMem[m];
                    this.dMem[m] = this.reg[r];
                    this.lastWrite = m;
                    this.emit('memoryWrite', { addr: m, value: this.reg[r], prevValue: prevVal });
                    break;

                // RA: LDA
                case 11:
                    this.reg[r] = m;
                    break;

                // RA: LDC
                case 12:
                    this.reg[r] = inst.a2;
                    break;

                // RA: JLT (Jump if < 0)
                case 13:
                    if (this.reg[r] < 0) this.reg[this.PC] = m;
                    break;

                // RA: JLE (Jump if <= 0)
                case 14:
                    if (this.reg[r] <= 0) this.reg[this.PC] = m;
                    break;

                // RA: JGT (Jump if > 0)
                case 15:
                    if (this.reg[r] > 0) this.reg[this.PC] = m;
                    break;

                // RA: JGE (Jump if >= 0)
                case 16:
                    if (this.reg[r] >= 0) this.reg[this.PC] = m;
                    break;

                // RA: JEQ (Jump if == 0)
                case 17:
                    if (this.reg[r] === 0) this.reg[this.PC] = m;
                    break;

                // RA: JNE (Jump if != 0)
                case 18:
                    if (this.reg[r] !== 0) this.reg[this.PC] = m;
                    break;

                default:
                    resultStatus = STATUS.HALTED;
                    break;
            }

            // Incrementar contador de instrucciones ejecutadas
            this.stepCount++;

            // Verificar si el nuevo PC corresponde a un breakpoint activo
            const targetPC = this.reg[this.PC];
            if (resultStatus === STATUS.OK && this.breakpoints.has(targetPC)) {
                resultStatus = STATUS.BREAKPOINT;
                this.emit('breakpoint', { pc: targetPC, step: this.stepCount });
            }

            this.setStatus(resultStatus);
            this.emit('step', this.getState());

            return resultStatus;
        }

        // =====================================================================
        // RESOLUCIÓN ASÍNCRONA DE ENTRADA (IN)
        // =====================================================================
        /**
         * Inyecta el valor suministrado por el usuario/IDE cuando la máquina
         * se encuentra en estado WAITING_INPUT. Avanza el PC y reanuda la ejecución.
         *
         * @param {number|string} val - Entero ingresado
         * @returns {string} Nuevo estado de la máquina
         */
        submitInput(val) {
            if (this.status !== STATUS.WAITING_INPUT) {
                console.warn('TMSimulator: submitInput llamado pero la máquina no está en WAITING_INPUT');
                return this.status;
            }

            const parsedVal = parseInt(val, 10);
            if (isNaN(parsedVal)) {
                console.warn('TMSimulator: submitInput recibió un valor no numérico:', val);
                return STATUS.WAITING_INPUT;
            }

            const targetReg = this.pendingInputReg;
            const currentPC = this.pendingInputPC;

            // Inyectar en el registro destino
            this.reg[targetReg] = parsedVal;

            // Registrar en el log de E/S
            const inEntry = {
                type: 'IN',
                value: parsedVal,
                reg: targetReg,
                pc: currentPC,
                step: this.stepCount,
                timestamp: Date.now()
            };
            this.ioLog.push(inEntry);
            this.emit('input', inEntry);

            // Avanzar PC tras completar la instrucción IN
            const nextPC = currentPC + 1;
            this.reg[this.PC] = nextPC;
            this.stepCount++;

            this.pendingInputReg = null;
            this.pendingInputPC = null;

            let resultStatus = STATUS.OK;
            if (this.breakpoints.has(nextPC)) {
                resultStatus = STATUS.BREAKPOINT;
                this.emit('breakpoint', { pc: nextPC, step: this.stepCount });
            }

            this.setStatus(resultStatus);
            this.emit('step', this.getState());

            // Si venía ejecutando en modo 'run', reanudar automáticamente
            if (this.wasRunningBeforeInput && resultStatus === STATUS.OK) {
                this.wasRunningBeforeInput = false;
                if (this.activeCycleFn) {
                    this.isRunning = true;
                    this.setStatus(STATUS.RUNNING);
                    this.scheduleCycle(this.activeCycleFn);
                }
            } else if (this.runResolve && resultStatus !== STATUS.OK && resultStatus !== STATUS.WAITING_INPUT) {
                const res = this.runResolve;
                this.runResolve = null;
                res(resultStatus);
            }

            return resultStatus;
        }

        /**
         * Alias para cumplir con el Contrato 3 de la guía metodológica
         */
        sendInput(val) {
            return this.submitInput(val);
        }

        // =====================================================================
        // EJECUCIÓN CONTINUA, CONTROL DE PAUSA Y TIEMPO
        // =====================================================================
        stopTimer() {
            if (this.timerId !== null) {
                if (typeof cancelAnimationFrame === 'function') {
                    cancelAnimationFrame(this.timerId);
                }
                clearTimeout(this.timerId);
                if (typeof clearImmediate === 'function') {
                    clearImmediate(this.timerId);
                }
                this.timerId = null;
            }
        }

        scheduleCycle(fn) {
            if (typeof requestAnimationFrame === 'function') {
                this.timerId = requestAnimationFrame(fn);
            } else if (typeof setImmediate === 'function') {
                this.timerId = setImmediate(fn);
            } else {
                this.timerId = setTimeout(fn, 0);
            }
        }

        /**
         * Inicia la ejecución continua no bloqueante del simulador.
         * En navegador procesa lotes por cuadro de animación (requestAnimationFrame)
         * para mantener la interfaz de usuario perfectamente fluida a 60fps.
         *
         * @param {Object} options
         * @param {number} [options.delayMs=0] - Retardo en ms por paso (para animaciones lentas)
         * @param {number} [options.maxSteps=1000000] - Límite de seguridad contra bucles infinitos
         * @returns {Promise<string>} Promesa que resuelve al detenerse (HALTED, BREAKPOINT, etc.)
         */
        run(options = {}) {
            const { delayMs = 0, maxSteps = 1000000 } = options;

            if (this.status === STATUS.HALTED || !this.programLoaded) {
                return Promise.resolve(this.status);
            }

            this.pause(); // Detener cualquier ciclo previo
            this.isRunning = true;
            this.setStatus(STATUS.RUNNING);

            return new Promise((resolve) => {
                this.runResolve = resolve;

                const executeCycle = () => {
                    if (!this.isRunning) {
                        return;
                    }

                    // Modo con retardo por paso (animación visual lenta)
                    if (delayMs > 0) {
                        const stepRes = this.step();
                        if (stepRes !== STATUS.OK) {
                            this.isRunning = false;
                            if (stepRes !== STATUS.WAITING_INPUT) {
                                this.activeCycleFn = null;
                                if (this.runResolve) {
                                    const r = this.runResolve;
                                    this.runResolve = null;
                                    r(stepRes);
                                }
                            }
                            return;
                        }
                        this.timerId = setTimeout(executeCycle, delayMs);
                        return;
                    }

                    // Modo de alta velocidad no bloqueante (lotes de instrucciones)
                    const batchSize = 1000;
                    let stepsInBatch = 0;

                    while (this.isRunning && stepsInBatch < batchSize && this.stepCount < maxSteps) {
                        const stepRes = this.step();
                        stepsInBatch++;

                        if (stepRes !== STATUS.OK) {
                            this.isRunning = false;
                            if (stepRes !== STATUS.WAITING_INPUT) {
                                this.activeCycleFn = null;
                                if (this.runResolve) {
                                    const r = this.runResolve;
                                    this.runResolve = null;
                                    r(stepRes);
                                }
                            }
                            return;
                        }
                    }

                    if (this.stepCount >= maxSteps) {
                        console.warn(`TMSimulator: run() alcanzó el límite de seguridad de ${maxSteps} pasos.`);
                        this.pause();
                        return;
                    }

                    // Ceder el control al motor de eventos / renderizado
                    this.scheduleCycle(executeCycle);
                };

                this.activeCycleFn = executeCycle;
                executeCycle();
            });
        }

        /**
         * Pausa inmediatamente la ejecución continua.
         */
        pause() {
            this.isRunning = false;
            this.activeCycleFn = null;
            this.wasRunningBeforeInput = false;
            this.stopTimer();

            if (this.status === STATUS.RUNNING) {
                this.setStatus(STATUS.PAUSED);
            }

            if (this.runResolve) {
                const res = this.runResolve;
                this.runResolve = null;
                res(this.status);
            }
        }

        // =====================================================================
        // GESTIÓN DE BREAKPOINTS (PUNTOS DE INTERRUPCIÓN)
        // =====================================================================
        setBreakpoint(loc, active = true) {
            const numLoc = parseInt(loc, 10);
            if (isNaN(numLoc) || numLoc < 0 || numLoc >= this.ISIZE) return false;

            if (active) {
                this.breakpoints.add(numLoc);
            } else {
                this.breakpoints.delete(numLoc);
            }
            return true;
        }

        toggleBreakpoint(loc) {
            const numLoc = parseInt(loc, 10);
            if (this.breakpoints.has(numLoc)) {
                this.breakpoints.delete(numLoc);
                return false;
            } else {
                this.breakpoints.add(numLoc);
                return true;
            }
        }

        clearBreakpoints() {
            this.breakpoints.clear();
        }

        hasBreakpoint(loc) {
            return this.breakpoints.has(parseInt(loc, 10));
        }

        getBreakpoints() {
            return Array.from(this.breakpoints).sort((a, b) => a - b);
        }

        // =====================================================================
        // EXPOSICIÓN EN VIVO DEL ESTADO (CONTRATO 3 CON EL IDE)
        // =====================================================================
        /**
         * Devuelve una instantánea inmutable del estado del hardware virtual.
         * Cumple con la firma exigida por el Contrato 3 de la guía metodológica.
         */
        getState() {
            return {
                regs: [...this.reg],
                pc: this.reg[this.PC],
                mp: this.reg[this.MP],
                gp: this.reg[this.GP],
                ac: this.reg[this.AC],
                ac1: this.reg[this.AC1],
                dMem: [...this.dMem],
                iMem: this.getLoadedInstructions(),
                status: this.status,
                lastWrite: this.lastWrite,
                stepCount: this.stepCount,
                breakpoints: this.getBreakpoints(),
                ioLog: [...this.ioLog],
                output: this.getOutputBuffer(),
                programLoaded: this.programLoaded
            };
        }

        /**
         * Obtiene la lista de instrucciones válidas cargadas en iMem.
         */
        getLoadedInstructions() {
            if (this.maxLoadedLoc < 0) return [];
            const result = [];
            for (let i = 0; i <= this.maxLoadedLoc; i++) {
                if (this.iMem[i] && this.iMem[i].has) {
                    result.push({
                        ...this.iMem[i],
                        hasBreakpoint: this.breakpoints.has(i),
                        isCurrentPC: this.reg[this.PC] === i
                    });
                }
            }
            return result;
        }

        /**
         * Obtiene todos los valores emitidos por instrucciones OUT como arreglo numérico.
         */
        getOutputBuffer() {
            return this.ioLog.filter(e => e.type === 'OUT').map(e => e.value);
        }

        // =====================================================================
        // SOPORTE PARA CADENAS Y DATOS EN MEMORIA (REQUERIMIENTO SANTIAGO)
        // =====================================================================
        /**
         * Lee una cadena de caracteres terminada en cero desde una dirección de dMem.
         * Esencial para verificar cadenas de texto ('string') generadas por el Módulo 2.
         *
         * @param {number} addr - Dirección de inicio en dMem
         * @returns {string} Cadena decodificada
         */
        getStringAt(addr) {
            let str = '';
            let current = addr;
            while (current >= 0 && current < this.DSIZE && this.dMem[current] !== 0) {
                str += String.fromCharCode(this.dMem[current]);
                current++;
            }
            return str;
        }

        /**
         * Escribe una cadena de caracteres terminada en null en dMem.
         * Útil para preparación de pruebas unitarias y simulaciones de cadenas.
         *
         * @param {number} addr - Dirección de inicio
         * @param {string} str - Cadena a escribir
         */
        setStringAt(addr, str) {
            if (addr < 0 || addr >= this.DSIZE) return false;
            for (let i = 0; i < str.length && (addr + i) < this.DSIZE; i++) {
                this.dMem[addr + i] = str.charCodeAt(i);
            }
            if ((addr + str.length) < this.DSIZE) {
                this.dMem[addr + str.length] = 0;
            }
            return true;
        }

        /**
         * Acceso de lectura directo a una celda de dMem.
         */
        getDMemValue(addr) {
            if (addr >= 0 && addr < this.DSIZE) {
                return this.dMem[addr];
            }
            return 0;
        }

        /**
         * Acceso de escritura directo a una celda de dMem.
         */
        setDMemValue(addr, val) {
            if (addr >= 0 && addr < this.DSIZE) {
                this.dMem[addr] = parseInt(val, 10) || 0;
                this.lastWrite = addr;
                return true;
            }
            return false;
        }
    }

    return TMSimulator;
}));
