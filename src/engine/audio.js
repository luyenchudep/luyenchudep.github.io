/* ================== ÂM THANH GIẤY TỔNG HỢP (WEB AUDIO API) ================== */
let audioCtx=null,noiseGain=null,noiseFilter=null;
function ensureAudio(){
  if(!S.sound)return false;
  try{
    if(!audioCtx){
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      audioCtx=new AC();
      const buf=audioCtx.createBuffer(1,audioCtx.sampleRate,audioCtx.sampleRate),ch=buf.getChannelData(0);
      for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*0.55;
      const src=audioCtx.createBufferSource();src.buffer=buf;src.loop=true;
      noiseFilter=audioCtx.createBiquadFilter();noiseFilter.type="bandpass";noiseFilter.frequency.value=2200;noiseFilter.Q.value=1.8;
      noiseGain=audioCtx.createGain();noiseGain.gain.value=0;
      src.connect(noiseFilter);noiseFilter.connect(noiseGain);noiseGain.connect(audioCtx.destination);
      src.start();
    }
    if(audioCtx.state==="suspended")audioCtx.resume();
    return true;
  }catch(_){return false}
}
function paperSoundStep(a,b){
  if(!S.sound||!ensureAudio())return;
  const spd=Math.min(18,Math.hypot(b[0]-a[0],b[1]-a[1]));
  const pr=b[2]||.5;
  const vol=Math.min(0.065,(spd/18)*0.045*(0.45+0.9*pr));
  const freq=S.penType==="pencil"?1800+spd*90:S.penType==="brush"?1100+spd*40:2500+spd*110;
  try{
    noiseFilter.frequency.setTargetAtTime(freq,audioCtx.currentTime,0.02);
    noiseGain.gain.setTargetAtTime(vol,audioCtx.currentTime,0.015);
  }catch(_){}
}
function paperSoundStop(){
  if(noiseGain&&audioCtx){try{noiseGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.03)}catch(_){}}
}

