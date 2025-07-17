import React from 'react';
export function ChainHeader({
  label, order, maxOrder, onOrderChange,
}:{
  label:string;
  order:number;
  maxOrder:number;
  onOrderChange:(n:number)=>void;
}){
  return (
    <div style={{display:'flex',alignItems:'center',margin:'0.25rem 0'}}>
      <div style={{flex:'0 0 auto',width:'2rem',textAlign:'right',marginRight:'0.5rem'}}>
        <select value={order} onChange={e=>onOrderChange(parseInt(e.target.value,10))}>
          {Array.from({length:maxOrder},(_,i)=>i+1).map(n=>
            <option key={n} value={n}>{n}</option>
          )}
        </select>
      </div>
      <strong style={{flex:'1 1 auto'}}>{label}</strong>
    </div>
  );
}
