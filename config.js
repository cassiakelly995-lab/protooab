/* ============================================================
   CONFIGURAÇÃO DO APLICATIVO
   Este é o único arquivo que precisa ser editado para ligar as
   reservas compartilhadas entre os advogados.
   ============================================================ */

window.OAB_CONFIG = {

  /* Banco de dados das reservas.
     - Deixe como null: cada celular guarda só as próprias reservas
       (bom para testar, mas um advogado não enxerga a reserva do outro).
     - Preencha com os dados do seu projeto Firebase: todos os advogados
       passam a ver a mesma agenda, em tempo real.
     Onde achar: console.firebase.google.com > Configurações do projeto >
     Seus aplicativos > Configuração do SDK. */
  firebase: null,

  /* Exemplo já preenchido, para copiar e colar por cima da linha acima:

  firebase: {
    apiKey: "AIza...",
    authDomain: "meu-projeto.firebaseapp.com",
    projectId: "meu-projeto",
    storageBucket: "meu-projeto.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:abc123"
  },

  */

  // Nome da coleção no Firestore onde as reservas ficam guardadas.
  colecao: 'reservas'
};
