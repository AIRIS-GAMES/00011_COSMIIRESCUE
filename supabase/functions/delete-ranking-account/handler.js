// A request capability is created only by the authenticated SQL RPC.
// No caller-supplied user ID is accepted. Retries still work after Auth deletion.
export function createDeletionHandler({url,key,fetcher=fetch}) {
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 const serviceHeaders={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 return async request=>{
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply(405,{error:'METHOD_NOT_ALLOWED'});
  if(!url||!key)return reply(503,{error:'NOT_CONFIGURED'});
  try{
   const raw=await request.text();if(raw.length>256)return reply(400,{error:'INVALID_REQUEST'});
   const body=JSON.parse(raw),id=body.request_id;
   if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||Object.keys(body).some(k=>k!=='request_id'))return reply(400,{error:'INVALID_REQUEST'});
   const endpoint=url+'/rest/v1/cosmii_deletion_requests?request_id=eq.'+encodeURIComponent(id);
   const read=await fetcher(endpoint+'&select=user_id,completed',{headers:serviceHeaders,signal:AbortSignal.timeout(15000)});
   if(!read.ok)return reply(503,{error:'RETRY_LATER'});
   const rows=await read.json();if(!Array.isArray(rows)||!rows.length)return reply(404,{error:'REQUEST_NOT_FOUND'});
   const row=rows[0];if(row.completed)return reply(200,{deleted:true});
   if(row.user_id){
    const removed=await fetcher(url+'/auth/v1/admin/users/'+encodeURIComponent(row.user_id),{method:'DELETE',headers:serviceHeaders,signal:AbortSignal.timeout(15000)});
    // 404 can mean the previous request deleted Auth before its response was lost.
    if(!removed.ok&&removed.status!==404)return reply(503,{error:'RETRY_LATER'});
   }
   const marked=await fetcher(endpoint,{method:'PATCH',headers:serviceHeaders,body:JSON.stringify({completed:true,user_id:null}),signal:AbortSignal.timeout(15000)});
   if(!marked.ok)return reply(503,{error:'RETRY_LATER'});
   return reply(200,{deleted:true});
  }catch(error){return reply(error instanceof SyntaxError?400:503,{error:error instanceof SyntaxError?'INVALID_REQUEST':'RETRY_LATER'});}
 };
}
