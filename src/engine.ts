export type CaseStatus = 'intake'|'needs_evidence'|'awaiting_approval'|'ready_to_send'|'submitted'|'awaiting_response'|'resolved'|'escalated';
export type Finding = {id:string;category:string;description:string;evidence:string[];verified:boolean};
export type Case = {id:string;customerId:string;status:CaseStatus;findings:Finding[];consent:boolean;approved:boolean;legalRuleVerified:boolean;delivery?:{tracking:string;sentAt:string}};
export function canSubmit(c:Case):{allowed:boolean;reasons:string[]} {
 const reasons:string[]=[];
 if(!c.consent) reasons.push('Missing customer authorization');
 if(!c.approved) reasons.push('Customer has not approved dispute');
 if(!c.legalRuleVerified) reasons.push('Legal rule not verified');
 if(!c.findings.length || c.findings.some(f=>!f.verified || !f.evidence.length || f.evidence.some(item=>!item.trim()))) reasons.push('Findings lack verified supporting evidence');
 if(c.status!=='ready_to_send') reasons.push('Case not ready to send');
 if(c.delivery) reasons.push('Already submitted');
 return {allowed:reasons.length===0,reasons};
}
export function plan90Days(day:number) {
 if(!Number.isInteger(day)||day<1||day>90) throw new Error('Day must be 1 to 90');
 if(day<=7) return {phase:'Onboarding and analysis',actions:['Verify identity and consent','Import authorized report','Collect evidence']};
 if(day<=30) return {phase:'Dispute preparation and credit habits',actions:['Review and approve evidence-based disputes','Track due dates','Review utilization']};
 if(day<=60) return {phase:'Investigation tracking',actions:['Monitor verified responses','Request missing documents','Review payment history']};
 return {phase:'Review and long-term improvement',actions:['Compare authorized report snapshots','Review resolved cases','Create next 90-day plan']};
}
