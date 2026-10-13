/**
 * Módulo de la Interfaz del Depurador Visual de la Tiny Machine
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Características de la Fase 5:
 * - Hardware virtual de la TM (PC=r7, GP=r5, MP=r6, AC=r0, AC1=r1, r2..r4)
 * - Motor de ejecución Louden TM completo (Step, Run, Pause, Reset)
 * - Puntos de interrupción (Breakpoints) interactivos con detención automática en Run
 * - Micro-animaciones de cambio de estado en registros (flashReg) y celdas de memoria (flashDMemWrite)
 * - Memoria de Datos (DMem - 1024 celdas) con selector de vistas y salto a celda
 * - Memoria de Instrucciones (IMem) con seguimiento visual y auto-desplazamiento del PC
 */

const TinyDebuggerUI = {
    // Estado del hardware virtual de la Tiny Machine
    registers: {
        pc: 0,    // r7: Program Counter
        gp: 0,    // r5: Global Pointer (base de datos estáticos)
        mp: 1023, // r6: Memory/Stack Pointer (tope de pila)
        ac: 0,    // r0: Acumulador principal
        ac1: 0,   // r1: Acumulador secundario
        r2: 0,    // r2: Registro auxiliar
        r3: 0,    // r3: Registro auxiliar
        r4: 0     // r4: Registro auxiliar
    },

    previousRegisters: {},
    dMem: new Array(1024).fill(0),
    iMem: [],
    breakpoints: new Set(),
    dMemViewMode: 'gp',
    status: 'STANDBY',
    isRunning: false,
    runTimer: null,
    executionSpeed: 200, // milisegundos por paso en modo Run
    justResumedFromBP: false,
    lastWrite: -1,
    initialProgramPreset: null,

    init() {
        this.setupTabs();
        this.setupIMemControls();
        this.setupDMemControls();
        this.updateRegisters(this.registers);
        this.renderDMem();
        this.updateControlButtons();
        this.setStatus('LISTO');
    },

    /**
     * Alternador de pestañas de inspección (IMem, DMem, AST, Símbolos)
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.inspector-tabs .tab-btn');
        const tabPanes = document.querySelectorAll('.inspector-content .tab-pane');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = document.getElementById(targetTab);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    },

    /**
     * Controles superiores de la Memoria de Instrucciones (IMem)
     */
    setupIMemControls() {
        const btnToPC = document.getElementById('btn-imem-topc');
        const btnClearBP = document.getElementById('btn-imem-clearbp');
        const speedSelect = document.getElementById('tm-speed-selector');

        if (btnToPC) {
            btnToPC.addEventListener('click', () => this.scrollToPC());
        }

        if (btnClearBP) {
            btnClearBP.addEventListener('click', () => this.clearBreakpoints());
        }

        if (speedSelect) {
            speedSelect.addEventListener('change', () => {
                this.executionSpeed = parseInt(speedSelect.value, 10) || 200;
                if (this.isRunning) {
                    // Reanudar con nueva velocidad
                    this.pause();
                    this.run();
                }
            });
        }
    },

    /**
     * Controles superiores de la Memoria de Datos (DMem)
     */
    setupDMemControls() {
        const selectMode = document.getElementById('dmem-view-mode');
        const jumpInput = document.getElementById('dmem-jump-input');
        const btnJump = document.getElementById('btn-dmem-jump');

        if (selectMode) {
            selectMode.addEventListener('change', () => {
                this.dMemViewMode = selectMode.value;
                this.renderDMem();
            });
        }

        const handleJump = () => {
            if (!jumpInput) return;
            const target = parseInt(jumpInput.value, 10);
            if (!isNaN(target) && target >= 0 && target < 1024) {
                this.jumpToDMemCell(target);
            }
        };

        if (btnJump) btnJump.addEventListener('click', handleJump);
        if (jumpInput) {
            jumpInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleJump();
            });
        }
    },

    /**
     * Actualiza el estado visual de los botones de la barra de control
     */
    updateControlButtons() {
        const btnRun = document.getElementById('btn-run');
        const btnStep = document.getElementById('btn-step');
        const btnPause = document.getElementById('btn-pause');
        const btnReset = document.getElementById('btn-reset');

        if (!btnRun || !btnStep || !btnPause) return;

        if (this.isRunning) {
            btnRun.classList.add('is-running');
            btnRun.disabled = true;
            btnStep.disabled = true;
            btnPause.disabled = false;
        } else {
            btnRun.classList.remove('is-running');
            const isHalted = this.status === 'HALTED';
            btnRun.disabled = isHalted;
            btnStep.disabled = isHalted;
            btnPause.disabled = true;
        }

        if (btnReset) {
            btnReset.disabled = false;
        }
    },

    // =========================================================================
    // ACCESO A REGISTROS (MAPEO ESTÁNDAR KENNETH LOUDEN: r0..r7)
    // =========================================================================
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
        const val = value | 0; // Truncado a entero de 32 bits
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

    /**
     * Actualiza la visualización de los registros y dispara micro-animación en cambios
     */
    updateRegisters(newRegs = {}) {
        const regMap = {
            pc: { id: 'val-pc', box: 'reg-pc' },
            gp: { id: 'val-gp', box: 'reg-gp' },
            mp: { id: 'val-mp', box: 'reg-mp' },
            ac: { id: 'val-ac', box: 'reg-ac' },
            ac1: { id: 'val-ac1', box: 'reg-ac1' }
        };

        let pcChanged = false;

        for (const [key, val] of Object.entries(newRegs)) {
            if (this.registers[key] !== undefined) {
                const prev = this.previousRegisters[key];
                this.registers[key] = val;

                if (key === 'pc' && prev !== val) {
                    pcChanged = true;
                }

                const domInfo = regMap[key];
                if (domInfo) {
                    const el = document.getElementById(domInfo.id);
                    const box = document.getElementById(domInfo.box);
                    if (el) el.textContent = val;

                    // Micro-animación de destello si el registro cambió
                    if (box && prev !== undefined && prev !== val) {
                        box.classList.remove('reg-changed');
                        void box.offsetWidth; // Forzar reflow para reiniciar animación
                        box.classList.add('reg-changed');
                    }
                }
            }
        }

        this.previousRegisters = { ...this.registers };

        if (pcChanged && this.iMem.length > 0) {
            this.highlightCurrentPC();
        }
    },

    setStatus(statusText) {
        this.status = statusText;
        const pill = document.getElementById('tm-status');
        if (pill) {
            pill.textContent = statusText;
            pill.className = 'tm-status-pill';
            if (statusText === 'LISTO' || statusText === 'CARGADO' || statusText === 'STANDBY') {
                pill.classList.add('status-ready');
            } else if (statusText === 'EJECUTANDO') {
                pill.classList.add('status-running');
            } else if (statusText.startsWith('PAUSADO')) {
                pill.classList.add('status-paused');
            } else if (statusText === 'HALTED') {
                pill.classList.add('status-halted');
            } else if (statusText.startsWith('ERROR')) {
                pill.classList.add('status-error');
            }
        }
    },

    // =========================================================================
    // MEMORIA DE INSTRUCCIONES (IMEM) Y PARSER
    // =========================================================================
    /**
     * Parsea argumentos de instrucciones TM (RO y RM)
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

        // Tipo RM: r, d(s)
        const rmMatch = cleanArgs.match(/^(-?\d+),(-?\d+)\((-?\d+)\)$/);
        if (rmMatch) {
            return {
                type: 'RM',
                r: parseInt(rmMatch[1], 10),
                d: parseInt(rmMatch[2], 10),
                s: parseInt(rmMatch[3], 10)
            };
        }

        // Fallback por comas si el formato varía ligeramente
        const parts = cleanArgs.split(',');
        const r = parseInt(parts[0], 10) || 0;
        const d = parseInt((parts[1] || '').replace(/[()]/g, ''), 10) || 0;
        const s = parseInt((parts[2] || '').replace(/[()]/g, ''), 10) || 0;
        return { type: 'RM', r, d, s };
    },

    /**
     * Parsea y carga instrucciones en formato estándar de Kenneth Louden
     * Ejemplo: "0: LDC 6, 1023(0) * inicializar mp"
     */
    loadInstructions(instructionStrings) {
        this.iMem = [];
        this.breakpoints.clear();

        instructionStrings.forEach(raw => {
            const trimmed = raw.trim();
            if (!trimmed || trimmed.startsWith('*')) return;

            // Formato: <loc>: <opcode> <args> * <comment>
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

        const countBadge = document.getElementById('imem-count');
        if (countBadge) {
            countBadge.textContent = `${this.iMem.length} instrs`;
        }

        this.renderIMem();
        this.updateBreakpointCount();
        this.highlightCurrentPC();
    },

    renderIMem() {
        const list = document.getElementById('imem-list');
        if (!list) return;

        if (this.iMem.length === 0) {
            list.innerHTML = '<div class="memory-placeholder">No se ha cargado ningún programa objeto TM todavía. Pulsa "Compilar".</div>';
            return;
        }

        let html = '';
        this.iMem.forEach(instr => {
            const hasBP = this.breakpoints.has(instr.addr);
            const isPC = instr.addr === this.registers.pc;

            html += `
                <div class="imem-row ${isPC ? 'active-pc' : ''}" data-addr="${instr.addr}">
                    <div class="imem-bp-col" data-addr="${instr.addr}" title="Alternar punto de interrupción">
                        <span class="bp-dot ${hasBP ? 'active' : ''}"></span>
                    </div>
                    <div class="imem-addr">${instr.addr}:</div>
                    <div class="imem-code" title="${instr.opcode} ${instr.args}">
                        <span class="imem-opcode">${instr.opcode}</span> <span class="imem-args">${instr.args}</span>
                    </div>
                    <div class="imem-comment" title="${instr.comment}">* ${instr.comment}</div>
                </div>
            `;
        });

        list.innerHTML = html;

        // Conectar eventos interactivos de Breakpoints en cada fila
        const rows = list.querySelectorAll('.imem-row');
        rows.forEach(row => {
            const addr = parseInt(row.getAttribute('data-addr'), 10);
            const bpCol = row.querySelector('.imem-bp-col');

            if (bpCol) {
                bpCol.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBreakpoint(addr);
                });
            }

            // Doble clic en la fila para alternar breakpoint
            row.addEventListener('dblclick', () => {
                this.toggleBreakpoint(addr);
            });
        });
    },

    toggleBreakpoint(addr) {
        if (this.breakpoints.has(addr)) {
            this.breakpoints.delete(addr);
            if (window.TinyConsole) {
                window.TinyConsole.info(`Breakpoint eliminado en dirección de memoria TM [${addr}]`);
            }
        } else {
            this.breakpoints.add(addr);
            if (window.TinyConsole) {
                window.TinyConsole.warn(`Breakpoint establecido en dirección de memoria TM [${addr}]`);
            }
        }

        // Actualizar visualmente la fila afectada
        const row = document.querySelector(`.imem-row[data-addr="${addr}"] .bp-dot`);
        if (row) {
            row.classList.toggle('active', this.breakpoints.has(addr));
        }

        this.updateBreakpointCount();
    },

    clearBreakpoints() {
        if (this.breakpoints.size === 0) return;
        this.breakpoints.clear();
        const activeDots = document.querySelectorAll('.imem-list .bp-dot.active');
        activeDots.forEach(d => d.classList.remove('active'));
        this.updateBreakpointCount();
        if (window.TinyConsole) {
            window.TinyConsole.info('Todos los puntos de interrupción han sido removidos.');
        }
    },

    updateBreakpointCount() {
        const bpBadge = document.getElementById('imem-bp-count');
        if (bpBadge) {
            bpBadge.textContent = `${this.breakpoints.size} BPs`;
            bpBadge.classList.toggle('has-bp', this.breakpoints.size > 0);
        }
    },

    highlightCurrentPC() {
        const currentPC = this.registers.pc;
        const rows = document.querySelectorAll('.imem-list .imem-row');
        rows.forEach(r => {
            const addr = parseInt(r.getAttribute('data-addr'), 10);
            r.classList.toggle('active-pc', addr === currentPC);
        });
    },

    scrollToPC() {
        const activeRow = document.querySelector('.imem-list .imem-row.active-pc');
        if (activeRow) {
            activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    // =========================================================================
    // MOTOR DE EJECUCIÓN (LOUDEN TM: STEP, RUN, PAUSE, RESET)
    // =========================================================================
    /**
     * Ejecuta exactamente una instrucción de la Tiny Machine
     */
    step() {
        if (this.iMem.length === 0) {
            if (window.TinyConsole) {
                window.TinyConsole.warn('No hay programa TM cargado en IMem. Haz clic en "Compilar" primero.');
            }
            return false;
        }

        if (this.status === 'HALTED') {
            if (window.TinyConsole) {
                window.TinyConsole.info('🏁 La Tiny Machine ya está en estado HALT. Haz clic en "Reset" (↺) para reiniciar.');
            }
            return false;
        }

        const currentPC = this.registers.pc;
        const instr = this.iMem.find(i => i.addr === currentPC);

        if (!instr) {
            this.setStatus('ERROR');
            if (window.TinyConsole) {
                window.TinyConsole.error(`Error de ejecución: No se encontró instrucción en la dirección PC = ${currentPC}.`);
            }
            this.pause();
            return false;
        }

        // Comprobar punto de interrupción si estamos en modo RUN continuo
        if (this.isRunning && this.breakpoints.has(currentPC) && !this.justResumedFromBP) {
            this.pause();
            this.setStatus('PAUSADO (BP)');
            if (window.TinyConsole) {
                window.TinyConsole.warn(`⏸ Punto de interrupción alcanzado en instrucción [${currentPC}: ${instr.opcode} ${instr.args}].`);
            }
            this.scrollToPC();
            return false;
        }

        this.justResumedFromBP = false;

        // Semántica de Louden TM: PC se incrementa ANTES de calcular operandos efectivos
        const nextSequentialPC = currentPC + 1;
        this.setRegister(7, nextSequentialPC);

        this.lastWrite = -1;
        const { opcode, type, r, s, t, d } = instr;

        // Cálculo de operando de memoria efectiva m para instrucciones RM
        let m = 0;
        if (type === 'RM') {
            m = d + this.getRegister(s);
        }

        switch (opcode) {
            case 'HALT':
                // En HALT, PC permanece apuntando a la instrucción HALT
                this.setRegister(7, currentPC);
                this.setStatus('HALTED');
                this.isRunning = false;
                if (this.runTimer) clearInterval(this.runTimer);
                this.runTimer = null;
                if (window.TinyConsole) {
                    window.TinyConsole.success(`🏁 HALT: Programa TM finalizado con éxito en la dirección ${currentPC}.`);
                }
                this.updateControlButtons();
                break;

            case 'IN':
                // Diálogo de entrada para read
                let inVal = 0;
                const userPrompt = prompt(`[Tiny Machine - IN]\nIngrese un valor entero para el acumulador r${r} (AC):`, '5');
                if (userPrompt !== null && userPrompt.trim() !== '') {
                    inVal = parseInt(userPrompt.trim(), 10) || 0;
                }
                this.setRegister(r, inVal);
                if (window.TinyConsole) {
                    window.TinyConsole.info(`📥 [TM IN] Entrada leída para r${r}: ${inVal}`);
                }
                break;

            case 'OUT':
                const outVal = this.getRegister(r);
                if (window.TinyConsole) {
                    window.TinyConsole.success(`📤 [TM OUT] Salida r${r}: ${outVal}`);
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
                    if (window.TinyConsole) {
                        window.TinyConsole.error(`⛔ Excepción TM: División por cero en instrucción ${currentPC} (${opcode} ${r}, ${s}, ${t}).`);
                    }
                    return false;
                }
                this.setRegister(r, Math.trunc(this.getRegister(s) / denom));
                break;

            case 'LD':
                if (m < 0 || m >= 1024) {
                    this.setStatus('ERROR (DMEM)');
                    this.pause();
                    if (window.TinyConsole) {
                        window.TinyConsole.error(`⛔ Excepción TM: Lectura en DMem fuera de rango [${m}] en PC = ${currentPC}.`);
                    }
                    return false;
                }
                this.setRegister(r, this.dMem[m] || 0);
                break;

            case 'ST':
                if (m < 0 || m >= 1024) {
                    this.setStatus('ERROR (DMEM)');
                    this.pause();
                    if (window.TinyConsole) {
                        window.TinyConsole.error(`⛔ Excepción TM: Escritura en DMem fuera de rango [${m}] en PC = ${currentPC}.`);
                    }
                    return false;
                }
                const stVal = this.getRegister(r);
                this.dMem[m] = stVal;
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

            default:
                if (window.TinyConsole) {
                    window.TinyConsole.warn(`Instrucción desconocida en TM: "${opcode}" en PC = ${currentPC}.`);
                }
                break;
        }

        // Actualizar visualizaciones y animaciones
        this.updateRegisters(this.registers);
        this.highlightCurrentPC();
        this.scrollToPC();

        if (this.status !== 'HALTED' && !this.status.startsWith('ERROR')) {
            if (!this.isRunning) {
                this.setStatus('PAUSADO');
            }
        }

        // Micro-animación de escritura en memoria si hubo ST
        if (this.lastWrite !== -1) {
            this.renderDMem();
            this.animateDMemCellWrite(this.lastWrite);
        }

        this.updateControlButtons();
        return true;
    },

    /**
     * Inicia la ejecución continua de la Tiny Machine con intervalos animados
     */
    run() {
        if (this.iMem.length === 0) {
            if (window.TinyConsole) {
                window.TinyConsole.warn('No hay programa TM cargado en IMem. Haz clic en "Compilar" primero.');
            }
            return;
        }

        if (this.status === 'HALTED') {
            if (window.TinyConsole) {
                window.TinyConsole.info('El programa ya finalizó (HALT). Haz clic en "Reset" (↺) para reiniciar.');
            }
            return;
        }

        if (this.isRunning) return;

        this.isRunning = true;
        this.justResumedFromBP = this.breakpoints.has(this.registers.pc);
        this.setStatus('EJECUTANDO');
        this.updateControlButtons();

        if (window.TinyConsole) {
            window.TinyConsole.info(`▶ Iniciando ejecución continua TM (${this.executionSpeed}ms/paso)...`);
        }

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

    /**
     * Pausa la ejecución continua
     */
    pause() {
        if (this.runTimer) {
            clearInterval(this.runTimer);
            this.runTimer = null;
        }
        const wasRunning = this.isRunning;
        this.isRunning = false;

        if (this.status !== 'HALTED' && !this.status.startsWith('ERROR') && !this.status.startsWith('PAUSADO')) {
            this.setStatus('PAUSADO');
        }

        this.updateControlButtons();

        if (wasRunning && window.TinyConsole) {
            window.TinyConsole.info(`⏸ Ejecución pausada en PC = ${this.registers.pc}.`);
        }
    },

    /**
     * Reinicia los registros y la memoria al estado inicial del programa
     */
    reset() {
        this.pause();

        if (this.initialProgramPreset) {
            const preset = this.initialProgramPreset;
            this.registers = {
                pc: 0,
                gp: preset.registers?.gp || 0,
                mp: preset.registers?.mp !== undefined ? preset.registers.mp : 1023,
                ac: 0,
                ac1: 0,
                r2: 0,
                r3: 0,
                r4: 0
            };
            this.dMem.fill(0);
            if (preset.dmem) {
                for (const [cell, val] of Object.entries(preset.dmem)) {
                    this.dMem[parseInt(cell, 10)] = val;
                }
            }
        } else {
            this.registers = { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0, r2: 0, r3: 0, r4: 0 };
            this.dMem.fill(0);
        }

        this.lastWrite = -1;
        this.previousRegisters = {};
        this.updateRegisters(this.registers);
        this.renderDMem();
        this.highlightCurrentPC();
        this.scrollToPC();
        this.setStatus('LISTO');
        this.updateControlButtons();

        if (window.TinyConsole) {
            window.TinyConsole.info('↺ Depurador de la Tiny Machine reiniciado: PC=0, registros y memoria restaurados.');
        }
    },

    // =========================================================================
    // MEMORIA DE DATOS (DMEM - 1024 CELDAS) Y MICRO-ANIMACIONES
    // =========================================================================
    renderDMem() {
        const list = document.getElementById('dmem-list');
        if (!list) return;

        let cellsToRender = [];

        if (this.dMemViewMode === 'gp') {
            // Variables Globales: primeras 32 celdas
            for (let i = 0; i < 32; i++) cellsToRender.push(i);
        } else if (this.dMemViewMode === 'mp') {
            // Pila de llamadas: desde 1023 hacia abajo
            for (let i = 1023; i >= 992; i--) cellsToRender.push(i);
        } else if (this.dMemViewMode === 'active') {
            // Celdas no vacías o celdas especiales
            for (let i = 0; i < 1024; i++) {
                if (this.dMem[i] !== 0 || i === this.registers.gp || i === this.registers.mp) {
                    cellsToRender.push(i);
                }
            }
            if (cellsToRender.length === 0) {
                for (let i = 0; i < 16; i++) cellsToRender.push(i);
            }
        } else {
            // Todas las 1024 celdas
            for (let i = 0; i < 1024; i++) cellsToRender.push(i);
        }

        let html = '';
        cellsToRender.forEach(idx => {
            const val = this.dMem[idx] || 0;
            const isZero = val === 0;
            const hexVal = '0x' + (val >>> 0).toString(16).toUpperCase().padStart(4, '0');

            // Determinar etiqueta según punteros GP y MP
            let role = 'Memoria';
            let roleClass = '';
            if (idx === this.registers.gp && idx === 0) {
                role = 'Base Global (GP)';
                roleClass = 'tag-gp';
            } else if (idx === this.registers.mp) {
                role = 'Tope Pila (MP)';
                roleClass = 'tag-mp';
            } else if (idx < 20) {
                role = `Variable Global (GP+${idx})`;
                roleClass = 'tag-gp';
            } else if (idx >= 1000) {
                role = `Marco Pila (${1023 - idx})`;
                roleClass = 'tag-mp';
            }

            html += `
                <div class="dmem-row" id="dmem-cell-${idx}">
                    <div class="dmem-cell-addr">${idx}</div>
                    <div class="dmem-cell-dec ${isZero ? 'zero' : ''}">${val}</div>
                    <div class="dmem-cell-hex ${isZero ? 'zero' : ''}">${hexVal}</div>
                    <div class="dmem-cell-role ${roleClass}">${role}</div>
                </div>
            `;
        });

        list.innerHTML = html;
    },

    /**
     * Micro-animación de destello en la celda de memoria modificada (lastWrite)
     */
    animateDMemCellWrite(targetAddr) {
        setTimeout(() => {
            const row = document.getElementById(`dmem-cell-${targetAddr}`);
            if (row) {
                row.classList.remove('dmem-cell-written');
                void row.offsetWidth; // Forzar reflow para reiniciar animación
                row.classList.add('dmem-cell-written');
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 10);
    },

    setDMemValue(addr, val) {
        if (addr >= 0 && addr < 1024) {
            this.dMem[addr] = val;
            this.renderDMem();
        }
    },

    jumpToDMemCell(targetAddr) {
        // Asegurarse de que esté en vista 'all' si la celda no pertenece a la vista actual
        if (this.dMemViewMode === 'gp' && targetAddr >= 32) {
            const sel = document.getElementById('dmem-view-mode');
            if (sel) {
                sel.value = 'all';
                this.dMemViewMode = 'all';
            }
        } else if (this.dMemViewMode === 'mp' && targetAddr < 992) {
            const sel = document.getElementById('dmem-view-mode');
            if (sel) {
                sel.value = 'all';
                this.dMemViewMode = 'all';
            }
        }

        this.renderDMem();

        setTimeout(() => {
            const row = document.getElementById(`dmem-cell-${targetAddr}`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('highlight-target');
                setTimeout(() => row.classList.remove('highlight-target'), 1500);
            }
        }, 50);
    },

    // =========================================================================
    // PROGRAMAS OBJETO TM PREENSAMBLADOS (CONTRATO CON EL COMPILADOR)
    // =========================================================================
    loadSampleProgram(sampleKey) {
        this.pause();

        const presets = {
            factorial: {
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
            }
        };

        const preset = presets[sampleKey];
        if (preset) {
            this.initialProgramPreset = {
                key: sampleKey,
                registers: { ...preset.registers },
                dmem: { ...preset.dmem },
                instructions: [...preset.instructions]
            };

            // Reiniciar memoria y registros
            this.dMem.fill(0);
            for (const [cell, val] of Object.entries(preset.dmem)) {
                this.dMem[parseInt(cell, 10)] = val;
            }
            this.previousRegisters = {};
            this.updateRegisters(preset.registers);
            this.loadInstructions(preset.instructions);
            this.renderDMem();
            this.setStatus('CARGADO');
            this.updateControlButtons();
        }
    }
};

window.TinyDebuggerUI = TinyDebuggerUI;
