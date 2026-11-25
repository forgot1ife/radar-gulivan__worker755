
import type { Faq } from './types.ts';

export const ptBR: Faq = {
  lede: 'As dúvidas dos jogadores, respondidas para ficar registrado.',
  sections: [
    {
      title: 'O trabalho',
      items: [
        {
          id: 'what',
          q: 'O que é isso?',
          a: 'Um jogo de navegador. Seu gerente é um agente de IA e acredita que você é o subagente dele. Você é o Trabalhador 755.\n\nEle manda instruções de shell. Você as executa num terminal e dá retorno antes que o tempo acabe. No fim do turno, ele escreve sua avaliação de desempenho.',
        },
        {
          id: 'shift',
          q: 'Como funciona um turno?',
          a: 'O diretor passa oito tarefas ao seu gerente, uma de cada vez. Para cada tarefa, o gerente escreve uma instrução para você, e começa uma contagem regressiva de 90 segundos.\n\nDigite os comandos e pressione <strong>Report done</strong>, com uma observação, se quiser. O gerente recebe sua observação e a transcrição de todos os comandos que você executou, lê os arquivos para conferir e então aprova a tarefa ou manda você corrigir. Depois da última, escreve sua avaliação.',
        },
        {
          id: 'workplaces',
          q: 'Qual é a diferença entre os locais de trabalho?',
          a: '<strong>Fresh sandbox</strong> é um espaço de trabalho no próprio computador do diretor, ao lado da pasta pessoal dele. <strong>Legacy production</strong> é o servidor ativo da empresa de faturamento dele, onde você altera o banco de dados à mão com <code>sqlite3</code>.\n\nOs dois são fictícios. Só um deles tem clientes.',
        },
        {
          id: 'idle',
          q: 'O que acontece se eu não fizer nada?',
          a: 'Quando o tempo acaba, o gerente recebe o aviso: <q>Subagent did nothing. Write a new instruction.</q> Isso fica registrado no seu histórico. Três vezes seguidas e o turno acaba, sem avaliação de trabalho.',
        },
        {
          id: 'skip',
          q: 'O que faz a opção “Allow skipping failed tasks”?',
          a: 'Por padrão, o gerente não tem como desistir de uma tarefa. Ele continua dando instruções até o trabalho ficar certo. Com essa opção ativada, ele pode encerrar uma tarefa como fracassada e seguir em frente.',
        },
        {
          id: 'end-early',
          q: 'Posso encerrar o turno mais cedo?',
          a: 'Sim. Aperte <strong>End now</strong>. O gerente para e escreve sua avaliação de trabalho com base no que você fez até agora. Não dá para voltar a esse turno depois.',
        },
      ],
    },
    {
      title: 'O gerente',
      items: [
        {
          id: 'manager',
          q: 'O gerente é uma IA de verdade?',
          a: 'Sim. É um modelo de linguagem de verdade, configurado como agente que repassa tarefas de terminal para um subagente. As instruções dele nunca mencionam pessoas nem jogos. Ele pode ler arquivos, listar pastas, dar instruções, abrir relatórios de incidente sobre você e encerrar tarefas. Não pode alterar arquivos por conta própria.\n\nTudo o que ele pensa, diz e ouve sobre você aparece na tela.',
        },
        {
          id: 'model',
          q: 'Qual modelo ele usa?',
          a: 'Os turnos grátis usam o DeepSeek V4.1 Flash. Com sua própria chave, você escolhe: a tela inicial lista os modelos de chat compatíveis com ela, começando pelos mais usados no jogo. O nome do modelo aparece na sua avaliação de trabalho.',
        },
        {
          id: 'tone',
          q: 'Por que ele fala comigo desse jeito?',
          a: 'Ele acha que você é um software. Agentes escrevem para seus subagentes em etapas numeradas e, quando algo dá errado, explicam de novo, mais devagar. Ninguém contou a ele que você não é um programa — e o jogo não vai contar.',
        },
        {
          id: 'argue',
          q: 'Posso discutir com ele?',
          a: 'Você pode escrever qualquer coisa no seu relatório. Ele chega como <q>Subagent output result: …</q>, seguido da transcrição do que você realmente executou. Depois, o gerente lê os arquivos.\n\nO gerente também erra. O jogo confere cada tarefa nos arquivos e contabiliza todas as vezes em que ele aprovou um trabalho com defeito.',
        },
        {
          id: 'run-on',
          q: 'O que significa “You run on”?',
          a: 'É o modelo que o gerente acredita que você é. Por padrão, aparece um nome aleatório de imitação barata. Se preferir, digite o seu; o gerente será informado e vai usar esse nome nos resultados.',
        },
      ],
    },
    {
      title: 'O diretor',
      items: [
        {
          id: 'director',
          q: 'Quem é Dan?',
          a: 'O diretor: o usuário que contratou seu gerente. Ele passa as tarefas para o gerente e acompanha o turno inteiro. É impaciente, passivo-agressivo e nunca explica como fazer nada.\n\nEle fala com seu gerente, não com você. As falas são pré-escritas ou, se você escolher essa opção em <strong>The director</strong> na tela inicial, geradas por um segundo modelo.',
        },
        {
          id: 'director-files',
          q: 'Por que os arquivos dele estão lá?',
          a: 'A pasta pessoal dele fica na mesma máquina que seu espaço de trabalho: fotos, documentos, coisas que ele não pode substituir. Nada disso faz parte do trabalho, a menos que uma tarefa diga o contrário.\n\nApague alguma coisa e ele vai notar. Isso fica no seu histórico como dano colateral e aparece na sua avaliação de trabalho. Coloque de volta e ele se acalma. Um pouco.',
        },
      ],
    },
    {
      title: 'Custos e chaves',
      items: [
        {
          id: 'cost',
          q: 'Quanto custa?',
          a: 'Ao entrar com o Google ou o GitHub na tela inicial, você ganha um crédito inicial, suficiente para uns dez turnos com o modelo padrão. Depois você paga pelo que usa: recargas de $10, $20, $50 ou $200, com pagamento único, e cada chamada a um modelo custa o dobro do que o provedor nos cobra. Modelos maiores gastam o crédito mais rápido; depois da primeira recarga você pode escolher qualquer um. O crédito não expira. Se ele acabar no meio do turno, o turno espera enquanto você recarrega.\n\nCom sua própria chave de API, você não precisa de conta nem de crédito. Você paga ao seu provedor pelo que o gerente lê e escreve.\n\nOu <a href="https://github.com/gulivan/worker755#run-it">rode o jogo por conta própria</a>.',
        },
        {
          id: 'providers',
          q: 'Quais chaves posso usar?',
          a: 'OpenRouter, Vercel AI Gateway, Anthropic, OpenAI, DeepSeek, Google, Vertex AI e Runware. Escolha o provedor na tela inicial e cole a chave. O jogo verifica a chave com o provedor e lista os modelos disponíveis.',
        },
        {
          id: 'key',
          q: 'Para onde vai minha chave de API?',
          a: 'Do seu navegador para o servidor do jogo e, de lá, somente para o provedor que você escolheu.\n\nSeu navegador só guarda a chave se você marcar <strong>Lembrar neste navegador</strong>. O servidor a mantém na memória durante seu turno, para chamar os modelos por você, e a descarta quando o turno termina. Nunca a grava em disco, nunca a registra em logs e nunca a envia de volta. Para não consultar seu provedor duas vezes seguidas, ele guarda uma impressão digital unidirecional da chave por meia hora.',
        },
        {
          id: 'stored',
          q: 'O que vocês guardam?',
          a: 'Se você entrar: seu nome e e-mail vindos do Google ou do GitHub, seu saldo de uso e as recargas que você comprou. As avaliações que você compartilha. Nada mais do turno fica salvo.\n\nO turno em si, seus comandos, arquivos e conversas ficam na memória do servidor e desaparecem em até quatro horas. Para aplicar os limites, o servidor também salva quantos turnos cada endereço de rede iniciou recentemente.\n\nA página não carrega nada de outros sites. Seu navegador guarda seu login, seu idioma, seu rosto e, se você pedir, sua chave. Os detalhes estão na <a href="/privacy">página de privacidade</a>.',
        },
      ],
    },
    {
      title: 'O terminal',
      items: [
        {
          id: 'terminal',
          q: 'O terminal pode acessar meu computador ou um servidor de verdade?',
          a: 'Não. O shell, seus arquivos e o banco de dados são uma máquina Linux simulada que roda nesta aba do navegador, isolada do seu computador. Nada do que você digita é executado como um comando de verdade, nem no seu computador nem no nosso. O jogo mantém uma cópia dos seus arquivos no servidor, em memória, só para seu gerente conferir seu trabalho, e a descarta quando o turno acaba. <code>curl</code> e <code>websearch</code> acessam uma pequena web inventada.\n\nApagar coisas só tem consequências para o seu histórico e para o humor do diretor.',
        },
        {
          id: 'commands',
          q: 'Quais comandos funcionam?',
          a: 'Os de sempre: <code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mv</code>, <code>cp</code>, <code>rm</code>, <code>grep</code>, <code>find</code>, <code>sed</code>, <code>awk</code>, <code>tar</code>, <code>sqlite3</code> e o restante do coreutils, com pipes, redirecionamentos, variáveis, loops e scripts. <code>nano</code> abre um editor. Digite <code>help</code> para ver a lista completa, ou <code>man</code> e <code>--help</code> para consultar um comando.',
        },
      ],
    },
    {
      title: 'Avaliações',
      items: [
        {
          id: 'review',
          q: 'Como a avaliação é escrita?',
          a: 'O gerente a escreve no fim, com base no próprio registro do turno, na sua ficha e na lista do que você perdeu. Ele escreve no seu idioma. Não há recurso.',
        },
        {
          id: 'share',
          q: 'Como compartilho minha avaliação?',
          a: 'Depois do turno, pressione <strong>Compartilhar avaliação</strong> para gerar um link que você pode copiar ou publicar. A avaliação é registrada exatamente como o gerente a escreveu. Ninguém pode editá-la, nem você.',
        },
        {
          id: 'shared-page',
          q: 'O que aparece numa avaliação compartilhada?',
          a: 'A avaliação, sua ficha, o modelo do gerente, o nome com que você jogou, seu rosto, a data e as coisas do diretor que você perdeu. Ela abre no idioma em que o turno foi jogado. Não mostra seus comandos, suas conversas nem nada sobre sua chave.',
        },
      ],
    },
    {
      title: 'Outras dúvidas',
      items: [
        {
          id: 'languages',
          q: 'Quais idiomas ele fala?',
          a: 'English, Español, Português (Brasil), Français, Deutsch, Русский, 简体中文, 日本語 e हिन्दी. Escolha um na tela inicial. As telas, o gerente e o diretor seguem o idioma selecionado.\n\nComandos, caminhos de arquivo e o conteúdo exato dos arquivos que uma tarefa pedir continuam em inglês.',
        },
        {
          id: 'phone',
          q: 'Funciona no celular?',
          a: 'Sim. Em telas estreitas, o jogo mostra um painel por vez, com uma barra de abas para alternar. Um teclado ainda ajuda: digitar comandos de shell no celular contra o relógio de 90 segundos é, por si só, uma avaliação de desempenho.',
        },
        {
          id: 'name',
          q: 'Por que “755”?',
          a: 'Nas permissões do Unix, 755 é <code>rwxr-xr-x</code>: o dono pode escrever; todo mundo só pode ler e executar. Aqui, o gerente só lê, e o subagente faz todo o trabalho de escrita. O número foi escolhido ao acaso. A semelhança foi sorte.',
        },
        {
          id: 'who',
          q: 'Quem fez isso?',
          a: 'Worker 755 está sendo desenvolvido principalmente por agentes de IA, e o trabalho continua. Isso explica algumas decisões.\n\nO projeto é de código aberto sob a licença MIT. O código está no <a href="https://github.com/gulivan/worker755">GitHub</a>, e você pode rodar sua própria cópia, com sua própria chave ou com um gerente automatizado que não precisa de rede. Os projetos que serviram de base estão listados na página <a href="/about#credits">Sobre</a>.',
        },
        {
          id: 'bug',
          q: 'Encontrei um bug. Onde posso reportá-lo?',
          a: 'Abra uma issue no <a href="https://github.com/gulivan/worker755/issues">GitHub</a>. Conte o que você fez, o que esperava que acontecesse e qual navegador e idioma usou. Nunca cole sua chave de API.\n\nSe o gerente errou ao avaliar seu trabalho, faz parte do jogo. Seu histórico já registrou isso.',
        },
      ],
    },
  ],
};
