/**
 * Tiny++ Studio IDE - Presets de Árbol Sintáctico (AST) y Tablas de Símbolos
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 *
 * Datos estáticos para los programas de muestra del proyecto
 */

const TinyInspectorPresets = {
    factorial: {
        ast: {
            kind: 'Program',
            badgeType: 'program',
            label: 'factorial_recursivo.tny',
            children: [
                {
                    kind: 'VarDeclarations',
                    badgeType: 'decl',
                    label: 'Variables Globales',
                    children: [
                        { kind: 'VarDecl', badgeType: 'decl', label: 'n', typeInfo: 'int' },
                        { kind: 'VarDecl', badgeType: 'decl', label: 'result', typeInfo: 'int' }
                    ]
                },
                {
                    kind: 'FunctionDecl',
                    badgeType: 'function',
                    label: 'fact',
                    typeInfo: 'int (int)',
                    children: [
                        {
                            kind: 'ParamList',
                            badgeType: 'decl',
                            label: 'Parámetros Formales',
                            children: [
                                { kind: 'Param', badgeType: 'decl', label: 'val', typeInfo: 'int' }
                            ]
                        },
                        {
                            kind: 'IfStmt',
                            badgeType: 'stmt',
                            label: 'if-then-else',
                            children: [
                                {
                                    kind: 'Condition',
                                    badgeType: 'op',
                                    label: 'Op (<=)',
                                    children: [
                                        { kind: 'Id', badgeType: 'id', label: 'val' },
                                        { kind: 'Const', badgeType: 'const', label: '1', value: 1 }
                                    ]
                                },
                                {
                                    kind: 'ThenBranch',
                                    badgeType: 'stmt',
                                    label: 'then',
                                    children: [
                                        {
                                            kind: 'ReturnStmt',
                                            badgeType: 'stmt',
                                            label: 'return',
                                            children: [{ kind: 'Const', badgeType: 'const', label: '1', value: 1 }]
                                        }
                                    ]
                                },
                                {
                                    kind: 'ElseBranch',
                                    badgeType: 'stmt',
                                    label: 'else',
                                    children: [
                                        {
                                            kind: 'ReturnStmt',
                                            badgeType: 'stmt',
                                            label: 'return',
                                            children: [
                                                {
                                                    kind: 'BinaryOp',
                                                    badgeType: 'op',
                                                    label: 'Op (*)',
                                                    children: [
                                                        { kind: 'Id', badgeType: 'id', label: 'val' },
                                                        {
                                                            kind: 'CallExpr',
                                                            badgeType: 'function',
                                                            label: 'call fact()',
                                                            children: [
                                                                {
                                                                    kind: 'BinaryOp',
                                                                    badgeType: 'op',
                                                                    label: 'Op (-)',
                                                                    children: [
                                                                        { kind: 'Id', badgeType: 'id', label: 'val' },
                                                                        { kind: 'Const', badgeType: 'const', label: '1', value: 1 }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    kind: 'StatementList',
                    badgeType: 'stmt',
                    label: 'Cuerpo Principal',
                    children: [
                        {
                            kind: 'ReadStmt',
                            badgeType: 'io',
                            label: 'read',
                            children: [{ kind: 'Id', badgeType: 'id', label: 'n' }]
                        },
                        {
                            kind: 'AssignStmt',
                            badgeType: 'op',
                            label: ':=',
                            children: [
                                { kind: 'Id', badgeType: 'id', label: 'result' },
                                {
                                    kind: 'CallExpr',
                                    badgeType: 'function',
                                    label: 'fact(n)',
                                    children: [{ kind: 'Id', badgeType: 'id', label: 'n' }]
                                }
                            ]
                        },
                        {
                            kind: 'WriteStmt',
                            badgeType: 'io',
                            label: 'write',
                            children: [{ kind: 'Id', badgeType: 'id', label: 'result' }]
                        }
                    ]
                }
            ]
        },
        symbols: [
            { name: 'n', type: 'int', scope: 'global', offset: 'GP + 0', line: 2 },
            { name: 'result', type: 'int', scope: 'global', offset: 'GP + 1', line: 2 },
            { name: 'fact', type: 'function', scope: 'global', offset: 'PC 3', line: 4 },
            { name: 'val', type: 'int', scope: 'fact', offset: 'MP - 1', line: 4 }
        ]
    },

    arreglos: {
        ast: {
            kind: 'Program',
            badgeType: 'program',
            label: 'arreglos_expresiones.tny',
            children: [
                {
                    kind: 'VarDeclarations',
                    badgeType: 'decl',
                    label: 'Arreglos y Variables',
                    children: [
                        { kind: 'ArrayDecl', badgeType: 'decl', label: 'A[5]', typeInfo: 'int[5]' },
                        { kind: 'VarDecl', badgeType: 'decl', label: 'i', typeInfo: 'int' },
                        { kind: 'VarDecl', badgeType: 'decl', label: 'sum', typeInfo: 'int' }
                    ]
                },
                {
                    kind: 'StatementList',
                    badgeType: 'stmt',
                    label: 'Bloque de Asignaciones y Bucle',
                    children: [
                        {
                            kind: 'AssignStmt',
                            badgeType: 'op',
                            label: 'sum := 0',
                            children: [
                                { kind: 'Id', badgeType: 'id', label: 'sum' },
                                { kind: 'Const', badgeType: 'const', label: '0', value: 0 }
                            ]
                        },
                        {
                            kind: 'AssignStmt',
                            badgeType: 'op',
                            label: 'A[0] := 10',
                            children: [
                                { kind: 'ArrayAccess', badgeType: 'id', label: 'A[0]' },
                                { kind: 'Const', badgeType: 'const', label: '10', value: 10 }
                            ]
                        },
                        {
                            kind: 'AssignStmt',
                            badgeType: 'op',
                            label: 'A[1] := 20',
                            children: [
                                { kind: 'ArrayAccess', badgeType: 'id', label: 'A[1]' },
                                { kind: 'Const', badgeType: 'const', label: '20', value: 20 }
                            ]
                        },
                        {
                            kind: 'WriteStmt',
                            badgeType: 'io',
                            label: 'write sum',
                            children: [{ kind: 'Id', badgeType: 'id', label: 'sum' }]
                        }
                    ]
                }
            ]
        },
        symbols: [
            { name: 'A', type: 'int[5]', scope: 'global', offset: 'GP + 0..4', line: 2 },
            { name: 'i', type: 'int', scope: 'global', offset: 'GP + 5', line: 3 },
            { name: 'sum', type: 'int', scope: 'global', offset: 'GP + 6', line: 3 }
        ]
    },

    ambitos: {
        ast: {
            kind: 'Program',
            badgeType: 'program',
            label: 'ambitos_locales.tny',
            children: [
                {
                    kind: 'VarDeclarations',
                    badgeType: 'decl',
                    label: 'Variables Globales',
                    children: [
                        { kind: 'VarDecl', badgeType: 'decl', label: 'x', typeInfo: 'int' },
                        { kind: 'VarDecl', badgeType: 'decl', label: 'g', typeInfo: 'int' }
                    ]
                },
                {
                    kind: 'FunctionDecl',
                    badgeType: 'function',
                    label: 'foo',
                    typeInfo: 'int ()',
                    children: [
                        {
                            kind: 'VarDeclarations',
                            badgeType: 'decl',
                            label: 'Variables Locales (foo)',
                            children: [
                                { kind: 'VarDecl', badgeType: 'decl', label: 'x', typeInfo: 'int (shadow)' },
                                { kind: 'VarDecl', badgeType: 'decl', label: 'temp', typeInfo: 'int' }
                            ]
                        },
                        {
                            kind: 'ReturnStmt',
                            badgeType: 'stmt',
                            label: 'return x + g',
                            children: [
                                {
                                    kind: 'BinaryOp',
                                    badgeType: 'op',
                                    label: 'Op (+)',
                                    children: [
                                        { kind: 'Id', badgeType: 'id', label: 'x (local)' },
                                        { kind: 'Id', badgeType: 'id', label: 'g (global)' }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        symbols: [
            { name: 'x', type: 'int', scope: 'global', offset: 'GP + 0', line: 2 },
            { name: 'g', type: 'int', scope: 'global', offset: 'GP + 1', line: 2 },
            { name: 'foo', type: 'function', scope: 'global', offset: 'PC 5', line: 4 },
            { name: 'x', type: 'int', scope: 'foo', offset: 'MP - 1', line: 5 },
            { name: 'temp', type: 'int', scope: 'foo', offset: 'MP - 2', line: 6 }
        ]
    },

    get(key) {
        return this[key] || this.factorial;
    }
};

window.TinyInspectorPresets = TinyInspectorPresets;
