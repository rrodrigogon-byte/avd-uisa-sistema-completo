import { useState, useEffect, useCallback } from 'react';

export interface WizardDraftData {
  step: number;
  cycleData: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
  };
  weights: {
    autoAvaliacaoWeight: number;
    avaliacaoGerenteWeight: number;
    avaliacaoPares: number;
    avaliacaoSubordinados: number;
  };
  competencies: Array<{
    id: number;
    name: string;
    description: string;
    requiredLevel: number;
  }>;
  participants: Array<{
    employeeId: number;
    role: string;
    name?: string;
  }>;
  savedAt: string;
}

const DRAFT_KEY = 'wizard_360_draft';
const DRAFT_EXPIRY_DAYS = 7;

export function useWizardDraft() {
  const [draft, setDraft] = useState<WizardDraftData | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Carregar rascunho ao montar componente
  useEffect(() => {
    const loadDraft = () => {
      try {
        const stored = localStorage.getItem(DRAFT_KEY);
        if (!stored) {
          setHasDraft(false);
          return;
        }

        const parsed = JSON.parse(stored) as WizardDraftData;
        
        // Verificar se o rascunho expirou
        const savedDate = new Date(parsed.savedAt);
        const expiryDate = new Date(savedDate);
        expiryDate.setDate(expiryDate.getDate() + DRAFT_EXPIRY_DAYS);
        
        if (new Date() > expiryDate) {
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
          return;
        }

        setDraft(parsed);
        setHasDraft(true);
        setLastSaved(savedDate);
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
      }
    };

    loadDraft();
  }, []);

  // Salvar rascunho
  const saveDraft = useCallback((data: Partial<WizardDraftData>) => {
    try {
      const currentDraft = draft || {
        step: 1,
        cycleData: { name: '', description: '', startDate: '', endDate: '' },
        weights: {
          autoAvaliacaoWeight: 20,
          avaliacaoGerenteWeight: 40,
          avaliacaoPares: 20,
          avaliacaoSubordinados: 20,
        },
        competencies: [],
        participants: [],
        savedAt: new Date().toISOString(),
      };

      const updatedDraft: WizardDraftData = {
        ...currentDraft,
        ...data,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDraft));
      setDraft(updatedDraft);
      setHasDraft(true);
      setLastSaved(new Date());
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      return false;
    }
  }, [draft]);

  // Limpar rascunho
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    setHasDraft(false);
    setLastSaved(null);
  }, []);

  // Restaurar rascunho
  const restoreDraft = useCallback(() => {
    return draft;
  }, [draft]);

  return {
    draft,
    hasDraft,
    lastSaved,
    saveDraft,
    clearDraft,
    restoreDraft,
  };
}
