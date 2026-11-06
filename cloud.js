/* Conexão com a API na nuvem (Netlify + Neon) + tela de login.
   Oferece ao app a mesma interface do banco do protótipo: collection(c).doc(id).set/delete e collection(c).onSnapshot. */
(function(){
  const API='/.netlify/functions/api',TK='gs-token',POLL=10000;
  const tok=()=>{try{return localStorage.getItem(TK)}catch(e){return null}};
  const setTok=v=>{try{v?localStorage.setItem(TK,v):localStorage.removeItem(TK)}catch(e){}};
  async function call(body){
    let r;
    try{r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(tok()||'')},body:JSON.stringify(body)})}
    catch(e){throw {code:'unavailable',message:'rede'}}
    let j={};try{j=await r.json()}catch(e){}
    if(r.status===401&&body.action!=='login'){setTok(null);location.reload();throw {code:'invalid_argument'}}
    if(!r.ok)throw {code:r.status>=500?'unavailable':'invalid_argument',status:r.status,erro:j.erro};
    return j;
  }
  function css(){
    const s=document.createElement('style');
    s.textContent=`#gs-login{position:fixed;inset:0;z-index:9999;background:var(--head,#12285a);display:grid;place-items:center;padding:16px;font-family:var(--f-body,system-ui)}
    #gs-login form{background:var(--surface,#fff);color:var(--ink,#14213d);width:100%;max-width:380px;border-radius:14px;padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
    #gs-login h1{font:700 22px var(--f-display,system-ui);margin:0 0 4px}#gs-login p{margin:0 0 18px;color:var(--muted,#5a6785);font-size:14px}
    #gs-login label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px}
    #gs-login input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--line,#dce1ee);border-radius:8px;font:inherit;background:var(--bg,#f2f4f9);color:inherit}
    #gs-login button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:8px;background:var(--navy,#12285a);color:#fff;font:600 15px var(--f-body,system-ui);cursor:pointer}
    #gs-login .err{color:var(--danger,#b3261e);font-size:13px;margin-top:10px;min-height:18px}`;
    document.head.appendChild(s);
  }
  function askLogin(){
    return new Promise(res=>{
      css();
      const d=document.createElement('div');d.id='gs-login';
      d.innerHTML=`<form><h1>Gestão de Serviços</h1><p>Vale Animal · entre com seu e-mail e senha.</p>
        <label for="gs-e">E-mail</label><input id="gs-e" type="email" autocomplete="username" required>
        <label for="gs-p">Senha</label><input id="gs-p" type="password" autocomplete="current-password" required>
        <div class="err" role="alert"></div><button type="submit">Entrar</button></form>`;
      document.body.appendChild(d);
      const f=d.querySelector('form'),er=d.querySelector('.err'),b=d.querySelector('button');
      f.addEventListener('submit',async e=>{
        e.preventDefault();er.textContent='';b.disabled=true;b.textContent='Entrando…';
        try{const j=await call({action:'login',email:d.querySelector('#gs-e').value,password:d.querySelector('#gs-p').value});
          setTok(j.token);d.remove();res()}
        catch(x){er.textContent=x.status===401?'E-mail ou senha incorretos.':'Não foi possível entrar. Verifique a internet e tente de novo.'}
        b.disabled=false;b.textContent='Entrar';
      });
    });
  }
  /* uma única consulta periódica alimenta todas as coleções */
  const subs=[];let timer=null,pend=null,busy=false;
  async function poll(){
    if(busy)return;busy=true;
    try{
      const all=await call({action:'all'});
      subs.forEach(s=>{const arr=all[s.c]||[],k=JSON.stringify(arr);if(k!==s.last){s.last=k;s.ok({docs:arr.map(x=>({data:()=>x})),metadata:{fromCache:false}})}});
    }catch(e){subs.forEach(s=>s.err&&s.err(e))}
    busy=false;
  }
  const soon=()=>{clearTimeout(pend);pend=setTimeout(poll,400)};
  function makeDB(){
    return {collection:c=>({
      doc:id=>({
        set:async data=>{await call({action:'set',collection:c,id,data});soon()},
        delete:async()=>{await call({action:'del',collection:c,id});soon()}
      }),
      onSnapshot:(ok,err)=>{
        subs.push({c,ok,err,last:null});
        if(!timer)timer=setInterval(()=>{if(!document.hidden)poll()},POLL);
        soon();
        return()=>{}
      }
    })};
  }
  window.GS_CLOUD={
    enabled:location.protocol!=='file:',
    async connect(){
      if(tok()){try{await call({action:'me'})}catch(e){if(e.code!=='unavailable')setTok(null)}}
      if(!tok())await askLogin();
      return makeDB();
    },
    logout(){setTok(null);location.reload()}
  };
})();
