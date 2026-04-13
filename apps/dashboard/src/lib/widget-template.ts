export function getWidgetScript(
  slug: string,
  primaryColor: string,
  bookingUrl: string
): string {
  return `(function(){
  if(document.getElementById('hotelos-widget-root'))return;

  var SLUG='${slug}';
  var COLOR='${primaryColor}';
  var BOOKING_URL='${bookingUrl}';

  var host=document.createElement('div');
  host.id='hotelos-widget-root';
  host.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
  document.body.appendChild(host);

  var shadow=host.attachShadow({mode:'open'});

  var tomorrow=new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  var dayAfter=new Date();
  dayAfter.setDate(dayAfter.getDate()+2);

  function fmt(d){return d.toISOString().split('T')[0];}

  var state={
    checkin:fmt(tomorrow),
    checkout:fmt(dayAfter),
    adults:2,
    children:0,
    minimized:false
  };

  function render(){
    shadow.innerHTML='';

    var style=document.createElement('style');
    style.textContent=\`
      *{margin:0;padding:0;box-sizing:border-box;}
      .hw-bar{background:#fff;border-top:1px solid #e2e8f0;padding:12px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 -4px 16px rgba(0,0,0,.08);}
      .hw-field{display:flex;flex-direction:column;gap:2px;}
      .hw-label{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
      .hw-input{border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;color:#1e293b;outline:none;background:#f8fafc;min-width:0;}
      .hw-input:focus{border-color:\${COLOR};box-shadow:0 0 0 2px \${COLOR}22;}
      .hw-num{display:flex;align-items:center;gap:6px;}
      .hw-num-btn{width:28px;height:28px;border-radius:50%;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:#475569;}
      .hw-num-btn:hover{background:#e2e8f0;}
      .hw-num-val{font-size:14px;font-weight:600;color:#1e293b;min-width:20px;text-align:center;}
      .hw-cta{background:\${COLOR};color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:opacity .2s;}
      .hw-cta:hover{opacity:.9;}
      .hw-close{background:none;border:none;cursor:pointer;font-size:18px;color:#94a3b8;padding:4px;line-height:1;}
      .hw-close:hover{color:#475569;}
      .hw-fab{position:fixed;bottom:20px;right:20px;background:\${COLOR};color:#fff;border:none;border-radius:50px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:transform .2s;}
      .hw-fab:hover{transform:scale(1.05);}
      @media(max-width:640px){
        .hw-bar{flex-direction:column;align-items:stretch;gap:8px;padding:12px;}
        .hw-row{display:flex;gap:8px;}
        .hw-row>.hw-field{flex:1;}
        .hw-cta{width:100%;}
      }
    \`;
    shadow.appendChild(style);

    if(state.minimized){
      var fab=document.createElement('button');
      fab.className='hw-fab';
      fab.textContent='Reservar';
      fab.onclick=function(){state.minimized=false;render();};
      shadow.appendChild(fab);
      return;
    }

    var bar=document.createElement('div');
    bar.className='hw-bar';

    // Check-in
    var f1=document.createElement('div');
    f1.className='hw-field';
    f1.innerHTML='<span class="hw-label">Llegada</span>';
    var i1=document.createElement('input');
    i1.type='date';i1.className='hw-input';i1.value=state.checkin;
    i1.onchange=function(e){state.checkin=e.target.value;};
    f1.appendChild(i1);

    // Check-out
    var f2=document.createElement('div');
    f2.className='hw-field';
    f2.innerHTML='<span class="hw-label">Salida</span>';
    var i2=document.createElement('input');
    i2.type='date';i2.className='hw-input';i2.value=state.checkout;
    i2.onchange=function(e){state.checkout=e.target.value;};
    f2.appendChild(i2);

    // Adults
    var f3=document.createElement('div');
    f3.className='hw-field';
    f3.innerHTML='<span class="hw-label">Adultos</span>';
    var n3=document.createElement('div');
    n3.className='hw-num';
    var m3=document.createElement('button');m3.className='hw-num-btn';m3.textContent='-';
    m3.onclick=function(){if(state.adults>1){state.adults--;render();}};
    var v3=document.createElement('span');v3.className='hw-num-val';v3.textContent=state.adults;
    var p3=document.createElement('button');p3.className='hw-num-btn';p3.textContent='+';
    p3.onclick=function(){if(state.adults<10){state.adults++;render();}};
    n3.appendChild(m3);n3.appendChild(v3);n3.appendChild(p3);
    f3.appendChild(n3);

    // Children
    var f4=document.createElement('div');
    f4.className='hw-field';
    f4.innerHTML='<span class="hw-label">Menores</span>';
    var n4=document.createElement('div');
    n4.className='hw-num';
    var m4=document.createElement('button');m4.className='hw-num-btn';m4.textContent='-';
    m4.onclick=function(){if(state.children>0){state.children--;render();}};
    var v4=document.createElement('span');v4.className='hw-num-val';v4.textContent=state.children;
    var p4=document.createElement('button');p4.className='hw-num-btn';p4.textContent='+';
    p4.onclick=function(){if(state.children<10){state.children++;render();}};
    n4.appendChild(m4);n4.appendChild(v4);n4.appendChild(p4);
    f4.appendChild(n4);

    // CTA
    var cta=document.createElement('button');
    cta.className='hw-cta';
    cta.textContent='Ver disponibilidad';
    cta.onclick=function(){
      var url=BOOKING_URL+'/'+SLUG+'/search?checkin='+state.checkin+'&checkout='+state.checkout+'&adults='+state.adults+'&children='+state.children;
      window.open(url,'_blank');
    };

    // Close
    var cls=document.createElement('button');
    cls.className='hw-close';
    cls.innerHTML='&#x2715;';
    cls.title='Minimizar';
    cls.onclick=function(){state.minimized=true;render();};

    // Build mobile-friendly layout
    var row1=document.createElement('div');
    row1.className='hw-row';
    row1.appendChild(f1);row1.appendChild(f2);

    var row2=document.createElement('div');
    row2.className='hw-row';
    row2.appendChild(f3);row2.appendChild(f4);

    bar.appendChild(row1);
    bar.appendChild(row2);
    bar.appendChild(cta);
    bar.appendChild(cls);
    shadow.appendChild(bar);
  }

  render();
})();`;
}
