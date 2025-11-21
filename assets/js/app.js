// URL do arquivo JSON (caminho absoluto a partir da raiz do site)
const DATA_URL = '/assets/data/pecas.json';

document.addEventListener('DOMContentLoaded', () => {
    const lookupButton = document.getElementById('lookup-button');
    const serialInput = document.getElementById('serial-code');
    
    // Se não houver botão de busca na página (ex: Home), não faz nada
    if (!lookupButton) return;

    lookupButton.addEventListener('click', handleLookup);
    
    // Permitir buscar ao apertar "Enter" no input
    serialInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLookup();
    });
});

async function handleLookup() {
    const serialInput = document.getElementById('serial-code');
    const messageDiv = document.getElementById('lookup-message');
    const certDiv = document.getElementById('certificate-details');
    
    // Obtém o contexto da página atual (definido no <body>, ex: data-context="sao-luis")
    const pageContext = document.body.getAttribute('data-context');

    // Elementos para preencher com os dados
    const elCodigoDisplay = document.getElementById('cert-codigo-display');
    const elModelo = document.getElementById('cert-modelo');
    const elColecao = document.getElementById('cert-colecao');
    const elMaterial = document.getElementById('cert-material');
    const elAcabamento = document.getElementById('cert-acabamento');
    const elData = document.getElementById('cert-data');
    const elMensagem = document.getElementById('cert-mensagem');

    // Reset visual (limpa estados anteriores)
    messageDiv.innerText = "Buscando...";
    messageDiv.className = "text-center mt-4 text-lg font-medium text-gray-500";
    certDiv.classList.add('hidden');

    let inputRaw = serialInput.value.trim();

    if (!inputRaw) {
        mostrarErro("Por favor, digite o código gravado na peça.");
        return;
    }

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Erro ao carregar dados.");
        const dados = await response.json();
        
        // --- 1. FILTRO DE CONTEXTO ---
        // Filtra apenas as peças que pertencem a esta página (se o contexto estiver definido)
        let pecasCandidatas = dados.pecas;
        if (pageContext) {
            pecasCandidatas = pecasCandidatas.filter(p => p.context === pageContext);
        }

        // --- 2. LÓGICA "GAMBIARRA" INTELIGENTE (Fuzzy Match) ---
        const normalizeCode = (code) => {
            // Remove tudo que não é número
            const numbersOnly = code.replace(/\D/g, ''); 
            // Converte para inteiro para ignorar zeros a esquerda (ex: 001 vira 1)
            return numbersOnly ? parseInt(numbersOnly, 10) : null;
        };

        const inputNormalized = normalizeCode(inputRaw);

        // Busca no array filtrado
        const pecaEncontrada = pecasCandidatas.find(p => {
            const dbNormalized = normalizeCode(p.codigo);
            
            // Verifica correspondência numérica (ex: input "N001" == db "#001" pois ambos viram 1)
            if (inputNormalized !== null && inputNormalized === dbNormalized) return true;
            
            // Verifica correspondência de texto exata (para casos alfanuméricos sem números)
            if (p.codigo.toUpperCase() === inputRaw.toUpperCase()) return true;

            return false;
        });

        if (pecaEncontrada) {
            // SUCESSO!
            messageDiv.innerText = ""; // Limpa mensagem de "Buscando..."
            
            // Preenche os dados no HTML
            if(elCodigoDisplay) elCodigoDisplay.innerText = pecaEncontrada.codigo;
            if(elModelo) elModelo.innerText = pecaEncontrada.modelo;
            if(elColecao) elColecao.innerText = pecaEncontrada.colecao || "";
            if(elMaterial) elMaterial.innerText = pecaEncontrada.material || "Padrão";
            if(elAcabamento) elAcabamento.innerText = pecaEncontrada.acabamento || "Padrão";
            if(elData) elData.innerText = pecaEncontrada.data_producao;
            if(elMensagem) elMensagem.innerText = pecaEncontrada.mensagem || "";

            // Mostra a área do certificado
            certDiv.classList.remove('hidden');
            
            // Scroll suave até o resultado para o usuário ver
            certDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } else {
            // FALHA!
            mostrarErro(`Código digitado (${inputRaw}) não encontrado para esta imagem.`);
        }

    } catch (erro) {
        console.error(erro);
        mostrarErro("Erro ao consultar o sistema. Tente novamente.");
    }
}

function mostrarErro(msg) {
    const messageDiv = document.getElementById('lookup-message');
    messageDiv.innerText = msg;
    messageDiv.className = "text-center mt-4 text-lg font-medium text-red-600";
}