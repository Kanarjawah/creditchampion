import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHash,createHmac,createCipheriv,createDecipheriv} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export const randomToken=()=>randomBytes(32).toString('base64url');
export const tokenHash=(value:string)=>createHash('sha256').update(value).digest('hex');
export function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${key.toString('hex')}`;}
export async function passwordValid(password:string,hash:string){const [method,salt,key]=hash.split(':');if(method!=='scrypt'||!salt||!key)return false;const actual=await scrypt(password,salt,64) as Buffer;return equal(actual.toString('hex'),key);}
export function cipher(key:string){
 const bytes=Buffer.from(key,'base64');if(bytes.length!==32)throw new Error('Encryption key must decode to 32 bytes');
 return {
  encrypt(value:string){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',bytes,iv);const data=Buffer.concat([c.update(value,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),data]).toString('base64');},
  decrypt(value:string){const b=Buffer.from(value,'base64'),d=createDecipheriv('aes-256-gcm',bytes,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8');},
  lookup(value:string){return createHmac('sha256',bytes).update(value).digest('hex');}
 };
}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newTotpSecret(){let out='',bits=0,buffer=0;for(const byte of randomBytes(20)){buffer=(buffer<<8)|byte;bits+=8;while(bits>=5){bits-=5;out+=alphabet[(buffer>>>bits)&31];}}return out;}
function decodeBase32(value:string){let buffer=0,bits=0;const bytes:number[]=[];for(const char of value){const n=alphabet.indexOf(char);if(n<0)throw new Error('Invalid secret');buffer=(buffer<<5)|n;bits+=5;if(bits>=8){bits-=8;bytes.push((buffer>>>bits)&255);}}return Buffer.from(bytes);}
export function totp(secret:string,counter:number){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=createHmac('sha1',decodeBase32(secret)).update(b).digest();const offset=h[19]&15;return ((h.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');}
export function verifyTotp(secret:string,code:string,now=Date.now(),lastCounter=-1){const counter=Math.floor(now/30000);for(const n of [counter-1,counter,counter+1])if(n>lastCounter&&equal(totp(secret,n),code))return n;return null;}
