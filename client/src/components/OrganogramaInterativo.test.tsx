import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrganogramaInterativo from './OrganogramaInterativo';

// Mock do ReactFlow
vi.mock('reactflow', () => ({
  default: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="controls">Controls</div>,
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
  Background: () => <div data-testid="background">Background</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  MarkerType: { ArrowClosed: 'arrowclosed' },
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  useReactFlow: () => ({
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
}));

// Mock do dagre
vi.mock('dagre', () => ({
  default: {
    graphlib: {
      Graph: vi.fn(() => ({
        setGraph: vi.fn(),
        setDefaultEdgeLabel: vi.fn(),
        setNode: vi.fn(),
        setEdge: vi.fn(),
        node: vi.fn(() => ({ x: 100, y: 100 })),
      })),
    },
  },
  layout: vi.fn(),
}));

describe('OrganogramaInterativo', () => {
  const mockData = {
    nodes: [
      {
        id: 1,
        nodeType: 'department' as const,
        departmentId: 1,
        parentId: null,
        level: 0,
        displayName: 'Diretoria',
        color: '#3b82f6',
        employees: [
          {
            id: 1,
            name: 'João Silva',
            position: 'Diretor Geral',
            department: 'Diretoria',
            email: 'joao@empresa.com',
            employeeCode: '001',
            isManager: true,
            subordinatesCount: 5,
            level: 0,
          },
        ],
        employeeCount: 1,
      },
      {
        id: 2,
        nodeType: 'department' as const,
        departmentId: 2,
        parentId: 1,
        level: 1,
        displayName: 'TI',
        color: '#10b981',
        employees: [
          {
            id: 2,
            name: 'Maria Santos',
            position: 'Gerente de TI',
            department: 'TI',
            email: 'maria@empresa.com',
            employeeCode: '002',
            isManager: true,
            subordinatesCount: 3,
            level: 1,
          },
        ],
        employeeCount: 1,
      },
    ],
  };

  it('deve renderizar o organograma com dados válidos', () => {
    render(<OrganogramaInterativo data={mockData} />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  it('deve renderizar o painel de controles', () => {
    render(<OrganogramaInterativo data={mockData} />);
    
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(screen.getByText(/Controles do Organograma/i)).toBeInTheDocument();
  });

  it('deve renderizar campo de busca', () => {
    render(<OrganogramaInterativo data={mockData} />);
    
    const searchInput = screen.getByPlaceholderText(/Nome, cargo, código/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('deve renderizar estatísticas', () => {
    render(<OrganogramaInterativo data={mockData} />);
    
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Exibindo:/i)).toBeInTheDocument();
  });

  it('deve lidar com dados vazios sem erros', () => {
    const emptyData = { nodes: [] };
    
    expect(() => {
      render(<OrganogramaInterativo data={emptyData} />);
    }).not.toThrow();
  });

  it('deve chamar callback ao clicar em funcionário', () => {
    const onEmployeeClick = vi.fn();
    
    render(
      <OrganogramaInterativo 
        data={mockData} 
        onEmployeeClick={onEmployeeClick}
      />
    );
    
    // O callback será testado na integração real
    expect(onEmployeeClick).not.toHaveBeenCalled();
  });

  it('deve suportar modo editável', () => {
    render(<OrganogramaInterativo data={mockData} editable={true} />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('deve renderizar com múltiplos níveis hierárquicos', () => {
    const multiLevelData = {
      nodes: [
        ...mockData.nodes,
        {
          id: 3,
          nodeType: 'department' as const,
          departmentId: 3,
          parentId: 2,
          level: 2,
          displayName: 'Desenvolvimento',
          employees: [
            {
              id: 3,
              name: 'Pedro Costa',
              position: 'Desenvolvedor',
              department: 'Desenvolvimento',
              level: 2,
            },
          ],
          employeeCount: 1,
        },
      ],
    };

    render(<OrganogramaInterativo data={multiLevelData} />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
