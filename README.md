Voxmind — Automação de Shorts com IA (YouTube/TikTok)

Voxmind é um backend que:

* coleta trends;

* escreve script;

* sintetiza voz (ElevenLabs);

* renderiza vídeo vertical (FFmpeg);

* aprova (frontend/Telegram — opcional);

* publica (YouTube resumable upload);

* coleta métricas e calcula receita.

* Decisão chave: sem ENUM no banco. Todos os estados/plataformas são strings (evita problemas de migração/serialização).

Principais entidades

* User: login simples (username/senha, cookie de sessão 1 mês).

* Campaign: configurações por nicho/plataforma. is_active controla se gera ou não.

* Content: unidade de vídeo. Campos: status (string: planned/scripted/voiced/rendered/published/failed), approval_status (pending/approved/
rejected), metadados de render.
* Job: fila/execução (type/status como strings).

* MetricDaily: métricas diárias por canal (platform, channel_id, date).

* FinanceSnapshot: custos/receitas agregadas.
