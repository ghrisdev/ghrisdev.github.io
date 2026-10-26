'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const viewer = $('#image-dialog'), motion = window.Motion, effects = new Set();
let content, stopReveals=()=>{}, returnFocus, toastTimer, playing=!reduced.matches, motionVisible=false, reelPage=0, reelActive=0;
let gallerySlides=[], galleryIndex=0, galleryTitle='';
const reelSize=4;
function animate(elements,keyframes,options={}) {
  if(reduced.matches||!motion)return;
  const animation=motion.animate(elements,keyframes,{duration:.65,ease:[.22,1,.36,1],...options});
  effects.add(animation);animation.finished.then(()=>effects.delete(animation)).catch(()=>effects.delete(animation));return animation;
}
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
function image(src,alt,dimensions) {
  const img=new Image();img.src=src;img.alt=alt;img.draggable=false;img.decoding='async';
  if(dimensions){img.width=dimensions.width;img.height=dimensions.height;}return img;
}
function credit(){const span=document.createElement('span');span.className='art-credit';span.textContent='ghris · portfolio preview';span.setAttribute('aria-hidden','true');return span;}
function addSwipe(element,onSwipe) {
  let start;
  element.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
  element.addEventListener('pointerup',e=>{
    if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;start=null;
    if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.4){element.dataset.swiped='true';onSwipe(x<0?1:-1);setTimeout(()=>delete element.dataset.swiped,150);}
  });
  element.addEventListener('pointercancel',()=>start=null);
}
function showViewerSlide(){
  const slide=gallerySlides[galleryIndex];$('#viewer-image').src=slide.src;$('#viewer-image').alt=slide.label;
  $('#viewer-label').textContent=galleryTitle;$('#viewer-counter').textContent=`${galleryIndex+1} / ${gallerySlides.length} · ${slide.label}`;
  $('#viewer-prev').hidden=$('#viewer-next').hidden=gallerySlides.length<2;
  $('.image-stage').classList.remove('actual');animate($('#viewer-image'),{opacity:[0,1],scale:[.97,1]},{duration:.35});
}
function openGallery(slides,index,title){
  returnFocus=document.activeElement;gallerySlides=slides;galleryIndex=index;galleryTitle=title;
  showViewerSlide();viewer.showModal();$('.close-viewer').focus();
}
function stepViewer(direction){galleryIndex=(galleryIndex+direction+gallerySlides.length)%gallerySlides.length;showViewerSlide();}
function closeViewer(){viewer.close();$('#viewer-image').removeAttribute('src');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
$('.close-viewer').addEventListener('click',closeViewer);viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
$('#viewer-prev').addEventListener('click',()=>stepViewer(-1));$('#viewer-next').addEventListener('click',()=>stepViewer(1));
$('.image-stage').addEventListener('click',e=>{if($('.image-stage').dataset.swiped)return;if(e.target===$('#viewer-image'))$('.image-stage').classList.toggle('actual');else closeViewer();});
addSwipe($('.image-stage'),stepViewer);
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stepViewer(1);}if(e.key==='ArrowLeft'){e.preventDefault();stepViewer(-1);}});
function selectedProjects(){
  const material=$('#filter-material').value,theme=$('#filter-theme').value,animation=$('#filter-motion').value;
  let projects=content.projects.filter(p=>(!material||p.tags.includes(material))&&(!theme||p.tags.includes(theme))&&(!animation||(animation==='animated'?p.motionIds.length:!p.motionIds.length)));
  if($('#sort-work').value==='az')projects.sort((a,b)=>a.title.localeCompare(b.title));
  if($('#sort-work').value==='motion')projects.sort((a,b)=>b.motionIds.length-a.motionIds.length);
  return projects;
}
function revealWork(){
  stopReveals();if(reduced.matches||!motion)return;
  stopReveals=motion.inView('.work-piece',element=>{animate(element,{opacity:[0,1],y:[35,0]},{duration:.85});},{amount:.06});
}
function renderProjects(){
  $('#project-grid').replaceChildren();const projects=selectedProjects();
  $('#work-status').textContent=`${projects.length} ${projects.length===1?'collection':'collections'}`;
  $('#reset-filters').hidden=!$$('.filter-fields select').some(s=>s.value&&s.value!=='featured');
  if(!projects.length){const empty=document.createElement('div');empty.className='empty-work';empty.textContent='No work matches those tags. Try another combination or reset the filters.';$('#project-grid').append(empty);return;}
  for(const project of projects){
    const figure=document.createElement('figure');figure.className='work-piece'+(project.id!=='kurohana'&&project.slides[0].image.width/project.slides[0].image.height>2.4?' compact':'');figure.dataset.project=project.id;
    const stage=document.createElement('div');stage.className='project-stage protected-art';stage.style.setProperty('--art-ratio',`${project.slides[0].image.width}/${project.slides[0].image.height}`);
    const main=document.createElement('button');main.className='artwork-button';main.type='button';main.setAttribute('aria-label',`Enlarge ${project.title}`);
    const cover=project.slides[0];const art=image(reduced.matches&&cover.poster?cover.poster:cover.image.src,`${project.title} · ${cover.label}`,cover.image);art.loading='lazy';main.append(art);stage.append(main,credit());
    let index=0;
    const controls=document.createElement('div');controls.className='project-controls';
    const prev=document.createElement('button'),next=document.createElement('button'),counter=document.createElement('span');prev.type=next.type='button';prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label',`Previous ${project.title} image`);next.setAttribute('aria-label',`Next ${project.title} image`);counter.setAttribute('aria-live','polite');
    const update=direction=>{index=(index+direction+project.slides.length)%project.slides.length;const slide=project.slides[index];art.src=reduced.matches&&slide.poster?slide.poster:slide.image.src;art.alt=`${project.title} · ${slide.label}`;counter.textContent=`${slide.label} · ${index+1}/${project.slides.length}`;animate(art,{opacity:[.15,1],x:[direction*12,0]},{duration:.45});};
    update(0);prev.addEventListener('click',()=>update(-1));next.addEventListener('click',()=>update(1));controls.append(prev,counter,next);controls.hidden=project.slides.length<2;
    addSwipe(main,update);main.addEventListener('click',()=>{if(main.dataset.swiped)return;openGallery(project.slides.map(s=>({src:reduced.matches&&s.poster?s.poster:s.image.src,label:s.label})),index,project.title);});
    main.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover)').matches)animate(art,{scale:1.012},{duration:.5});});main.addEventListener('pointerleave',()=>animate(art,{scale:1},{duration:.5}));
    const caption=document.createElement('figcaption'),tagList=document.createElement('div');tagList.className='project-tags';
    for(const tag of project.tags){const chip=document.createElement('button');chip.type='button';chip.textContent=tag;chip.setAttribute('aria-label',`Filter by ${tag}`);chip.addEventListener('click',()=>{const select=['Ink','Pixel','Parchment'].includes(tag)?$('#filter-material'):$('#filter-theme');select.value=tag;renderProjects();});tagList.append(chip);}
    caption.append(tagList);
    if(project.motionIds.length){const badge=document.createElement('a');badge.className='animated-badge';badge.href='#motion';badge.innerHTML='<span class="badge-spark" aria-hidden="true">✧</span><span>ANIMATED / FLIPBOOK</span><span aria-hidden="true">↗</span>';badge.addEventListener('click',()=>{const i=content.motion.findIndex(m=>m.project===project.id);reelPage=Math.floor(i/reelSize);reelActive=i%reelSize;renderReel();});caption.append(badge);}
    figure.append(stage,controls,caption);$('#project-grid').append(figure);
  }
  revealWork();
}
function reelItems(){return content.motion.slice(reelPage*reelSize,reelPage*reelSize+reelSize);}
function activeReel(index){
  reelActive=index;const items=reelItems();
  $$('.motion-panel').forEach((panel,i)=>{panel.classList.toggle('active',i===index);panel.setAttribute('aria-label',`${items[i].title}${i===index?' — enlarged preview':' — expand preview'}`);});
  $('#motion-active-label').textContent=items[index].title;
}
function updateReelPlayback(){
  const items=reelItems();$$('.motion-panel img').forEach((img,i)=>{const src=playing&&motionVisible&&!document.hidden?items[i].src:items[i].poster;if(img.getAttribute('src')!==src)img.src=src;});
  $('#motion-play').textContent=playing?'Pause animations Ⅱ':'Play animations ▷';$('#motion-play').setAttribute('aria-pressed',String(playing));
}
function renderReel(){
  $('.motion-reel').replaceChildren();const items=reelItems();reelActive=Math.min(reelActive,items.length-1);
  items.forEach((m,i)=>{
    const panel=document.createElement('button');panel.type='button';panel.className=`motion-panel ${m.type}`;
    const img=image(m.poster,`${m.title} flipbook preview`);panel.append(img,credit());
    const label=document.createElement('span');label.className='panel-label';label.textContent=m.title;
    const number=document.createElement('span');number.className='panel-number';number.textContent=String(reelPage*reelSize+i+1).padStart(2,'0');panel.append(label,number);
    let pointerHadActive=true;panel.addEventListener('pointerdown',()=>{pointerHadActive=i===reelActive;});
    panel.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover)').matches)activeReel(i);});
    panel.addEventListener('focus',()=>activeReel(i));
    panel.addEventListener('click',()=>{if(!pointerHadActive||i!==reelActive){pointerHadActive=true;activeReel(i);return;}openGallery(items.map(x=>({src:playing&&!reduced.matches?x.src:x.poster,label:x.title})),i,'Flipbook animations');});
    panel.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;activeReel(next);$$('.motion-panel')[next].focus();}});
    $('.motion-reel').append(panel);
  });
  activeReel(reelActive);updateReelPlayback();$('#reel-page').textContent=`${reelPage+1} / ${Math.ceil(content.motion.length/reelSize)}`;
  animate($$('.motion-panel'),{opacity:[0,1],y:[16,0]},{duration:.6,delay:motion?.stagger(.06)});
}
function initializeMotion(){
  renderReel();$('#motion-play').addEventListener('click',()=>{playing=!playing;updateReelPlayback();});
  const step=direction=>{reelPage=(reelPage+direction+Math.ceil(content.motion.length/reelSize))%Math.ceil(content.motion.length/reelSize);reelActive=0;renderReel();};
  $('#motion-prev').addEventListener('click',()=>step(-1));$('#motion-next').addEventListener('click',()=>step(1));
  addSwipe($('.motion-reel'),step);
  new IntersectionObserver(entries=>{motionVisible=entries[0].isIntersecting;updateReelPlayback();},{threshold:.08}).observe($('.motion-section'));
  document.addEventListener('visibilitychange',updateReelPlayback);
}
reduced.addEventListener('change',()=>{playing=!reduced.matches;if(reduced.matches){stopReveals();for(const effect of effects)effect.complete();effects.clear();}if(content)updateReelPlayback();});
// Preview deterrents apply only to artwork; links, forms, text, and keyboard navigation stay usable.
document.addEventListener('contextmenu',e=>{if(e.target.closest('.protected-art, .motion-reel'))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(e.target.closest('.protected-art, .motion-reel'))e.preventDefault();});
function emailDraftURL(name,email,message){
  const subject=`Roblox UI project inquiry — ${name.trim()}`;
  const body=`Hi ghris,\r\n\r\n${message.trim()}\r\n\r\nFrom: ${name.trim()}\r\nReply email: ${email.trim()}`;
  return `mailto:ghris1107@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
$('#contact-form').addEventListener('submit',e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const name=$('#contact-name').value,email=$('#contact-email').value,message=$('#contact-message').value;if(!name.trim()||!message.trim()){$('#draft-status').textContent='Please add your name and a little about the project.';(!name.trim()?$('#contact-name'):$('#contact-message')).focus();return;}$('#draft-status').textContent='Review your draft in your email app, then send. Your message stays here.';window.location.href=emailDraftURL(name,email,message);});
$$('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);toast('Copied — ghrisdev');}catch{toast('Discord — ghrisdev');}}));
async function start(){
  try{
    const response=await fetch('content.json');if(!response.ok)throw new Error('Collection unavailable');content=await response.json();
    renderProjects();initializeMotion();$$('.filter-fields select').forEach(select=>select.addEventListener('change',renderProjects));$('#reset-filters').addEventListener('click',()=>{$$('.filter-fields select').forEach(s=>s.selectedIndex=0);renderProjects();});
    animate($$('.hero > .eyebrow, .hero h1, .hero-bottom'),{opacity:[0,1],y:[32,0]},{duration:1,delay:motion?.stagger(.12)});
    if(motion&&!reduced.matches)motion.inView('.contact-section, .motion-section',element=>{animate(element,{opacity:[0,1],y:[25,0]},{duration:.85});},{amount:.08});
    document.body.dataset.ready='true';const anchor=['#top','#work','#process','#motion','#contact'].includes(location.hash)?$(location.hash):null;anchor?.scrollIntoView({behavior:'instant'});
  }catch(error){$('#project-grid').textContent='The work could not be loaded. Please refresh or email ghris1107@gmail.com.';console.error(error);}
}
start();
