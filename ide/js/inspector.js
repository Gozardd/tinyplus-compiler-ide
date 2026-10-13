/**
 * Tiny++ Studio IDE - Orquestador de Inspección de Compilador
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Responsabilidad:
 * - Coordinar el Árbol AST (TinyASTViewer) y la Tabla de Símbolos (TinySymbolsViewer).
 * - Cargar estructuras precompiladas (TinyInspectorPresets) o analizarlas dinámicamente.
 */

const TinyInspector = {
    init() {
        if (window.TinyASTViewer) window.TinyASTViewer.init();
        if (window.TinySymbolsViewer) window.TinySymbolsViewer.init();
        this.loadSample('factorial');
    },

    loadSample(sampleKey) {
        if (!window.TinyInspectorPresets) return;
        const data = window.TinyInspectorPresets.get(sampleKey);

        if (window.TinyASTViewer) window.TinyASTViewer.render(data.ast);
        if (window.TinySymbolsViewer) window.TinySymbolsViewer.render(data.symbols);
    },

    updateFromSource(code, sampleKey = null) {
        if (sampleKey && window.TinyInspectorPresets && window.TinyInspectorPresets[sampleKey]) {
            this.loadSample(sampleKey);
            return;
        }

        // Análisis dinámico para código libre ingresado en el editor
        const dynamicData = this.parseSource(code);
        if (window.TinyASTViewer) window.TinyASTViewer.render(dynamicData.ast);
        if (window.TinySymbolsViewer) window.TinySymbolsViewer.render(dynamicData.symbols);
    },

    parseSource(sourceCode) {
        const lines = sourceCode.split('\n');
        const symbols = [];
        let globalOffset = 0;
        let localOffset = -1;
        let currentScope = 'global';

        const astRoot = {
            kind: 'Program',
            badgeType: 'program',
            label: 'programa.tny',
            children: []
        };

        const declGroup = {
            kind: 'Declarations',
            badgeType: 'decl',
            label: 'Variables Globales',
            children: []
        };

        const stmtsGroup = {
            kind: 'StatementList',
            badgeType: 'stmt',
            label: 'Cuerpo Principal',
            children: []
        };

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const line = lines[i].replace(/\{[^}]*\}/g, '').trim();
            if (!line) continue;

            // Función: int fact(int val) o function foo(...)
            const funcMatch = line.match(/^(?:int|bool|string|void)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
            if (funcMatch && !['if', 'while', 'repeat'].includes(funcMatch[1])) {
                const funcName = funcMatch[1];
                currentScope = funcName;
                symbols.push({
                    name: funcName,
                    type: 'function',
                    scope: 'global',
                    offset: 'Código (PC)',
                    line: lineNum
                });

                const funcNode = {
                    kind: 'FunctionDecl',
                    badgeType: 'function',
                    label: funcName,
                    typeInfo: 'fun',
                    children: []
                };

                if (funcMatch[2].trim()) {
                    const params = funcMatch[2].split(',');
                    params.forEach((p, pIdx) => {
                        const pMatch = p.trim().match(/^(int|bool|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                        if (pMatch) {
                            symbols.push({
                                name: pMatch[2],
                                type: pMatch[1],
                                scope: currentScope,
                                offset: `MP - ${pIdx + 1}`,
                                line: lineNum
                            });
                            funcNode.children.push({
                                kind: 'Param',
                                badgeType: 'decl',
                                label: pMatch[2],
                                typeInfo: pMatch[1]
                            });
                        }
                    });
                }

                astRoot.children.push(funcNode);
                continue;
            }

            // Declaraciones de variables: int x, y; o int A[10];
            const declMatch = line.match(/^(int|bool|string)\s+([^;()]+);/);
            if (declMatch) {
                const type = declMatch[1];
                const rawVars = declMatch[2].split(',');
                rawVars.forEach(v => {
                    const cleanVar = v.trim();
                    const isArray = cleanVar.includes('[');
                    const varName = cleanVar.replace(/\[.*\]/, '').trim();
                    const offsetStr = currentScope === 'global' ? `GP + ${globalOffset++}` : `MP - ${Math.abs(localOffset--)}`;

                    symbols.push({
                        name: varName,
                        type: isArray ? `${type}[]` : type,
                        scope: currentScope,
                        offset: offsetStr,
                        line: lineNum
                    });

                    declGroup.children.push({
                        kind: isArray ? 'ArrayDecl' : 'VarDecl',
                        badgeType: 'decl',
                        label: cleanVar,
                        typeInfo: type
                    });
                });
                continue;
            }

            // Asignación: x := expr;
            const assignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\[[^\]]+\])?)\s*:=\s*(.+?);?$/);
            if (assignMatch) {
                stmtsGroup.children.push({
                    kind: 'AssignStmt',
                    badgeType: 'op',
                    label: ':=',
                    children: [
                        { kind: 'Id', badgeType: 'id', label: assignMatch[1] },
                        { kind: 'Expr', badgeType: 'const', label: assignMatch[2] }
                    ]
                });
                continue;
            }

            // Lectura: read x;
            const readMatch = line.match(/^read\s+([a-zA-Z_][a-zA-Z0-9_]*);/);
            if (readMatch) {
                stmtsGroup.children.push({
                    kind: 'ReadStmt',
                    badgeType: 'io',
                    label: 'read',
                    children: [{ kind: 'Id', badgeType: 'id', label: readMatch[1] }]
                });
                continue;
            }

            // Escritura: write x;
            const writeMatch = line.match(/^write\s+(.+?);/);
            if (writeMatch) {
                stmtsGroup.children.push({
                    kind: 'WriteStmt',
                    badgeType: 'io',
                    label: 'write',
                    children: [{ kind: 'Expr', badgeType: 'id', label: writeMatch[1] }]
                });
                continue;
            }
        }

        if (declGroup.children.length > 0) astRoot.children.unshift(declGroup);
        if (stmtsGroup.children.length > 0) astRoot.children.push(stmtsGroup);

        return { ast: astRoot, symbols };
    }
};

window.TinyInspector = TinyInspector;
