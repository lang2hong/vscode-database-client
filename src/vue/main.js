import '@/../public/theme/custom.css';
import '@/../public/theme/element.css';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import "tailwindcss/tailwind.css";
import UmyTable from 'umy-table';
import 'umy-table/lib/theme-chalk/index.css';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import App from './App';
import Contextmenu from "./Contextmenu";
import connect from "./connect";
import design from "./design";
import forward from "./forward";
import { messages } from "./message";
import keyView from "./redis/keyView";
import redisStatus from "./redis/redisStatus";
import terminal from "./redis/terminal";
import status from "./status";
import structDiff from "./structDiff";
import sshTerminal from "./xterm";

Vue.use(Contextmenu).use(VueRouter)
  .use(VueI18n)
  .use(ElementUI, { locale })
  .use(UmyTable);

Vue.config.productionTip = false

const i18n = new VueI18n({
  locale:'en',
  fallbackLocale: 'en',
  messages
})

const router = new VueRouter({
  routes: [
    { path: '/connect', component: connect, name: 'connect' },
    { path: '/status', component: status, name: 'status' },
    { path: '/design', component: design, name: 'design' },
    { path: '/structDiff', component: structDiff, name: 'structDiff' },
    // redis
    { path: '/keyView', component: keyView, name: 'keyView' },
    { path: '/terminal', component: terminal, name: 'terminal' },
    { path: '/redisStatus', component: redisStatus, name: 'redisStatus' },
    // ssh
    { path: '/forward', component: forward, name: 'forward' },
    { path: '/sshTerminal', component: sshTerminal, name: 'sshTerminal' },
  ]
})

new Vue({
  el: '#app',i18n,
  components: { App },
  router,
  template: '<App/>'
})
