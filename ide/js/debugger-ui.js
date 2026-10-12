/**
 * Módulo de la Interfaz del Depurador Visual de la Tiny Machine
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 */

const TinyDebuggerUI = {
    init() {
        this.setupTabs();
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
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    },

    updateRegisters(regs = {}) {
        if (regs.pc !== undefined) document.getElementById('val-pc').textContent = regs.pc;
        if (regs.gp !== undefined) document.getElementById('val-gp').textContent = regs.gp;
        if (regs.mp !== undefined) document.getElementById('val-mp').textContent = regs.mp;
        if (regs.ac !== undefined) document.getElementById('val-ac').textContent = regs.ac;
        if (regs.ac1 !== undefined) document.getElementById('val-ac1').textContent = regs.ac1;
    },

    setStatus(statusText) {
        const pill = document.getElementById('tm-status');
        if (pill) {
            pill.textContent = statusText;
        }
    }
};

window.TinyDebuggerUI = TinyDebuggerUI;
