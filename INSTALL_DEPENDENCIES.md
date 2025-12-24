# Dependências para Organograma Interativo

## Instalação Necessária

Execute o seguinte comando para instalar as dependências do organograma interativo:

```bash
cd /home/ubuntu/avd-uisa-sistema-completo
pnpm add reactflow dagre @types/dagre
```

## Dependências

- **reactflow** (v11.x): Biblioteca para criar diagramas interativos com React
- **dagre**: Algoritmo de layout hierárquico para grafos
- **@types/dagre**: Tipos TypeScript para dagre

## Após Instalação

1. Reinicie o servidor: `pnpm dev`
2. Acesse a página de Organograma Dinâmico
3. O organograma interativo estará disponível com:
   - Layout hierárquico automático
   - Zoom e pan
   - Minimap para navegação
   - Busca e filtros
   - Cards personalizados de funcionários
   - Exportação (PNG, PDF, SVG)

## Verificação

Para verificar se as dependências foram instaladas corretamente:

```bash
pnpm list reactflow dagre
```

## Troubleshooting

Se houver erros de instalação:

1. Limpe o cache: `pnpm store prune`
2. Remova node_modules: `rm -rf node_modules`
3. Reinstale: `pnpm install`
4. Tente novamente: `pnpm add reactflow dagre @types/dagre`
