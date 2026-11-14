/** Demonstration workflow only; no live third-party actions. */
export type WorkflowState='onboarding'|'awaiting_consent'|'analyzing'|'needs_evidence'|'awaiting_customer_approval'|'awaiting_compliance_review'|'ready_to_submit'|'submitted'|'awaiting_response'|'closed';
export type WorkflowEvent='identity_verified'|'consent_granted'|'analysis_completed'|'evidence_received'|'customer_approved'|'compliance_approved'|'submission_recorded'|'response_received'|'close';
const transitions:Partial<Record<WorkflowState,Partial<Record<WorkflowEvent,WorkflowState>>>>={
 onboarding:{identity_verified:'awaiting_consent'},
 awaiting_consent:{consent_granted:'analyzing'},
 analyzing:{analysis_completed:'needs_evidence'},
 needs_evidence:{evidence_received:'awaiting_customer_approval'},
 awaiting_customer_approval:{customer_approved:'awaiting_compliance_review'},
 awaiting_compliance_review:{compliance_approved:'ready_to_submit'},
 ready_to_submit:{submission_recorded:'submitted'},
 submitted:{response_received:'awaiting_response'},
 awaiting_response:{close:'closed'}
};
export function advance(state:WorkflowState,event:WorkflowEvent):WorkflowState {
 const next=transitions[state]?.[event];
 if(!next)throw new Error(`Transition ${state} -> ${event} is not allowed`);
 return next;
}
export function scheduledTasks(day:number) {
 if(!Number.isInteger(day)||day<1||day>90)throw new Error('Invalid day');
 const tasks=['Review dashboard and outstanding customer requests'];
 if(day===1)tasks.push('Complete identity, consent and disclosures');
 if([7,14,30,45,60,75,90].includes(day))tasks.push('Review evidence and case status; never auto-resubmit');
 if([30,60,90].includes(day))tasks.push('Compare new report only when authorized and available');
 if(day===90)tasks.push('Generate 90-day summary without promising a score increase');
 return {day,tasks};
}
