import os from 'os';

try {
  if (typeof os.hostname === 'function') {
    os.hostname = () => 'github';
  }
} catch (e) {
  // ignore if unable to override
}

process.env.COMPUTERNAME = 'GITHUB';
process.env.USERDOMAIN = 'GITHUB';
process.env.USERDOMAIN_ROAMINGPROFILE = 'GITHUB';
process.env.USER = 'github';
process.env.USERNAME = process.env.USERNAME || 'github';
