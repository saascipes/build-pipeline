import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from '@/store/types';
import { quoteStore } from '@/store/quote/index';
import { stockSubscriptionStore } from '@/store/stockSubscription/index';

Vue.use(Vuex);

const store: StoreOptions<RootState> = {
    strict: false, //the @BindSelectedCopy covers this concern process.env.NODE_ENV !== 'production',

    state: {
        version: '1.0.0'
    },

    modules: {       
        quoteStore,
        stockSubscriptionStore
    }
};

export default new Vuex.Store<RootState>(store);
