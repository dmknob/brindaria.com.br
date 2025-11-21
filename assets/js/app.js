// URL do arquivo JSON (caminho absoluto a partir da raiz do site)
const DATA_URL = '/assets/data/pecas.json';

document.addEventListener('DOMContentLoaded', () => {
    const lookupButton = document.getElementById('lookup-button');
    const serialInput = document.getElementById('serial-code');
    
    // Se não houver botão de busca na página, não faz nada
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
    
    // Elementos para preencher (Atualizado para a nova estrutura)
    const elCodigoDisplay = document.getElementById('cert-codigo-display');
    const elModelo = document.getElementById('cert-modelo');
    const elColecao = document.getElementById('cert-colecao');
    const elMaterial = document.getElementById('cert-material');
    const elAcabamento = document.getElementById('cert-acabamento');
    const elData = document.getElementById('cert-data');
    const elMensagem = document.getElementById('cert-mensagem');

    // Limpa estados anteriores
    messageDiv.innerText = "Buscando...";
    messageDiv.className = "text-center mt-4 text-lg font-medium text-gray-500";
    certDiv.classList.add('hidden');

    let codigoDigitado = serialInput.value.trim();

    if (!codigoDigitado) {
        mostrarErro("Por favor, digite o código gravado na peça.");
        return;
    }

    // Adiciona o '#' se o usuário digitou apenas números e o banco espera '#'
    // Ou normaliza para maiúsculo
    // Vamos buscar de forma "fuzzy" (contém) ou exata, mas simplificando:
    if (!codigoDigitado.startsWith('#') && !isNaN(codigoDigitado)) {
        codigoDigitado = '#' + codigoDigitado; // Ex: transforma '001' em '#001'
    }
    
    codigoDigitado = codigoDigitado.toUpperCase();

    try {
        // 1. Busca o JSON
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Erro ao carregar dados.");
        
        const dados = await response.json();
        
        // 2. Procura a peça no array
        // Compara o código digitado com o código no JSON
        const pecaEncontrada = dados.pecas.find(p => p.codigo.toUpperCase() === codigoDigitado);

        if (pecaEncontrada) {
            // SUCESSO
            messageDiv.innerText = ""; // Limpa mensagem de carregamento
            
            // Preenche os dados
            if(elCodigoDisplay) elCodigoDisplay.innerText = pecaEncontrada.codigo;
            if(elModelo) elModelo.innerText = pecaEncontrada.modelo;
            if(elColecao) elColecao.innerText = pecaEncontrada.colecao || "";
            if(elMaterial) elMaterial.innerText = pecaEncontrada.material || "Padrão";
            if(elAcabamento) elAcabamento.innerText = pecaEncontrada.acabamento || "Padrão";
            if(elData) elData.innerText = pecaEncontrada.data_producao;
            if(elMensagem) elMensagem.innerText = pecaEncontrada.mensagem || "";

            // Mostra o certificado
            certDiv.classList.remove('hidden');
            
        } else {
            mostrarErro(`Código ${codigoDigitado} não encontrado. Verifique a grafia.`);
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