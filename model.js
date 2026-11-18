import {CATALOG} from './catalog.js';
const DEMO=[
 {kind:'missing',status:'바코드 미등록',reason:'상품 옵션의 바코드 등록 내역을 확인해 주세요.',detail:'이 상품 옵션이 eCvan 바코드 등록 내역에서 누락된 상황을 가정한 예시예요.',action:'바코드 등록 확인',owner:'협력사 상품 MD',checks:[['상품 정보','등록됨'],['바코드 등록','해당 옵션 확인 필요'],['바이어 결재','등록 보완 후 확인']]},
 {kind:'approval',status:'바이어 결재 대기',reason:'eCvan 내 바이어 결재 상태를 확인해 주세요.',detail:'상품과 바코드는 등록됐지만, 바이어 결재가 완료되지 않은 상황을 가정한 예시예요.',action:'바이어 결재 확인',owner:'이마트 바이어',checks:[['상품 정보','등록됨'],['바코드 등록','등록됨'],['바이어 결재','대기'],['판매 가능 상태','결재 후 확인']]},
 {kind:'store',status:'점포 단품 미추가',reason:'광주점의 판매 단품 등록 여부를 확인해 주세요.',detail:'공통 상품 정보는 있지만 광주점 판매 단품은 추가되지 않은 상황을 가정한 예시예요.',action:'점포 단품 확인',owner:'협력사 영업 MD',checks:[['상품 정보','등록됨'],['바코드 등록','등록됨'],['광주점 단품','추가 필요']]},
 {kind:'ready',status:'판매 준비 확인',reason:'등록·바이어 결재·점포 단품 확인 완료 예시예요.',detail:'등록·바이어 결재·점포 단품을 모두 확인한 상황을 가정한 예시예요.',action:'등록 상태 보기',owner:'상품 등록 담당자',checks:[['상품 정보','등록됨'],['바코드 등록','등록됨'],['광주점 단품','등록됨'],['바이어 결재','완료']]}
];
export const PRODUCTS=CATALOG.map((p,i)=>({...p,...DEMO[i%DEMO.length]}));
export const RECIPIENTS=['이마트 바이어','협력사 영업 MD','협력사 상품 MD'];
export function ticketProductInfo(p){return {productId:p.id,productName:p.tagName,name:p.name,color:p.color,size:p.size,productCode:p.sku,productNumber:p.productNumber,barcode:p.barcode};}
export function initialState(){return {version:2,role:'cashier',roleLinked:true,requests:[],cleared:PRODUCTS.filter(p=>p.kind==='ready').map(p=>p.id),tickets:[
 {id:'OK-104',...ticketProductInfo(PRODUCTS[1]),reason:PRODUCTS[1].status,source:'입고 전 점검',resolved:false,time:'오늘 09:12'},
 ...[3,7,11].map((idx,i)=>({id:'OK-'+(103-i),...ticketProductInfo(PRODUCTS[idx]),reason:'담당자 확인 완료',source:'입고 전 점검',resolved:true,time:'이번 주'}))
]};}
function nextId(state){return 'OK-'+(Math.max(104,...state.tickets.map(t=>Number(t.id.split('-')[1])||0))+1);}
export function requestTicket(state,productId,barcode,source='계산대 접수'){
 const p=PRODUCTS.find(p=>p.id===productId);
 const existing=state.tickets.find(t=>!t.resolved&&((p&&t.productId===p.id)||(barcode&&t.barcode===barcode)));
 if(existing)return {ticket:existing,duplicate:true};
 const ticket={id:nextId(state),...(p?ticketProductInfo(p):{productId:null,name:'미등록 상품',barcode}),reason:p&&p.kind!=='ready'?p.status:'상품 확인 필요',source,resolved:false,time:'방금'};
 state.tickets.unshift(ticket);if(p){state.cleared=state.cleared.filter(id=>id!==p.id);if(!state.requests.includes(p.id))state.requests.push(p.id);}
 return {ticket,duplicate:false};
}
export function resolveTicket(state,id){const t=state.tickets.find(t=>t.id===id);if(!t||t.resolved)return false;t.resolved=true;if(t.productId&&!state.cleared.includes(t.productId))state.cleared.push(t.productId);return true;}
export function metrics(state){return {total:state.tickets.length,resolved:state.tickets.filter(t=>t.resolved).length,pending:state.tickets.filter(t=>!t.resolved).length};}
export function restoreState(raw){try{
 const s=JSON.parse(raw);if(![1,2].includes(s?.version)||!['am','cashier','manager'].includes(s.role)||!Array.isArray(s.tickets)||!Array.isArray(s.cleared)||!Array.isArray(s.requests)||s.tickets.length>100)return initialState();
 if(s.tickets.some(t=>!/^OK-\d+$/.test(t.id)||typeof t.name!=='string'||typeof t.resolved!=='boolean'))return initialState();
 if(s.version===1){
  const replacements={'OK-104':['양말 · 그레이',1],'OK-103':['코튼 타월',3],'OK-102':['수납 바스켓',7],'OK-101':['쿠션 커버',11]};
  s.tickets.forEach(t=>{const r=replacements[t.id];if(r&&t.name===r[0]&&!t.photoAttached){const p=PRODUCTS[r[1]];Object.assign(t,ticketProductInfo(p),{reason:t.resolved?'담당자 확인 완료':p.status});}else if(['navy','gray','pillow'].includes(t.productId)){t.productId=null;}});
  s.cleared=s.cleared.filter(id=>PRODUCTS.some(p=>p.id===id));s.requests=s.requests.filter(id=>PRODUCTS.some(p=>p.id===id));
  s.tickets.filter(t=>t.resolved&&t.productId).forEach(t=>{if(!s.cleared.includes(t.productId))s.cleared.push(t.productId);});
  s.version=2;delete s.grayApprovalRestored;
 }
 if(!s.roleLinked){s.role='cashier';s.roleLinked=true;}return s;
}catch{return initialState();}}
export function restoreProduct(state,id){const p=PRODUCTS.find(p=>p.id===id);if(!p)return false;state.cleared=state.cleared.filter(item=>item!==id);const ticket=state.tickets.find(t=>t.productId===id);if(ticket){ticket.resolved=false;ticket.reason=p.kind==='ready'?'상품 확인 필요':p.status;}else requestTicket(state,id,p.barcode,'입고 전 점검');return true;}
const codeKey=v=>String(v||'').trim().toUpperCase().replace(/[-\s/]/g,'');
const optionKey=v=>String(v||'').trim().toUpperCase().replace(/[\s/~()성여발길이]/g,'');
export function findCatalogProduct(fields){
 const code=codeKey(fields.productCode),color=optionKey(fields.color),size=optionKey(fields.size);
 if(!code)return null;
 const candidates=PRODUCTS.filter(p=>[p.sku,p.rawProductNumber,p.officialSku,p.productNumber].some(v=>codeKey(v)===code));
 const matches=candidates.filter(p=>(!color||[p.color,p.colorCode,p.colorCode.replaceAll('/','')].some(v=>optionKey(v)===color))&&(!size||[p.size,p.sizeCode,p.sizeCode==='FR'?'FREE':'23~25cm'].some(v=>optionKey(v)===size)));
 return matches.length===1?matches[0]:null;
}
export function requestPhotoTicket(state,fields){
 const productName=String(fields.productName||'').trim().slice(0,60),color=String(fields.color||'').trim().slice(0,40),size=String(fields.size||'').trim().slice(0,40),productCode=String(fields.productCode||'').trim().toUpperCase().slice(0,80);
 if(!productName||!color)throw new Error('상품명과 컬러를 확인해 주세요.');
 const p=findCatalogProduct({productCode,color,size});
 const existing=state.tickets.find(t=>!t.resolved&&(p?t.productId===p.id:codeKey(t.productCode)===codeKey(productCode)&&t.productName===productName&&optionKey(t.color)===optionKey(color)&&optionKey(t.size)===optionKey(size)));
 const info={...(p?ticketProductInfo(p):{productId:null}),productName,color,size,productCode,name:productName,source:'상품·택 촬영',photoAttached:true};
 if(existing){Object.assign(existing,info);return {ticket:existing,duplicate:true};}
 const ticket={id:nextId(state),...info,reason:p&&p.kind!=='ready'?p.status:'상품 확인 필요',resolved:false,time:'방금'};
 state.tickets.unshift(ticket);if(p){state.cleared=state.cleared.filter(id=>id!==p.id);if(!state.requests.includes(p.id))state.requests.push(p.id);}
 return {ticket,duplicate:false};
}
