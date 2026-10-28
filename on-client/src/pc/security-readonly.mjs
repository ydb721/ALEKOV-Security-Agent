import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';

const execFileAsync=promisify(execFile);
const now=()=>new Date().toISOString();
const psPath=()=>join(typeof process.env.SystemRoot==='string'&&process.env.SystemRoot?process.env.SystemRoot:'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
const aborted=signal=>signal?.aborted===true;
const cancel=()=>Object.assign(new Error('cancelled'),{code:'REQUEST_CANCELLED'});
// Windows PowerShell 5.1 otherwise writes redirected stdout using the active
// console code page. Set only this child process output to UTF-8 without BOM.
const utf8Output=`$utf8NoBom=New-Object System.Text.UTF8Encoding($false); [Console]::OutputEncoding=$utf8NoBom; $OutputEncoding=$utf8NoBom; `;

const scripts=Object.freeze({
  network:`$a=@(Get-NetAdapter -ErrorAction Stop | Where-Object Status -eq 'Up' | ForEach-Object { $c=Get-NetIPConfiguration -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue; [pscustomobject]@{name=[string]$_.Name;status=[string]$_.Status;linkSpeed=[string]$_.LinkSpeed;ipConfigured=($null -ne $c -and (($c.IPv4Address|Measure-Object).Count -gt 0 -or ($c.IPv6Address|Measure-Object).Count -gt 0));dnsConfigured=($null -ne $c -and ($c.DNSServer.ServerAddresses|Measure-Object).Count -gt 0);gatewayConfigured=($null -ne $c -and (($c.IPv4DefaultGateway|Measure-Object).Count -gt 0 -or ($c.IPv6DefaultGateway|Measure-Object).Count -gt 0))} }); [pscustomobject]@{adapters=$a;tcpStates=@()}|ConvertTo-Json -Compress -Depth 4`,
  firewall:`@(Get-NetFirewallProfile -Profile Domain,Private,Public -ErrorAction Stop | ForEach-Object {[pscustomobject]@{profile=[string]$_.Name;enabled=[bool]$_.Enabled;defaultInbound=[string]$_.DefaultInboundAction;defaultOutbound=[string]$_.DefaultOutboundAction}})|ConvertTo-Json -Compress`,
  system:`$s=(Get-Date).AddHours(-24); $e=@(Get-WinEvent -FilterHashtable @{LogName='System';StartTime=$s;Level=@(2,3)} -ErrorAction Stop); [pscustomobject]@{log='System';from=$s.ToUniversalTime().ToString('o');to=(Get-Date).ToUniversalTime().ToString('o');errors=@($e|Where-Object Level -eq 2).Count;warnings=@($e|Where-Object Level -eq 3).Count}|ConvertTo-Json -Compress`,
  application:`$s=(Get-Date).AddHours(-24); $e=@(Get-WinEvent -FilterHashtable @{LogName='Application';StartTime=$s;Level=@(2,3)} -ErrorAction Stop); [pscustomobject]@{log='Application';from=$s.ToUniversalTime().ToString('o');to=(Get-Date).ToUniversalTime().ToString('o');errors=@($e|Where-Object Level -eq 2).Count;warnings=@($e|Where-Object Level -eq 3).Count}|ConvertTo-Json -Compress`,
});

async function query(kind,signal){
  if(process.platform!=='win32')throw Error('WINDOWS_UNAVAILABLE');
  if(aborted(signal))throw cancel();
  const {stdout}=await execFileAsync(psPath(),['-NoProfile','-NonInteractive','-Command',utf8Output+scripts[kind]],{windowsHide:true,timeout:5000,maxBuffer:32768,signal});
  if(aborted(signal))throw cancel();
  return JSON.parse(String(stdout));
}
const err=(code,message)=>({status:'error',error:{code,message}});
async function part(kind,signal,validate,source,scope){
  try{const data=await query(kind,signal);if(!validate(data))throw Error('invalid');return {status:'ok',data,source,scope,measuredAt:now()};}
  catch(error){if(error?.code==='REQUEST_CANCELLED'||aborted(signal))throw error;return err(error?.code==='ETIMEDOUT'?'WINDOWS_QUERY_TIMEOUT':'WINDOWS_QUERY_UNAVAILABLE',`${kind} 조회 결과를 확인할 수 없습니다.`);}
}
const text=value=>typeof value==='string'&&value.length>0&&value.length<=200;
const count=value=>Number.isSafeInteger(value)&&value>=0&&value<=1000000;
const network=value=>value&&typeof value==='object'&&Array.isArray(value.adapters)&&Array.isArray(value.tcpStates)&&value.adapters.length<=64&&value.adapters.every(x=>x&&text(x.name)&&text(x.status)&&text(x.linkSpeed)&&['boolean'].includes(typeof x.ipConfigured)&&typeof x.dnsConfigured==='boolean'&&typeof x.gatewayConfigured==='boolean')&&value.tcpStates.length<=32&&value.tcpStates.every(x=>x&&text(x.state)&&count(x.count));
const firewall=value=>Array.isArray(value)&&value.length<=3&&value.every(x=>x&&text(x.profile)&&typeof x.enabled==='boolean'&&text(x.defaultInbound)&&text(x.defaultOutbound));
const events=log=>value=>value&&value.log===log&&typeof value.from==='string'&&typeof value.to==='string'&&count(value.errors)&&count(value.warnings);

function demo(){const measuredAt=now(),event={status:'ok',data:{log:'System',from:measuredAt,to:measuredAt,errors:0,warnings:0},source:'제공 예제 데이터',scope:'최근 24시간',measuredAt};return {schema:'alekov.pc.security.v1',mode:'demo',measuredAt,network:{status:'ok',data:{adapters:[{name:'예제 어댑터',status:'Up',linkSpeed:'1 Gbps',ipConfigured:true,dnsConfigured:true,gatewayConfigured:true}],tcpStates:[]},source:'제공 예제 데이터',scope:'예제 구성',measuredAt},firewall:{status:'ok',data:[{profile:'Private',enabled:true,defaultInbound:'Block',defaultOutbound:'Allow'}],source:'제공 예제 데이터',scope:'예제 프로필',measuredAt},events:{system:event,application:{...event,data:{...event.data,log:'Application'}}}};}
export async function collectWindowsSecurity({mode='local',signal}={}){
  if(mode==='demo')return demo();
  const [networkResult,firewallResult,system,application]=await Promise.all([
    part('network',signal,network,'Windows Get-NetAdapter, Get-NetIPConfiguration','연결된 어댑터와 IP·DNS·게이트웨이 설정 여부'),
    part('firewall',signal,firewall,'Windows Get-NetFirewallProfile','Domain, Private, Public 프로필'),
    part('system',signal,events('System'),'Windows Event Log Get-WinEvent','최근 24시간 · Error(Level 2), Warning(Level 3)'),
    part('application',signal,events('Application'),'Windows Event Log Get-WinEvent','최근 24시간 · Error(Level 2), Warning(Level 3)'),
  ]);
  return {schema:'alekov.pc.security.v1',mode:'local',measuredAt:now(),network:networkResult,firewall:firewallResult,events:{system,application}};
}
