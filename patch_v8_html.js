const fs = require('fs');

const filePath = 'public/assets/aistudio/KARAOKE_LECTOR_INCLUSIVO_V8.HTML';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Controls Toolbar with live rhythm stepper (+/-) and rate indicator
const oldControls = `<select class="r-speed" onchange="Reader.speedChanged(this)" style="width:auto"><option value="super">🐌 Superlenta</option><option value="muy">🐢 Muy lenta</option><option value="lenta">🚶 Lenta</option><option value="media" selected>🏃 Media</option><option value="rapida">⚡ Rápida</option></select></div>`;
const newControls = `<select class="r-speed" onchange="Reader.speedChanged(this)" style="width:auto"><option value="super">🐌 Superlenta</option><option value="muy">🐢 Muy lenta</option><option value="lenta">🚶 Lenta</option><option value="media" selected>🏃 Media</option><option value="rapida">⚡ Rápida</option></select><button class="btn ghost sm" type="button" onclick="Reader.adjustSpeed(-0.1)" title="Más lento">🐢 -</button><span class="r-rate-txt" style="font-weight:bold;font-size:0.85rem;min-width:32px;text-align:center">1.0x</span><button class="btn ghost sm" type="button" onclick="Reader.adjustSpeed(0.1)" title="Más rápido">+ 🐇</button></div>`;

if (content.includes(oldControls)) {
  content = content.replace(oldControls, newControls);
  console.log('✅ Added live rhythm buttons to toolbar');
}

// 2. AdjustSpeed and rate calculator with userRate
const targetSpeedLogic = `speedChangedLogic(){
    const was=this.playing;
    const curW=(this.units[this.idx]&&this.units[this.idx].w!=null)?this.units[this.idx].w:(this.units[this.idx]&&this.units[this.idx].f!=null&&this.sents[this.units[this.idx].f]?this.sents[this.units[this.idx].f].wids[0]:0);
    if(was)this.pause();
    this.build(curW);
    if(was){this.playing=true;this.updateButtons();this.speakCurrent();}else{this.render();}
  },`;

const adjustSpeedCode = `  adjustSpeed(delta){
    this.userRate=clamp(parseFloat(((this.userRate||1.0)+delta).toFixed(2)),0.4,2.0);
    document.querySelectorAll('.r-rate-txt').forEach(el=>el.textContent=this.userRate.toFixed(1)+'x');
    toast('⚡ Ritmo: '+Math.round(this.rate()*100)+'%');
    if(this.playing){clearTimeout(this.timer);try{speechSynthesis.cancel();}catch(e){}this.speakCurrent();}
  },
  ` + targetSpeedLogic;

if (content.includes(targetSpeedLogic)) {
  content = content.replace(targetSpeedLogic, adjustSpeedCode);
  console.log('✅ Added adjustSpeed method');
}

// 3. Rate calculation honoring userRate
const oldRate = `rate(){const sp=$('#ctrls-top .r-speed')?$('#ctrls-top .r-speed').value:'media';return sp==='super'?0.55:sp==='muy'?0.70:sp==='lenta'?0.85:sp==='rapida'?1.30:1.00;}`;
const newRate = `rate(){const sp=$('#ctrls-top .r-speed')?$('#ctrls-top .r-speed').value:'media';const base=sp==='super'?0.55:sp==='muy'?0.70:sp==='lenta'?0.85:sp==='rapida'?1.30:1.00;return clamp(parseFloat((base*(this.userRate||1.0)).toFixed(2)),0.4,2.0);}`;

if (content.includes(oldRate)) {
  content = content.replace(oldRate, newRate);
  console.log('✅ Updated rate() to support live cadence changes');
}

// 4. Update build(preserveWord) to preserve reading position
const oldBuild = `  build(){
    this.words=[];this.sents=[];this.syls=[];this.paras=[];this.units=[];this.idx=0;if(!this.text)return;`;

const newBuild = `  build(preserveWord){
    this.words=[];this.sents=[];this.syls=[];this.paras=[];this.units=[];if(!this.text)return;`;

if (content.includes(oldBuild)) {
  content = content.replace(oldBuild, newBuild);
  // Also update end of build() to find match
  content = content.replace(`    this.makeUnits();\n  },`, `    this.makeUnits();
    if(preserveWord!=null&&this.units.length){
      const match=this.units.findIndex(u=>u.w!=null?u.w>=preserveWord:(u.f!=null&&this.sents[u.f]?this.sents[u.f].wids.includes(preserveWord):false));
      this.idx=match>=0?match:0;
    }else{this.idx=0;}
  },`);
  console.log('✅ Updated build(preserveWord) to keep place during reading');
}

// 5. Update paintStep for stepped pyramid / escalera mode
const oldPaintStep = `paintStep(i){const box=$('#r-ladder');if(!box)return;const u=this.units[i];if(!u)return;if(this.mode==='escalera'){this.ladder.push(u.parts.join(' '));if(u.step===1)this.ladder=[u.parts.join(' ')];box.innerHTML=this.ladder.map((t,k)=>'<div class="'+(k===this.ladder.length-1?'now':'')+'">'+esc(t)+'</div>').join('');}else{const arr=[];for(let k=1;k<=u.step;k++)arr.push(u.parts.slice(0,k).join(' '));box.innerHTML=arr.map((t,k)=>'<div class="'+(k===arr.length-1?'now':'')+'">'+esc(t)+'</div>').join('');}},`;
const newPaintStep = `paintStep(i){const box=$('#r-ladder');if(!box)return;const u=this.units[i];if(!u||!u.parts)return;const arr=[];for(let k=1;k<=u.step;k++)arr.push(u.parts.slice(0,k).join(' '));box.innerHTML=arr.map((t,k)=>'<div class="'+(k===arr.length-1?'now':'')+'">'+esc(t)+'</div>').join('');},`;

if (content.includes(oldPaintStep)) {
  content = content.replace(oldPaintStep, newPaintStep);
  console.log('✅ Enhanced paintStep for pyramid mode');
}

fs.writeFileSync(filePath, content, 'utf8');
fs.copyFileSync(filePath, 'dist/assets/aistudio/KARAOKE_LECTOR_INCLUSIVO_V8.HTML');
console.log('✅ Successfully synced KARAOKE_LECTOR_INCLUSIVO_V8.HTML to public and dist');
