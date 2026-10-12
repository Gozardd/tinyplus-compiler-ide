/**
 * Módulo de Control del Editor de Código Tiny++
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 */

const TinyEditor = {
    init() {
        this.editor = document.getElementById('code-editor');
        this.lineNumbers = document.getElementById('line-numbers');
        this.cursorPos = document.getElementById('cursor-pos');

        if (!this.editor) return;

        this.setupLineNumbers();
        this.setupCursorTracker();
    },

    setupLineNumbers() {
        if (!this.lineNumbers) return;

        const updateNumbers = () => {
            const lines = this.editor.value.split('\n').length;
            let html = '';
            for (let i = 1; i <= lines; i++) {
                html += `${i}<br>`;
            }
            this.lineNumbers.innerHTML = html;
        };

        this.editor.addEventListener('input', updateNumbers);
        this.editor.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
        });

        updateNumbers();
    },

    setupCursorTracker() {
        if (!this.cursorPos) return;

        const updateCursor = () => {
            const textLines = this.editor.value.substr(0, this.editor.selectionStart).split('\n');
            const currentLine = textLines.length;
            const currentCol = textLines[textLines.length - 1].length + 1;
            this.cursorPos.textContent = `Lín: ${currentLine}, Col: ${currentCol}`;
        };

        this.editor.addEventListener('keyup', updateCursor);
        this.editor.addEventListener('click', updateCursor);
    },

    getValue() {
        return this.editor ? this.editor.value : '';
    },

    setValue(text) {
        if (this.editor) {
            this.editor.value = text;
            this.editor.dispatchEvent(new Event('input'));
        }
    }
};

window.TinyEditor = TinyEditor;
