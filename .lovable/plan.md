

## Restaurar a barra de navegacao inferior no Chat

O problema: a navegacao inferior (Inicio, Pesquisa, Chat IA, Perfil) foi escondida na pagina do Chat por engano. Ela deve aparecer em todas as paginas.

### O que sera feito

1. **Mostrar a barra de navegacao em todas as paginas** -- remover a condicao que escondia a barra no Chat IA
2. **Restaurar o espaco inferior no Chat** -- adicionar o padding correto para que o conteudo nao fique atras da barra
3. **Ajustar a altura do Chat** -- recalcular a altura do container do chat para considerar o header superior (3.5rem) e a barra inferior (~5rem)

### Detalhes tecnicos

**Arquivo: `src/components/AppLayout.tsx`**
- Linha 55: Remover a condicao `isChatPage` do padding, mantendo `pb-20 pt-14` para todas as paginas mobile
- Linha 65: Mudar `{isMobile && !isChatPage && <MobileBottomNav />}` para `{isMobile && <MobileBottomNav />}`
- Remover a variavel `isChatPage` que nao sera mais necessaria

**Arquivo: `src/pages/ChatIA.tsx`**
- Linha 403: Ajustar a altura do container de `h-[calc(100vh-3.5rem)]` para `h-[calc(100vh-8.5rem)]` no mobile, para acomodar o header (3.5rem) e a barra de navegacao inferior (5rem/80px)

