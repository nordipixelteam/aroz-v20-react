import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const consumer=createRequire(require.resolve('@typescript-eslint/typescript-estree/package.json'));

test('only the TypeScript ESLint matcher receives the security override',()=>{
 assert.equal(consumer('minimatch/package.json').version,'11.0.1');
 assert.equal(require('minimatch/package.json').version,'3.1.5');
});

test('patched matcher retains the named API and dot-file semantics used by ESLint',()=>{
 const {minimatch}=consumer('minimatch');
 for(const [file,pattern,expected] of [['example.ts','*.ts',true],['.example.ts','*.ts',true],['example.js','*.ts',false],['app/page.tsx','app/*.tsx',true],['app/nested/page.tsx','app/*.tsx',false],['app/nested/page.tsx','**/*.tsx',true]])assert.equal(minimatch(file,pattern,{dot:true}),expected);
});

test('TypeScript ESLint project service parses a file admitted through the overridden matcher',()=>{
 const directory=path.resolve('.avault-kit/dependency-compatibility');fs.mkdirSync(directory,{recursive:true});
 const file=path.join(directory,'fixture.ts'),source='const compatibilityCheck: number = 1;';fs.writeFileSync(file,source);
 try{
  const result=require('@typescript-eslint/parser').parseForESLint(source,{filePath:file,tsconfigRootDir:process.cwd(),projectService:{allowDefaultProject:['.avault-kit/dependency-compatibility/fixture.ts']},sourceType:'module',ecmaVersion:'latest'});
  assert.equal(result.ast.type,'Program');assert.ok(result.services.program);
 }finally{fs.unlinkSync(file)}
});
