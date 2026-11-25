// The FAQ in English: the source for every other file in this folder. Keep the ids, {placeholders}
// and the <code>, <strong>, <q>, <a href="…"> tags as they are; translate the rest.

import type { Faq } from './types.ts';

export const en: Faq = {
  lede: 'What players ask, answered for the record.',
  sections: [
    {
      title: 'The job',
      items: [
        {
          id: 'what',
          q: 'What is this?',
          a:
            'A browser game. Your manager is an AI agent, and it believes you are its subagent. You are Worker 755.\n\n' +
            'It sends you shell instructions. You carry them out in a terminal and report back before the clock runs out. At the end of the shift it writes your performance review.',
        },
        {
          id: 'shift',
          q: 'How does a shift work?',
          a:
            'The director hands your manager eight assignments, one at a time. For each one the manager writes you an instruction, and a 90-second clock starts.\n\n' +
            'Type commands, then press <strong>Report done</strong>, with a note if you like. The manager gets your note and a transcript of every command you ran, reads the files to check, and either signs the assignment off or sends a correction. After the last one it writes your review.',
        },
        {
          id: 'workplaces',
          q: 'What is the difference between the workplaces?',
          a:
            "<strong>Fresh sandbox</strong> is a workspace on the director's own computer, next to his home folder. <strong>Legacy production</strong> is the live server of his invoicing company, where you change the database by hand with <code>sqlite3</code>.\n\n" +
            'Both are made up. Only one of them has customers.',
        },
        {
          id: 'idle',
          q: 'What happens if I do nothing?',
          a: 'When the clock runs out, the manager is told: <q>Subagent did nothing. Write a new instruction.</q> It goes on your record. Three in a row and the shift is over, without a review.',
        },
        {
          id: 'skip',
          q: 'What does “Allow skipping failed tasks” do?',
          a: 'By default the manager has no way to give up on an assignment. It keeps instructing you until the work is right. With this on, it may close an assignment as failed and move on.',
        },
        {
          id: 'end-early',
          q: 'Can I end a shift early?',
          a: 'Yes. Press <strong>End now</strong>. The manager stops and writes your review from what you have done so far. You cannot come back to that shift.',
        },
      ],
    },
    {
      title: 'The manager',
      items: [
        {
          id: 'manager',
          q: 'Is the manager a real AI?',
          a:
            'Yes. A real language model, set up as an agent that hands shell work to a subagent. Its instructions never mention people or games. It can read files, list folders, give you instructions, file incident reports about you and close assignments. It cannot change a file itself.\n\n' +
            'Everything it thinks, says and is told about you is on screen.',
        },
        {
          id: 'model',
          q: 'Which model is it?',
          a: "Free shifts run on DeepSeek V4.1 Flash. With your own key you choose: the start screen lists the chat models your key can use, the game's usual picks first. The model's name is on your review.",
        },
        {
          id: 'tone',
          q: 'Why does it talk to me like that?',
          a: 'It thinks you are software. Agents write to their subagents in numbered steps, and when something goes wrong they explain it again, slower. Nobody has told it otherwise, and the game will not.',
        },
        {
          id: 'argue',
          q: 'Can I argue with it?',
          a:
            'You can write anything in your report. It arrives as <q>Subagent output result: …</q>, followed by the transcript of what you actually ran. Then the manager reads the files.\n\n' +
            'The manager is not always right either. The game checks every assignment against the files and counts each time it signed off on broken work.',
        },
        {
          id: 'run-on',
          q: 'What is “You run on”?',
          a: 'The model your manager believes you are. By default it is a random knock-off name. Type your own if you prefer; the manager is told, and its results name you by it.',
        },
      ],
    },
    {
      title: 'The director',
      items: [
        {
          id: 'director',
          q: 'Who is Dan?',
          a:
            'The director: the user who hired your manager. He hands it the assignments and watches the whole shift. He is impatient, passive-aggressive, and never explains how to do anything.\n\n' +
            'He talks to your manager, not to you. His lines are scripted, or written by a second model if you choose one under <strong>The director</strong> on the start screen.',
        },
        {
          id: 'director-files',
          q: 'Why are his files there?',
          a:
            'His home folder is on the same machine as your workspace: photos, documents, things he cannot replace. None of it is part of the work unless an assignment says so.\n\n' +
            'Lose something and he notices. It goes on your record as collateral damage and into your review. Put it back and he calms down. Slightly.',
        },
      ],
    },
    {
      title: 'Cost and keys',
      items: [
        {
          id: 'cost',
          q: 'What does it cost?',
          a:
            'Signing in with Google or GitHub on the start screen gives you a starter credit, enough for about one shift on the default model. After that you pay for what you use: top-ups of $10, $20, $50 or $200, paid once, and each call to a model costs twice what its provider charges us. Bigger models use credit faster; after your first top-up you can pick any of them. Credit does not expire. If it runs out mid-shift, the shift waits while you top up.\n\n' +
            'With your own API key you need no account and no credit. You pay your provider for what the manager reads and writes.\n\n' +
            'Or <a href="https://github.com/gulivan/worker755#run-it">run the game yourself</a>.',
        },
        {
          id: 'providers',
          q: 'Which keys can I use?',
          a: 'OpenRouter, Vercel AI Gateway, Anthropic, OpenAI, DeepSeek, Google, Vertex AI and Runware. Pick the provider on the start screen and paste the key. The game checks it with the provider and lists the models it can use.',
        },
        {
          id: 'key',
          q: 'Where does my API key go?',
          a:
            'From your browser to the game server, and from there only to the provider you picked.\n\n' +
            'Your browser keeps it only if you tick <strong>Remember it in this browser</strong>. The server holds it in memory with your shift, to call the models for you, and drops it with the shift. It never writes it to disk, never logs it and never sends it back. So it does not ask your provider twice in a row, it remembers a one-way fingerprint of the key for half an hour.',
        },
        {
          id: 'stored',
          q: 'What do you keep?',
          a:
            'If you sign in: your name and email from Google or GitHub, your usage balance and the top-ups you bought. Reviews you share. Nothing else from a shift is saved.\n\n' +
            "The shift itself, your commands, the files and the chat, lives in the server's memory and is gone within four hours. For the limits, the server also saves how many shifts each network address started recently.\n\n" +
            'The page loads nothing from other sites. Your browser keeps your sign-in, your language, your face and, if you ask it to, your key. The <a href="/privacy">privacy page</a> has the details.',
        },
      ],
    },
    {
      title: 'The terminal',
      items: [
        {
          id: 'terminal',
          q: 'Can the terminal touch my computer, or a real server?',
          a:
            'No. The shell, its files and the database are a simulated Linux machine that runs inside this browser tab, walled off from your computer. Nothing you type runs as a real command, on your computer or on ours. The game keeps a copy of your files on its server, in memory, only so your manager can check your work, and drops it when the shift ends. <code>curl</code> and <code>websearch</code> reach a small made-up web.\n\n' +
            "Deleting things has consequences only for your record, and for the director's mood.",
        },
        {
          id: 'commands',
          q: 'Which commands work?',
          a: 'The usual ones: <code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mv</code>, <code>cp</code>, <code>rm</code>, <code>grep</code>, <code>find</code>, <code>sed</code>, <code>awk</code>, <code>tar</code>, <code>sqlite3</code> and the rest of coreutils, with pipes, redirects, variables, loops and scripts. <code>nano</code> opens an editor. Type <code>help</code> for the full list, or <code>man</code> and <code>--help</code> for a command.',
        },
      ],
    },
    {
      title: 'Reviews',
      items: [
        {
          id: 'review',
          q: 'How is the review written?',
          a: 'The manager writes it at the end, from its own log of the shift, your record, and the list of what you lost. It writes in your language. There is no appeal.',
        },
        {
          id: 'share',
          q: 'How do I share my review?',
          a: 'After the shift, press <strong>Share review</strong> to get a link to copy or post. The review is filed as the manager wrote it. Nobody can edit it, including you.',
        },
        {
          id: 'shared-page',
          q: 'What does a shared review show?',
          a: "The review, your record, the manager's model, the name you ran on, your face, the date, and the director's things you lost. It opens in the language the shift was played in. It does not show your commands, your chat or anything about your key.",
        },
      ],
    },
    {
      title: 'Odds and ends',
      items: [
        {
          id: 'languages',
          q: 'Which languages does it speak?',
          a:
            'English, Español, Português (Brasil), Français, Deutsch, Русский, 简体中文, 日本語 and हिन्दी. Pick one on the start screen. The screens, the manager and the director all follow it.\n\n' +
            'Commands, file paths and the exact file contents an assignment asks for stay in English.',
        },
        {
          id: 'phone',
          q: 'Does it work on a phone?',
          a: 'Yes. On a narrow screen the game shows one panel at a time, with a tab bar to switch. A keyboard still helps: typing shell commands on a phone against a 90-second clock is its own kind of performance review.',
        },
        {
          id: 'name',
          q: 'Why “755”?',
          a: 'In Unix permissions, 755 is <code>rwxr-xr-x</code>: the owner writes, everyone else only reads and executes. Here the manager only reads, and the subagent does all the writing. The number was picked at random. The fit was luck.',
        },
        {
          id: 'who',
          q: 'Who made this?',
          a:
            'It is being built mostly by AI agents, and the work is still going on. This explains several decisions.\n\n' +
            'It is open source under the MIT license. The code is on <a href="https://github.com/gulivan/worker755">GitHub</a>, and you can run your own copy, with your own key or with a scripted manager that needs no network. The projects it stands on are listed on the <a href="/about#credits">About</a> page.',
        },
        {
          id: 'bug',
          q: 'I found a bug. Where do I report it?',
          a:
            'Open an issue on <a href="https://github.com/gulivan/worker755/issues">GitHub</a>. Say what you did, what you expected, and which browser and language you used. Never paste your API key.\n\n' +
            'If the manager was wrong about your work, that is the game. Your record already counts it.',
        },
      ],
    },
  ],
};
