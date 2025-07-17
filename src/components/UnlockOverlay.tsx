import React from 'react';

export function UnlockOverlay({visible,onClick}:{visible:boolean;onClick:()=>void;}){
  if(!visible) return null;
  return (
    <div
      style={{
        position:'fixed',inset:0,
        background:'rgba(0,0,0,0.45)',
        color:'#fff',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        flexDirection:'column',
        zIndex:9999,
        cursor:'pointer',
        userSelect:'none'
      }}
      onClick={onClick}
      onPointerDown={onClick}
    >
      <h1>Audio-Visual Ambientalizer</h1>
      <p>Clicca per avviare audio &amp; visual.</p>
      <p style={{fontSize:'0.8em',opacity:0.7}}>(please, proceed)</p>
      <button style={{marginTop:'1rem',padding:'0.4rem 20rem'}}>Start</button>
    </div>
  );
}
