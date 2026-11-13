// Pure helper, safe to import from AVAULT's browser code.
// A short, readable browser / OS / device label. Good enough to tell a phone lead from a desktop one.
export function describeAgent(ua=''){
 const browser=/Edg\//.test(ua)?'Edge':/OPR\/|Opera/.test(ua)?'Opera':/SamsungBrowser/.test(ua)?'Samsung Internet':/Firefox\//.test(ua)?'Firefox':/CriOS|Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'';
 const os=/Windows NT/.test(ua)?'Windows':/iPhone|iPad|iPod/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Mac OS X/.test(ua)?'macOS':/CrOS/.test(ua)?'ChromeOS':/Linux/.test(ua)?'Linux':'';
 const device=/iPad|Tablet/.test(ua)?'Tablet':/Mobi|iPhone|Android/.test(ua)?'Mobile':ua?'Desktop':'';
 return [browser,os,device].filter(Boolean).join(' · ')||'Unknown';
}
