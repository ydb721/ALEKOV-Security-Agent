import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';

const execFileAsync=promisify(execFile);
const GiB=1024 ** 3;
const CPU_SAMPLE_MS=300;

const now=()=>new Date().toISOString();
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const isAbort=signal=>signal?.aborted===true;

function cancelled(signal){
  if(isAbort(signal))throw Object.assign(new Error('PC measurement cancelled'),{code:'REQUEST_CANCELLED'});
}

function cpuSnapshot(){
  const rows=os.cpus();
  if(!Array.isArray(rows)||rows.length===0)throw Error('CPU snapshot unavailable');
  return rows.reduce((total,row)=>{
    const times=row?.times;
    if(!times||!Object.values(times).every(Number.isFinite))throw Error('CPU times unavailable');
    const all=Object.values(times).reduce((sum,value)=>sum+value,0);
    return {idle:total.idle+times.idle,total:total.total+all};
  },{idle:0,total:0});
}

function wait(ms,signal){
  return new Promise((resolve,reject)=>{
    if(isAbort(signal))return reject(Object.assign(new Error('PC measurement cancelled'),{code:'REQUEST_CANCELLED'}));
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);
    const abort=()=>{clearTimeout(timer);reject(Object.assign(new Error('PC measurement cancelled'),{code:'REQUEST_CANCELLED'}));};
    signal?.addEventListener('abort',abort,{once:true});
  });
}

async function measureCpu(signal){
  const before=cpuSnapshot();
  const startedAt=performance.now();
  await wait(CPU_SAMPLE_MS,signal);
  cancelled(signal);
  const after=cpuSnapshot();
  const elapsedMs=Math.round((performance.now()-startedAt)*10)/10;
  const total=after.total-before.total;
  const idle=after.idle-before.idle;
  if(!Number.isFinite(total)||!Number.isFinite(idle)||total<=0||idle<0||idle>total)throw Error('Invalid CPU interval');
  return {status:'ok',percent:Math.round(clamp((1-idle/total)*100,0,100)*10)/10,
    source:`node:os.cpus() CPU time delta over ${elapsedMs} ms (target ${CPU_SAMPLE_MS} ms)`,measuredAt:now()};
}

function measureMemory(){
  const totalBytes=os.totalmem(),freeBytes=os.freemem(),usedBytes=totalBytes-freeBytes;
  if(!Number.isSafeInteger(totalBytes)||!Number.isSafeInteger(freeBytes)||totalBytes<=0||freeBytes<0||freeBytes>totalBytes)throw Error('Invalid memory values');
  return {status:'ok',usedBytes,totalBytes,usedPercent:Math.round((usedBytes/totalBytes)*1000)/10,
    source:'node:os.totalmem() and node:os.freemem()',
    basis:'사용량 = 전체 물리 메모리 - OS가 현재 사용 가능으로 보고한 메모리',measuredAt:now()};
}

function systemDrive(){
  const value=process.env.SystemDrive;
  return typeof value==='string'&&/^[A-Za-z]:$/.test(value)?value.toUpperCase():'C:';
}

async function measureDisk(signal){
  if(process.platform!=='win32')throw Error('Windows system drive measurement is unavailable');
  const drive=systemDrive();
  const systemRoot=typeof process.env.SystemRoot==='string'&&process.env.SystemRoot.length>0?process.env.SystemRoot:'C:\\Windows';
  const powershell=join(systemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe');
  // drive is locally derived and constrained above; no browser value becomes a command argument.
  const script=`$d=Get-CimInstance -ClassName Win32_LogicalDisk -Filter \"DeviceID='${drive}'\"; if ($null -eq $d) { exit 3 }; [Console]::Out.Write([string]$d.FreeSpace)`;
  const {stdout}=await execFileAsync(powershell,['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:4000,maxBuffer:1024,signal});
  cancelled(signal);
  const freeBytes=Number(String(stdout).trim());
  if(!Number.isSafeInteger(freeBytes)||freeBytes<0)throw Error('Invalid disk free space');
  return {status:'ok',drive,freeBytes,source:'Windows Win32_LogicalDisk.FreeSpace (Get-CimInstance)',measuredAt:now()};
}

async function metric(work,signal,code,message){
  try{return await work(signal);}
  catch(error){
    if(error?.code==='REQUEST_CANCELLED'||isAbort(signal))throw error;
    return {status:'error',error:{code,message}};
  }
}

function demoMetrics(){
  const measuredAt=now();
  return {schema:'alekov.pc.status.v1',mode:'demo',measuredAt,metrics:{
    cpu:{status:'ok',percent:18.4,source:'제공 예제 데이터',measuredAt},
    memory:{status:'ok',usedBytes:6*GiB,totalBytes:16*GiB,usedPercent:37.5,source:'제공 예제 데이터',basis:'예제: 전체 물리 메모리 - 사용 가능 메모리',measuredAt},
    disk:{status:'ok',drive:'C:',freeBytes:120*GiB,source:'제공 예제 데이터',measuredAt},
  }};
}

export async function collectPcStatus({mode='local',signal}={}){
  if(mode==='demo')return demoMetrics();
  cancelled(signal);
  // Disk CIM starts only after the CPU interval is complete, so this process
  // does not add its own PowerShell startup cost to the CPU sample.
  const cpu=await metric(measureCpu,signal,'CPU_MEASUREMENT_UNAVAILABLE','CPU 사용률을 측정할 수 없습니다.');
  const [memory,disk]=await Promise.all([
    metric(()=>measureMemory(),signal,'MEMORY_MEASUREMENT_UNAVAILABLE','메모리 사용량을 측정할 수 없습니다.'),
    metric(measureDisk,signal,'DISK_MEASUREMENT_UNAVAILABLE','시스템 드라이브 여유 공간을 측정할 수 없습니다.'),
  ]);
  return {schema:'alekov.pc.status.v1',mode:'local',measuredAt:now(),metrics:{cpu,memory,disk}};
}
