// Browser validation strings otherwise follow the visitor's browser language,
// rather than the page's lang attribute. Keep the site's default feedback English.
(() => {
 const managed=new WeakSet();
 document.addEventListener('invalid',event=>{
  const field=event.target;
  if(!field||typeof field.setCustomValidity!=='function')return;
  if(managed.has(field))field.setCustomValidity('');
  const v=field.validity;
  if(v.customError)return;
  const message=v.valueMissing?(field.type==='checkbox'?'Please confirm this option.':'Please fill in this field.'):
   v.typeMismatch?(field.type==='email'?'Please enter a valid email address.':'Please enter a valid website address.'):
   v.tooShort?`Please use at least ${field.minLength} characters.`:
   v.tooLong?`Please use no more than ${field.maxLength} characters.`:
   v.patternMismatch?'Please use the requested format.':
   v.rangeUnderflow?`Please enter a value of at least ${field.min}.`:
   v.rangeOverflow?`Please enter a value no greater than ${field.max}.`:
   v.badInput||v.stepMismatch?'Please enter a valid value.':'';
  if(message){field.setCustomValidity(message);managed.add(field)}
 },true);
 document.addEventListener('input',event=>{if(managed.has(event.target)){event.target.setCustomValidity('');managed.delete(event.target)}},true);
 document.addEventListener('change',event=>{if(managed.has(event.target)){event.target.setCustomValidity('');managed.delete(event.target)}},true);
})();
