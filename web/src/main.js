import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createAuth0 } from '@auth0/auth0-vue';

import './assets/main.css'

const app = createApp(App)

app.use(
    createAuth0({
        domain: "coupla.au.auth0.com",
        client_id: "tnYkM52odhHr7oNFeswLNhnfVFRrwZP9",
        redirect_uri: window.location.origin,
        audience: "https://coupla.ai/api",
    })
);

app.use(router)

app.mount('#app')
