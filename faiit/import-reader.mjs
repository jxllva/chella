/* File bytes are processed locally. OCR/PDF dependencies are served by this site. */
let ocrScript;
function loadOCR(){if(globalThis.Tesseract)return Promise.resolve();return ocrScript??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('vendor/ocr/tesseract.min.js',import.meta.url).href;s.onload=resolve;s.onerror=()=>{ocrScript=null;reject(Error('Could not load the receipt reader. Check your connection and retry.'))};document.head.append(s)})}
async function recognize(image,onProgress){await loadOCR();let worker;try{worker=await Tesseract.createWorker('eng',1,{workerPath:new URL('vendor/ocr/worker.min.js',import.meta.url).href,corePath:new URL('vendor/ocr/core',import.meta.url).href,langPath:new URL('vendor/ocr/lang',import.meta.url).href,logger:m=>{if(m.status==='recognizing text')onProgress('Reading receipt '+Math.round(m.progress*100)+'%')}});const {data}=await worker.recognize(image);return data.text}finally{if(worker)await worker.terminate()}}
// Best-effort account-holder name from statement text: a labelled line first, then a name sitting above an address.
const NOT_NAME=/\b(bank|statement|account|summary|page|checking|savings|credit|union|card|balance|period|date|total|customer service|member|fdic|llc|inc|ltd|plc|po box|street|st\.|avenue|ave|road|rd|suite|apt|branch|routing|www|http|phone|tel|receipt|invoice|thank|coffee|cafe|café|shop|store|market|mart|restaurant|grill|kitchen|bar|pharmacy|foods?|grocery|deli|bakery|hotel|airlines?|company|co)\b/i;
const looksLikeName=l=>/^[A-Za-z][A-Za-z'.-]+(?:\s+[A-Za-z][A-Za-z'.-]*){1,3}$/.test(l)&&!NOT_NAME.test(l)&&l.length<=40;
const looksLikeAddress=l=>/^\d{1,6}\s+\S+/.test(l)||/\b(street|st|avenue|ave|road|rd|lane|ln|drive|dr|blvd|way|close|crescent|apt|suite)\b\.?/i.test(l);
export function holderName(text,statement=true){
 const lines=String(text||'').split(/\r?\n/).map(l=>l.replace(/\s{2,}/g,' ').trim()).filter(Boolean).slice(0,40);
 for(const l of lines){const m=l.match(/\b(?:account\s*holder|account\s*name|customer\s*name|prepared\s*for|statement\s*for|name)\s*[:\-]\s*([A-Za-z][A-Za-z'.-]+(?:\s+[A-Za-z][A-Za-z'.-]*){1,3})/i);if(m&&!NOT_NAME.test(m[1]))return m[1].trim()}
 if(statement)for(let i=0;i<Math.min(lines.length-1,20);i++){if(looksLikeName(lines[i])&&looksLikeAddress(lines[i+1]))return lines[i].replace(/^(mr|mrs|ms|miss|dr)\.?\s+/i,'')}
 return '';
}
export async function readFile(file,opts={},onProgress=()=>{}){
 if(file.size>15*1024*1024)throw Error('This file exceeds 15 MB. Use a smaller photo or split the statement.');
 const ext=file.name.split('.').at(-1).toLowerCase();let rows,text='';
 if(ext==='csv'){text=await file.text();rows=MWData.parseCSV(text,opts)}
 else if(ext==='txt'){text=await file.text();rows=MWData.parseText(text,opts)}
 else if(['png','jpg','jpeg','webp'].includes(ext)){text=await recognize(file,onProgress);rows=MWData.parseText(text,opts)}
 else if(ext==='pdf'){
  const pdfjs=await import(new URL('vendor/pdf/pdf.min.mjs',import.meta.url).href);pdfjs.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf/pdf.worker.min.mjs',import.meta.url).href;const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});let pdf;
  try{pdf=await task.promise;if(pdf.numPages>20)throw Error('Use a statement of 20 pages or fewer, or export it as CSV.');const pages=[];for(let n=1;n<=pdf.numPages;n++){onProgress(`Reading PDF page ${n} of ${pdf.numPages}`);const page=await pdf.getPage(n);const content=await page.getTextContent();let lines=[],lastY=null,line='';for(const item of content.items){if(!item.str)continue;const y=Math.round(item.transform[5]);if(lastY!==null&&Math.abs(y-lastY)>3){lines.push(line);line=''}line+=(line?'  ':'')+item.str;lastY=y;if(item.hasEOL){lines.push(line);line='';lastY=null}}if(line)lines.push(line);let pageText=lines.join('\n');if(pageText.replace(/\s/g,'').length<35){const viewport=page.getViewport({scale:1.7});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;pageText=await recognize(canvas,onProgress);canvas.width=canvas.height=0}pages.push(pageText);page.cleanup?.()}text=pages.join('\n');const receiptPages=pages.map(t=>{try{const r=MWData.parseText(t,opts);return r.length===1&&r[0].note.startsWith('Check the merchant')?r:null}catch{return null}});rows=receiptPages.every(Boolean)?receiptPages.flat():MWData.parseText(text,opts)}finally{await task.destroy()}
 }else throw Error('Choose CSV, PDF, TXT, JPG, PNG, or WebP. HEIC photos must be exported as JPG first.');
 if(rows.length>2000)throw Error('This file contains more than 2,000 rows. Split it into smaller statements.');
 return {rows,text,holder:ext==='csv'?'':holderName(text,ext==='pdf'||ext==='txt')};
}
