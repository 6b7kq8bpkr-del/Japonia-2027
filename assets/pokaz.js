/* Pokaz na projektor. Dwa tryby: „Przegląd planu” (we własnym gronie, szczegóły każdego punktu dnia)
   i „Ze znajomymi” (pytania i uwagi). ← → zmieniają slajd, ↑ ↓ punkt dnia w przeglądzie, T tryb, F pełny ekran.
   Notatki zapisują się w tej przeglądarce; oba tryby piszą do tych samych notatek dnia. */
(function(){
  var root=document.documentElement;
  var all=[].slice.call(document.querySelectorAll('.slide')), dots=[].slice.call(document.querySelectorAll('.dots a'));
  var KEY='jp2027.uwagi', TKEY='jp2027.tryb', notes={};
  try{ notes=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){}
  function zn(){ return root.classList.contains('tryb-zn'); }
  function visible(s){ return !(zn()?s.classList.contains('only-my'):s.classList.contains('only-zn')); }
  function slides(){ return all.filter(visible); }
  var cur=all[0];
  // Ekran projektora nie przewija się: panel, który się nie mieści, zmniejsza czcionkę (najwyżej do ok. 62%).
  var narrow=window.matchMedia('(max-aspect-ratio:1/1)');
  function fit(el){
    el.style.fontSize=''; if(narrow.matches||!el.offsetParent) return;
    var base=parseFloat(getComputedStyle(el).fontSize), k=1;
    while(el.scrollHeight>el.clientHeight+1&&k>0.62){ k-=0.04; el.style.fontSize=(base*k)+'px'; }
  }
  function fitSlide(slide){ [].forEach.call(slide.querySelectorAll('.fit'),fit); }
  addEventListener('resize',function(){ fitSlide(cur); });

  function show(target){
    var list=slides(); if(list.indexOf(target)<0) target=list[0];
    cur=target;
    all.forEach(function(s){ s.classList.toggle('on',s===cur); });
    dots.forEach(function(d){ d.classList.toggle('on',d.getAttribute('href')==='#'+cur.id); });
    if(location.hash!=='#'+cur.id) history.replaceState(null,'',location.pathname+location.search+'#'+cur.id);
    if(cur.classList.contains('sum')) summary();
    fitSlide(cur);
  }
  function step(n){ var list=slides(), i=list.indexOf(cur); show(list[Math.max(0,Math.min(list.length-1,i+n))]); }
  function fromHash(){ var s=document.getElementById((location.hash||'').slice(1)); show(s&&s.classList.contains('slide')?s:all[0]); }

  function setMode(m){
    root.classList.toggle('tryb-zn',m==='zn');
    try{ localStorage.setItem(TKEY,m); }catch(e){}
    [].forEach.call(document.querySelectorAll('[data-tryb]'),function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-tryb')===m)); });
    show(cur);
  }
  [].forEach.call(document.querySelectorAll('[data-tryb]'),function(b){ b.addEventListener('click',function(){ setMode(b.getAttribute('data-tryb')); }); });
  var tb=document.getElementById('tryb'); if(tb) tb.addEventListener('click',function(){ setMode(zn()?'my':'zn'); });

  // punkty dnia w trybie przeglądu
  function pick(slide,i){
    var btns=[].slice.call(slide.querySelectorAll('.pick')), arts=[].slice.call(slide.querySelectorAll('.step'));
    if(!btns.length) return;
    i=Math.max(0,Math.min(btns.length-1,i));
    btns.forEach(function(b,n){ b.classList.toggle('on',n===i); b.setAttribute('aria-pressed',String(n===i)); });
    arts.forEach(function(a,n){ a.classList.toggle('on',n===i); });
    var box=btns[i].closest('.panel'); if(box){ var r=btns[i].getBoundingClientRect(), p=box.getBoundingClientRect(); if(r.bottom>p.bottom||r.top<p.top) btns[i].scrollIntoView({block:'nearest'}); }
    var det=slide.querySelector('.detail'); if(det) fit(det);
  }
  function picked(slide){ var b=slide.querySelector('.pick.on'); return b?+b.getAttribute('data-i'):0; }
  [].forEach.call(document.querySelectorAll('.pick'),function(b){ b.addEventListener('click',function(){ pick(b.closest('.slide'),+b.getAttribute('data-i')); }); });

  function typing(e){ var t=e.target; return t&&(t.tagName==='TEXTAREA'||t.tagName==='INPUT'); }
  addEventListener('keydown',function(e){
    if(typing(e)){ if(e.key==='Escape') e.target.blur(); return; }
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    var review=!zn()&&cur.querySelector('.pick');
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ e.preventDefault(); step(1); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); step(-1); }
    else if(review&&e.key==='ArrowDown'){ e.preventDefault(); pick(cur,picked(cur)+1); }
    else if(review&&e.key==='ArrowUp'){ e.preventDefault(); pick(cur,picked(cur)-1); }
    else if(e.key==='Home'){ show(slides()[0]); } else if(e.key==='End'){ var l=slides(); show(l[l.length-1]); }
    else if(e.key==='f'||e.key==='F'){ full(); }
    else if(e.key==='t'||e.key==='T'){ setMode(zn()?'my':'zn'); }
  });
  addEventListener('hashchange',fromHash);
  function full(){ var d=document.documentElement; if(document.fullscreenElement){ document.exitFullscreen(); } else if(d.requestFullscreen){ d.requestFullscreen().catch(function(){}); } }
  var fb=document.getElementById('full'); if(fb) fb.addEventListener('click',full);
  var pb=document.getElementById('prev'), nb=document.getElementById('next');
  if(pb) pb.addEventListener('click',function(){ step(-1); });
  if(nb) nb.addEventListener('click',function(){ step(1); });

  // notatki: kilka pól może mieć ten sam klucz (dzień w obu trybach), więc synchronizujemy je
  var areas=[].slice.call(document.querySelectorAll('textarea[data-key]'));
  areas.forEach(function(a){
    var k=a.getAttribute('data-key'); a.value=notes[k]||'';
    a.addEventListener('input',function(){
      if(a.value.trim()) notes[k]=a.value; else delete notes[k];
      areas.forEach(function(b){ if(b!==a&&b.getAttribute('data-key')===k) b.value=a.value; });
      try{ localStorage.setItem(KEY,JSON.stringify(notes)); }catch(e){}
    });
  });
  function collect(){
    var out=[], seen={};
    areas.forEach(function(a){ var k=a.getAttribute('data-key'); if(seen[k]) return; seen[k]=1; var v=(notes[k]||'').trim(); if(v) out.push(a.getAttribute('data-title')+'\n'+v); });
    return out.join('\n\n');
  }
  function summary(){
    var box=document.getElementById('summary'); if(!box) return;
    var t=collect(); box.textContent=t||'Nie ma jeszcze żadnych notatek. Wpisuje się je w polu po prawej stronie slajdów dni.';
  }
  var cp=document.getElementById('copy'), dl=document.getElementById('save'), msg=document.getElementById('msg');
  function say(t){ if(msg){ msg.textContent=t; setTimeout(function(){ msg.textContent=''; },2500); } }
  if(cp) cp.addEventListener('click',function(){
    var t=collect(); if(!t){ say('Brak notatek do skopiowania.'); return; }
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ say('Skopiowano.'); },function(){ say('Nie udało się skopiować; użyj pobierania.'); }); }
    else say('Ta przeglądarka nie pozwala kopiować; użyj pobierania.');
  });
  if(dl) dl.addEventListener('click',function(){
    var t=collect(); if(!t){ say('Brak notatek do pobrania.'); return; }
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/plain;charset=utf-8'})); a.download='japonia-2027-notatki.txt';
    document.body.appendChild(a); a.click(); a.remove();
  });
  [].forEach.call(document.querySelectorAll('[data-tryb]'),function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-tryb')===(zn()?'zn':'my'))); });
  fromHash();
})();
