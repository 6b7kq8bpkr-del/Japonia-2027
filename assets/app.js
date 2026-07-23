document.addEventListener('keydown',function(e){
  if(e.target.matches('input,textarea')) return;
  if(e.key==='ArrowRight'){var n=document.getElementById('navNext'); if(n&&n.href) location.href=n.href;}
  if(e.key==='ArrowLeft'){var p=document.getElementById('navPrev'); if(p&&p.href) location.href=p.href;}
});
var bt=document.getElementById('totop');
if(bt){addEventListener('scroll',function(){bt.classList.toggle('show',scrollY>500);});
  bt.addEventListener('click',function(){scrollTo({top:0,behavior:'smooth'});});}
var on=document.querySelector('.pills a.on'); if(on&&on.scrollIntoView) on.scrollIntoView({inline:'center',block:'nearest'});
