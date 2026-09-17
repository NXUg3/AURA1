export function el(tag,text='',props={}){const n=document.createElement(tag);if(text)n.textContent=text;Object.assign(n,props);return n;}
export function button(text,action,disabled=false){const b=el('button',text,{type:'button',disabled});b.addEventListener('click',action);return b;}
export function image(src,alt){const i=el('img','',{src,alt});i.addEventListener('error',()=>{i.hidden=true;i.title=alt;},{once:true});return i;}
export function group(className,...children){const n=el('div','',{className});n.append(...children);return n;}
