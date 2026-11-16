import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {hiddenPasswordSession} from './hidden-password.mjs';

const dummy='DummyPassword123!';
function fixture(tty=true){
 const input=new PassThrough();const modes=[];let output='';
 input.isTTY=tty;input.isRaw=false;
 input.setRawMode=value=>{input.isRaw=value;modes.push(value)};
 const session=hiddenPasswordSession(input,{write(value){output+=value}});
 return {input,modes,session,output:()=>output};
}

for(const ending of ['\r','\n','\r\n']){
 test(`two hidden prompts with ${JSON.stringify(ending)}`,async()=>{
  const f=fixture();
  try{
   const first=f.session.ask('Password: ');f.input.write(dummy+ending);
   assert.equal(await first,dummy);
   const second=f.session.ask('Repeat password: ');f.input.write(dummy+ending);
   assert.equal(await second,dummy);
   assert.deepEqual(f.modes,[true]);
   assert.equal(f.output(),'Password: \nRepeat password: \n');
  }finally{f.session.close()}
  assert.deepEqual(f.modes,[true,false]);
  assert.equal(f.input.listenerCount('data'),0);
  assert.equal(f.input.isPaused(),true);
 });
}

test('split CR/LF does not submit an empty repeat password',async()=>{
 const f=fixture();
 try{
  const first=f.session.ask('Password: ');f.input.write(dummy+'\r');assert.equal(await first,dummy);
  const second=f.session.ask('Repeat password: ');let resolved=false;second.then(()=>{resolved=true});
  f.input.write('\n');await Promise.resolve();assert.equal(resolved,false);
  f.input.write(dummy+'\r');assert.equal(await second,dummy);
 }finally{f.session.close()}
});

test('piped input preserves both lines in the same chunk',async()=>{
 const f=fixture(false);
 try{
  const first=f.session.ask('Password: ');f.input.write(dummy+'\r\n'+dummy+'\r\n');
  assert.equal(await first,dummy);assert.equal(await f.session.ask('Repeat password: '),dummy);
  assert.deepEqual(f.modes,[]);
 }finally{f.session.close()}
});

test('backspace works and different input remains different',async()=>{
 const f=fixture();
 try{
  const first=f.session.ask('Password: ');f.input.write(dummy+'xy\b\u007f\r');assert.equal(await first,dummy);
  const second=f.session.ask('Repeat password: ');f.input.write('DifferentPassword!\r');assert.notEqual(await second,dummy);
  assert.equal(f.output().includes(dummy),false);
 }finally{f.session.close()}
});

test('Ctrl+C restores terminal mode without revealing input',async()=>{
 const f=fixture();const result=f.session.ask('Password: ');
 f.input.write(dummy+'\u0003');
 await assert.rejects(result,error=>error.exitCode===130);
 assert.deepEqual(f.modes,[true,false]);assert.equal(f.output().includes(dummy),false);
});

test('EOF rejects incomplete input and restores terminal mode',async()=>{
 const f=fixture();const result=f.session.ask('Password: ');
 f.input.end('unfinished');await assert.rejects(result,/Input ended/);
 assert.deepEqual(f.modes,[true,false]);
});
