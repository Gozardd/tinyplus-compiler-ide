/**
 * Tiny++ Studio IDE - Gestor de Entrada y Salida Gráfica (E/S - IN & OUT)
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Responsabilidades:
 * - Diálogo modal interactivo no bloqueante para la instrucción 'read' ('IN').
 * - Registro visual y estructurado de eventos E/S ('OUT' y 'IN') con valores Dec/Hex.
 * - Sincronización con la consola del sistema y contador de salidas emitidas.
 */

const TinyIO = {
    events: [],
    waitingForInput: false,
    inputCallback: null,

    init() {
        this.setupModal();
        this.clearLog();
    },

    setupModal() {
        const modal = document.getElementById('modal-io-input');
        const inputVal = document.getElementById('io-modal-input-val');
        const btnSubmit = document.getElementById('btn-io-modal-submit');
        const btnCancel = document.getElementById('btn-io-modal-cancel');
        const btnClose = document.getElementById('modal-io-close');

        if (!modal) return;

        const handleConfirm = () => {
            if (!this.waitingForInput) return;
            const raw = inputVal ? inputVal.value.trim() : '';
            const num = raw !== '' ? parseInt(raw, 10) : 0;
            const validNum = isNaN(num) ? 0 : num;

            modal.classList.remove('active');
            this.waitingForInput = false;

            if (this.inputCallback) {
                const cb = this.inputCallback;
                this.inputCallback = null;
                cb(validNum);
            }
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            this.waitingForInput = false;
            if (this.inputCallback) {
                const cb = this.inputCallback;
                this.inputCallback = null;
                cb(null);
            }
        };

        if (btnSubmit) btnSubmit.addEventListener('click', handleConfirm);
        if (btnCancel) btnCancel.addEventListener('click', handleCancel);
        if (btnClose) btnClose.addEventListener('click', handleCancel);

        const btnInc = document.getElementById('btn-io-inc');
        const btnDec = document.getElementById('btn-io-dec');

        const stepValue = (delta) => {
            if (!inputVal) return;
            const current = parseInt(inputVal.value, 10);
            const base = isNaN(current) ? 0 : current;
            inputVal.value = base + delta;
            inputVal.focus();
            inputVal.select();
        };

        if (btnInc) {
            btnInc.addEventListener('click', (e) => {
                e.preventDefault();
                stepValue(1);
            });
        }

        if (btnDec) {
            btnDec.addEventListener('click', (e) => {
                e.preventDefault();
                stepValue(-1);
            });
        }

        if (inputVal) {
            inputVal.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                }
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });
    },

    /**
     * Muestra el modal gráfico no bloqueante para solicitar un entero al usuario
     * @param {number} regNum - Índice del registro destino (ej: 0 para AC)
     * @param {number} pc - Dirección PC de la instrucción IN
     * @param {function} onValueEntered - Callback al confirmar valor
     * @param {function} onCancel - Callback si el usuario cancela o cierra
     */
    requestInput(regNum, pc, onValueEntered, onCancel) {
        const modal = document.getElementById('modal-io-input');
        const inputVal = document.getElementById('io-modal-input-val');
        const regLabel = document.getElementById('io-modal-reg-label');
        const pcLabel = document.getElementById('io-modal-pc-label');

        this.waitingForInput = true;

        if (regLabel) {
            const name = regNum === 0 ? 'r0 (AC)' : regNum === 1 ? 'r1 (AC1)' : `r${regNum}`;
            regLabel.textContent = name;
        }

        if (pcLabel) {
            pcLabel.textContent = `PC = ${pc}`;
        }

        if (inputVal) {
            inputVal.value = '5';
        }

        if (modal) {
            modal.classList.add('active');
            setTimeout(() => {
                if (inputVal) {
                    inputVal.focus();
                    inputVal.select();
                }
            }, 50);
        }

        this.inputCallback = (val) => {
            if (val !== null) {
                if (onValueEntered) onValueEntered(val);
            } else {
                if (onCancel) onCancel();
            }
        };
    },

    /**
     * Registra un evento de entrada o salida en el historial visual
     */
    recordEvent(type, regNum, val, pc, note) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const hex = '0x' + (val >>> 0).toString(16).toUpperCase().padStart(4, '0');
        const regStr = regNum === 0 ? 'r0 (AC)' : regNum === 1 ? 'r1 (AC1)' : `r${regNum}`;

        const entry = {
            id: this.events.length + 1,
            time,
            type,
            reg: regStr,
            regNum,
            val,
            hex,
            pc,
            note
        };

        this.events.push(entry);

        // Actualizar contador badge de la pestaña
        const outBadge = document.getElementById('io-out-count');
        if (outBadge) {
            const outCount = this.events.filter(e => e.type === 'OUT').length;
            outBadge.textContent = outCount;
        }

        // Renderizar fila en la tabla de E/S
        const list = document.getElementById('io-events-list');
        if (list) {
            const placeholder = list.querySelector('.io-empty-placeholder');
            if (placeholder) placeholder.remove();

            const row = document.createElement('div');
            row.className = 'io-row io-row-new';
            const tagClass = type === 'OUT' ? 'tag-out' : 'tag-in';

            row.innerHTML = `
                <div class="col-io-time">${time}</div>
                <div class="col-io-type"><span class="io-tag ${tagClass}">${type}</span></div>
                <div class="col-io-pc">${pc}</div>
                <div class="col-io-reg">${regStr}</div>
                <div class="col-io-dec">${val}</div>
                <div class="col-io-hex">${hex}</div>
                <div class="col-io-note" title="${note}">${note}</div>
            `;

            list.appendChild(row);
            list.scrollTop = list.scrollHeight;
        }

        // Reflejar en la consola del sistema
        if (window.TinyConsole) {
            if (type === 'OUT') {
                window.TinyConsole.success(`[TM OUT] Salida r${regNum}: ${val}`);
            } else {
                window.TinyConsole.info(`[TM IN] Entrada leída para r${regNum}: ${val}`);
            }
        }
    },

    clearLog() {
        this.events = [];
        const outBadge = document.getElementById('io-out-count');
        if (outBadge) outBadge.textContent = '0';

        const list = document.getElementById('io-events-list');
        if (list) {
            list.innerHTML = '<div class="io-empty-placeholder">No se han emitido instrucciones de Entrada o Salida (IN / OUT) todavía.</div>';
        }

        const modal = document.getElementById('modal-io-input');
        if (modal) modal.classList.remove('active');
        this.waitingForInput = false;
        this.inputCallback = null;
    }
};

window.TinyIO = TinyIO;
