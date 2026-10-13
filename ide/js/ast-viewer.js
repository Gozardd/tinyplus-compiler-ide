/**
 * Tiny++ Studio IDE - Controlador Visual del Árbol Sintáctico (AST)
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Responsabilidad:
 * - Renderizado jerárquico del AST con sangría y conectores visuales.
 * - Soporte para colapsar y expandir nodos individualmente o de forma global.
 * - Etiquetas y badges de colores por tipo de nodo sintáctico.
 */

const TinyASTViewer = {
    currentAST: null,

    init() {
        this.setupToolbarEvents();
    },

    setupToolbarEvents() {
        const btnExpand = document.getElementById('btn-ast-expand');
        const btnCollapse = document.getElementById('btn-ast-collapse');

        if (btnExpand) {
            btnExpand.addEventListener('click', () => {
                document.querySelectorAll('#ast-tree-root .ast-children').forEach(el => {
                    el.classList.remove('collapsed');
                });
                document.querySelectorAll('#ast-tree-root .ast-toggle').forEach(el => {
                    el.classList.remove('collapsed');
                });
            });
        }

        if (btnCollapse) {
            btnCollapse.addEventListener('click', () => {
                document.querySelectorAll('#ast-tree-root .ast-children').forEach(el => {
                    el.classList.add('collapsed');
                });
                document.querySelectorAll('#ast-tree-root .ast-toggle').forEach(el => {
                    el.classList.add('collapsed');
                });
            });
        }
    },

    render(astData) {
        this.currentAST = astData;
        const container = document.getElementById('ast-tree-root');
        const countBadge = document.getElementById('ast-node-count');
        if (!container) return;

        if (!this.currentAST) {
            container.innerHTML = '<div class="inspector-placeholder">No hay árbol sintáctico generado. Haz clic en "Compilar".</div>';
            return;
        }

        let totalNodes = 0;
        const buildNodeHtml = (node) => {
            totalNodes++;
            const hasChildren = node.children && node.children.length > 0;
            const badgeClass = `ast-badge-${node.badgeType || 'stmt'}`;

            let labelExtra = '';
            if (node.value !== undefined) {
                labelExtra += ` <span class="ast-value">"${node.value}"</span>`;
            }
            if (node.typeInfo) {
                labelExtra += ` <span class="ast-type-tag">:${node.typeInfo}</span>`;
            }

            let html = `
                <div class="ast-node">
                    <div class="ast-node-header" data-node-id="${totalNodes}">
                        <span class="ast-toggle ${hasChildren ? '' : 'leaf'}">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </span>
                        <span class="ast-badge ${badgeClass}">${node.kind}</span>
                        <span class="ast-label">${node.label}${labelExtra}</span>
                    </div>
            `;

            if (hasChildren) {
                html += `<div class="ast-children">`;
                node.children.forEach(child => {
                    html += buildNodeHtml(child);
                });
                html += `</div>`;
            }

            html += `</div>`;
            return html;
        };

        container.innerHTML = buildNodeHtml(this.currentAST);

        if (countBadge) {
            countBadge.textContent = `${totalNodes} nodos`;
        }

        // Conectar alternador individual por cada nodo
        container.querySelectorAll('.ast-node-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = header.closest('.ast-node');
                const children = node.querySelector(':scope > .ast-children');
                const toggle = header.querySelector('.ast-toggle');

                if (children && toggle && !toggle.classList.contains('leaf')) {
                    children.classList.toggle('collapsed');
                    toggle.classList.toggle('collapsed');
                }
            });
        });
    }
};

window.TinyASTViewer = TinyASTViewer;
