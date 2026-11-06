// Round-number celebrations during a run: every 50 points (50, 100, 150 …); multiples of 100 are the big ones.
export const MILESTONE_STEP=50;
export function milestoneCrossed(before,after,step=MILESTONE_STEP){const a=Math.floor(Math.max(0,before)/step),b=Math.floor(Math.max(0,after)/step);return b>a&&b>0?b*step:0;}
export const isBigMilestone=value=>value>0&&value%100===0;
