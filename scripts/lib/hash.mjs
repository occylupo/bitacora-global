import { createHash } from 'node:crypto';
export function seal(id, value, date){
  return createHash('sha256').update(`${id}|${value}|${date}`).digest('hex').slice(0,6);
}
