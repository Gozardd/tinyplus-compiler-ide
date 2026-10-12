/**
 * Módulo de la Consola del Sistema
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Soporta registro con marcas de tiempo y niveles de log
 */

const TinyConsole = {
    init() {
        this.output = document.getElementById('console-output');
        this.clearBtn = document.getElementById('btn-clear-console');

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clear());
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
    },

    appendLine(message, typeClass, prefix = '[Sistema]') {
        if (!this.output) return;
        const line = document.createElement('div');
        line.className = `console-line ${typeClass}`;
        line.innerHTML = `<span class="console-time">${this.getTimestamp()}</span> <span class="console-tag">${prefix}</span> ${message}`;
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

    error(message, lineNumber = null) {
        const extra = lineNumber ? ` (Línea ${lineNumber})` : '';
        this.appendLine(`${message}${extra}`, 'error-msg', '[Error]');
    }
};

window.TinyConsole = TinyConsole;
