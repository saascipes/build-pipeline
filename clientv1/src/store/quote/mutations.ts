import { MutationTree } from 'vuex';
import { CoreState } from '@/store/types';
import { Quote } from './types';

// You can't invoke mutations from other mutations via Vuex but you can directly invoke them
import {mutations as coreMutations} from '@/store/core/mutations';

export const mutations: MutationTree<CoreState> = {  
  addModels(state: CoreState, models: Quote[]){
    coreMutations.addModels(state, models);
  },

  select(state: CoreState, model: Quote){
    coreMutations.select(state, model);
  },

  update(state: CoreState, model: Quote){
    coreMutations.update(state, model);
  },

  updateSelectedCopy(state: CoreState, updated: Quote){    
    coreMutations.updateSelectedCopy(state, updated);
  },

  delete(state: CoreState, model: Quote) {    
    coreMutations.delete(state, model);
  }
};