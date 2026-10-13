/**
 * Tiny++ Studio IDE - Adaptador del Motor de la Tiny Machine
 * Integración Módulo 4 (IDE Henyer) <-> Módulo 3 (Simulador TM Santiago)
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Cumple con el Contrato 3 de la guía metodológica:
 * - Delega la emulación del hardware al motor oficial TMSimulator de Santiago.
 * - Sincroniza eventos reactivos (step, output, inputNeeded, halt, error).
 * - Expone la API estándar esperada por el controlador visual (TinyDebuggerUI).
 */

const TinyMachine = {
    simulator: null,

    // Registros estándar de hardware (Louden TM)
    registers: {
        pc: 0,    // r7: Contador de programa
        gp: 0,    // r5: Puntero global (datos estáticos)
        mp: 1023, // r6: Puntero de memoria / pila de llamadas
        ac: 0,    // r0: Acumulador principal
        ac1: 0,   // r1: Acumulador secundario
        r2: 0,
        r3: 0,
        r4: 0
    },

    dMem: new Array(1024).fill(0),
    iMem: [],
    breakpoints: new Set(),
    status: 'READY',
    isRunning: false,
    executionSpeed: 200,
    lastWrite: -1,

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

        if (typeof window.TMSimulator === 'function') {
            this.simulator = new window.TMSimulator();
            this.bindSimulatorEvents();
        }

        this.reset();
    },

    bindSimulatorEvents() {
        if (!this.simulator) return;
        const sim = this.simulator;

        sim.on('step', (state) => {
            this.syncStateFromSimulator(state);
            if (this.callbacks.onStep) {
                this.callbacks.onStep(this.getState());
            }
        });

        sim.on('output', (entry) => {
            if (this.callbacks.onOutput) {
                this.callbacks.onOutput(entry.reg, entry.value, entry.pc);
            }
        });

        sim.on('inputNeeded', (data) => {
            if (this.callbacks.onInputRequired) {
                this.callbacks.onInputRequired(data.reg, data.pc, (val) => {
                    sim.submitInput(val);
                }, () => {
                    sim.pause();
                });
            }
        });

        sim.on('halt', (data) => {
            this.status = 'HALTED';
            this.isRunning = false;
            if (this.callbacks.onHalt) {
                this.callbacks.onHalt(data.pc);
            }
        });

        sim.on('error', (err) => {
            this.status = `ERROR_${err.error}`;
            this.isRunning = false;
            if (this.callbacks.onError) {
                this.callbacks.onError(`Fallo TM: ${err.error} en PC=${err.pc}`);
            }
        });

        sim.on('statusChange', (newStatus) => {
            this.status = newStatus;
            this.isRunning = (newStatus === 'RUNNING');
            if (this.callbacks.onStateChange) {
                this.callbacks.onStateChange(newStatus);
            }
        });
    },

    syncStateFromSimulator(state) {
        if (!state) return;
        this.registers.pc = state.pc !== undefined ? state.pc : 0;
        this.registers.mp = state.mp !== undefined ? state.mp : 1023;
        this.registers.gp = state.gp !== undefined ? state.gp : 0;
        this.registers.ac = state.ac !== undefined ? state.ac : 0;
        this.registers.ac1 = state.ac1 !== undefined ? state.ac1 : 0;

        if (state.regs) {
            this.registers.r2 = state.regs[2] || 0;
            this.registers.r3 = state.regs[3] || 0;
            this.registers.r4 = state.regs[4] || 0;
        }

        this.dMem = state.dMem ? [...state.dMem] : this.dMem;
        this.lastWrite = state.lastWrite !== undefined ? state.lastWrite : -1;
        this.status = state.status || this.status;
        this.isRunning = this.simulator ? this.simulator.isRunning : false;
    },

    loadInstructions(instructions = []) {
        this.iMem = instructions.map(i => ({
            ...i,
            addr: i.addr !== undefined ? i.addr : i.loc
        }));

        if (this.simulator) {
            const lines = this.iMem.map(i => `${i.addr}: ${i.opcode} ${i.args} * ${i.comment || ''}`).join('\n');
            const res = this.simulator.loadProgram(lines);
            if (res.success) {
                this.breakpoints.forEach(bp => this.simulator.setBreakpoint(bp, true));
                this.syncStateFromSimulator(this.simulator.getState());
                this.setStatus('READY');
                return true;
            } else {
                console.warn('TMSimulator errors:', res.errors);
            }
        }

        return false;
    },

    step() {
        if (this.simulator) {
            const res = this.simulator.step();
            this.syncStateFromSimulator(this.simulator.getState());
            return res;
        }
        return 'NO_SIMULATOR';
    },

    run() {
        if (this.simulator) {
            this.isRunning = true;
            this.setStatus('RUNNING');
            return this.simulator.run({ delay: this.executionSpeed });
        }
    },

    pause() {
        if (this.simulator) {
            this.simulator.pause();
            this.isRunning = false;
            this.setStatus('PAUSED');
        }
    },

    reset(preset = null) {
        if (this.simulator) {
            this.simulator.reset();
            if (preset && preset.instructions) {
                this.loadInstructions(preset.instructions);
            }
            this.syncStateFromSimulator(this.simulator.getState());
            this.setStatus(this.simulator.programLoaded ? 'READY' : 'STANDBY');
            return this.getState();
        }
    },

    toggleBreakpoint(addr) {
        const numAddr = parseInt(addr, 10);
        let active = false;
        if (this.breakpoints.has(numAddr)) {
            this.breakpoints.delete(numAddr);
            active = false;
        } else {
            this.breakpoints.add(numAddr);
            active = true;
        }

        if (this.simulator) {
            this.simulator.setBreakpoint(numAddr, active);
        }

        return active;
    },

    clearBreakpoints() {
        this.breakpoints.clear();
        if (this.simulator) {
            this.simulator.clearBreakpoints();
        }
    },

    setStatus(newStatus) {
        this.status = newStatus;
        if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(newStatus);
        }
    },

    getState() {
        return {
            registers: { ...this.registers },
            dMem: [...this.dMem],
            iMem: [...this.iMem],
            status: this.status,
            lastWrite: this.lastWrite,
            isRunning: this.isRunning
        };
    }
};

window.TinyMachine = TinyMachine;
