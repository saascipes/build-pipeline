import Vue from 'vue';
import Router, { Route } from 'vue-router';
import { StoreType } from '@/store/types';
import store from '@/store';
import _ from 'lodash';
import { SgAlert, AlertPlacement, AlertCategory } from "@/store/alert/types";

Vue.use(Router);

// helper to auto-save the selected script copy shadow code if it's changed
const tryToSaveScriptEdits = async (next: (options?: any) => {}) => {
  try {
    if(store.state[StoreType.ScriptShadowStore].storeUtils.hasSelectedCopyChanged()){
      // try to save the script's shadow copy
      await store.dispatch(`${StoreType.ScriptShadowStore}/save`);
      store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert(`Saved a backup of script`, AlertPlacement.FOOTER));
    }
  }
  catch(err){
    console.error(err);
    store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert(`Failed to save a backup of script`, AlertPlacement.FOOTER, AlertCategory.ERROR));
  }
  finally {
    return next(true);
  }
};


const router = new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
  ]
});

router.beforeEach(async (to: Route, from: Route, next: (options?: any) => void) => { 
  let shouldCancel = false;
  
  // Need to intercept if a beforeLeave/beforeEnter handler cancelled the navigation
  const nextInterceptor = (options: any) => {    
    if(_.isBoolean(options) && !options){
      shouldCancel = true;
    }

    next(options);
  };

  if(!shouldCancel && from.meta.beforeLeave){
    await from.meta.beforeLeave(to, from, nextInterceptor);
  }

  if (!shouldCancel && to.meta.beforeEnter) {
    await to.meta.beforeEnter(to, from, nextInterceptor);
  }
  
  if(!shouldCancel){
    next();
  }  
});

router.afterEach(async (to: Route, from: Route) => {

  if (to.meta.afterEnter) {
    await to.meta.afterEnter(to, from);
  }
});

export default router;
