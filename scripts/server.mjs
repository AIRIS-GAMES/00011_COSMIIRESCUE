import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createReadStream} from 'node:fs';
const root=process.cwd(),port=Number(process.env.PORT||5180);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.json':'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const relative=path.relative(root,file).split(path.sep).join('/');
 // LAN preview serves game content, not repository metadata, logs or local data.
 if(relative!=='index.html'&&relative!=='scripts/audio-check.html'&&!/^(src|Asset|dist)\//.test(relative)){res.writeHead(404);res.end('Not found');return;}
 if(relative.split('/').some(part=>part.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
 const info=await stat(file);if(!info.isFile())throw Error();
 const headers={'Content-Type':path.extname(file).toLowerCase()==='.mp4'?'video/mp4':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
 let start=0,end=info.size-1,code=200;
 if(req.headers.range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
  if(!match[1])start=Math.max(0,info.size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
  if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
  code=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
 }
 headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(code,headers);
 if(req.method==='HEAD'||!info.size){res.end();return;}
 const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'0.0.0.0',()=>console.log(`COSMII FLY! ready: http://localhost:${port}`));
