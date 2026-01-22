# Configuração do Arquivo .env

## Backend (Pasta backend/)

**O frontend agora usa o backend para processar textos.** Você só precisa configurar o arquivo `.env` no backend.

Crie um arquivo `.env` na pasta `backend/` com o seguinte conteúdo:

```
PORT=3001
GEMINI_API_KEY=sua_chave_api_do_gemini_aqui
```

## Frontend (Opcional - Apenas se quiser mudar a URL do backend)

Se o backend estiver rodando em uma URL diferente de `http://localhost:3001`, você pode criar um arquivo `.env` na raiz do projeto:

```
VITE_BACKEND_URL=http://localhost:3001
```

## Como obter a chave da API do Gemini

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Crie uma nova chave de API
4. Copie a chave e cole no arquivo `.env` do backend

## Como iniciar o projeto

1. **Backend**: 
   ```bash
   cd backend
   npm install  # se ainda não instalou
   npm start    # ou npm run dev para modo desenvolvimento
   ```

2. **Frontend** (em outro terminal):
   ```bash
   npm install  # se ainda não instalou
   npm run dev
   ```

## Importante

- Substitua `sua_chave_api_do_gemini_aqui` pela sua chave real
- Não compartilhe suas chaves de API publicamente
- Os arquivos `.env` já estão no `.gitignore` e não serão commitados
- A chave de API agora fica segura no backend, não exposta no frontend