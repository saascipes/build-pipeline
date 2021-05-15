<template>
  <div class="main" style="margin-left: 44px; margin-right: 12px; margin-top: 24px">
    <div style="font-size: 28px; margin-bottom: 12px;">
      Stock Quotes Feed
    </div>

    <div style="height: 50px; margin-top: 24px;">
      <span style="font-weight: 700; size: 20px; margin-left: 6px">
        <input id="ticker" class="input" style="width: 100px;" type="text" v-model="ticker" placeholder="ticker"/>
      </span>

      <button id="btnSubscribe" class="button is-primary button-spaced" @click="onSubscribeTickerClick">Subscribe</button>
    </div>

    <br>

    <div style="font-size: 20px; margin-bottom: 12px; margin-left: 6px;">
      Showing stock quotes for ticker <span style="font-weight: 700;">{{ticker}}</span>
    </div>

    <!-- List of jobs -->
    <table class="table is-striped">
      <thead class="thead">
        <td class="td">Time</td>
        <td class="td">Open</td>
        <td class="td">Bid</td>
        <td class="td">Bid Size</td>
        <td class="td">Ask</td>
        <td class="td">Ask Size</td>
        <td class="td" v-if="haveReceivedWpx()">Wpx</td>
      </thead>

      <tbody class="tbody">
        <tr class="tr" v-for="quote in filteredQuotes" v-bind:key="quote.id">
          <td class="td">{{momentToStringV2(quote.time)}}</td>
          <td class="td">{{quote.last}}</td>
          <td class="td">{{quote.bid}}</td>
          <td class="td">{{quote.bidSize}}</td>
          <td class="td">{{quote.ask}}</td>
          <td class="td">{{quote.askSize}}</td>
          <td class="td"><span style="font-weight:700">{{wpxToString(quote.wpx)}}</span></td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script lang="ts">
import router from './router';
import { ClickOutside } from './directive';
import { momentToStringV2 } from './utils/DateTime';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { StoreType } from './store/types';
import { enumKeyToPretty } from './utils/Enums';
import { StockSubscription } from './store/stockSubscription/types';
import { Quote } from './store/quote/types';
import { SgAlert, AlertPlacement, AlertCategory } from './store/alert/types';
import { BindSelected, BindStoreModel } from './decorator';
import { showErrors } from './utils/ErrorHandler';
import axios from 'axios';

@Component({
  directives: { ClickOutside }
})
export default class App extends Vue {
  private readonly momentToStringV2 = momentToStringV2;
  
  private get defaultStoreType(){
    return StoreType.StockSubscriptionStore;
  }

  @BindStoreModel({ storeType: StoreType.QuoteStore, selectedModelName: 'models'})
  private quotes!: Quote[];

  @BindSelected()
  private selectedQuote!: Quote;

  private ticker = '';

  private haveReceivedWpx(){
    for (let q of this.quotes) {
      if (q.wpx)
        return true;
    }
    return false;
  }

  private wpxToString(wpx){
    if (wpx)
      return wpx.toFixed(4);
    return '';
  }

  private get filteredQuotes(): Quote[]{
    const filteredQuotes: Quote[] = this.quotes.filter((quote: Quote) => {
      if (quote.ticker != this.ticker)
        return false;
      return true;
    });

    filteredQuotes.sort((a: Quote, b: Quote) => {
      return b.time - a.time;
    });
    return filteredQuotes;
  }

  private async onSubscribeTickerClick(){
    try {
      this.$store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert(`Subscribing to ticker feed ${this.ticker}`, AlertPlacement.FOOTER));
      
      await this.$store.dispatch(`${StoreType.StockSubscriptionStore}/save`, {ticker: this.ticker });

      this.$store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert(`Subscribed to ticker feed ${this.ticker}`, AlertPlacement.FOOTER));
    }
    catch(err){
      console.error(err);
      showErrors(`Error subscribing to ticker feed ${this.ticker}`, err);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  body {   font-family: 'Open Sans', 'Avenir'; }

  table {
    border-width: 0;
    margin-left: 6px;
    tr:nth-child(odd) {background: hsl(0, 0%, 98%)} // no idea why the bulma is-striped didn't work
  }

  td {
    border-width: 0 !important;
  }

  .input {
    height: 24px;
  }

  .button {
    height: 24px;
  }

  .button-spaced {
    margin-left: 8px;
  }

  .validation-error {
    margin-top: 3px;
    margin-bottom: 3px;
    padding-left: 3px;
    padding-right: 3px;
    color: $danger;
  }

</style>
