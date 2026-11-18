export const TABS=[
 {id:'scan',icon:'camera',label:'현장 접수',role:'cashier',roleLabel:'담당'},
 {id:'inspect',icon:'clipboard',label:'입고 점검',role:'am',roleLabel:'AM'},
 {id:'status',icon:'chart',label:'처리 현황',role:'manager',roleLabel:'점장'}
];
export function normalizeRoute(route){return TABS.some(tab=>tab.id===route)?route:'scan';}
export function tabForPage(page,{historyTab='status',ticketTab='scan'}={}){
 if(page==='history')return normalizeRoute(historyTab);
 if(page==='ticket')return normalizeRoute(ticketTab);
 if(page==='review'||page==='success')return 'scan';
 return normalizeRoute(page);
}
export function roleForTab(tabId){return TABS.find(tab=>tab.id===tabId)?.role||'cashier';}
