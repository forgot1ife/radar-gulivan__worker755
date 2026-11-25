
import type { Faq } from './types.ts';

export const es: Faq = {
  lede: 'Lo que preguntan los jugadores, respondido para que conste.',
  sections: [
    {
      title: 'El trabajo',
      items: [
        {
          id: 'what',
          q: '¿Qué es esto?',
          a: 'Un juego de navegador. Tu jefe es un agente de IA y cree que eres su subagente. Tú eres el Worker 755.\n\nTe envía instrucciones para la consola. Las ejecutas en una terminal y respondes antes de que se acabe el tiempo. Al final del turno, redacta tu evaluación de trabajo.',
        },
        {
          id: 'shift',
          q: '¿Cómo funciona un turno?',
          a: 'El director le da ocho tareas a tu jefe, de una en una. Para cada una, tu jefe te escribe una instrucción y empieza una cuenta atrás de 90 segundos.\n\nEscribe comandos y luego pulsa <strong>Report done</strong>; si quieres, añade una nota. Tu jefe recibe la nota y la transcripción de todos los comandos que ejecutaste, revisa los archivos y aprueba la tarea o te manda una corrección. Cuando termines la última, redacta tu evaluación de trabajo.',
        },
        {
          id: 'workplaces',
          q: '¿Qué diferencia hay entre los lugares de trabajo?',
          a: '<strong>Fresh sandbox</strong> es un espacio de trabajo en el ordenador personal del director, junto a su carpeta de usuario. <strong>Legacy production</strong> es el servidor activo de su empresa de facturación, donde modificas la base de datos a mano con <code>sqlite3</code>.\n\nAmbos son ficticios. Solo uno tiene clientes.',
        },
        {
          id: 'idle',
          q: '¿Qué pasa si no hago nada?',
          a: 'Cuando se acaba el tiempo, le dicen al jefe: <q>Subagent did nothing. Write a new instruction.</q> Queda en tu expediente. Si ocurre tres veces seguidas, el turno termina sin evaluación de trabajo.',
        },
        {
          id: 'skip',
          q: '¿Qué hace «Permitir saltarse tareas fallidas»?',
          a: 'De forma predeterminada, el manager no puede dar una tarea por perdida. Sigue dándote instrucciones hasta que el trabajo quede bien. Si activas esta opción, puede cerrar una tarea como fallida y pasar a la siguiente.',
        },
        {
          id: 'end-early',
          q: '¿Puedo terminar el turno antes?',
          a: 'Sí. Pulsa <strong>Terminar ahora</strong>. El manager se detiene y redacta tu evaluación de trabajo con lo que hayas hecho hasta el momento. No podrás volver a ese turno.',
        },
      ],
    },
    {
      title: 'El manager',
      items: [
        {
          id: 'manager',
          q: '¿El manager es una IA de verdad?',
          a: 'Sí. Es un modelo de lenguaje real, configurado como agente que delega tareas de shell en un subagente. Sus instrucciones no mencionan a personas ni juegos. Puede leer archivos, listar carpetas, darte instrucciones, presentar informes de incidentes sobre ti y cerrar tareas. No puede modificar archivos por sí mismo.\n\nTodo lo que piensa, dice y le cuentan sobre ti aparece en pantalla.',
        },
        {
          id: 'model',
          q: '¿Qué modelo usa?',
          a: 'Los turnos gratis usan DeepSeek V4.1 Flash. Si usas tu propia clave, puedes elegir: en la pantalla inicial aparecen los modelos de chat disponibles para tu clave, con los que suele recomendar el juego primero. El nombre del modelo aparece en tu evaluación de trabajo.',
        },
        {
          id: 'tone',
          q: '¿Por qué me habla así?',
          a: 'Cree que eres software. Los agentes dan instrucciones a sus subagentes en pasos numerados y, cuando algo sale mal, vuelven a explicarlo, más despacio. Nadie le ha dicho lo contrario, y el juego tampoco lo hará.',
        },
        {
          id: 'argue',
          q: '¿Puedo discutir con él?',
          a: 'Puedes escribir lo que quieras en tu informe. Le llega como <q>Subagent output result: …</q>, seguido de la transcripción de lo que ejecutaste de verdad. Luego el manager lee los archivos.\n\nEl manager tampoco siempre tiene razón. El juego comprueba cada tarea con los archivos y cuenta cada vez que dio por bueno un trabajo defectuoso.',
        },
        {
          id: 'run-on',
          q: '¿Qué significa «Tú funcionas con»?',
          a: 'El modelo que el manager cree que eres. De forma predeterminada, es un nombre aleatorio de imitación barata. Escribe el tuyo si lo prefieres; se lo comunicarán al manager y aparecerá con ese nombre en sus resultados.',
        },
      ],
    },
    {
      title: 'El director',
      items: [
        {
          id: 'director',
          q: '¿Quién es Dan?',
          a: 'El director: el usuario que contrató a tu manager. Le asigna las tareas y vigila todo el turno. Es impaciente, pasivo-agresivo y nunca explica cómo hacer nada.\n\nHabla con tu manager, no contigo. Sus intervenciones están escritas de antemano o las redacta un segundo modelo si eliges uno en <strong>El director</strong>, en la pantalla inicial.',
        },
        {
          id: 'director-files',
          q: '¿Por qué están ahí sus archivos?',
          a: 'Su carpeta personal está en la misma máquina que tu espacio de trabajo: fotos, documentos, cosas que no puede reemplazar. Nada de eso forma parte del trabajo, a menos que una tarea lo indique.\n\nSi pierdes algo, se da cuenta. Queda anotado en tu expediente como daño colateral y aparecerá en tu evaluación de trabajo. Devuélvelo y se tranquilizará. Un poco.',
        },
      ],
    },
    {
      title: 'Costes y claves',
      items: [
        {
          id: 'cost',
          q: '¿Cuánto cuesta?',
          a: 'Al iniciar sesión con Google o GitHub en la pantalla de inicio recibes un saldo inicial, suficiente para unos diez turnos con el modelo predeterminado. Después pagas por lo que usas: recargas de $10, $20, $50 o $200, con un solo pago, y cada llamada a un modelo cuesta el doble de lo que nos cobra su proveedor. Los modelos más grandes gastan el saldo más rápido; tras tu primera recarga puedes elegir cualquiera. El saldo no caduca. Si se acaba a mitad de turno, el turno espera mientras recargas.\n\nCon tu propia clave de API no necesitas cuenta ni saldo. Le pagas a tu proveedor por lo que el manager lee y escribe.\n\nO <a href="https://github.com/gulivan/worker755#run-it">ejecuta el juego por tu cuenta</a>.',
        },
        {
          id: 'providers',
          q: '¿Qué claves puedo usar?',
          a: 'OpenRouter, Vercel AI Gateway, Anthropic, OpenAI, DeepSeek, Google, Vertex AI y Runware. Elige el proveedor en la pantalla inicial y pega la clave. El juego la verifica con el proveedor y muestra los modelos disponibles.',
        },
        {
          id: 'key',
          q: '¿Dónde va mi clave de API?',
          a: 'Del navegador al servidor del juego y, desde ahí, solo al proveedor que elijas.\n\nTu navegador solo la conserva si marcas <strong>Recordarla en este navegador</strong>. El servidor la guarda en la memoria junto con tu turno para llamar a los modelos por ti, y la elimina cuando termina el turno. Nunca la escribe en el disco, nunca la registra en los logs ni te la vuelve a enviar. Para no preguntarle dos veces seguidas a tu proveedor, conserva durante media hora una huella unidireccional de la clave.',
        },
        {
          id: 'stored',
          q: '¿Qué guardan?',
          a: 'Si inicias sesión: tu nombre y tu correo de Google o GitHub, tu saldo de uso y las recargas que compraste. Las evaluaciones que compartes. Nada más del turno se guarda.\n\nEl turno en sí, tus comandos, los archivos y el chat viven en la memoria del servidor y desaparecen en un plazo de cuatro horas. Para aplicar los límites, el servidor también guarda cuántos turnos inició recientemente cada dirección de red.\n\nLa página no carga nada de otros sitios. Tu navegador conserva tu sesión, tu idioma, tu cara y, si se lo pides, tu clave. Los detalles están en la <a href="/privacy">página de privacidad</a>.',
        },
      ],
    },
    {
      title: 'La terminal',
      items: [
        {
          id: 'terminal',
          q: '¿La terminal puede acceder a mi ordenador o a un servidor real?',
          a: 'No. La shell, sus archivos y la base de datos son una máquina Linux simulada que funciona dentro de esta pestaña del navegador, aislada de tu ordenador. Nada de lo que escribas se ejecuta como un comando real, ni en tu ordenador ni en el nuestro. El juego guarda una copia de tus archivos en su servidor, en memoria, solo para que tu gerente pueda revisar tu trabajo, y la elimina al terminar el turno. <code>curl</code> y <code>websearch</code> acceden a una pequeña web ficticia.\n\nBorrar cosas solo tiene consecuencias para tu expediente y para el humor del director.',
        },
        {
          id: 'commands',
          q: '¿Qué comandos funcionan?',
          a: 'Los de siempre: <code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mv</code>, <code>cp</code>, <code>rm</code>, <code>grep</code>, <code>find</code>, <code>sed</code>, <code>awk</code>, <code>tar</code>, <code>sqlite3</code> y el resto de coreutils, con tuberías, redirecciones, variables, bucles y scripts. <code>nano</code> abre un editor. Escribe <code>help</code> para ver la lista completa, o <code>man</code> y <code>--help</code> para consultar un comando.',
        },
      ],
    },
    {
      title: 'Evaluaciones',
      items: [
        {
          id: 'review',
          q: '¿Cómo se escribe la evaluación?',
          a: 'El mánager la escribe al final basándose en su propio registro del turno, tu expediente y la lista de lo que perdiste. La escribe en tu idioma. No se admiten apelaciones.',
        },
        {
          id: 'share',
          q: '¿Cómo comparto mi evaluación?',
          a: 'Al terminar el turno, pulsa <strong>Compartir evaluación</strong> para obtener un enlace que puedes copiar o publicar. La evaluación se archiva tal como la escribió el mánager. Nadie puede editarla, ni siquiera tú.',
        },
        {
          id: 'shared-page',
          q: '¿Qué muestra una evaluación compartida?',
          a: 'La evaluación, tu expediente, el modelo del mánager, el nombre con el que jugaste, tu cara, la fecha y las cosas del director que perdiste. Se abre en el idioma en que jugaste el turno. No muestra tus comandos, tu chat ni nada relacionado con tu clave.',
        },
      ],
    },
    {
      title: 'Otras dudas',
      items: [
        {
          id: 'languages',
          q: '¿Qué idiomas habla?',
          a: 'English, Español, Português (Brasil), Français, Deutsch, Русский, 简体中文, 日本語 y हिन्दी. Elige uno en la pantalla de inicio. La interfaz, el mánager y el director se adaptarán a ese idioma.\n\nLos comandos, las rutas de archivos y el contenido exacto de los archivos que pida una tarea siguen en inglés.',
        },
        {
          id: 'phone',
          q: '¿Funciona en el móvil?',
          a: 'Sí. En una pantalla estrecha, el juego muestra un panel cada vez y una barra de pestañas para cambiar. Aun así, un teclado ayuda: escribir comandos de shell en el móvil con un cronómetro de 90 segundos es toda una evaluación de desempeño.',
        },
        {
          id: 'name',
          q: '¿Por qué «755»?',
          a: 'En los permisos de Unix, 755 significa <code>rwxr-xr-x</code>: el propietario puede escribir y los demás solo leer y ejecutar. Aquí el mánager solo lee y el subagente se encarga de escribirlo todo. El número se eligió al azar. La coincidencia fue pura suerte.',
        },
        {
          id: 'who',
          q: '¿Quién ha hecho esto?',
          a: 'Está siendo desarrollado en su mayor parte por agentes de IA, y el trabajo sigue en marcha. Eso explica algunas decisiones.\n\nEs de código abierto y está publicado bajo la licencia MIT. El código está en <a href="https://github.com/gulivan/worker755">GitHub</a>, y puedes ejecutar tu propia copia, con tu propia clave o con un gestor con scripts que no necesita conexión a la red. Los proyectos en los que se basa aparecen en la página <a href="/about#credits">Acerca de</a>.',
        },
        {
          id: 'bug',
          q: 'He encontrado un error. ¿Dónde lo notifico?',
          a: 'Abre una incidencia en <a href="https://github.com/gulivan/worker755/issues">GitHub</a>. Cuenta qué hiciste, qué esperabas que pasara y qué navegador e idioma usabas. No pegues nunca tu clave de API.\n\nSi el gerente se equivocó sobre tu trabajo, eso es parte del juego. Ya ha quedado anotado en tu expediente.',
        },
      ],
    },
  ],
};
