// URL do arquivo JSON (caminho absoluto a partir da raiz do site)
const DATA_URL = '/assets/data/pecas.json';

document.addEventListener('DOMContentLoaded', () => {
    const lookupButton = document.getElementById('lookup-button');
    const serialInput = document.getElementById('serial-code');
    
    if (!lookupButton) return;

    // 1. Event Listeners Normais
    lookupButton.addEventListener('click', () => handleLookup()); // Chama sem argumentos para usar o valor do input
    
    serialInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLookup();
    });

    // 2. VERIFICAÇÃO DE URL PARAM (Novo!)
    // Verifica se existe algo como ?q=001 na URL ao carregar a página
    const urlParams = new URLSearchParams(window.location.search);
    const queryCode = urlParams.get('q');

    if (queryCode) {
        // Preenche o campo e dispara a busca automaticamente
        serialInput.value = queryCode;
        handleLookup(queryCode);
    }
});

async function handleLookup(codeOverride = null) {
    const serialInput = document.getElementById('serial-code');
    const messageDiv = document.getElementById('lookup-message');
    const certDiv = document.getElementById('certificate-details');
    
    // Elementos para preencher
    const elCodigoDisplay = document.getElementById('cert-codigo-display');
    const elModelo = document.getElementById('cert-modelo');
    const elColecao = document.getElementById('cert-colecao');
    const elMaterial = document.getElementById('cert-material');
    const elAcabamento = document.getElementById('cert-acabamento');
    const elData = document.getElementById('cert-data');
    const elMensagem = document.getElementById('cert-mensagem');

    // Container para botões de ação (share)
    let actionsDiv = document.getElementById('cert-actions');
    // Se não existir, cria (para garantir compatibilidade se o HTML não tiver)
    if (!actionsDiv && certDiv) {
        actionsDiv = document.createElement('div');
        actionsDiv.id = 'cert-actions';
        actionsDiv.className = "mt-6 flex justify-center";
        certDiv.appendChild(actionsDiv);
    }

    const pageContext = document.body.getAttribute('data-context');

    messageDiv.innerText = "Buscando...";
    messageDiv.className = "text-center mt-4 text-lg font-medium text-gray-500";
    certDiv.classList.add('hidden');

    // Usa o override se vier da URL, senão usa o input
    let inputRaw = codeOverride || serialInput.value.trim();

    if (!inputRaw) {
        mostrarErro("Por favor, digite o código gravado na peça.");
        return;
    }

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Erro ao carregar dados.");
        const dados = await response.json();
        
        // --- LÓGICA DE BUSCA (Mantida) ---
        let pecasCandidatas = dados.pecas;
        if (pageContext) {
            pecasCandidatas = pecasCandidatas.filter(p => p.context === pageContext);
        }

        const normalizeCode = (code) => {
            const numbersOnly = code.replace(/\D/g, ''); 
            return numbersOnly ? parseInt(numbersOnly, 10) : null;
        };

        const inputNormalized = normalizeCode(inputRaw);

        const pecaEncontrada = pecasCandidatas.find(p => {
            const dbNormalized = normalizeCode(p.codigo);
            if (inputNormalized !== null && inputNormalized === dbNormalized) return true;
            if (p.codigo.toUpperCase() === inputRaw.toUpperCase()) return true;
            return false;
        });

        if (pecaEncontrada) {
            messageDiv.innerText = "";
            
            if(elCodigoDisplay) elCodigoDisplay.innerText = pecaEncontrada.codigo;
            if(elModelo) elModelo.innerText = pecaEncontrada.modelo;
            if(elColecao) elColecao.innerText = pecaEncontrada.colecao || "";
            if(elMaterial) elMaterial.innerText = pecaEncontrada.material || "Padrão";
            if(elAcabamento) elAcabamento.innerText = pecaEncontrada.acabamento || "Padrão";
            if(elData) elData.innerText = pecaEncontrada.data_producao;
            if(elMensagem) elMensagem.innerText = pecaEncontrada.mensagem || "";

            // --- ATUALIZA A URL DO NAVEGADOR (Novo!) ---
            // Isso permite que o usuário copie a URL lá de cima e já esteja com o código
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('q', pecaEncontrada.codigo.replace('#', '')); // Salva sem o # para ficar limpo
            window.history.pushState({}, '', newUrl);

            // --- BOTÃO DE COMPARTILHAR (Novo!) ---
            renderShareButton(actionsDiv, pecaEncontrada);

            certDiv.classList.remove('hidden');
            certDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } else {
            mostrarErro(`Código digitado (${inputRaw}) não encontrado para esta imagem.`);
        }

    } catch (erro) {
        console.error(erro);
        mostrarErro("Erro ao consultar o sistema. Tente novamente.");
    }
}

function renderShareButton(container, peca) {
    // Limpa botões anteriores
    container.innerHTML = '';

    const btn = document.createElement('button');
    btn.className = "inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all transform hover:scale-105";
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartilhar Certificado
    `;

    btn.onclick = async () => {
        const shareData = {
            title: `Presente Brindaria: ${peca.modelo}`,
            text: `Veja o certificado de autenticidade desta peça exclusiva da Brindaria: ${peca.modelo}.`,
            url: window.location.href // Usa a URL atual que já tem o ?q=...
        };

        // Tenta usar a API nativa do celular (Android/iOS)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Compartilhamento cancelado');
            }
        } else {
            // Fallback para Desktop (Copia para a área de transferência)
            navigator.clipboard.writeText(window.location.href);
            const originalText = btn.innerHTML;
            btn.innerHTML = "Link Copiado!";
            btn.className = "inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-md";
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.className = "inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all transform hover:scale-105";
            }, 2000);
        }
    };

    container.appendChild(btn);
}

function mostrarErro(msg) {
    const messageDiv = document.getElementById('lookup-message');
    messageDiv.innerText = msg;
    messageDiv.className = "text-center mt-4 text-lg font-medium text-red-600";
}