import './App.css'
import { LinkedinLogo, GithubLogo } from '@phosphor-icons/react'
import { Card } from './Components/Card/Card'

function App() {
  return (
    <div className="layout">
      {/* BACKGROUND GLOWS */}
      <div className="glow-circle top-left"></div>
      <div className="glow-circle bottom-right"></div>

      <aside className="sidebar">
        <div className="project-card-me">
          <div className="profile-section">
            <div className="pfp-container">
              <img className="pfp" src="/img/me.jpeg" alt="Foto de Marcus" />
            </div>
            <h1 className="name">Marcus Gomes</h1>
            <h2 className="role">Desenvolvedor Full Stack</h2>
            <p className="bio">
              27 Anos, Rio de Janeiro - Brasil.</p>
              <p>
              Cursando Engenharia de Software e Formado em Análise e Desenvolvimento de Sistemas.
            </p>
            <br/>

            <ul className="list-skills">
              <li>Python</li>
              <li>React</li>
              <li>HTML/CSS</li>
              <li>TypeScript</li>
              <li>Web Scraping</li>
              <li>API REST</li>
              <li>SQL</li>
            </ul>

            <ul className="list-socials">
              <li>
                <a
                  href="https://github.com/marcvsg"
                  target="_blank"
                  rel="noreferrer"
                >
                  <GithubLogo weight="fill" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/marcusvsgomes/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <LinkedinLogo weight="fill" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <main className="content-area">
        <section className="projects-section">
          <h1 className="section-title">Meus Projetos Recentes</h1>
        </section>
      <div className='projects-grid'>
        <Card project={{
          name: 'Roboto 9000 - Em andamento',
          description: 'Assistente Virtual de desktop com chat inteligente, construído do zero em Python. O "ROBOTO 9000" vive numa telinha verde estilo Game Boy, sente fome ao longo do tempo, muda de humor e conversa com o usuário como um amigo programador. Alimentado pela API do Claude (Anthropic).',
          imageUrl: '/img/project-placeholder.png',
          projectUrl: 'https://www.linkedin.com/posts/marcusvsgomes_react-typescript-firebase-ugcPost-7453284558722129920-eXuF?utm_source=share&utm_medium=member_desktop&rcm=ACoAADEpipoB0d42jHWwQMtnL0tt2ev4DREio4Q',
          tags: 'Python, JSON, Desktop App',
          status: 'em-andamento',
          projectIcon: 'linkedin'
        }} />
        <Card project={{
          name: 'Ranking - Sistema de Ranqueamento de Jogos',
          description: 'Aplicação web fullstack para gerenciamento de rankings e pontuações de participantes em múltiplos eventos/categorias, com atualização em tempo real e interface intuitiva. Desenvolvida com React no Frontend e FireBase no Backend, utilizando uma base de dados NoSQL para armazenar as informações dos participantes, eventos e pontuações.',
          imageUrl: '/img/project-placeholder.png',
          projectUrl: 'https://www.linkedin.com/posts/marcusvsgomes_react-typescript-firebase-activity-7453284659100102656-ylkc?utm_source=share&utm_medium=member_desktop&rcm=ACoAADEpipoB0d42jHWwQMtnL0tt2ev4DREio4Q',
          tags: 'Typescript, React, Firebase, NoSQL',
          status: 'em-andamento',
          projectIcon: 'linkedin'
        }} />
        <Card project={{
          name: 'BOTS de automação de processos',
          description: 'Projeto feito com Python para automatizar tarefas repetitivas, como verificação de dados, buscas em APIs, e muito mais. Ideal para aumentar a eficiência e reduzir erros humanos.',
          imageUrl: '/img/project-placeholder.png',
          projectUrl: 'https://github.com/marcvsg/Console',
          tags: 'Python, API/REST, Discord BOT',
          status: 'concluido',
          projectIcon: 'github'
        }} />
        <Card project={{
          name: 'Aplicação Web de Ranqueamento de Jogos',
          description: 'Aplicação web fullstack para gerenciamento de rankings e pontuações de participantes em múltiplos eventos/categorias, com atualização em tempo real e interface intuitiva. Desenvolvida com React no Frontend e FireBase no Backend, utilizando uma base de dados SQL para armazenar as informações dos participantes, eventos e pontuações.',
          imageUrl: '/img/project-placeholder.png',
          projectUrl: '#',
          tags: 'React, Typescript, Firebase, SQL',
          status: 'concluido'
        }} />
        <Card project={{
          name: 'DiffText - Comparação de Textos',
          description: 'Aplicação Web desenvolvida com React + Typescript / Backend em JavaScript. Essa aplicação foi feita para comparar dois textos e destacar as diferenças. Perfeito para comparar documentos .txt, .json, códigos-fonte, ou qualquer tipo de conteúdo textual, facilitando a identificação de mudanças e variações. E ainda possui API do Gemini para gerar correções automáticas, resumos e muito mais.',
          imageUrl: '/img/project-placeholder.png',
          projectUrl: 'https://difftxt.vercel.app/',
          tags: 'Typescript, React, API/REST',
          status: 'concluido'
        }} />
        <Card project={{
          name: 'Web Scraping de Noticias',
          description: 'BOT de Discord feito com Python para coletar notícias de um determinado Jogo e postar em um canal específico. O BOT utiliza técnicas de web scraping para extrair informações relevantes, como títulos, resumos e links das notícias, mantendo a comunidade atualizada sobre as últimas novidades do jogo.',
          imageUrl: '/img/project-placeholder.png',
          projectUrl: 'https://github.com/marcvsg/Console',
          tags: 'Python, Web Scraping, Discord BOT',
          status: 'concluido',
          projectIcon: 'github'
        }} />
        
        </div>
      </main>
    </div>
  )
}

export default App