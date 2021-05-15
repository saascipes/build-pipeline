import { Model } from '@/store/types'

export interface Quote extends Model {
  ticker: string;
  last: number;
  bid: number;
  bidSize: number;
  ask: number;
  askSize: number;
  time: number;
  wpx: number;
}