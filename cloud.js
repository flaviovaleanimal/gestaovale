/* Conexão com o banco na nuvem (Supabase) + tela de login.
   Imita a mesma interface do banco usado no protótipo: collection(c).doc(id).set/delete e collection(c).onSnapshot. */
(function(){
  const cfg=window.GS_CONFIG||{};
  const ok=cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!/COLE_AQUI/.test(cfg.SUPABASE_URL+cfg.SUPABASE_ANON_KEY)&&window.supabase;
  let sb=null;
  const wrap=e=>{
    const msg=String((e&&e.message)||''),st=e&&e.status;
    const net=!st&&/fetch|network|failed|load/i.test(msg);
    return {code:net?'unavailable':(st===401||st===403||(e&&e.code==='42501')?'invalid_argument':'error'),message:msg};
  };
  function css(){
    const s=document.createElement('style');
    s.textContent=`#gs-login{position:fixed;inset:0;z-index:9999;background:var(--head,#12285a);display:grid;place-items:center;padding:16px;font-family:var(--f-body,system-ui)}
    #gs-login form{background:var(--surface,#fff);color:var(--ink,#14213d);width:100%;max-width:380px;border-radius:14px;padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
    #gs-login h1{font:700 22px var(--f-display,system-ui);margin:0 0 4px}#gs-login p{margin:0 0 18px;color:var(--muted,#5a6785);font-size:14px}
    #gs-login label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px}
    #gs-login input,#gs-login input:invalid{box-shadow:none;outline-offset:0;text-decoration:none;width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--line,#dce1ee);border-radius:8px;font:inherit;background:var(--bg,#f2f4f9);color:inherit}
    #gs-login input:focus{outline:2px solid var(--navy,#12285a);outline-offset:1px}
    #gs-login button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:8px;background:var(--navy,#12285a);color:#fff;font:600 15px var(--f-body,system-ui);cursor:pointer}
    #gs-login .err{color:var(--danger,#b3261e);font-size:13px;margin-top:10px;background:none;padding:0;border:0}#gs-login .err:empty{display:none}`;
    document.head.appendChild(s);
  }
  function askLogin(){
    return new Promise(res=>{
      css();
      const d=document.createElement('div');d.id='gs-login';
      d.innerHTML=`<form><h1>Gestão de Serviços</h1><p>Vale Animal · entre com seu e-mail e senha.</p>
        <label for="gs-e">E-mail</label><input id="gs-e" type="email" autocomplete="username" spellcheck="false" autocapitalize="off" autocorrect="off" required>
        <label for="gs-p">Senha</label><input id="gs-p" type="password" autocomplete="current-password" spellcheck="false" autocapitalize="off" autocorrect="off" required>
        <div class="err" role="alert"></div><button type="submit">Entrar</button></form>`;
      document.body.appendChild(d);
      const f=d.querySelector('form'),er=d.querySelector('.err'),b=d.querySelector('button');
      f.addEventListener('submit',async e=>{
        e.preventDefault();er.textContent='';b.disabled=true;b.textContent='Entrando…';
        const {error}=await sb.auth.signInWithPassword({email:d.querySelector('#gs-e').value.trim(),password:d.querySelector('#gs-p').value});
        b.disabled=false;b.textContent='Entrar';
        if(error){er.textContent=/invalid/i.test(error.message)?'E-mail ou senha incorretos.':'Não foi possível entrar. Verifique a internet e tente de novo.';return}
        d.remove();res();
      });
    });
  }
  function makeDB(){
    return {collection:c=>({
      doc:id=>({
        set:async data=>{const {error}=await sb.from('docs').upsert({collection:c,id,data,updated_at:new Date().toISOString()});if(error)throw wrap(error)},
        delete:async()=>{const {error}=await sb.from('docs').delete().eq('collection',c).eq('id',id);if(error)throw wrap(error)}
      }),
      onSnapshot:(onOk,onErr)=>{
        let t=null,dead=false;
        const load=async()=>{
          const {data,error}=await sb.from('docs').select('data').eq('collection',c);
          if(dead)return;
          if(error){onErr&&onErr(wrap(error));return}
          onOk({docs:data.map(r=>({data:()=>r.data})),metadata:{fromCache:false}});
        };
        load();
        const ch=sb.channel('docs-'+c+'-'+Math.random().toString(36).slice(2))
          .on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'collection=eq.'+c},()=>{clearTimeout(t);t=setTimeout(load,250)})
          .subscribe();
        return()=>{dead=true;sb.removeChannel(ch)};
      }
    })};
  }
  window.GS_CLOUD={
    enabled:!!ok,
    async connect(){
      if(!ok)return null;
      sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      const {data}=await sb.auth.getSession();
      if(!data.session)await askLogin();
      sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_OUT')location.reload()});
      window.GS_ADMIN=false;
      try{const r=await sb.rpc('me_admin');window.GS_ADMIN=r.data===true}catch(e){window.GS_ADMIN=false}
      return makeDB();
    },
    async logout(){if(sb)await sb.auth.signOut();location.reload()}
  };
})();
