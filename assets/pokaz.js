/* Pokaz na projektor: strzałki przełączają slajdy, F włącza pełny ekran, uwagi zapisują się w tej przeglądarce. */
(function(){
  var slides=[].slice.call(document.querySelectorAll('.slide')), dots=[].slice.call(document.querySelectorAll('.dots a'));
  var KEY='jp2027.uwagi', notes={};
  try{ notes=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){}
  var cur=0;
  function show(i){
    cur=Math.max(0,Math.min(slides.length-1,i));
    slides.forEach(function(s,n){ s.classList.toggle('on',n===cur); });
    dots.forEach(function(d,n){ d.classList.toggle('on',n===cur); });
    if(location.hash!=='#s'+(cur+1)) history.replaceState(null,'','#s'+(cur+1));
    if(slides[cur].classList.contains('sum')) summary();
  }
  function fromHash(){ var n=parseInt((location.hash||'').replace(/^#s/,''),10); show(isNaN(n)?0:n-1); }
  function typing(e){ var t=e.target; return t&&(t.tagName==='TEXTAREA'||t.tagName==='INPUT'); }
  addEventListener('keydown',function(e){
    if(typing(e)){ if(e.key==='Escape') e.target.blur(); return; }
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ e.preventDefault(); show(cur+1); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); show(cur-1); }
    else if(e.key==='Home'){ show(0); } else if(e.key==='End'){ show(slides.length-1); }
    else if(e.key==='f'||e.key==='F'){ full(); }
  });
  addEventListener('hashchange',fromHash);
  function full(){ var d=document.documentElement; if(document.fullscreenElement){ document.exitFullscreen(); } else if(d.requestFullscreen){ d.requestFullscreen().catch(function(){}); } }
  var fb=document.getElementById('full'); if(fb) fb.addEventListener('click',full);
  var pb=document.getElementById('prev'), nb=document.getElementById('next');
  if(pb) pb.addEventListener('click',function(){ show(cur-1); });
  if(nb) nb.addEventListener('click',function(){ show(cur+1); });

  // uwagi
  var areas=[].slice.call(document.querySelectorAll('textarea[data-key]'));
  areas.forEach(function(a){
    a.value=notes[a.getAttribute('data-key')]||'';
    a.addEventListener('input',function(){
      var v=a.value.trim(); if(v) notes[a.getAttribute('data-key')]=a.value; else delete notes[a.getAttribute('data-key')];
      try{ localStorage.setItem(KEY,JSON.stringify(notes)); }catch(e){}
    });
  });
  function collect(){
    var out=[];
    areas.forEach(function(a){ var v=(notes[a.getAttribute('data-key')]||'').trim(); if(v) out.push(a.getAttribute('data-title')+'\n'+v); });
    return out.join('\n\n');
  }
  function summary(){
    var box=document.getElementById('summary'); if(!box) return;
    var t=collect(); box.textContent=t||'Nie ma jeszcze żadnych uwag. Wpisuje się je w polu „Uwagi” na slajdach dni.';
  }
  var cp=document.getElementById('copy'), dl=document.getElementById('save'), msg=document.getElementById('msg');
  function say(t){ if(msg){ msg.textContent=t; setTimeout(function(){ msg.textContent=''; },2500); } }
  if(cp) cp.addEventListener('click',function(){
    var t=collect(); if(!t){ say('Brak uwag do skopiowania.'); return; }
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ say('Skopiowano.'); },function(){ say('Nie udało się skopiować; użyj pobierania.'); }); }
    else say('Ta przeglądarka nie pozwala kopiować; użyj pobierania.');
  });
  if(dl) dl.addEventListener('click',function(){
    var t=collect(); if(!t){ say('Brak uwag do pobrania.'); return; }
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/plain;charset=utf-8'})); a.download='japonia-2027-uwagi.txt';
    document.body.appendChild(a); a.click(); a.remove();
  });
  fromHash();
})();
