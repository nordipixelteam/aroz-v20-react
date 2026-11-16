import type { NextConfig } from 'next';
import {assertDatabaseEnvironment} from './db/environment.mjs';

assertDatabaseEnvironment();

const nextConfig: NextConfig = {
  trailingSlash: true,
  async headers(){
    return process.env.AVAULT_ENV==='staging'?[{source:'/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}]:[];
  },
};

export default nextConfig;
