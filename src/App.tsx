import React, { useState, useRef } from 'react';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Check, 
  Copy, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import './App.css';

// URL do backend - pode ser configurada via variável de ambiente
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Interface para os resultados da comparação
interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export default function App() {
  const [textA, setTextA] = useState<string>('');
  const [textB, setTextB] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffPart[]>([]);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'compare' | 'improve'>('compare');
  
  // Estados para o Revisor IA
  const [improvePrompt, setImprovePrompt] = useState<string>('');
  const [improvedText, setImprovedText] = useState<string>('');
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // Algoritmo de diff de linhas (LCS simplificado) - mostra apenas alterações
  const computeDiff = (oldStr: string, newStr: string): DiffPart[] => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const result: DiffPart[] = [];
    
    let i = 0;
    let j = 0;

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        // Linhas iguais - PULAR (não adicionar ao resultado)
        i++;
        j++;
      } else {
        let foundMatch = false;
        for (let lookAhead = 1; lookAhead < 10; lookAhead++) {
          if (i + lookAhead < oldLines.length && oldLines[i + lookAhead] === newLines[j]) {
            for (let k = 0; k < lookAhead; k++) {
              result.push({ value: oldLines[i + k] + '\n', removed: true });
            }
            i += lookAhead;
            foundMatch = true;
            break;
          }
          if (j + lookAhead < newLines.length && newLines[j + lookAhead] === oldLines[i]) {
            for (let k = 0; k < lookAhead; k++) {
              result.push({ value: newLines[j + k] + '\n', added: true });
            }
            j += lookAhead;
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          if (i < oldLines.length) {
            result.push({ value: oldLines[i] + '\n', removed: true });
            i++;
          }
          if (j < newLines.length) {
            result.push({ value: newLines[j] + '\n', added: true });
            j++;
          }
        }
      }
    }
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content = '';
      if (file.type === 'application/pdf') {
        content = await file.text();
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        try {
          content = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          content = text;
        }
      } else {
        content = await file.text();
      }

      if (target === 'A') setTextA(content);
      else setTextB(content);
      setError(null);
    } catch {
      setError('Erro ao ler o ficheiro. Verifique o formato.');
    }
  };

  const runComparison = () => {
    setIsComparing(true);
    setTimeout(() => {
      const result = computeDiff(textA, textB);
      setDiffResult(result);
      setIsComparing(false);
    }, 100);
  };

  const improveTextWithGemini = async () => {
    if (!textB && !textA) {
      setError('Adicione algum texto para melhorar.');
      return;
    }

    const textToImprove = textB || textA;
    setIsImproving(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/improve-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToImprove,
          prompt: improvePrompt || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao processar o texto');
      }

      const data = await response.json();
      if (data.improvedText) {
        setImprovedText(data.improvedText);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Não foi possível conectar ao backend. Certifique-se de que o servidor está rodando na porta 3001.');
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Falha ao processar o texto. Verifique se o backend está configurado corretamente.');
      }
    } finally {
      setIsImproving(false);
    }
  };

  const copyToClipboard = (content: string) => {
    const el = document.createElement('textarea');
    el.value = content;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="title-container">
            <h1>
              <span className="icon-bg"><ArrowRightLeft size={28} /></span>
              Diff <span className="text-blue-500">Text</span>
            </h1>
            <p className="subtitle">Comparador de documentos e revisão textual inteligente.</p>
          </div>
          
          <div className="tab-nav">
            <button 
              onClick={() => setActiveTab('compare')}
              className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
            >
              <ArrowRightLeft size={18} />
              Comparar
            </button>
            <button 
              onClick={() => setActiveTab('improve')}
              className={`tab-button improve ${activeTab === 'improve' ? 'active' : ''}`}
            >
              <Sparkles size={18} />
              Revisar com IA
            </button>
          </div>
        </header>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span className="error-text">{error}</span>
          </div>
        )}

        {activeTab === 'compare' ? (
          <div className="space-y-8">
            <div className="compare-grid">
              <div className="text-input-container">
                <div className="input-header">
                  <label className="input-label">
                    <div className="dot blue"></div> Versão Original
                  </label>
                  <button 
                    onClick={() => fileInputARef.current?.click()}
                    className="import-button"
                  >
                    Importar Ficheiro
                  </button>
                  <input type="file" ref={fileInputARef} className="hidden-input" accept=".txt,.json,.pdf" onChange={(e) => handleFileUpload(e, 'A')} />
                </div>
                <textarea 
                  className="text-input"
                  placeholder="Cole o texto original ou carregue um ficheiro..."
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                />
              </div>

              <div className="text-input-container">
                <div className="input-header">
                  <label className="input-label">
                    <div className="dot emerald"></div> Versão Modificada
                  </label>
                  <button 
                    onClick={() => fileInputBRef.current?.click()}
                    className="import-button emerald"
                  >
                    Importar Ficheiro
                  </button>
                  <input type="file" ref={fileInputBRef} className="hidden-input" accept=".txt,.json,.pdf" onChange={(e) => handleFileUpload(e, 'B')} />
                </div>
                <textarea 
                  className="text-input emerald"
                  placeholder="Cole o texto modificado ou carregue um ficheiro..."
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                />
              </div>
            </div>

            <div className="compare-button-container">
              <button 
                onClick={runComparison}
                disabled={isComparing || (!textA && !textB)}
                className="compare-button"
              >
                {isComparing ? <Loader2 className="spinner" /> : <ArrowRightLeft size={22} />}
                COMPARAR
              </button>
            </div>

            {diffResult.length > 0 && (
              <div className="diff-result">
                <div className="diff-header">
                  <h2>
                    <Check className="check-icon" /> Alterações Detectadas
                  </h2>
                  <div className="diff-legend">
                    <div className="legend-item">
                      <div className="legend-color removed"></div> Removido
                    </div>
                    <div className="legend-item">
                      <div className="legend-color added"></div> Adicionado
                    </div>
                  </div>
                </div>

                <div className="diff-content">
                  {diffResult.map((part, index) => {
                    let className = "diff-line ";
                    if (part.added) className += "added";
                    else if (part.removed) className += "removed";
                    else className += "unchanged";
                    
                    return (
                      <div key={index} className={className}>
                        {part.value || '\n'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="improve-container">
            <div className="improve-section space-y-8">
              <div className="improve-card">
                <div className="improve-header">
                  <h2>
                    <Sparkles className="sparkles-icon" /> Revisor IA
                  </h2>
                  <p>Otimize a gramática e o estilo do seu texto final.</p>
                </div>
                
                <div className="improve-form">
                  <div>
                    <label className="form-label">Texto de Referência</label>
                    <div className="reference-text">
                      {textB || textA || <span className="empty">Nenhum texto carregado...</span>}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Notas de Revisão (Opcional)</label>
                    <input 
                      type="text"
                      value={improvePrompt}
                      onChange={(e) => setImprovePrompt(e.target.value)}
                      placeholder="Ex: 'Torne o texto mais formal'"
                      className="improve-prompt-input"
                    />
                  </div>

                  <button 
                    onClick={improveTextWithGemini}
                    disabled={isImproving || (!textA && !textB)}
                    className="improve-button"
                  >
                    {isImproving ? <Loader2 className="spinner" /> : <Sparkles size={24} />}
                    REVER COM GEMINI
                  </button>
                </div>
              </div>

              {improvedText && (
                <div className="improved-result">
                  <div className="improved-header">
                    <h3>Texto Otimizado</h3>
                    <button 
                      onClick={() => copyToClipboard(improvedText)}
                      className="copy-button"
                    >
                      <Copy size={14} /> Copiar
                    </button>
                  </div>
                  <div className="improved-text">
                    {improvedText}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}