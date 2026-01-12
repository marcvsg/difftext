import { useState, useCallback, useMemo } from 'react';
import type { ChangeEvent, FC } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
// Usando 'lucide-react' para ícones
import { Settings, User, Download, Search, Smile, Minimize2 as LucideMinimize, Maximize2 as LucideMaximize, Coffee, RotateCcw } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

// --- Tipos e Interfaces TypeScript ---

interface Option {
    value: string;
    label: string;
}

interface AvatarParams {
    figure: string;
    direction: number;
    head_direction: number;
    action: string;
    gesture: string;
    size: 's' | 'm' | 'l';
}

interface ModalState {
    isOpen: boolean;
    title: string;
    content: string;
}

interface ModalProps extends ModalState {
    onClose: () => void;
    closeText: string;
}

interface SelectorProps {
    label: string;
    options: Option[];
    value: string | number;
    onChange: (value: string) => void;
    icon: React.ElementType; // Tipo para ícones Lucide
    isLoading: boolean;
}


// --- Componente Modal Simples (Estilo Pixelado) ---
const Modal: FC<ModalProps> = ({ isOpen, title, content, onClose, closeText }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-text">{content}</p>
                <button
                    onClick={onClose}
                    className="modal-button"
                >
                    {closeText}
                </button>
            </div>
        </div>
    );
};

// --- Ícone ChevronDown nativo ---
const ChevronDown: FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

// --- Componente de Dropdown Reutilizável (Estilo Pixelado) ---
const Selector: FC<SelectorProps> = ({ label, options, value, onChange, icon: Icon, isLoading }) => (
    <div className="selector-container">
        <label className="selector-label">
            <Icon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            {label}
        </label>
        <div className="selector-wrapper">
            <select
                value={value}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
                className="selector-select"
                disabled={isLoading}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="selector-chevron" />
        </div>
    </div>
);

// --- Componente Principal ---
const App: FC = () => {
    const { t } = useTranslation();

    const ACTIONS = useMemo((): Option[] => [
        { value: 'std', label: t('actions.std') },
        { value: 'wlk', label: t('actions.wlk') },
        { value: 'lay', label: t('actions.lay') },
        { value: 'sit', label: t('actions.sit') },
        { value: 'wav', label: t('actions.wav') },
        { value: 'drk', label: t('actions.drk') },
        { value: 'spk', label: t('actions.spk') },
        { value: 'crr', label: t('actions.crr') },
        { value: 'srp', label: t('actions.srp') },
    ], [t]);

    const EXPRESSIONS = useMemo((): Option[] => [
        { value: 'std', label: t('expressions.std') },
        { value: 'sad', label: t('expressions.sad') },
        { value: 'agr', label: t('expressions.agr') },
        { value: 'sml', label: t('expressions.sml') },
        { value: 'spk', label: t('expressions.spk') },
        { value: 'srp', label: t('expressions.srp') },
        { value: 'eyb', label: t('expressions.eyb') },
        { value: 'grn', label: t('expressions.grn') },
    ], [t]);

    const SIZES = useMemo((): Option[] => [
        { value: 's', label: t('sizes.s') },
        { value: 'm', label: t('sizes.m') },
        { value: 'l', label: t('sizes.l') },
    ], [t]);

    const DOMAINS = useMemo((): Option[] => [
        { value: 'com.br', label: t('Origins.br') },
        { value: 'com', label: t('Origins.com') },
        { value: 'es', label: t('Origins.es') },
    ], [t]);

    const CARRYING_ITEMS = useMemo((): Option[] => [
        { value: '0', label: t('items.0') },
        { value: '1', label: t('items.1') },
        { value: '2', label: t('items.2') },
        { value: '3', label: t('items.3') },
        { value: '5', label: t('items.5') },
        { value: '6', label: t('items.6') },
        { value: '9', label: t('items.9') },
        { value: '42', label: t('items.42') },
        { value: '43', label: t('items.43') },
        { value: '44', label: t('items.44') },
        { value: '45', label: t('items.45') },
        { value: '46', label: t('items.46') },
        { value: '47', label: t('items.47') },
        { value: '56', label: t('items.56') },
        { value: '73', label: t('items.73') },
        { value: '76', label: t('items.76') },
        { value: '77', label: t('items.77') },
        { value: '78', label: t('items.78') },
        { value: '97', label: t('items.97') },
        { value: '98', label: t('items.98') },
        { value: '99', label: t('items.99') },
        { value: '146', label: t('items.146') },
        { value: '182', label: t('items.182') },
        { value: '215', label: t('items.215') },
        { value: '216', label: t('items.216') },
        { value: '235', label: t('items.235') },
        { value: '236', label: t('items.236') },
        { value: '237', label: t('items.237') },
        { value: '261', label: t('items.261') },
    ], [t]);
    const defaultFigure = 'hr-828-1150.hd-180-1021.ch-260-1314.lg-270-1189.sh-300-1189.ea-1401-1314'; // Default Habbo figure code
    const [avatarParams, setAvatarParams] = useState<AvatarParams>({
        figure: defaultFigure,
        direction: 4,
        head_direction: 4,
        action: 'std',
        gesture: 'sml',
        size: 'l'
    });

    const [carryingItem, setCarryingItem] = useState<string>('6'); // Default: Coffee
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userName, setUserName] = useState<string>('');
    const [habboDomain, setHabboDomain] = useState<string>('com.br');
    const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', content: '' });

    // CONSTRUÇÃO DA URL REAL DO HABBO IMAGER
    const generateAvatarUrl = useCallback((format: 'png' | 'gif' | 'default' = 'default'): string => {
        const baseUrl = 'https://www.habbo.com/habbo-imaging/avatarimage';
        const { figure, direction, head_direction, gesture, size, action } = avatarParams;

        const carryingId = carryingItem.trim();
        const hasCarryingItem = carryingId && carryingId !== '0';

        let finalAction = action;
        // Se estiver carregando um item, o parâmetro 'action' deve incluir o 'crr=ID'
        if (hasCarryingItem) {
            finalAction = `${action},crr=${carryingId}`;
        }

        let url = `${baseUrl}?figure=${figure}&direction=${direction}&head_direction=${head_direction}&gesture=${gesture}&size=${size}&action=${finalAction}`;
        
        // Adiciona um parâmetro único para forçar o recarregamento da imagem
        url += `&key=${Date.now()}`;
        
        // Adiciona o formato, se não for o padrão (GIF)
        if (format !== 'default' && format !== 'gif') {
            url += `&format=${format}`;
        }

        return url;
    }, [avatarParams, carryingItem]);

    const currentAvatarUrl = useMemo(() => generateAvatarUrl('default'), [generateAvatarUrl]);

    // Função genérica para atualizar os parâmetros
    const handleChange = (key: keyof AvatarParams, value: string | number) => {
        setIsLoading(true);
        setAvatarParams(prev => ({ ...prev, [key]: value as any }));
    };

    // Altera a direção do avatar
    const handleDirectionChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newDirection = parseInt(e.target.value, 10);

        setIsLoading(true);
        setAvatarParams(prev => ({
            ...prev,
            direction: newDirection,
            // A cabeça segue a direção do corpo, a menos que seja explicitamente diferente
            head_direction: newDirection,
        }));
    };

    const handleDownload = (format: 'png' | 'gif') => {
        setIsLoading(true);
        
        const downloadUrl = generateAvatarUrl(format);
        
        try {
            // Cria um elemento âncora temporário para disparar o download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `habbo-avatar-${new Date().getTime()}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a); // Limpa o elemento âncora

            setModal({
                isOpen: true,
                title: t('downloadCompleteTitle'),
                content: t('downloadCompleteContent', { format }),
            });
        } catch (error) {
            console.error('Erro ao baixar a imagem:', error);
            setModal({
                isOpen: true,
                title: t('downloadErrorTitle'),
                content: t('downloadErrorContent'),
            });
        } finally {
            // Nota: O setIsLoading(false) é adiado para o `onLoad` do <img> para evitar flicker.
            // Para o download, podemos resetar o estado de loading immediately se a imagem já foi carregada.
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
    };

    const fetchFigureCode = async (user: string): Promise<string | null> => {
    try {
        const apiBaseUrl = `https://origins.habbo.${habboDomain}`;
        const response = await fetch(`${apiBaseUrl}/api/public/users?name=${encodeURIComponent(user)}`);
        
        if (!response.ok) {
            setModal({
                isOpen: true,
                title: t('searchErrorTitle'),
                content: t('userNotFoundOrApiError', { user, status: response.status }),
            });
            return null;
        }

        const data: { figureString?: string } = await response.json();
        const figure = data?.figureString;

        if (!figure) {
            setModal({
                isOpen: true,
                title: t('userWithoutFigureTitle'),
                content: t('userWithoutFigureContent', { user }),
            });
            return null;
        }

        return figure;
    } catch (error) {
        console.error('Erro ao buscar figura:', error);
        setModal({
            isOpen: true,
            title: t('connectionErrorTitle'),
            content: t('connectionErrorContent'),
        });
        return null;
    }
};

    const handleSearchUser = async () => {
        if (!userName.trim()) {
            setModal({
                isOpen: true,
                title: t('searchErrorTitle'),
                content: t('pleaseEnterUsername'),
            });
            return;
        }

        const newFigure = await fetchFigureCode(userName);

        if (newFigure) {
            // A função handleChange irá definir o figure e setar isLoading(true), que será resetado pelo onLoad do <img>
            handleChange('figure', newFigure); 
        } else {
            // Se falhar, reseta o loading se a busca não o fez
            setIsLoading(false);
        }
    };

    // Lida com o pressionar de teclas.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearchUser();
        }
    };

    // Determina o tamanho do contêiner da imagem com base no parâmetro 'size'
    const imageContainerSize = useMemo(() => {
        // Proporções exatas do Habbo
        switch(avatarParams.size) {
            case 's': return { width: '33px', height: '56px' };   // Pequeno
            case 'm': 
            default: return { width: '64px', height: '110px' }; // Médio (padrão)
            case 'l': return { width: '128px', height: '220px' }; // Grande
        }
    }, [avatarParams.size]);
    
    // Função para resetar os parâmetros de ação e gesto
    const handleReset = () => {
        setIsLoading(true);
        setAvatarParams(prev => ({ 
            ...prev,
            action: 'std',
            gesture: 'std',
            direction: 4,
            head_direction: 4,
        }));
        setCarryingItem('0');
        setModal({
            isOpen: true,
            title: t('paramsResetTitle'),
            content: t('paramsResetContent'),
        });
    }

    return (
        <>
            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                content={modal.content}
                onClose={closeModal}
                closeText={t('close')}
            />

            <div className="app-container">
                <div className="main-window">

                    {/* Header (Topo da Janela Habbo) */}
                    <header className="window-header">
                        <h1 className="window-title">
                            <User style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} />
                            {t('headerTitle')}
                        </h1>
                    </header>

                    <div className="content-grid">

                        {/* Coluna de Visualização (Avatar) */}
                        <div className="preview-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                                <h3 className="preview-title" style={{ margin: 0 }}>{t('avatar')}</h3>
                                <button
                                    onClick={handleReset}
                                    disabled={isLoading}
                                    className="base-button blue-button"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', transform: 'none', boxShadow: '1px 1px 0 0 rgba(0,0,0,0.3)' }}
                                >
                                    <RotateCcw size={14} /> {t('reset')}
                                </button>
                            </div>

                            {/* Imagem do Avatar (REAL) */}
                            <div
                                className={`avatar-wrapper ${isLoading ? 'loading' : ''}`}
                                style={imageContainerSize}>
                                <img
                                    // A chave força o React a recriar o elemento, garantindo o recarregamento da imagem
                                    key={currentAvatarUrl}
                                    src={currentAvatarUrl}
                                    alt={t('habboAvatarAlt')}
                                    className="avatar-image"
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => {
                                        setIsLoading(false);
                                        setModal({
                                            isOpen: true,
                                            title: t('renderErrorTitle'),
                                            content: t('renderErrorContent'),
                                        });
                                    }}
                                />
                            </div>

                            {/* Controles de Download */}
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'center',
                                marginTop: '1rem'
                            }}>
                                <button
                                    onClick={() => handleDownload('png')}
                                    disabled={isLoading}
                                    className="base-button blue-button"
                                >
                                    <Download size={16} /> {t('downloadPng')}
                                </button>
                                <button
                                    onClick={() => handleDownload('gif')}
                                    disabled={isLoading}
                                    className="base-button green-button"
                                >
                                    <Download size={16} /> {t('downloadGif')}
                                </button>
                            </div>
                            
                            {/* CONTROLE DE DIREÇÃO (SLIDER ESTILO PIXELADO) */}
                            <div className="direction-control">
                                <div className="direction-header">
                                    <p className="direction-label">{t('directionLabel')}</p>
                                    <p className="direction-value">{avatarParams.direction}</p>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="7"
                                    step="1"
                                    value={avatarParams.direction}
                                    onChange={handleDirectionChange}
                                    className="direction-range"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Coluna de Controles (Busca, Ação e Gesto) */}
                        <div className="controls-panel">
                            <h2 className="panel-heading">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
                                    {t('avatarControlsTitle')}
                                </div>
                                <LanguageSwitcher />
                            </h2>

                            {/* BUSCA DE USUÁRIO */}
                            <div className="search-section">
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                    <Search style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                    {t('searchByUsername')}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '1rem' }}>
                                    {t('searchDescription')}
                                </p>

                                <div style={{marginBottom: '1rem'}}>
                                    <Selector
                                        label={t('hotel')}
                                        options={DOMAINS}
                                        value={habboDomain}
                                        onChange={(val) => setHabboDomain(val)}
                                        icon={Search} // Using Search icon for consistency
                                        isLoading={isLoading}
                                    />
                                </div>

                                <div className="search-input-group">
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t('usernamePlaceholder')}
                                        className="search-input"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSearchUser}
                                        className="search-button"
                                        disabled={isLoading}
                                    >
                                        <Search style={{ width: '1.25rem', height: '1.25rem' }} />
                                    </button>
                                </div>
                            </div>

                            {/* AÇÃO, GESTURE E TAMANHO */}
                            <div className="selectors-section">
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('displayParamsTitle')}</h3>
                                <div className="selectors-grid">

                                    <Selector
                                        label={t('bodyAction')}
                                        options={ACTIONS}
                                        value={avatarParams.action}
                                        onChange={(val) => handleChange('action', val)}
                                        icon={User}
                                        isLoading={isLoading}
                                    />

                                    <Selector
                                        label={t('faceGesture')}
                                        options={EXPRESSIONS}
                                        value={avatarParams.gesture}
                                        onChange={(val) => handleChange('gesture', val)}
                                        icon={Smile}
                                        isLoading={isLoading}
                                    />

                                    <Selector
                                        label={t('size')}
                                        options={SIZES}
                                        value={avatarParams.size}
                                        onChange={(val) => handleChange('size', val as AvatarParams['size'])}
                                        icon={avatarParams.size === 'l' ? LucideMaximize : LucideMinimize}
                                        isLoading={isLoading}
                                    />
                                </div>

                                {/* SELECTOR PARA ITEM SEGURO (CARRYING) */}
                                <div className="carrying-item-section">
                                    <Selector
                                        label={t('itemList')}
                                        options={CARRYING_ITEMS}
                                        value={carryingItem}
                                        onChange={(val) => {
                                            setCarryingItem(val);
                                            setIsLoading(true);
                                        }}
                                        icon={Coffee}
                                        isLoading={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Parâmetros da URL Final (Debug) */}
                                                        
                            {/* Parâmetros da URL Final (Debug) */}
                            <div className="debug-panel">
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.75rem' }}>{t('imagerUrlDebug')}</h3>
                                <code className="debug-code">
                                    {currentAvatarUrl}
                                </code>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;