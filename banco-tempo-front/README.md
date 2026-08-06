# Banco de Tempo Universitário - Frontend

Este diretório contém a aplicação web frontend do **Banco de Tempo Universitário**, desenvolvida em React utilizando Vite e Tailwind CSS v4.

## Tech Stack
* **React 19**
* **Vite** (Build Tool & HMR)
* **Tailwind CSS v4** (Estilização)
* **Axios** (Comunicação HTTP com a API RESTful)
* **React Router DOM** (Navegação SPA)
* **Lucide React** (Ícones)
* **Nginx** (Servidor de arquivos estáticos em produção/Docker)

---

## Execução com Docker (Running with Docker)

### 1. Via Docker Compose (Recomendado na raiz do projeto)
Para iniciar a aplicação frontend junto com o backend e o banco de dados PostgreSQL, execute na raiz do repositório:

```bash
docker-compose up -d --build
```

O frontend estará disponível em: **`http://localhost:5173`**.

### 2. Execução isolada via Dockerfile
Se desejar construir e rodar apenas a imagem Docker do frontend isoladamente:

```bash
# Construir a imagem Docker
docker build -t banco-tempo-frontend .

# Rodar o container na porta 5173
docker run -d -p 5173:80 --name frontend-app banco-tempo-frontend
```

---

## Execução em Desenvolvimento Local (Sem Docker)

### Pré-requisitos
* Node.js v18+ instalado.
* NPM instalado.

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento Vite:**
   ```bash
   npm run dev
   ```

3. Acessar `http://localhost:5173` no seu navegador.

### Gerar Build de Produção
Para compilar os arquivos estáticos otimizados para produção:
```bash
npm run build
```
Os arquivos gerados ficarão na pasta `./dist`.
