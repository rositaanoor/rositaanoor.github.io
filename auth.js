/* Login Google Drive bersama untuk semua app di origin ini.
   Index menyimpan Client ID, kata sandi, dan token. App membacanya lewat SharedAuth.
   Pakai: <script src="../auth.js"></script> (di root: ./auth.js). */
(function(){
/* Isi sekali dengan Client ID Google-mu (bukan rahasia). Kalau terisi, halaman index tidak lagi meminta Client ID. */
var CLIENT_ID='270909836788-69i2ii2nus89nmfignf1b2t53ma3rong.apps.googleusercontent.com';
var K='shared.auth',SCOPE='https://www.googleapis.com/auth/drive.appdata',TC=null,TCID='',TCB=null,TEB=null,GP=null;
function read(){try{var o=JSON.parse(localStorage.getItem(K)||'null');return o&&o.cid&&o.pass?o:null;}catch(e){return null;}}
function write(o){try{localStorage.setItem(K,JSON.stringify(o));}catch(e){}}
function loadGIS(){
  if(window.google&&google.accounts&&google.accounts.oauth2)return Promise.resolve();
  if(GP)return GP;
  GP=new Promise(function(res,rej){
    var el=document.createElement('script');el.src='https://accounts.google.com/gsi/client';el.async=true;
    el.onload=function(){res();};el.onerror=function(){el.remove();GP=null;rej({code:'net'});};
    document.head.appendChild(el);
  });
  return GP;
}
function token(interactive){
  var o=read();if(!o)return Promise.reject({code:'auth'});
  if(o.tok&&o.exp>Date.now())return Promise.resolve({t:o.tok,exp:o.exp});
  return loadGIS().then(function(){return new Promise(function(res,rej){
    if(!TC||TCID!==o.cid){TC=google.accounts.oauth2.initTokenClient({client_id:o.cid,scope:SCOPE,callback:function(r){TCB(r);},error_callback:function(e){TEB(e);}});TCID=o.cid;}
    TCB=function(r){
      if(r&&r.access_token){var c=read()||o,exp=Date.now()+((+r.expires_in||3600)-90)*1000;c.tok=r.access_token;c.exp=exp;c.ok=1;write(c);res({t:c.tok,exp:exp});}
      else rej({code:'auth',detail:r&&r.error});
    };
    TEB=function(e){rej({code:'auth',detail:e&&e.type});};
    try{TC.requestAccessToken({prompt:interactive?(o.ok?'':'consent'):'none'});}catch(e){rej({code:'auth'});}
  });});
}
function login(cid,pass){cid=CLIENT_ID||cid;var o=read();write({cid:cid,pass:pass,ok:o&&o.cid===cid?o.ok:0});}
function reset(){
  return token(true).then(function(o){
    var h={Authorization:'Bearer '+o.t};
    return fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=100&fields=files(id,name)',{headers:h}).then(function(r){
      if(!r.ok)throw {code:'http',status:r.status};return r.json();
    }).then(function(j){
      var fs=j.files||[];
      return Promise.all(fs.map(function(f){
        return fetch('https://www.googleapis.com/drive/v3/files/'+f.id,{method:'DELETE',headers:h}).then(function(r){if(!r.ok&&r.status!==404)throw {code:'http',status:r.status};});
      })).then(function(){return fs.length;});
    });
  });
}
function drop(){var o=read();if(o){delete o.tok;delete o.exp;write(o);}}
function logout(){try{localStorage.removeItem(K);}catch(e){}}
window.SharedAuth={cid:CLIENT_ID,read:read,login:login,logout:logout,token:token,drop:drop,reset:reset};
loadGIS().catch(function(){});
})();
