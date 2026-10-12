/**
 * Módulo de la Consola del Sistema
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 */

const TinyConsole = {
    init() {
        this.output = document.getElementById('console-output');
        this.clearBtn = document.getElementById('btn-clear-console');

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clear());
        }
    },

    clear() {
        if (!this.output) return;
        this.output.innerHTML = '<div class="console-line system-msg">[Sistema] Consola despejada.</div>';
    },

    log(message, type = 'system-msg') {
        if (!this.output) return;
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = message;
        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }
};

window.TinyConsole = TinyConsole;
