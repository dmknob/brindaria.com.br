# Este é o bloco de servidor para o domínio brindaria.com.br.
# Copie este conteúdo e cole no arquivo /etc/nginx/sites-available/brindaria.com.br no seu servidor.

server {
    # Escuta na porta 80 para tráfego HTTP padrão.
    listen 80;
    listen [::]:80;

    # O diretório raiz onde os arquivos do site estão localizados.
    # Corresponde à pasta onde você clonou o projeto.
    root /var/www/brindaria.com.br;

    # O Nginx tentará servir o arquivo index.html por padrão.
    index index.html;

    # O nome do domínio que este bloco de servidor deve responder.
    server_name brindaria.com.br www.brindaria.com.br;

    # Regras para como os arquivos devem ser servidos.
    location / {
        # Tenta encontrar um arquivo com o nome exato solicitado.
        # Se não encontrar, tenta servir um diretório com esse nome.
        # Se falhar, retorna um erro 404 (Not Found).
        try_files $uri $uri/ =404;
    }
}
