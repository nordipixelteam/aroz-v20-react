// Keep one raw-mode session across both prompts. In particular, Windows stdin
// must not switch back to cooked mode while the next read is being started.
export function hiddenPasswordSession(input=process.stdin,output=process.stdout){
 const wasRaw=Boolean(input.isRaw);
 let pending='',active,closed=false,skipLF=false,discarding=false;
 input.setEncoding('utf8');
 if(input.isTTY)input.setRawMode(true);
 function fail(error){const current=active;active=undefined;close();current?.reject(error)}
 function drain(){
  while(active&&pending){
   const char=pending[0];pending=pending.slice(1);
   if(skipLF){skipLF=false;if(char==='\n')continue}
   if(char==='\u0003'){fail(Object.assign(new Error('Password entry cancelled.'),{exitCode:130}));return}
   if(char==='\r'||char==='\n'){
    skipLF=char==='\r';
    const current=active;active=undefined;output.write('\n');current.resolve(current.value);return;
   }
   if(char==='\u007f'||char==='\b')active.value=Array.from(active.value).slice(0,-1).join('');
   else active.value+=char;
  }
 }
 function onData(chunk){if(discarding)return;pending+=chunk;drain()}
 function onEnd(){fail(new Error('Input ended before password entry was complete.'))}
 function onError(error){fail(error)}
 function close(){
  if(closed)return;
  closed=true;input.pause();input.off('data',onData);input.off('end',onEnd);input.off('error',onError);
  if(input.isTTY)input.setRawMode(wasRaw);
 }
 input.on('data',onData);input.on('end',onEnd);input.on('error',onError);input.resume();
 return {
  // Discard pasted command tails before showing the first password prompt.
  async discardTypeahead(){discarding=true;pending='';await new Promise(resolve=>setTimeout(resolve,300));discarding=false},
  ask(question){
   if(closed)return Promise.reject(new Error('Password input is closed.'));
   if(active)return Promise.reject(new Error('A password prompt is already active.'));
   output.write(question);
   return new Promise((resolve,reject)=>{active={resolve,reject,value:''};drain()});
  },
  close,
 };
}
