/**
 * Módulo de la Consola del Sistema y Navegación de Errores
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Soporta registro estructurado y navegación interactiva al código fuente
 */

const TinyConsole = {
    init() {
        this.output = document.getElementById('console-output');
        this.clearBtn = document.getElementById('btn-clear-console');

        this.setupTabs();

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clear());
        }
    },

    /**
     * Alternador de pestañas inferiores: Consola del Sistema vs Registro E/S
     */
    setupTabs() {
        const tabConsole = document.getElementById('tab-btn-console');
        const tabIO = document.getElementById('tab-btn-io');
        const viewConsole = document.getElementById('console-output');
        const viewIO = document.getElementById('io-panel-output');

        if (tabConsole && tabIO && viewConsole && viewIO) {
            tabConsole.addEventListener('click', () => {
                tabConsole.classList.add('active');
                tabIO.classList.remove('active');
                viewConsole.style.display = 'block';
                viewIO.style.display = 'none';
            });

            tabIO.addEventListener('click', () => {
                tabIO.classList.add('active');
                tabConsole.classList.remove('active');
                viewIO.style.display = 'flex';
                viewConsole.style.display = 'none';
            });
        }
    },

    getTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    },

    clear() {
        if (!this.output) return;
        this.output.innerHTML = '';
        this.system('Consola despejada.');
        if (window.TinyEditor && typeof window.TinyEditor.clearErrorHighlight === 'function') {
            window.TinyEditor.clearErrorHighlight();
        }
        if (window.TinyIO && typeof window.TinyIO.clearLog === 'function') {
            window.TinyIO.clearLog();
        } else if (window.TinyDebuggerUI && typeof window.TinyDebuggerUI.clearIOLog === 'function') {
            window.TinyDebuggerUI.clearIOLog();
        }
    },

    appendLine(message, typeClass, prefix = '[Sistema]') {
        if (!this.output) return;
        const line = document.createElement('div');
        line.className = `console-line ${typeClass}`;
        line.innerHTML = `<span class="console-time">${this.getTimestamp()}</span> <span class="console-tag">${prefix}</span> <span>${message}</span>`;
        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    },

    system(message) {
        this.appendLine(message, 'system-msg', '[Sistema]');
    },

    info(message) {
        this.appendLine(message, 'info-msg', '[Info]');
    },

    success(message) {
        this.appendLine(message, 'success-msg', '[Éxito]');
    },

    warn(message) {
        this.appendLine(message, 'warning-msg', '[Aviso]');
    },

    /**
     * Emite un mensaje de error con botón de navegación interactiva a la línea
     * @param {string} message - Descripción del error
     * @param {number|null} lineNumber - Número de línea infractora (1-indexed)
     */
    error(message, lineNumber = null) {
        if (!lineNumber) {
            // Detección automática por regex si el mensaje incluye "Línea X" o "Line X"
            const match = message.match(/(?:l[íi]nea|line)\s+(\d+)/i);
            if (match) {
                lineNumber = parseInt(match[1], 10);
            }
        }

        if (!this.output) return;

        const line = document.createElement('div');
        line.className = 'console-line error-msg';

        let navButtonHtml = '';
        if (lineNumber) {
            navButtonHtml = `
                <button class="error-nav-btn" type="button" data-line="${lineNumber}" title="Ir a la línea ${lineNumber} en el editor">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span>Línea ${lineNumber}</span>
                </button>
            `;
        }

        line.innerHTML = `
            <span class="console-time">${this.getTimestamp()}</span>
            <span class="console-tag">[Error]</span>
            <span class="error-text">${message}</span>
            ${navButtonHtml}
        `;

        if (lineNumber) {
            const btn = line.querySelector('.error-nav-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.TinyEditor && typeof window.TinyEditor.goToLine === 'function') {
                        window.TinyEditor.goToLine(lineNumber);
                    }
                });
            }

            line.style.cursor = 'pointer';
            line.addEventListener('click', () => {
                if (window.TinyEditor && typeof window.TinyEditor.goToLine === 'function') {
                    window.TinyEditor.goToLine(lineNumber);
                }
            });
        }

        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }
};

window.TinyConsole = TinyConsole;
