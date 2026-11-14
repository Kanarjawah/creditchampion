export type FundingKind='business_line'|'business_loan'|'personal_line'|'personal_loan'|'grant'|'vehicle_loan';
export type FundingProduct={id:string;institution:string;name:string;kind:FundingKind;officialUrl:string;minimumScore?:number;minimumAnnualRevenue?:number;minimumYearsBusiness?:number;minAmount?:number;maxAmount?:number;states?:string[];requiresPersonalGuarantee?:boolean;verifiedAt:string;sourceNote:string;entryType?:'product'|'program'|'directory';eligibilityVerified?:boolean;expiresAt?:string};
export type FundingProfile={purpose:'business'|'personal';state:string;creditScore?:number;annualRevenue?:number;yearsBusiness?:number;desiredAmount?:number};
export type Match={product:FundingProduct;status:'possible'|'needs_review'|'does_not_match';reasons:string[]};
export function matchFunding(profile:FundingProfile,products:FundingProduct[],now:Date=new Date()):Match[]{
 return products.map((product):Match=>{
 const reasons:string[]=[];let excluded=false;
 const business=product.kind==='business_line'||product.kind==='business_loan'||product.kind==='grant'||product.kind==='vehicle_loan';
 if((profile.purpose==='business')!==business){excluded=true;reasons.push('Different funding category')}
 if(product.states?.length && !product.states.includes(profile.state.toUpperCase())){excluded=true;reasons.push('Outside listed service area')}
 if(product.minimumScore!==undefined){if(profile.creditScore===undefined)reasons.push('Credit score needed for preliminary review');else if(profile.creditScore<product.minimumScore){excluded=true;reasons.push('Below published credit score guideline')}}
 if(product.minimumAnnualRevenue!==undefined){if(profile.annualRevenue===undefined)reasons.push('Business revenue information needed');else if(profile.annualRevenue<product.minimumAnnualRevenue){excluded=true;reasons.push('Below published revenue guideline')}}
 if(product.minimumYearsBusiness!==undefined){if(profile.yearsBusiness===undefined)reasons.push('Time in business needed');else if(profile.yearsBusiness<product.minimumYearsBusiness){excluded=true;reasons.push('Below published business age guideline')}}
 if(profile.desiredAmount!==undefined){if(product.minAmount!==undefined&&profile.desiredAmount<product.minAmount){excluded=true;reasons.push('Requested amount below product range')}if(product.maxAmount!==undefined&&profile.desiredAmount>product.maxAmount){excluded=true;reasons.push('Requested amount above product range')}}
 const checkedAt=Date.parse(product.verifiedAt);
 if(!Number.isFinite(checkedAt)||checkedAt>now.getTime()||now.getTime()-checkedAt>90*86400000)reasons.push('Provider details require re-verification');
 if(product.entryType&&product.entryType!=='product')reasons.push('Program or directory only; lender-specific review needed');
 if(product.eligibilityVerified===false)reasons.push('Full eligibility, costs, guarantees and service area review needed');
 if(product.expiresAt){const expiry=Date.parse(product.expiresAt);if(!Number.isFinite(expiry)||expiry<=now.getTime()){excluded=true;reasons.push('Opportunity expired or expiration date invalid')}}
 if(!reasons.length)reasons.push('Preliminary criteria appear compatible; lender makes final decision');
 return {product,status:excluded?'does_not_match':reasons.some(r=>/needed|re-verification/.test(r))?'needs_review':'possible',reasons};
 }).sort((a,b)=>({possible:0,needs_review:1,does_not_match:2}[a.status]-{possible:0,needs_review:1,does_not_match:2}[b.status]));
}
