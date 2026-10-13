/**
 * Tiny++ Studio IDE - Controlador Visual de la Tabla de Símbolos
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Responsabilidad:
 * - Renderizado tabular de identificadores, tipos, ámbitos y desplazamientos de memoria TM.
 * - Filtro dinámico por ámbito (Scope: global, local, funciones).
 * - Búsqueda reactiva por nombre de identificador.
 */

const TinySymbolsViewer = {
    currentSymbols: [],
    scopeFilter: 'all',
    searchQuery: '',

    init() {
        this.setupToolbarEvents();
    },

    setupToolbarEvents() {
        const scopeSelect = document.getElementById('symbols-scope-filter');
        const searchInput = document.getElementById('symbols-search-input');

        if (scopeSelect) {
            scopeSelect.addEventListener('change', () => {
                this.scopeFilter = scopeSelect.value;
                this.renderTable();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchQuery = searchInput.value.trim().toLowerCase();
                this.renderTable();
            });
        }
    },

    render(symbolsList) {
        this.currentSymbols = symbolsList || [];
        this.populateScopeOptions();
        this.renderTable();
    },

    populateScopeOptions() {
        const select = document.getElementById('symbols-scope-filter');
        if (!select) return;

        const currentVal = select.value;
        const scopes = new Set(['all']);
        this.currentSymbols.forEach(s => scopes.add(s.scope));

        let html = '<option value="all">Todos los ámbitos</option>';
        scopes.forEach(sc => {
            if (sc !== 'all') {
                html += `<option value="${sc}">Ámbito: ${sc}</option>`;
            }
        });

        select.innerHTML = html;
        if (scopes.has(currentVal)) {
            select.value = currentVal;
            this.scopeFilter = currentVal;
        } else {
            this.scopeFilter = 'all';
        }
    },

    renderTable() {
        const list = document.getElementById('symbols-list');
        const countBadge = document.getElementById('symbols-count');
        if (!list) return;

        let filtered = this.currentSymbols;

        // Filtrar por ámbito
        if (this.scopeFilter !== 'all') {
            filtered = filtered.filter(s => s.scope === this.scopeFilter);
        }

        // Filtrar por texto de búsqueda
        if (this.searchQuery) {
            filtered = filtered.filter(s => s.name.toLowerCase().includes(this.searchQuery));
        }

        if (countBadge) {
            countBadge.textContent = `${filtered.length} símbolos`;
        }

        if (filtered.length === 0) {
            list.innerHTML = '<div class="inspector-placeholder">No se encontraron símbolos coincidentes con el filtro.</div>';
            return;
        }

        let html = '';
        filtered.forEach(s => {
            let typeClass = 'sym-type-int';
            if (s.type.includes('bool')) typeClass = 'sym-type-bool';
            else if (s.type.includes('fun') || s.type.includes('function')) typeClass = 'sym-type-fun';
            else if (s.type.includes('[')) typeClass = 'sym-type-array';

            const scopeClass = s.scope === 'global' ? 'sym-scope-global' : 'sym-scope-local';

            html += `
                <div class="symbol-row">
                    <div class="sym-name" title="${s.name}">
                        <span>${s.name}</span>
                    </div>
                    <div><span class="sym-type-tag ${typeClass}">${s.type}</span></div>
                    <div><span class="sym-scope-tag ${scopeClass}">${s.scope}</span></div>
                    <div class="sym-offset" title="${s.offset}">${s.offset}</div>
                    <div class="sym-line">Lín ${s.line}</div>
                </div>
            `;
        });

        list.innerHTML = html;
    }
};

window.TinySymbolsViewer = TinySymbolsViewer;
