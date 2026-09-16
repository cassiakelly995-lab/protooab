/* ============================================================
   CONTEÚDO DO APLICATIVO
   Edite só este arquivo para manter salas, eventos e contatos
   em dia. Nada mais precisa ser alterado.
   ============================================================ */

// Horário de funcionamento das salas e limite diário por advogado
window.REGRAS = {
  abertura: 9,          // primeira hora de entrada
  fechamento: 18,       // última hora de saída
  limiteDiarioHoras: 2, // máximo por OAB, somando todas as salas
  diasVisiveis: 21      // quantos dias para frente o advogado pode agendar
};

window.SALAS = [
  { id:'4', nome:'Coworking 1', local:'Sede da Subseção' },
  { id:'3', nome:'Coworking 2', local:'Poupatempo' },
  { id:'5', nome:'Coworking 3', local:'Poupatempo' },
  { id:'6', nome:'Coworking 4', local:'Pirapora do Bom Jesus' }
];

window.EVENTOS = [
  {
    data:'2026-09-24', hora:'19:00',
    titulo:'Reunião da Comissão da Advocacia Dativa',
    local:'Sede da Subseção — Santana de Parnaíba',
    descricao:'Pauta: distribuição de nomeações do Convênio nº 001/2026 e prestação de contas do trimestre.'
  },
  {
    data:'2026-10-08', hora:'14:00',
    titulo:'Prática em audiências no Juizado Especial Cível',
    local:'Auditório do Fórum da Comarca',
    descricao:'Curso aberto à advocacia local. Inscrição pela secretaria da Subseção. Vagas limitadas.'
  },
  {
    data:'2026-08-15', hora:'10:00',
    titulo:'Mutirão de conciliação — CEJUSC',
    local:'CEJUSC — Fórum de Santana de Parnaíba',
    descricao:'Mutirão de acordos em ações de família com apoio da Assistência Judiciária.'
  }
];

window.CONTATOS = [
  { grupo:'Varas e unidades judiciais', nome:'1ª e 2ª Vara Cível', tag:'Cível', tel:'1143229839',
    horario:'Seg a sex, 13h às 17h (público) e 9h às 17h (advogado)' },
  { grupo:'Varas e unidades judiciais', nome:'Juizado Especial Cível', tag:'JEC', tel:'1143229822',
    horario:'Seg a sex, 13h às 16h' },
  { grupo:'Varas e unidades judiciais', nome:'CEJUSC — Conciliação e Mediação', tag:'CEJUSC', tel:'1143229833' },
  { grupo:'Varas e unidades judiciais', nome:'Vara Criminal / Ofício Criminal', tag:'Criminal', tel:'1143229830' },
  { grupo:'Varas e unidades judiciais', nome:'Vara da Família e das Sucessões', tag:'Família', tel:'1143229839' },
  { grupo:'Varas e unidades judiciais', nome:'Anexo de Violência Doméstica e Familiar contra a Mulher', tag:'VD', tel:'1143229823' },
  { grupo:'Varas e unidades judiciais', nome:'UPJ 1 e 2 CVFAM', tag:'UPJ', tel:'1143229839' },

  { grupo:'Setores administrativos do Fórum', nome:'Administração', tag:'Admin', tel:'1143229836',
    obs:'Renata Del Negro (mat. 359593), santanaprnbadm@tjsp.jus.br' },
  { grupo:'Setores administrativos do Fórum', nome:'Seção de Distribuição Judicial', tag:'Distribuição', tel:'1143229841' },
  { grupo:'Setores administrativos do Fórum', nome:'Seção Adm. de Distribuição de Mandados', tag:'Mandados', tel:'1143229824' },
  { grupo:'Setores administrativos do Fórum', nome:'Setor das Execuções Fiscais', tag:'Fiscal', tel:'1143229831' },
  { grupo:'Setores administrativos do Fórum', nome:'Setor Técnico — Psicólogo e Assistente Social', tag:'Técnico', tel:'1143229832' },

  { grupo:'Santana de Parnaíba', nome:'Fórum da Comarca', tag:'Fórum', tel:'1143229839',
    end:'R. Prof. Eugênio Teani, 215 — Jardim Prof. Benoa', horario:'Seg a sex, 13h às 17h' },
  { grupo:'Santana de Parnaíba', nome:'Subseção OAB — 247ª', tag:'OAB', tel:'1141544228',
    end:'R. Alberto Frediani, 770 — CEP 06502-155',
    horario:'Seg a sex, 9h às 18h', obs:'santana.parnaiba@oabsp.org.br · (11) 4154-1371' },
  { grupo:'Santana de Parnaíba', nome:'Delegacia de Polícia Civil', tag:'DP', tel:'1141545053',
    end:'R. Álvares de Azevedo, 21 — Jardim Anhembi', horario:'Aberta 24 horas' },
  { grupo:'Santana de Parnaíba', nome:'Delegacia de Defesa da Mulher', tag:'DDM', tel:'1141544157',
    end:'R. Álvares de Azevedo, 21 — Jardim Anhembi', horario:'Seg a sex, 8h às 18h' },
  { grupo:'Santana de Parnaíba', nome:'Promotoria de Justiça', tag:'MP', tel:'1131197205',
    end:'R. Prof. Antônio Olegário Cardoso Filho, 147 — Jardim Prof. Benoa', horario:'Ter a qui, 13h às 17h' },
  { grupo:'Santana de Parnaíba', nome:'Conselho Tutelar', tag:'CT', tel:'1141561113',
    end:'R. José de Alencar, 56 — Centro', horario:'Seg a sex, 8h às 17h' },
  { grupo:'Santana de Parnaíba', nome:'Prefeitura Municipal', tag:'Prefeitura', tel:'1146227500',
    end:'Av. Mal. Mascarenhas de Moraes, 1283 — Sítio do Morro', horario:'Seg a sex, 8h às 17h' },

  { grupo:'Pirapora do Bom Jesus', nome:'Delegacia de Polícia Civil', tag:'DP', tel:'1141311894',
    end:'R. Cônego Henrique, 300 — Jardim Bom Jesus', horario:'Seg a sex, 9h às 19h' },
  { grupo:'Pirapora do Bom Jesus', nome:'Prefeitura Municipal', tag:'Prefeitura', tel:'1141312143',
    end:'Jardim Bom Jesus', horario:'Seg a sex, 8h às 17h' }
];
