# Event System ISPGAYA

Projeto web desenvolvido para a gestão e publicação de conteúdos do **InfoCultura**, com frontend em **React/Vite** e backend em **Django**.

A aplicação foi pensada para apoiar a organização, divulgação e gestão de eventos e conteúdos culturais, através de uma estrutura separada entre frontend, backend, base de dados e API.

## Visão geral

O **Event System ISPGAYA** é uma aplicação web académica desenvolvida com o objetivo de criar uma plataforma organizada para gestão e publicação de informação cultural.

O projeto inclui uma interface frontend para utilização da aplicação e um backend responsável pela lógica de negócio, autenticação, ligação à base de dados e disponibilização de endpoints para consumo pela aplicação.

## Objetivo do projeto

O principal objetivo do projeto é disponibilizar uma solução web que permita gerir conteúdos associados ao InfoCultura de forma mais estruturada, centralizada e acessível.

A aplicação procura apoiar funcionalidades como:

* Gestão de eventos culturais
* Publicação e organização de conteúdos
* Administração de informação através de backend
* Comunicação entre frontend e backend através de API
* Configuração de integrações externas
* Gestão de dados em base de dados relacional

## Tecnologias utilizadas

### Frontend

* React
* Vite
* JavaScript
* HTML
* CSS

### Backend

* Python
* Django
* Django REST Framework

### Base de dados

* MySQL

### Migrações e configuração

* Django migrations
* Alembic

### Ferramentas de desenvolvimento

* Git
* GitHub
* VS Code
* npm
* pip
* virtualenv

### Integrações previstas

* Google Maps API
* Eventbrite API
* SMTP para envio de emails

## Estrutura do projeto

```text
eventSystem-Ispgaya/
|- src/                  Frontend React com Vite
|- backend/              Backend Django
|  |- alembic/           Migrações do schema usado no projeto
|  |- manage.py          Comando principal do Django
|  `- .env.example       Exemplo de variáveis de ambiente
|- package.json          Dependências e scripts do frontend
`- README.md
```

## Requisitos

Para executar o projeto localmente, é necessário ter instalado:

* Node.js 18 ou superior
* Python 3.11 ou superior
* MySQL acessível localmente ou em rede
* npm
* pip
* virtualenv

## Configuração do backend

### 1. Entrar na pasta do backend

```bash
cd backend
```

### 2. Criar e ativar o ambiente virtual

```bash
python3 -m venv .venv
```

Em Linux/macOS:

```bash
source .venv/bin/activate
```

Em Windows:

```bash
.venv\Scripts\activate
```

### 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 4. Criar o ficheiro de variáveis de ambiente

Criar o ficheiro `.env` a partir do exemplo existente:

```bash
cp .env.example .env
```

Depois, preencher o ficheiro `backend/.env` com os valores adequados para o ambiente local.

Exemplo de configuração:

```env
DJANGO_SECRET_KEY=your_django_secret_key_here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=127.0.0.1
DB_PORT=3306

INFOCULTURA_JWT_SECRET=your_jwt_secret_here
INFOCULTURA_JWT_EXPIRES_HOURS=12
INFOCULTURA_ADMIN_USER=admin
INFOCULTURA_ADMIN_EMAIL=admin@example.com
INFOCULTURA_ADMIN_PASS=your_admin_password_here

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=your_email_host
EMAIL_PORT=587
EMAIL_HOST_USER=your_email_user
EMAIL_HOST_PASSWORD=your_email_password
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=your_email@example.com

EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_private_token
EVENTBRITE_ORGANIZATION_ID=your_eventbrite_organization_id
EVENTBRITE_API_KEY=your_eventbrite_api_key
EVENTBRITE_CLIENT_SECRET=your_eventbrite_client_secret
EVENTBRITE_PUBLIC_TOKEN=your_eventbrite_public_token
EVENTBRITE_DEFAULT_CURRENCY=EUR
EVENTBRITE_DEFAULT_TIMEZONE=Europe/Lisbon
EVENTBRITE_DEFAULT_COUNTRY=PT
EVENTBRITE_DEFAULT_VENUE_ID=your_eventbrite_venue_id
EVENTBRITE_TICKET_NAME=Entrada geral
```

> As chaves reais, passwords, tokens e credenciais não devem ser guardados no GitHub.

### 5. Aplicar as migrations

```bash
python manage.py migrate
```

### 6. Criar o utilizador admin e os dados base do InfoCultura

```bash
python manage.py bootstrap_infocultura
```

### 7. Arrancar o backend

```bash
python manage.py runserver 8001
```

O backend ficará disponível em:

```text
http://127.0.0.1:8001
```

## Configuração do frontend

### 1. Voltar à raiz do projeto

```bash
cd ..
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Criar o ficheiro de variáveis de ambiente

Criar um ficheiro `.env` na raiz do projeto com a configuração do frontend.

Exemplo:

```env
VITE_INFOCULTURA_API=http://127.0.0.1:8001/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

A variável `VITE_INFOCULTURA_API` define o endereço da API utilizada pelo frontend.

A variável `VITE_GOOGLE_MAPS_API_KEY` pode ser usada para funcionalidades relacionadas com locais e moradas no formulário de eventos.

### 4. Arrancar o frontend

```bash
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

## Acesso ao projeto

Com backend e frontend a correr, a aplicação pode ser acedida localmente através dos seguintes endereços:

```text
Frontend: http://localhost:5173
Backend:  http://127.0.0.1:8001
```

## Build do frontend

Para gerar a versão de produção do frontend:

```bash
npm run build
```

## Verificação rápida

Durante o desenvolvimento, é possível confirmar o funcionamento do projeto verificando:

* Se o backend está ativo antes de iniciar o frontend
* Se o ficheiro `backend/.env` existe e está configurado
* Se a base de dados MySQL está acessível
* Se o ficheiro `.env` da raiz contém a variável `VITE_INFOCULTURA_API`
* Se a porta `8001` está disponível para o backend
* Se a porta `5173` está disponível para o frontend

## Segurança

O projeto utiliza ficheiros de ambiente para configuração local e armazenamento de dados sensíveis.

Ficheiros como `.env`, tokens, passwords, chaves de API e credenciais reais não devem ser enviados para o GitHub.

O ficheiro `.env.example` deve conter apenas valores de exemplo ou placeholders, servindo como referência para configuração local.

## O que aprendi com este projeto

Com este projeto aprofundei conhecimentos em desenvolvimento web full-stack, separação entre frontend e backend, configuração de APIs, autenticação, ligação a base de dados e organização de projetos com múltiplas tecnologias.

Também trabalhei conceitos importantes como:

* Estruturação de uma aplicação com React e Django
* Comunicação entre frontend e backend através de API
* Configuração de ambiente local
* Gestão de variáveis de ambiente
* Utilização de base de dados MySQL
* Migrações de schema
* Organização de código por responsabilidades
* Integração com serviços externos
* Documentação técnica de um projeto web

## Estado do projeto

Projeto académico desenvolvido no contexto de Engenharia Informática.

A aplicação encontra-se estruturada com frontend, backend, base de dados e configuração local, permitindo a execução e validação do sistema em ambiente de desenvolvimento.

## Autora

Desenvolvido por **Mafalda Brandão**.

Estudante de Engenharia Informática com formação em Gestão de Marketing e interesse em desenvolvimento web, full-stack e soluções digitais aplicadas a problemas reais.

* GitHub: [MafaldaBrandao](https://github.com/MafaldaBrandao)
* LinkedIn: [Mafalda Brandão](https://www.linkedin.com/in/mafaldabrandao3)
