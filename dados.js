/* ============================================================
   CAMADA DE DADOS
   A tela conversa só com window.Dados. Quando o Firebase está
   configurado, as reservas ficam na nuvem e todos os advogados
   veem a mesma agenda. Sem configuração, cada aparelho guarda
   as próprias reservas.
   ============================================================ */

(function(){
  const CONFIG = window.OAB_CONFIG || {};
  const CHAVE = 'oab.reservas.v2';

  /* ---------- Reservas guardadas no próprio aparelho ---------- */
  const Local = {
    modo: 'local',
    async listar(data){
      let todas = [];
      try{
        todas = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      }catch(e){
        console.error('Reservas locais ilegíveis', e);
      }
      return data ? todas.filter(r => r.data === data) : todas;
    },
    async listarDoAdvogado(oabChave){
      const hoje = new Date().toISOString().slice(0,10);
      return (await this.listar())
        .filter(r => r.oabChave === oabChave && r.data >= hoje && !r.continuacao)
        .sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    },
    async salvar(reserva){
      const todas = await this.listar();
      // trava de última hora: alguém pode ter pego o horário nesta mesma aba
      if(todas.some(r => r.sala === reserva.sala && r.data === reserva.data && cruza(r, reserva))){
        throw new Error('ocupado');
      }
      todas.push(reserva);
      localStorage.setItem(CHAVE, JSON.stringify(todas));
      avisarMudanca();
      return reserva;
    },
    async remover(id){
      const restantes = (await this.listar()).filter(r => r.id !== id);
      localStorage.setItem(CHAVE, JSON.stringify(restantes));
      avisarMudanca();
    },
    observar(){ /* sem tempo real no modo local */ }
  };

  /* ---------- Reservas na nuvem (Firestore) ---------- */
  function criarNuvem(){
    let db, colecao, api;
    const pronto = (async () => {
      const [appMod, storeMod] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
      ]);
      api = storeMod;
      const app = appMod.initializeApp(CONFIG.firebase);
      db = storeMod.getFirestore(app);
      colecao = storeMod.collection(db, CONFIG.colecao || 'reservas');
    })();

    return {
      modo: 'nuvem',
      async listar(data){
        await pronto;
        const filtro = data
          ? api.query(colecao, api.where('data', '==', data))
          : colecao;
        const snap = await api.getDocs(filtro);
        return snap.docs.map(d => ({ ...d.data(), id:d.id }));
      },
      async listarDoAdvogado(oabChave){
        await pronto;
        const hoje = new Date().toISOString().slice(0,10);
        const snap = await api.getDocs(api.query(colecao, api.where('oabChave','==',oabChave)));
        return snap.docs.map(d => ({ ...d.data(), id:d.id }))
          .filter(r => r.data >= hoje && !r.continuacao)
          .sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora));
      },
      async salvar(reserva){
        await pronto;
        const { id, ...corpo } = reserva;
        // o id determinístico evita duas reservas na mesma sala e horário
        const chave = `${reserva.data}_${reserva.sala}_${reserva.hora}`;
        const ref = api.doc(colecao, chave);
        await api.runTransaction(db, async tx => {
          const atual = await tx.get(ref);
          if(atual.exists()) throw new Error('ocupado');
          tx.set(ref, corpo);
          // uma reserva de 2h ocupa também o bloco seguinte
          if(reserva.duracao === 120){
            const seguinte = api.doc(colecao, `${reserva.data}_${reserva.sala}_${somaHora(reserva.hora,60)}`);
            const ocupadoDepois = await tx.get(seguinte);
            if(ocupadoDepois.exists()) throw new Error('ocupado');
            tx.set(seguinte, { ...corpo, continuacao:chave, duracao:60, hora:somaHora(reserva.hora,60) });
          }
        });
        return { ...reserva, id:chave };
      },
      async remover(id){
        await pronto;
        await api.deleteDoc(api.doc(colecao, id));
        // apaga também o bloco de continuação, se houver
        const extras = await api.getDocs(api.query(colecao, api.where('continuacao','==',id)));
        await Promise.all(extras.docs.map(d => api.deleteDoc(d.ref)));
      },
      async observar(data, callback){
        await pronto;
        return api.onSnapshot(api.query(colecao, api.where('data','==',data)), snap => {
          callback(snap.docs.map(d => ({ ...d.data(), id:d.id })));
        });
      }
    };
  }

  /* ---------- Auxiliares ---------- */
  function minutos(hhmm){ const [h,m] = hhmm.split(':').map(Number); return h*60+m; }
  function somaHora(hhmm, mais){
    const t = minutos(hhmm) + mais;
    return String(Math.floor(t/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0');
  }
  function cruza(a, b){
    const ia = minutos(a.hora), fa = ia + a.duracao;
    const ib = minutos(b.hora), fb = ib + b.duracao;
    return ib < fa && ia < fb;
  }
  function avisarMudanca(){
    window.dispatchEvent(new CustomEvent('reservas:mudou'));
  }

  const usaNuvem = CONFIG.firebase && CONFIG.firebase.projectId;
  window.Dados = usaNuvem ? criarNuvem() : Local;
  window.Dados.somaHora = somaHora;
  window.Dados.minutos = minutos;
})();
