# Event System ISPGAYA

Projeto web com frontend em React/Vite e backend em Django para gestão e publicação do InfoCultura.

## Estrutura

- `src/` - frontend React
- `backend/` - backend Django
- `backend/alembic/` - migrations do schema usado neste projeto

## Requisitos

- Node.js 18+ ou superior
- Python 3.11+ ou superior
- MySQL acessível localmente ou em rede

## 1. Configurar o backend

1. Entra na pasta do backend:

```bash
cd backend
```

2. Cria e ativa o ambiente virtual:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Instala as dependências:

```bash
pip install -r requirements.txt
```

4. Cria o ficheiro `.env` a partir do exemplo:

```bash
cp .env.example .env
```

5. Preenche o `backend/.env` com os valores certos para a tua máquina.

Campos importantes:

```env
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=127.0.0.1
DB_PORT=3306


INFOCULTURA_JWT_SECRET=
INFOCULTURA_JWT_EXPIRES_HOURS=12
INFOCULTURA_ADMIN_USER=admin
INFOCULTURA_ADMIN_EMAIL=admin@ispgaya.pt
INFOCULTURA_ADMIN_PASS=cultura2026

INFOCULTURA_JWT_SECRET=...
INFOCULTURA_JWT_EXPIRES_HOURS=12
INFOCULTURA_ADMIN_USER=admin
INFOCULTURA_ADMIN_EMAIL=admin@ispgaya.pt
INFOCULTURA_ADMIN_PASS=...

INFOCULTURA_JWT_SECRET=your_jwt_secret_here
INFOCULTURA_ADMIN_USER=admin
INFOCULTURA_ADMIN_EMAIL=admin@example.com
INFOCULTURA_ADMIN_PASS=your_admin_password_here

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=
EMAIL_PORT=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=""
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=

EVENTBRITE_PRIVATE_TOKEN=
EVENTBRITE_ORGANIZATION_ID=
EVENTBRITE_API_KEY=
EVENTBRITE_CLIENT_SECRET=
EVENTBRITE_PUBLIC_TOKEN=
EVENTBRITE_DEFAULT_CURRENCY=EUR
EVENTBRITE_DEFAULT_TIMEZONE=Europe/Lisbon
EVENTBRITE_DEFAULT_COUNTRY=PT
EVENTBRITE_DEFAULT_VENUE_ID=
EVENTBRITE_TICKET_NAME=Entrada geral
```

6. Aplica as migrations:

```bash
python manage.py migrate
```

7. Cria o utilizador admin e os dados base do InfoCultura:

```bash
python manage.py bootstrap_infocultura
```

8. Arranca o backend:

```bash
python manage.py runserver 8001
```

## 2. Configurar o frontend

1. Volta à raiz do projeto:

```bash
cd ..
```

2. Instala as dependências do frontend:

```bash
npm install
```

3. Cria um ficheiro `.env` na raiz do projeto com:

```env
VITE_INFOCULTURA_API=http://127.0.0.1:8001/api
VITE_GOOGLE_MAPS_API_KEY=
```

4. Se quiseres autocomplete de locais/moradas no formulário de eventos, coloca aqui a chave do Google Maps.

5. Arranca o frontend:

```bash
npm run dev
```

## 3. Aceder ao projeto

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8001`

## 4. Verificação rápida

Se algo falhar, confirma primeiro:

- o backend está a correr antes do frontend
- o ficheiro `backend/.env` existe e tem a base de dados correta
- o ficheiro `.env` da raiz tem `VITE_INFOCULTURA_API`
- a porta `8001` não está ocupada

## 5. Build

Para gerar a build do frontend:

```bash
npm run build
```

## 6. Nota

O ficheiro `backend/.env.example` já existe para servir de base. Não guardes chaves reais em ficheiros de exemplo.
