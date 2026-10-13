/**
 * Tiny++ Studio IDE - Controlador Visual del Depurador TM
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Responsabilidad exclusiva de UI:
 * - Renderizado de tarjetas de registros de la TM y micro-animaciones.
 * - Visualizador de Memoria de Instrucciones (IMem), breakpoints y puntero PC.
 * - Visualizador de Memoria de Datos (DMem - 1024 celdas), saltos y vistas.
 * - Coordinación visual entre TinyMachine, TinyIO y la interfaz de usuario.
 */

const TinyDebuggerUI = {
    dMemViewMode: 'gp',
    previousRegisters: {},

    init() {
        this.setupTabs();
        this.setupIMemControls();
        this.setupDMemControls();
        this.setupButtons();

        // Conectar el motor virtual de la Tiny Machine con la UI
        window.TinyMachine.init({
            onStep: (state) => this.handleMachineStep(state),
            onStateChange: (status) => this.setStatus(status),
            onOutput: (r, val, pc) => {
                window.TinyIO.recordEvent('OUT', r, val, pc, `Salida por acumulador r${r}`);
            },
            onInputRequired: (r, pc, onContinue, onCancel) => {
                window.TinyIO.requestInput(r, pc, (val) => {
                    window.TinyIO.recordEvent('IN', r, val, pc, `Valor ingresado para r${r}`);
                    onContinue(val);
                }, () => {
                    if (window.TinyConsole) {
                        window.TinyConsole.warn(`[TM IN] Entrada cancelada en PC = ${pc}. Ejecución pausada.`);
                    }
                    onCancel();
                });
            },
            onHalt: (pc) => {
                if (window.TinyConsole) {
                    window.TinyConsole.success(`[TM HALT] Programa TM finalizado con éxito en la dirección ${pc}.`);
                }
            },
            onError: (msg) => {
                if (window.TinyConsole) {
                    window.TinyConsole.error(`[TM ERROR] ${msg}`);
                }
            }
        });

        // Inicializar gestor de Entrada y Salida
        if (window.TinyIO) window.TinyIO.init();

        this.updateRegisters(window.TinyMachine.registers);
        this.renderDMem();
        this.updateControlButtons();
        this.setStatus('LISTO');
    },

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
                if (targetPane) targetPane.classList.add('active');
            });
        });
    },

    setupIMemControls() {
        const btnToPC = document.getElementById('btn-imem-topc');
        const btnClearBP = document.getElementById('btn-imem-clearbp');
        const speedSelect = document.getElementById('tm-speed-selector');

        if (btnToPC) btnToPC.addEventListener('click', () => this.scrollToPC());

        if (btnClearBP) {
            btnClearBP.addEventListener('click', () => {
                window.TinyMachine.clearBreakpoints();
                this.renderIMem();
                this.updateBreakpointCount();
                if (window.TinyConsole) {
                    window.TinyConsole.info('Todos los puntos de interrupción han sido removidos.');
                }
            });
        }

        if (speedSelect) {
            speedSelect.addEventListener('change', () => {
                const spd = parseInt(speedSelect.value, 10) || 200;
                window.TinyMachine.executionSpeed = spd;
                if (window.TinyMachine.isRunning) {
                    window.TinyMachine.pause();
                    window.TinyMachine.run();
                }
            });
        }
    },

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

    setupButtons() {
        const btnRun = document.getElementById('btn-run');
        const btnStep = document.getElementById('btn-step');
        const btnPause = document.getElementById('btn-pause');
        const btnReset = document.getElementById('btn-reset');

        if (btnRun) btnRun.addEventListener('click', () => this.run());
        if (btnStep) btnStep.addEventListener('click', () => this.step());
        if (btnPause) btnPause.addEventListener('click', () => this.pause());
        if (btnReset) btnReset.addEventListener('click', () => this.reset());
    },

    step() {
        return window.TinyMachine.step();
    },

    run() {
        if (window.TinyMachine.iMem.length === 0) {
            if (window.TinyConsole) window.TinyConsole.warn('No hay programa TM cargado en IMem. Haz clic en "Compilar" primero.');
            return;
        }
        if (window.TinyMachine.status === 'HALTED') {
            if (window.TinyConsole) window.TinyConsole.info('[TM] El programa ya finalizó (HALT). Haz clic en "Reset" para reiniciar.');
            return;
        }
        if (window.TinyConsole) {
            window.TinyConsole.info(`[TM RUN] Iniciando ejecución continua (${window.TinyMachine.executionSpeed}ms/paso)...`);
        }
        window.TinyMachine.run();
    },

    pause() {
        const wasRunning = window.TinyMachine.isRunning;
        window.TinyMachine.pause();
        if (wasRunning && window.TinyConsole) {
            window.TinyConsole.info(`[TM PAUSA] Ejecución pausada en PC = ${window.TinyMachine.registers.pc}.`);
        }
    },

    reset() {
        window.TinyMachine.reset();
        if (window.TinyIO) window.TinyIO.clearLog();
        if (window.TinyConsole) {
            window.TinyConsole.info('[TM RESET] Depurador reiniciado: PC=0, registros y memoria restaurados.');
        }
    },

    clearIOLog() {
        if (window.TinyIO) window.TinyIO.clearLog();
    },

    handleMachineStep(state) {
        this.updateRegisters(state.registers);
        this.highlightCurrentPC();
        this.scrollToPC();
        this.updateControlButtons();

        if (state.lastWrite !== -1) {
            this.renderDMem();
            this.animateDMemCellWrite(state.lastWrite);
        }
    },

    updateRegisters(newRegs = {}) {
        const regMap = {
            pc: { id: 'val-pc', box: 'reg-pc' },
            gp: { id: 'val-gp', box: 'reg-gp' },
            mp: { id: 'val-mp', box: 'reg-mp' },
            ac: { id: 'val-ac', box: 'reg-ac' },
            ac1: { id: 'val-ac1', box: 'reg-ac1' }
        };

        for (const [key, val] of Object.entries(newRegs)) {
            const domInfo = regMap[key];
            if (domInfo) {
                const el = document.getElementById(domInfo.id);
                const box = document.getElementById(domInfo.box);
                const prev = this.previousRegisters[key];

                if (el) el.textContent = val;

                if (box && prev !== undefined && prev !== val) {
                    box.classList.remove('reg-changed');
                    void box.offsetWidth;
                    box.classList.add('reg-changed');
                }
            }
        }

        this.previousRegisters = { ...newRegs };
    },

    setStatus(statusText) {
        const pill = document.getElementById('tm-status');
        if (pill) {
            pill.textContent = statusText;
            pill.className = 'tm-status-pill';
            if (['LISTO', 'CARGADO', 'STANDBY'].includes(statusText)) {
                pill.classList.add('status-ready');
            } else if (statusText === 'EJECUTANDO') {
                pill.classList.add('status-running');
            } else if (statusText.startsWith('PAUSADO') || statusText.startsWith('ESPERANDO')) {
                pill.classList.add('status-paused');
            } else if (statusText === 'HALTED') {
                pill.classList.add('status-halted');
            } else if (statusText.startsWith('ERROR')) {
                pill.classList.add('status-error');
            }
        }
        this.updateControlButtons();
    },

    updateControlButtons() {
        const btnRun = document.getElementById('btn-run');
        const btnStep = document.getElementById('btn-step');
        const btnPause = document.getElementById('btn-pause');
        const btnReset = document.getElementById('btn-reset');

        if (!btnRun || !btnStep || !btnPause) return;

        const isRunning = window.TinyMachine.isRunning;
        const isHalted = window.TinyMachine.status === 'HALTED';

        btnRun.classList.toggle('is-running', isRunning);
        btnRun.disabled = isRunning || isHalted;
        btnStep.disabled = isRunning || isHalted;
        btnPause.disabled = !isRunning;
        if (btnReset) btnReset.disabled = false;
    },

    renderIMem() {
        const list = document.getElementById('imem-list');
        if (!list) return;

        const iMem = window.TinyMachine.iMem;
        if (iMem.length === 0) {
            list.innerHTML = '<div class="memory-placeholder">No se ha cargado ningún programa objeto TM todavía. Pulsa "Compilar".</div>';
            return;
        }

        let html = '';
        iMem.forEach(instr => {
            const hasBP = window.TinyMachine.breakpoints.has(instr.addr);
            const isPC = instr.addr === window.TinyMachine.registers.pc;

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

        list.querySelectorAll('.imem-row').forEach(row => {
            const addr = parseInt(row.getAttribute('data-addr'), 10);
            const bpCol = row.querySelector('.imem-bp-col');

            if (bpCol) {
                bpCol.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBreakpoint(addr);
                });
            }

            row.addEventListener('dblclick', () => {
                this.toggleBreakpoint(addr);
            });
        });
    },

    toggleBreakpoint(addr) {
        const active = window.TinyMachine.toggleBreakpoint(addr);
        if (window.TinyConsole) {
            const msg = active 
                ? `Breakpoint establecido en dirección de memoria TM [${addr}]`
                : `Breakpoint eliminado en dirección de memoria TM [${addr}]`;
            window.TinyConsole.info(msg);
        }

        const dot = document.querySelector(`.imem-row[data-addr="${addr}"] .bp-dot`);
        if (dot) dot.classList.toggle('active', active);

        this.updateBreakpointCount();
    },

    updateBreakpointCount() {
        const bpBadge = document.getElementById('imem-bp-count');
        if (bpBadge) {
            const count = window.TinyMachine.breakpoints.size;
            bpBadge.textContent = `${count} BPs`;
            bpBadge.classList.toggle('has-bp', count > 0);
        }
    },

    highlightCurrentPC() {
        const currentPC = window.TinyMachine.registers.pc;
        document.querySelectorAll('.imem-list .imem-row').forEach(r => {
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

    renderDMem() {
        const list = document.getElementById('dmem-list');
        if (!list) return;

        const dMem = window.TinyMachine.dMem;
        const gp = window.TinyMachine.registers.gp;
        const mp = window.TinyMachine.registers.mp;
        let cells = [];

        if (this.dMemViewMode === 'gp') {
            for (let i = 0; i < 32; i++) cells.push(i);
        } else if (this.dMemViewMode === 'mp') {
            for (let i = 1023; i >= 992; i--) cells.push(i);
        } else if (this.dMemViewMode === 'active') {
            for (let i = 0; i < 1024; i++) {
                if (dMem[i] !== 0 || i === gp || i === mp) cells.push(i);
            }
            if (cells.length === 0) {
                for (let i = 0; i < 16; i++) cells.push(i);
            }
        } else {
            for (let i = 0; i < 1024; i++) cells.push(i);
        }

        let html = '';
        cells.forEach(idx => {
            const val = dMem[idx] || 0;
            const isZero = val === 0;
            const hexVal = '0x' + (val >>> 0).toString(16).toUpperCase().padStart(4, '0');

            let role = 'Memoria';
            let roleClass = '';
            if (idx === gp && idx === 0) {
                role = 'Base Global (GP)';
                roleClass = 'tag-gp';
            } else if (idx === mp) {
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

    animateDMemCellWrite(targetAddr) {
        setTimeout(() => {
            const row = document.getElementById(`dmem-cell-${targetAddr}`);
            if (row) {
                row.classList.remove('dmem-cell-written');
                void row.offsetWidth;
                row.classList.add('dmem-cell-written');
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 10);
    },

    jumpToDMemCell(targetAddr) {
        if (this.dMemViewMode === 'gp' && targetAddr >= 32) {
            const sel = document.getElementById('dmem-view-mode');
            if (sel) { sel.value = 'all'; this.dMemViewMode = 'all'; }
        } else if (this.dMemViewMode === 'mp' && targetAddr < 992) {
            const sel = document.getElementById('dmem-view-mode');
            if (sel) { sel.value = 'all'; this.dMemViewMode = 'all'; }
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

    loadSampleProgram(sampleKey) {
        const preset = window.TinyTMPresets.get(sampleKey);
        if (preset) {
            window.TinyMachine.reset(preset);
            window.TinyMachine.loadInstructions(preset.instructions);
            this.renderIMem();
            this.renderDMem();
            this.updateRegisters(window.TinyMachine.registers);
            this.updateBreakpointCount();
            const countBadge = document.getElementById('imem-count');
            if (countBadge) countBadge.textContent = `${window.TinyMachine.iMem.length} instrs`;
            this.setStatus('CARGADO');
        }
    }
};

window.TinyDebuggerUI = TinyDebuggerUI;
