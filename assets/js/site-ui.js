(function(){
  'use strict';

  document.querySelectorAll('[data-site-back]').forEach(function(btn){
    btn.addEventListener('click', function(event){
      event.preventDefault();
      if (window.history.length > 1) { window.history.back(); return; }
      window.location.assign('/');
    });
  });

  document.querySelectorAll('[data-share]').forEach(function(root){
    var nativeBtn=root.querySelector('[data-share-native]');
    var fallback=root.querySelector('[data-share-fallback]');
    var copy=root.querySelector('[data-share-copy]');
    var url=root.getAttribute('data-url') || window.location.href;
    var title=root.getAttribute('data-title') || document.title;
    var text=title;

    function showFallback(){ if(fallback) fallback.hidden=false; }
    function copyText(){
      if(navigator.clipboard && window.isSecureContext){
        return navigator.clipboard.writeText(url);
      }
      return new Promise(function(resolve,reject){
        var ta=document.createElement('textarea');
        ta.value=url; ta.setAttribute('readonly','');
        ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); resolve(); } catch(e){ reject(e); }
        document.body.removeChild(ta);
      });
    }

    if(navigator.share){
      nativeBtn.hidden=false;
      nativeBtn.addEventListener('click', async function(){
        try { await navigator.share({title:title,text:text,url:url}); }
        catch(e){ if(e && e.name !== 'AbortError') showFallback(); }
      });
      // Fallback remains available through a small explicit link if native sharing fails.
      showFallback();
    } else {
      showFallback();
    }

    if(copy){
      copy.addEventListener('click', function(){
        copyText().then(function(){
          var old=copy.textContent; copy.textContent='Copiado';
          setTimeout(function(){copy.textContent=old;},1800);
        }).catch(function(){
          window.prompt('Copiá este enlace:', url);
        });
      });
    }
  });
})();
