// These panels sit over the scene, so let visitors reveal controls only when
// needed while keeping all controls available to keyboard and screen readers.
const stopsToggle=document.getElementById('street-stops-toggle');
const stopsList=document.getElementById('street-stop-list');
const editToggle=document.getElementById('edit-panel-toggle');
const editContent=document.getElementById('edit-panel-content');
const editPanel=document.getElementById('edit-panel');

// Arrow/WASD keys on a focused control should not also move the walker.
for(const panel of [document.getElementById('street-stops'),editPanel]){
  panel.addEventListener('keydown',event=>{
    if(event.target.closest('button,summary') &&
      ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'].includes(event.code))event.stopPropagation();
  });
}

function setStopsExpanded(expanded){
  stopsList.hidden=!expanded;
  stopsToggle.setAttribute('aria-expanded',String(expanded));
}
stopsToggle.addEventListener('click',()=>setStopsExpanded(stopsList.hidden));
stopsList.addEventListener('click',event=>{
  if(!event.target.closest('button'))return;
  setStopsExpanded(false);
  // Continue walking immediately with WASD/arrows after a destination is
  // selected, including when selection was made with the keyboard.
  document.getElementById('world').focus({preventScroll:true});
});

editToggle.addEventListener('click',()=>{
  const expanded=editContent.hidden;
  editContent.hidden=!expanded;
  editToggle.setAttribute('aria-expanded',String(expanded));
  editToggle.setAttribute('aria-label',expanded?'配置パネルをたたむ':'配置パネルを開く');
  editToggle.innerHTML=expanded?'たたむ <span aria-hidden="true">⌄</span>':'開く <span aria-hidden="true">⌃</span>';
  editPanel.classList.toggle('is-collapsed',!expanded);
  if(!expanded)editPanel.scrollTop=0;
});
