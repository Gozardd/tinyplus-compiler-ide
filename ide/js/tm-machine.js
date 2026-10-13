/**
 * Tiny++ Studio IDE - Motor de la Máquina Virtual Tiny Machine (Kenneth Louden TM)
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Características:
 * - Emulador desacoplado de hardware de 8 registros (r0..r7) y 1024 celdas DMem.
 * - Arquitectura Kenneth Louden: PC avanza secuencialmente antes de calcular direcciones efectivas.
 * - Soporte de instrucciones RO: HALT, IN, OUT, ADD, SUB, MUL, DIV.
 * - Soporte de instrucciones RM: LD, ST, LDA, LDC, JLT, JLE, JGT, JGE, JEQ, JNE.
 * - Control de ejecución no bloqueante: step(), run(), pause(), reset().
 * - Gestión de puntos de interrupción (Breakpoints) y seguimiento de lastWrite.
 */

const TinyMachine = {
    // Registros estándar de hardware (Louden TM)
    registers: {
        pc: 0,    // r7: Contador de programa
        gp: 0,    // r5: Puntero global (datos estáticos)
        mp: 1023, // r6: Puntero de memoria / pila de llamadas
        ac: 0,    // r0: Acumulador principal
        ac1: 0,   // r1: Acumulador secundario
        r2: 0,    // r2: Registro temporal auxiliar
        r3: 0,    // r3: Registro temporal auxiliar
        r4: 0     // r4: Registro temporal auxiliar
    },

    previousRegisters: {},
    dMem: new Array(1024).fill(0),
    iMem: [],
    breakpoints: new Set(),
    status: 'STANDBY',
    isRunning: false,
    runTimer: null,
    executionSpeed: 200,
    lastWrite: -1,
    justResumedFromBP: false,
    initialPreset: null,

    // Callbacks para desacoplar completamente la lógica del DOM
    callbacks: {
        onStep: null,
        onStateChange: null,
        onOutput: null,
        onInputRequired: null,
        onHalt: null,
        onError: null
    },

    init(callbacks = {}) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        this.reset();
    },

    getRegister(regNum) {
        switch (regNum) {
            case 0: return this.registers.ac;
            case 1: return this.registers.ac1;
            case 2: return this.registers.r2 || 0;
            case 3: return this.registers.r3 || 0;
            case 4: return this.registers.r4 || 0;
            case 5: return this.registers.gp;
            case 6: return this.registers.mp;
            case 7: return this.registers.pc;
            default: return 0;
        }
    },

    setRegister(regNum, value) {
        const val = value | 0;
        switch (regNum) {
            case 0: this.registers.ac = val; break;
            case 1: this.registers.ac1 = val; break;
            case 2: this.registers.r2 = val; break;
            case 3: this.registers.r3 = val; break;
            case 4: this.registers.r4 = val; break;
            case 5: this.registers.gp = val; break;
            case 6: this.registers.mp = val; break;
            case 7: this.registers.pc = val; break;
        }
    },

    setStatus(newStatus) {
        this.status = newStatus;
        if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(newStatus);
        }
    },

    /**
     * Parsea operandos en formato Kenneth Louden
     */
    parseInstructionArgs(opcode, argsStr) {
        const cleanArgs = (argsStr || '').replace(/\s+/g, '');
        const roOpcodes = ['HALT', 'IN', 'OUT', 'ADD', 'SUB', 'MUL', 'DIV'];

        if (roOpcodes.includes(opcode)) {
            const parts = cleanArgs.split(',').map(p => parseInt(p, 10) || 0);
            return {
                type: 'RO',
                r: parts[0] !== undefined ? parts[0] : 0,
                s: parts[1] !== undefined ? parts[1] : 0,
                t: parts[2] !== undefined ? parts[2] : 0
            };
        }

        const rmMatch = cleanArgs.match(/^(-?\d+),(-?\d+)\((-?\d+)\)$/);
        if (rmMatch) {
            return {
                type: 'RM',
                r: parseInt(rmMatch[1], 10),
                d: parseInt(rmMatch[2], 10),
                s: parseInt(rmMatch[3], 10)
            };
        }

        const parts = cleanArgs.split(',');
        const r = parseInt(parts[0], 10) || 0;
        const d = parseInt((parts[1] || '').replace(/[()]/g, ''), 10) || 0;
        const s = parseInt((parts[2] || '').replace(/[()]/g, ''), 10) || 0;
        return { type: 'RM', r, d, s };
    },

    loadInstructions(instructionStrings) {
        this.iMem = [];
        this.breakpoints.clear();

        instructionStrings.forEach(raw => {
            const trimmed = raw.trim();
            if (!trimmed || trimmed.startsWith('*')) return;

            const match = trimmed.match(/^(\d+):\s*([A-Za-z]+)\s+([^*]+)(?:\*\s*(.*))?$/);
            if (match) {
                const addr = parseInt(match[1], 10);
                const opcode = match[2].trim().toUpperCase();
                const args = match[3].trim();
                const comment = match[4] ? match[4].trim() : '';
                const parsed = this.parseInstructionArgs(opcode, args);

                this.iMem.push({
                    addr,
                    opcode,
                    args,
                    comment,
                    raw: trimmed,
                    ...parsed
                });
            }
        });

        this.setStatus('LISTO');
        this.notifyState();
    },

    /**
     * Ejecuta exactamente un ciclo de instrucción de la TM
     */
    step() {
        if (this.iMem.length === 0) {
            if (this.callbacks.onError) {
                this.callbacks.onError('No hay programa TM cargado en IMem.');
            }
            return false;
        }

        if (this.status === 'HALTED') {
            return false;
        }

        const currentPC = this.registers.pc;
        const instr = this.iMem.find(i => i.addr === currentPC);

        if (!instr) {
            this.setStatus('ERROR');
            if (this.callbacks.onError) {
                this.callbacks.onError(`No se encontró instrucción en la dirección PC = ${currentPC}.`);
            }
            this.pause();
            return false;
        }

        // Comprobar punto de interrupción en ejecución continua
        if (this.isRunning && this.breakpoints.has(currentPC) && !this.justResumedFromBP) {
            this.pause();
            this.setStatus('PAUSADO (BP)');
            this.notifyState();
            return false;
        }

        this.justResumedFromBP = false;

        // Semántica Louden: PC avanza antes de calcular direcciones efectivas
        const nextSequentialPC = currentPC + 1;
        this.setRegister(7, nextSequentialPC);
        this.lastWrite = -1;

        const { opcode, type, r, s, t, d } = instr;
        let m = 0;
        if (type === 'RM') {
            m = d + this.getRegister(s);
        }

        switch (opcode) {
            case 'HALT':
                this.setRegister(7, currentPC);
                this.setStatus('HALTED');
                this.isRunning = false;
                if (this.runTimer) clearInterval(this.runTimer);
                this.runTimer = null;
                if (this.callbacks.onHalt) this.callbacks.onHalt(currentPC);
                break;

            case 'IN':
                const wasRunning = this.isRunning;
                this.pause();
                this.setStatus('ESPERANDO ENTRADA');
                if (this.callbacks.onInputRequired) {
                    this.callbacks.onInputRequired(r, currentPC, (val) => {
                        this.setRegister(r, val);
                        this.setRegister(7, currentPC + 1);
                        this.setStatus('PAUSADO');
                        this.notifyState();
                        if (wasRunning) {
                            setTimeout(() => this.run(), 50);
                        }
                    }, () => {
                        this.setStatus('PAUSADO');
                        this.notifyState();
                    });
                }
                return true;

            case 'OUT':
                const outVal = this.getRegister(r);
                if (this.callbacks.onOutput) {
                    this.callbacks.onOutput(r, outVal, currentPC);
                }
                break;

            case 'ADD':
                this.setRegister(r, this.getRegister(s) + this.getRegister(t));
                break;

            case 'SUB':
                this.setRegister(r, this.getRegister(s) - this.getRegister(t));
                break;

            case 'MUL':
                this.setRegister(r, this.getRegister(s) * this.getRegister(t));
                break;

            case 'DIV':
                const denom = this.getRegister(t);
                if (denom === 0) {
                    this.setStatus('ERROR (DIV 0)');
                    this.pause();
                    if (this.callbacks.onError) {
                        this.callbacks.onError(`División por cero en instrucción ${currentPC} (${opcode} ${r}, ${s}, ${t}).`);
                    }
                    return false;
                }
                this.setRegister(r, Math.trunc(this.getRegister(s) / denom));
                break;

            case 'LD':
                if (m < 0 || m >= 1024) {
                    this.setStatus('ERROR (DMEM)');
                    this.pause();
                    if (this.callbacks.onError) {
                        this.callbacks.onError(`Lectura en DMem fuera de rango [${m}] en PC = ${currentPC}.`);
                    }
                    return false;
                }
                this.setRegister(r, this.dMem[m] || 0);
                break;

            case 'ST':
                if (m < 0 || m >= 1024) {
                    this.setStatus('ERROR (DMEM)');
                    this.pause();
                    if (this.callbacks.onError) {
                        this.callbacks.onError(`Escritura en DMem fuera de rango [${m}] en PC = ${currentPC}.`);
                    }
                    return false;
                }
                this.dMem[m] = this.getRegister(r);
                this.lastWrite = m;
                break;

            case 'LDA':
                this.setRegister(r, m);
                break;

            case 'LDC':
                this.setRegister(r, d);
                break;

            case 'JLT':
                if (this.getRegister(r) < 0) this.setRegister(7, m);
                break;

            case 'JLE':
                if (this.getRegister(r) <= 0) this.setRegister(7, m);
                break;

            case 'JGT':
                if (this.getRegister(r) > 0) this.setRegister(7, m);
                break;

            case 'JGE':
                if (this.getRegister(r) >= 0) this.setRegister(7, m);
                break;

            case 'JEQ':
                if (this.getRegister(r) === 0) this.setRegister(7, m);
                break;

            case 'JNE':
                if (this.getRegister(r) !== 0) this.setRegister(7, m);
                break;
        }

        if (this.status !== 'HALTED' && !this.status.startsWith('ERROR')) {
            if (!this.isRunning) {
                this.setStatus('PAUSADO');
            }
        }

        this.notifyState();
        return true;
    },

    run() {
        if (this.iMem.length === 0 || this.status === 'HALTED' || this.isRunning) return;

        this.isRunning = true;
        this.justResumedFromBP = this.breakpoints.has(this.registers.pc);
        this.setStatus('EJECUTANDO');

        this.runTimer = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(this.runTimer);
                this.runTimer = null;
                return;
            }

            const ok = this.step();
            if (!ok || this.status === 'HALTED' || this.status.startsWith('PAUSADO') || this.status.startsWith('ERROR')) {
                this.pause();
            }
        }, this.executionSpeed);
    },

    pause() {
        if (this.runTimer) {
            clearInterval(this.runTimer);
            this.runTimer = null;
        }
        this.isRunning = false;
        if (this.status !== 'HALTED' && !this.status.startsWith('ERROR') && !this.status.startsWith('PAUSADO')) {
            this.setStatus('PAUSADO');
        }
        this.notifyState();
    },

    reset(preset = null) {
        this.pause();

        if (preset) {
            this.initialPreset = preset;
        }

        const src = this.initialPreset;
        if (src) {
            this.registers = {
                pc: 0,
                gp: src.registers?.gp || 0,
                mp: src.registers?.mp !== undefined ? src.registers.mp : 1023,
                ac: 0,
                ac1: 0,
                r2: 0,
                r3: 0,
                r4: 0
            };
            this.dMem.fill(0);
            if (src.dmem) {
                for (const [cell, val] of Object.entries(src.dmem)) {
                    this.dMem[parseInt(cell, 10)] = val;
                }
            }
        } else {
            this.registers = { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0, r2: 0, r3: 0, r4: 0 };
            this.dMem.fill(0);
        }

        this.lastWrite = -1;
        this.setStatus('LISTO');
        this.notifyState();
    },

    toggleBreakpoint(addr) {
        if (this.breakpoints.has(addr)) {
            this.breakpoints.delete(addr);
            return false;
        } else {
            this.breakpoints.add(addr);
            return true;
        }
    },

    clearBreakpoints() {
        this.breakpoints.clear();
    },

    notifyState() {
        if (this.callbacks.onStep) {
            this.callbacks.onStep(this.getState());
        }
    },

    getState() {
        return {
            registers: { ...this.registers },
            dMem: [...this.dMem],
            iMem: [...this.iMem],
            status: this.status,
            isRunning: this.isRunning,
            lastWrite: this.lastWrite,
            breakpointsCount: this.breakpoints.size,
            pc: this.registers.pc
        };
    }
};

window.TinyMachine = TinyMachine;
