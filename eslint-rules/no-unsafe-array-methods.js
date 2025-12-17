/**
 * ESLint Rule: no-unsafe-array-methods
 * 
 * Detecta uso direto de métodos de array (.map, .filter, etc.) sem verificação de segurança
 * e sugere o uso das funções seguras do arrayHelpers.
 * 
 * Exemplos de código que dispara o erro:
 * - data?.items.map(...)  ❌
 * - items.filter(...)     ❌ (se items pode ser undefined)
 * 
 * Código correto:
 * - safeMap(data?.items, ...) ✅
 * - safeFilter(items, ...)    ✅
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detecta uso direto de métodos de array sem verificação de segurança',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      unsafeMap: 'Uso direto de .map() pode causar erro se o array for undefined/null. Use safeMap() do arrayHelpers.',
      unsafeFilter: 'Uso direto de .filter() pode causar erro se o array for undefined/null. Use safeFilter() do arrayHelpers.',
      unsafeReduce: 'Uso direto de .reduce() pode causar erro se o array for undefined/null. Use safeReduce() do arrayHelpers.',
      unsafeFlatMap: 'Uso direto de .flatMap() pode causar erro se o array for undefined/null. Use safeFlatMap() do arrayHelpers.',
      unsafeSort: 'Uso direto de .sort() pode causar erro se o array for undefined/null. Use safeSort() do arrayHelpers.',
      unsafeFind: 'Uso direto de .find() pode causar erro se o array for undefined/null. Use safeFind() do arrayHelpers.',
      unsafeForEach: 'Uso direto de .forEach() pode causar erro se o array for undefined/null. Use safeForEach() do arrayHelpers.',
      unsafeSome: 'Uso direto de .some() pode causar erro se o array for undefined/null. Use safeSome() do arrayHelpers.',
      unsafeEvery: 'Uso direto de .every() pode causar erro se o array for undefined/null. Use safeEvery() do arrayHelpers.',
    },
  },

  create(context) {
    // Métodos de array que devem ser verificados
    const unsafeMethods = {
      map: 'unsafeMap',
      filter: 'unsafeFilter',
      reduce: 'unsafeReduce',
      flatMap: 'unsafeFlatMap',
      sort: 'unsafeSort',
      find: 'unsafeFind',
      forEach: 'unsafeForEach',
      some: 'unsafeSome',
      every: 'unsafeEvery',
    };

    /**
     * Verifica se o objeto pode ser undefined/null
     * Retorna true se:
     * - Usa optional chaining (data?.items)
     * - É resultado de uma query/mutation (pode ser undefined)
     * - Não tem verificação de Array.isArray antes
     */
    function isPotentiallyUnsafe(node) {
      // Se usa optional chaining, é potencialmente unsafe
      if (node.optional) {
        return true;
      }

      // Se é acesso a propriedade de algo com optional chaining
      if (node.object && node.object.optional) {
        return true;
      }

      // Se é resultado de query tRPC (data, items, etc.)
      if (node.object && node.object.type === 'Identifier') {
        const varName = node.object.name;
        // Nomes comuns de variáveis que podem ser undefined
        const suspiciousNames = ['data', 'items', 'results', 'list', 'array', 'rows'];
        if (suspiciousNames.some(name => varName.toLowerCase().includes(name))) {
          return true;
        }
      }

      return false;
    }

    return {
      CallExpression(node) {
        // Verifica se é chamada de método de array
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          unsafeMethods[node.callee.property.name]
        ) {
          const methodName = node.callee.property.name;
          const messageId = unsafeMethods[methodName];

          // Verifica se é potencialmente unsafe
          if (isPotentiallyUnsafe(node.callee)) {
            context.report({
              node,
              messageId,
            });
          }
        }
      },
    };
  },
};
