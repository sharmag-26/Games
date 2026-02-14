(function(){
  if(typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.innerHTML = `
  #touch-controls{position:fixed;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:18px;z-index:9998;pointer-events:none}
  .touch-pad{pointer-events:auto;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);padding:10px;border-radius:12px;display:flex;gap:8px;align-items:center}
  .touch-btn{width:56px;height:56px;border-radius:10px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;user-select:none}
  .touch-dir{display:flex;gap:6px}
  #touch-toggle{position:fixed;right:12px;bottom:12px;padding:8px 10px;background:rgba(0,0,0,0.6);color:#fff;border-radius:8px;z-index:10001;font-size:13px}
  @media(min-width:900px){#touch-controls{display:none}}`;
  document.head.appendChild(style);

  function dispatchKey(type, key, code){
    const ev = new KeyboardEvent(type, {key:key,code:code,which: key && key.length===1?key.charCodeAt(0):0,bubbles:true,cancelable:true});
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
  }

  function makeButton(label, key, code){
    const el = document.createElement('div');
    el.className = 'touch-btn';
    el.innerText = label;

    function onPress(e){ e.preventDefault(); dispatchKey('keydown', key, code); el.classList.add('active'); }
    function onRelease(e){ e.preventDefault(); dispatchKey('keyup', key, code); el.classList.remove('active'); }

    ['touchstart','mousedown'].forEach(evt => el.addEventListener(evt, onPress));
    ['touchend','mouseup','touchcancel','mouseleave'].forEach(evt => el.addEventListener(evt, onRelease));
    return el;
  }

  // Create control layout
  const container = document.createElement('div');
  container.id = 'touch-controls';

  const leftPad = document.createElement('div'); leftPad.className='touch-pad';
  const dir = document.createElement('div'); dir.className='touch-dir';
  dir.appendChild(makeButton('◀', 'ArrowLeft','ArrowLeft'));
  dir.appendChild(makeButton('▲', 'ArrowUp','ArrowUp'));
  dir.appendChild(makeButton('▶', 'ArrowRight','ArrowRight'));
  leftPad.appendChild(dir);

  const actionPad = document.createElement('div'); actionPad.className='touch-pad';
  actionPad.appendChild(makeButton('A', ' ', 'Space')); // primary action (space)
  actionPad.appendChild(makeButton('B', 'x', 'KeyX')); // secondary action (dash/shoot)
  actionPad.appendChild(makeButton('G', 'g', 'KeyG')); // glide
  actionPad.appendChild(makeButton('S', 'Shift', 'ShiftLeft')); // shield

  container.appendChild(leftPad);
  container.appendChild(actionPad);

  // Helper: decide whether to show controls automatically
  function isTouchDevice(){ return ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints>0); }
  const urlParams = (typeof URLSearchParams !== 'undefined') ? new URLSearchParams(location.search) : null;
  const forceShow = urlParams && (urlParams.get('touch') === '1' || urlParams.get('forceTouch') === '1');

  // Append controls when appropriate
  function showControls(){ if(!document.body.contains(container)) document.body.appendChild(container); }
  function hideControls(){ if(document.body.contains(container)) container.remove(); }

  if(isTouchDevice() || forceShow) {
    showControls();
  } else {
    // Provide a manual toggle for desktops or Windows touchscreens that don't report touch
    const toggle = document.createElement('button');
    toggle.id = 'touch-toggle';
    toggle.innerText = 'Show Touch Controls';
    toggle.onclick = function(){
      if(document.body.contains(container)){
        hideControls();
        toggle.innerText = 'Show Touch Controls';
      } else {
        showControls();
        toggle.innerText = 'Hide Touch Controls';
      }
    };
    document.addEventListener('DOMContentLoaded', ()=> document.body.appendChild(toggle));
    if(document.readyState === 'complete' || document.readyState === 'interactive') document.body.appendChild(toggle);
  }

  // Prevent accidental scrolling during touch controls interaction
  container.addEventListener('touchstart', e=>{ e.preventDefault(); }, {passive:false});

})();
