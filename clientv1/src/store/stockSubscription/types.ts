import { Model } from '@/store/types'

export interface StockSubscription extends Model {
  ticker: string;
  expires: number;
}