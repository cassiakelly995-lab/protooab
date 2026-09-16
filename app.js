/* ============================================================
   APLICATIVO — OAB SP, 247ª Subseção Santana de Parnaíba
   ============================================================ */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);

const CHAVE_ADVOGADO = 'oab.advogado.v1';
const { abertura, fechamento, limiteDiarioHoras, diasVisiveis } = window.REGRAS;
const LIMITE_MIN = limiteDiarioHoras * 60;

let advogado = null;
let dataEscolhida = hojeISO();
let duracao = 60;
let reservasDoDia = [];
let escolha = null;      // bloco que o advogado tocou, aguardando confirmação
let pararDeOuvir = null; // cancela o tempo real do Firestore ao trocar de data

/* ============================================================
   Datas e horas
   ============================================================ */
function hojeISO(){
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function paraData(iso){
  const [a,m,d] = iso.split('-').map(Number);
  return new Date(a, m-1, d);
}
function dataExtenso(iso){
  return paraData(iso).toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
}
function dataCurta(iso){
  return paraData(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
}
const minutos = h => window.Dados.minutos(h);
const somaHora = (h, m) => window.Dados.somaHora(h, m);
const nomeSala = id => (window.SALAS.find(s => s.id === id) || {}).nome || id;
const chaveOab = v => (v || '').replace(/[^0-9A-Za-z]/g,'').toUpperCase();

function telFormatado(t){
  return t.length === 11
    ? `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`
    : `(${t.slice(0,2)}) ${t.slice(2,6)}-${t.slice(6)}`;
}

let relogioToast;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(relogioToast);
  relogioToast = setTimeout(() => { t.hidden = true; }, 2800);
}
function aviso(tipo, html){
  $('#aviso').innerHTML = `<div class="aviso aviso-${tipo}">${html}</div>`;
}
function limparAviso(){ $('#aviso').innerHTML = ''; }

/* ============================================================
   Identificação do advogado — fica salva no aparelho
   ============================================================ */
function carregarAdvogado(){
  try{ advogado = JSON.parse(localStorage.getItem(CHAVE_ADVOGADO) || 'null'); }
  catch(e){ advogado = null; }
  return advogado;
}
function mostrarIdentificacao(preencher){
  $('#tela-cadastro').hidden = false;
  $('#tela-app').hidden = true;
  $('.barra').hidden = true;
  if(preencher && advogado){
    $('#cad-nome').value = advogado.nome;
    $('#cad-oab').value = advogado.oab;
    $('#cad-telefone').value = advogado.telefone;
    $('#cad-email').value = advogado.email || '';
  }
}
function mostrarApp(){
  $('#tela-cadastro').hidden = true;
  $('#tela-app').hidden = false;
  $('.barra').hidden = false;
  $('#quem-nome').textContent = advogado.nome.split(' ')[0];
  $('#quem-oab').textContent = 'OAB ' + advogado.oab;
}

$('#form-cadastro').addEventListener('submit', e => {
  e.preventDefault();
  advogado = {
    nome: $('#cad-nome').value.trim(),
    oab: $('#cad-oab').value.trim().toUpperCase(),
    telefone: $('#cad-telefone').value.trim(),
    email: $('#cad-email').value.trim()
  };
  localStorage.setItem(CHAVE_ADVOGADO, JSON.stringify(advogado));
  mostrarApp();
  abrirAba('agenda');
  carregarAgenda();
  toast('Dados guardados neste aparelho');
});
$('#trocar-advogado').addEventListener('click', () => mostrarIdentificacao(true));

// Máscaras que formatam sem atrapalhar quem cola o texto
$('#cad-telefone').addEventListener('input', e => {
  const d = e.target.value.replace(/\D/g,'').slice(0,11);
  e.target.value = d.length <= 2 ? d
    : d.length <= 6  ? `(${d.slice(0,2)}) ${d.slice(2)}`
    : d.length <= 10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    : `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
});
$('#cad-oab').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });

/* ============================================================
   Navegação entre as abas
   ============================================================ */
function abrirAba(id){
  $$('.barra button').forEach(b => {
    const ativa = b.dataset.aba === id;
    b.setAttribute('aria-selected', String(ativa));
  });
  $$('.painel').forEach(p => { p.hidden = p.id !== 'painel-' + id; });
  window.scrollTo({ top:0 });
  if(id === 'minhas') carregarMinhasReservas();
}
$$('.barra button').forEach(b => b.addEventListener('click', () => abrirAba(b.dataset.aba)));

/* ============================================================
   Agenda — tira de datas
   ============================================================ */
function montarDatas(){
  const tira = $('#datas');
  tira.innerHTML = '';
  const base = new Date();
  for(let i = 0; i < diasVisiveis; i++){
    const d = new Date(base.getTime() + i*86400000);
    if(d.getDay() === 0 || d.getDay() === 6) continue; // salas fecham no fim de semana
    const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const b = el('button', { type:'button', className:'dia' });
    b.innerHTML = `
      <span class="sem">${d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</span>
      <span class="num">${String(d.getDate()).padStart(2,'0')}</span>
      <span class="mes">${d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</span>`;
    b.setAttribute('aria-pressed', String(iso === dataEscolhida));
    b.setAttribute('aria-label', dataExtenso(iso));
    b.addEventListener('click', () => {
      dataEscolhida = iso;
      [...tira.children].forEach(c => c.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      limparAviso();
      carregarAgenda();
    });
    tira.append(b);
  }
  // se hoje for fim de semana, começa no próximo dia útil disponível
  if(!tira.querySelector('[aria-pressed="true"]') && tira.firstElementChild){
    tira.firstElementChild.click();
  }
}

$$('.duracao button').forEach(b => {
  b.addEventListener('click', () => {
    duracao = Number(b.dataset.min);
    $$('.duracao button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    desenharGrade();
  });
});

/* ============================================================
   Agenda — grade de salas e horários
   ============================================================ */
async function carregarAgenda(){
  if(pararDeOuvir){ pararDeOuvir(); pararDeOuvir = null; }
  $('#grade').innerHTML = '<p class="vazio">Carregando a agenda do dia…</p>';
  try{
    reservasDoDia = await window.Dados.listar(dataEscolhida);
    desenharGrade();
    if(window.Dados.observar){
      pararDeOuvir = await window.Dados.observar(dataEscolhida, lista => {
        reservasDoDia = lista;
        desenharGrade();
      });
    }
  }catch(e){
    console.error(e);
    $('#grade').innerHTML = '';
    aviso('erro','Não foi possível carregar a agenda. Verifique a conexão e toque na data de novo.');
  }
}

function ocupado(salaId, inicioMin, dur){
  const fim = inicioMin + dur;
  return reservasDoDia.find(r => {
    if(r.sala !== salaId) return false;
    const ri = minutos(r.hora), rf = ri + r.duracao;
    return inicioMin < rf && ri < fim;
  });
}

function minutosJaUsados(){
  return reservasDoDia
    .filter(r => r.oabChave === chaveOab(advogado.oab) && !r.continuacao)
    .reduce((soma, r) => soma + r.duracao, 0);
}

function desenharGrade(){
  const grade = $('#grade');
  grade.innerHTML = '';
  const agora = new Date();
  const ehHoje = dataEscolhida === hojeISO();
  const usados = minutosJaUsados();
  const saldo = LIMITE_MIN - usados;

  $('#saldo').textContent = saldo <= 0
    ? `Você já usou as ${limiteDiarioHoras} horas de ${dataCurta(dataEscolhida)}. Escolha outro dia.`
    : `Disponível para você em ${dataCurta(dataEscolhida)}: ${saldo/60}h de ${limiteDiarioHoras}h.`;

  window.SALAS.forEach(sala => {
    const bloco = el('section', { className:'sala' });
    bloco.innerHTML = `
      <div class="sala-topo">
        <span class="nome">${sala.nome}</span>
        <span class="local">${sala.local}</span>
      </div>`;
    const horas = el('div', { className:'horas' });

    for(let h = abertura; h < fechamento; h++){
      const inicio = h*60;
      if(inicio + duracao > fechamento*60) break;
      const hora = somaHora('00:00', inicio);
      const reserva = ocupado(sala.id, inicio, duracao);
      const passou = ehHoje && inicio <= agora.getHours()*60 + agora.getMinutes();
      const minha = reserva && reserva.oabChave === chaveOab(advogado.oab);
      const semSaldo = saldo < duracao;

      const b = el('button', {
        type:'button',
        className:'hora' + (minha ? ' minha' : ''),
        disabled: Boolean(reserva) || passou || semSaldo
      });
      const etiqueta = minha ? 'sua reserva'
        : reserva ? 'ocupada'
        : passou ? 'já passou'
        : semSaldo ? 'sem saldo'
        : 'até ' + somaHora(hora, duracao);
      b.innerHTML = `${hora}<small>${etiqueta}</small>`;
      b.addEventListener('click', () => confirmar(sala, hora));
      horas.append(b);
    }
    bloco.append(horas);
    grade.append(bloco);
  });
}

/* ============================================================
   Confirmação da reserva
   ============================================================ */
function confirmar(sala, hora){
  escolha = { sala, hora };
  $('#modal-texto').innerHTML = `
    <p><strong>${sala.nome}</strong> — ${sala.local}</p>
    <p>${dataExtenso(dataEscolhida)}</p>
    <p>Das ${hora} às ${somaHora(hora, duracao)} (${duracao/60}h)</p>`;
  $('#modal').showModal();
}

$('#modal-cancelar').addEventListener('click', () => $('#modal').close());

$('#modal-confirmar').addEventListener('click', async () => {
  if(!escolha) return;
  const botao = $('#modal-confirmar');
  botao.disabled = true;
  botao.textContent = 'Reservando…';

  const reserva = {
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
    nome: advogado.nome,
    oab: advogado.oab,
    oabChave: chaveOab(advogado.oab),
    telefone: advogado.telefone,
    email: advogado.email || '',
    sala: escolha.sala.id,
    salaNome: escolha.sala.nome,
    data: dataEscolhida,
    hora: escolha.hora,
    duracao,
    criadoEm: new Date().toISOString()
  };

  try{
    await window.Dados.salvar(reserva);
    $('#modal').close();
    aviso('ok', `Reserva confirmada: <strong>${reserva.salaNome}</strong>, ${dataExtenso(reserva.data)}, das ${reserva.hora} às ${somaHora(reserva.hora, reserva.duracao)}.`);
    toast('Reserva confirmada');
    await carregarAgenda();
  }catch(erro){
    $('#modal').close();
    if(String(erro.message).includes('ocupado')){
      aviso('erro','Outro advogado acabou de pegar esse horário. Escolha outro bloco.');
    }else{
      console.error(erro);
      aviso('erro','A reserva não foi gravada. Verifique a conexão e tente de novo.');
    }
    await carregarAgenda();
  }finally{
    botao.disabled = false;
    botao.textContent = 'Reservar';
    escolha = null;
  }
});

window.addEventListener('reservas:mudou', () => {
  if(!$('#painel-agenda').hidden) carregarAgenda();
  if(!$('#painel-minhas').hidden) carregarMinhasReservas();
});

/* ============================================================
   Minhas reservas
   ============================================================ */
async function carregarMinhasReservas(){
  const alvo = $('#minhas-lista');
  alvo.innerHTML = '<p class="vazio">Carregando…</p>';
  let lista = [];
  try{
    lista = await window.Dados.listarDoAdvogado(chaveOab(advogado.oab));
  }catch(e){
    console.error(e);
    alvo.innerHTML = '<p class="vazio">Não foi possível carregar suas reservas. Verifique a conexão.</p>';
    return;
  }

  alvo.innerHTML = '';
  if(!lista.length){
    alvo.innerHTML = '<p class="vazio">Você não tem reservas futuras. Abra a agenda e escolha um horário.</p>';
    return;
  }

  lista.forEach(r => {
    const item = el('div', { className:'item' });
    item.innerHTML = `
      <span class="quando">${dataCurta(r.data)} · ${r.hora}</span>
      <span class="detalhe"><strong>${r.salaNome || nomeSala(r.sala)}</strong><br>
        ${paraData(r.data).toLocaleDateString('pt-BR',{weekday:'long'})}, das ${r.hora} às ${somaHora(r.hora, r.duracao)}</span>`;
    const cancelar = el('button', { className:'btn-texto', textContent:'Cancelar' });
    cancelar.addEventListener('click', async () => {
      if(!confirm(`Cancelar ${r.salaNome || nomeSala(r.sala)} em ${dataCurta(r.data)} às ${r.hora}?`)) return;
      try{
        await window.Dados.remover(r.id);
        toast('Reserva cancelada');
        carregarMinhasReservas();
      }catch(e){
        console.error(e);
        toast('Não foi possível cancelar agora');
      }
    });
    item.append(cancelar);
    alvo.append(item);
  });
}

/* ============================================================
   Eventos
   ============================================================ */
function montarEventos(){
  const hoje = hojeISO();
  const ordenados = [...window.EVENTOS].sort((a,b) => a.data.localeCompare(b.data));
  const futuros = ordenados.filter(e => e.data >= hoje);
  const passados = ordenados.filter(e => e.data < hoje).reverse();

  const cartao = (ev, passado) => {
    const d = paraData(ev.data);
    const c = el('article', { className:'evento' + (passado ? ' passado' : '') });
    c.innerHTML = `
      <div class="evento-data">
        <span class="num">${String(d.getDate()).padStart(2,'0')}</span>
        <span class="mes">${d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</span>
      </div>
      <div>
        <h3>${ev.titulo}</h3>
        <p>${ev.hora} · ${ev.local}</p>
        <p>${ev.descricao}</p>
      </div>`;
    const compartilhar = el('button', { className:'btn-texto', textContent:'Compartilhar' });
    compartilhar.addEventListener('click', () =>
      enviar(ev.titulo, `${ev.titulo}\n${dataExtenso(ev.data)} às ${ev.hora}\n${ev.local}\n\n${ev.descricao}`));
    c.lastElementChild.append(compartilhar);
    return c;
  };

  const proximos = $('#eventos-proximos');
  futuros.length
    ? futuros.forEach(e => proximos.append(cartao(e, false)))
    : proximos.innerHTML = '<p class="vazio">Nenhum evento marcado. As próximas atividades aparecem aqui.</p>';

  const antigos = $('#eventos-passados');
  passados.length
    ? passados.forEach(e => antigos.append(cartao(e, true)))
    : antigos.innerHTML = '<p class="vazio">Nada realizado neste período.</p>';
}

/* ============================================================
   Contatos
   ============================================================ */
async function copiar(texto){
  try{
    await navigator.clipboard.writeText(texto);
    toast('Copiado');
  }catch(e){
    const campo = el('textarea', { value:texto, style:'position:fixed;opacity:0' });
    document.body.append(campo);
    campo.select();
    const ok = document.execCommand('copy');
    campo.remove();
    toast(ok ? 'Copiado' : 'Selecione o número para copiar');
  }
}
async function enviar(titulo, texto){
  if(navigator.share){
    try{ await navigator.share({ title:titulo, text:texto }); return; }
    catch(e){ if(e.name === 'AbortError') return; }
  }
  copiar(texto);
}

function montarContatos(){
  const alvo = $('#lista-contatos');
  [...new Set(window.CONTATOS.map(c => c.grupo))].forEach(grupo => {
    const bloco = el('section');
    bloco.append(el('h2', { textContent:grupo }));
    window.CONTATOS.filter(c => c.grupo === grupo).forEach(c => {
      const tel = telFormatado(c.tel);
      const card = el('div', { className:'contato' });
      card.innerHTML = `
        <div class="contato-topo">
          <span class="nome">${c.nome}</span>
          <span class="tag">${c.tag}</span>
        </div>
        ${c.end ? `<p>${c.end}</p>` : ''}
        ${c.horario ? `<p>${c.horario}</p>` : ''}
        ${c.obs ? `<p>${c.obs}</p>` : ''}
        <p><a class="tel" href="tel:+55${c.tel}">${tel}</a></p>`;
      const acoes = el('div', { className:'acoes-contato' });
      const bCopiar = el('button', { className:'btn-texto', textContent:'Copiar número' });
      bCopiar.addEventListener('click', () => copiar(tel));
      const bEnviar = el('button', { className:'btn-texto', textContent:'Compartilhar' });
      bEnviar.addEventListener('click', () =>
        enviar(c.nome, [c.nome, tel, c.end, c.horario, c.obs].filter(Boolean).join('\n')));
      acoes.append(bCopiar, bEnviar);
      card.append(acoes);
      card.dataset.busca = [c.nome, c.tag, c.end, c.obs, c.grupo, tel].filter(Boolean).join(' ').toLowerCase();
      bloco.append(card);
    });
    alvo.append(bloco);
  });
}

$('#busca').addEventListener('input', e => {
  const termo = e.target.value.trim().toLowerCase();
  let visiveis = 0;
  $$('#lista-contatos section').forEach(bloco => {
    let noGrupo = 0;
    bloco.querySelectorAll('.contato').forEach(card => {
      const bate = !termo || card.dataset.busca.includes(termo);
      card.hidden = !bate;
      if(bate) noGrupo++;
    });
    bloco.hidden = noGrupo === 0;
    visiveis += noGrupo;
  });
  $('#busca-vazia').hidden = visiveis > 0;
});

/* ============================================================
   Início
   ============================================================ */
montarDatas();
montarEventos();
montarContatos();

if(carregarAdvogado()){
  mostrarApp();
  carregarAgenda();
}else{
  mostrarIdentificacao(false);
}

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
