import type {FundingProduct} from './funding.js';
/** Illustrative directory entries only. No underwriting or live offer feed. Verification dates are deliberately empty until sources are reviewed. All product details must be reverified with lender. */
export const fundingProducts:FundingProduct[]=[
 {id:'sba-7a',institution:'U.S. Small Business Administration',name:'7(a) Loan Program',kind:'business_loan',officialUrl:'https://www.sba.gov/funding-programs/loans/7a-loan-program',verifiedAt:'',sourceNote:'Program directory entry; lenders set their own underwriting requirements'},
 {id:'sba-micro',institution:'U.S. Small Business Administration',name:'Microloan Program',kind:'business_loan',officialUrl:'https://www.sba.gov/funding-programs/loans/microloans',verifiedAt:'',sourceNote:'Program directory entry; apply through intermediary lenders'},
 {id:'grants-gov',institution:'Grants.gov',name:'Federal Grants Search',kind:'grant',officialUrl:'https://www.grants.gov/search-grants',verifiedAt:'',sourceNote:'Search portal, not a grant offer or award guarantee'},
 {id:'cdfi-directory',institution:'CDFI Fund',name:'Community Development Lender Directory',kind:'business_loan',officialUrl:'https://www.cdfifund.gov/',verifiedAt:'',sourceNote:'Institution discovery, not a loan product or offer'}
];
