/** Generate a text-only, self-restoring source package for Hostinger's staged editor.
 * It contains only tracked files from a pinned, already validated commit.
 * Temporary output is deployment material, not a new canonical codebase.
 */
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const commit=process.argv[2];
const destination=process.argv[3];
if(!/^[a-f0-9]{40}$/.test(commit||'')||!destination)throw new Error('Provide a full pinned commit and a temporary output directory');
const files=execFileSync('git',['ls-tree','-r','--name-only',commit],{encoding:'utf8'}).trim().split('\n');
const source={};
for(const path of files){if(path==='.env'||path.startsWith('.git/')||path.includes('..')||path.startsWith('/'))throw new Error('Unsafe source path');const bytes=execFileSync('git',['show',commit+':'+path]);source[path]=/\.(webp|png|jpg|jpeg|woff2)$/.test(path)?{encoding:'base64',data:bytes.toString('base64')}:bytes.toString('utf8');}
const payload=JSON.stringify(source);
const digest=createHash('sha256').update(payload).digest('hex');
const packed=gzipSync(Buffer.from(payload)).toString('base64');
const restore=`import {mkdir,writeFile,readFile} from 'node:fs/promises';\nimport {resolve,dirname,sep} from 'node:path';\nimport {createHash} from 'node:crypto';\nimport {spawnSync} from 'node:child_process';\nimport {gunzipSync} from 'node:zlib';\nconst source=JSON.parse(gunzipSync(Buffer.from('${packed}','base64')).toString('utf8'));\nconst expected='${digest}';\nif(createHash('sha256').update(JSON.stringify(source)).digest('hex')!==expected)throw new Error('Source package checksum mismatch');\nconst root=process.cwd();\nconst manifest=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));\nif(manifest.name!=='credit-champion')throw new Error('Wrong application');\nfor(const [path,content] of Object.entries(source)){const target=resolve(root,path);if(!target.startsWith(root+sep)||path==='.env'||path.startsWith('.git/'))throw new Error('Invalid destination');await mkdir(dirname(target),{recursive:true});await writeFile(target,typeof content==='string'?content:Buffer.from(content.data,'base64'));}\nconsole.log('Restored validated Credit Champion source ${commit}');\nfor(const args of [['ci'],['run','typecheck']]){const result=spawnSync('npm',args,{stdio:'inherit',env:{...process.env,NPM_CONFIG_INCLUDE:'dev'}});if(result.status!==0)process.exit(result.status||1);}
const unit=spawnSync(process.execPath,['--import','tsx','--test','tests/engine.test.ts','tests/funding.test.ts','tests/tools.test.ts','tests/workflow.test.ts'],{stdio:'inherit',env:process.env});if(unit.status!==0)process.exit(unit.status||1);
const build=spawnSync('npm',['run','build'],{stdio:'inherit',env:process.env});if(build.status!==0)process.exit(build.status||1);\n`;
const stagedManifest=JSON.parse(source['package.json']);stagedManifest.scripts.build='node restore-release.mjs';
await mkdir(destination,{recursive:true});
await writeFile(resolve(destination,'package.json'),JSON.stringify(stagedManifest,null,2)+'\n');
await writeFile(resolve(destination,'restore-release.mjs'),restore);
console.log(JSON.stringify({commit,sourceFiles:files.length,sha256:digest,output:resolve(destination)}));
