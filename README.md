# audit tool

## Launch
`npm start` Starts a local instance
`npm start:linux` Starts a local instance for macOS and Linux
`npm start:production` Starts a production instance for maOS and Linux

## Process Manager
We are using `pm2` as our main process management, you can read pm2.io for more information.
1. Install pm2 globally by doing `sudo npm install -g pm2@latest`
2. Run instance via `pm2 startOrReload ecosystem.config.js`
You can also link the instance to their web panel, create an account on their Keymetrics dashboard and it provides Linux commands to link it up.

## Database
To handle requests of different reports we are using MongoDB - we recommend using MongoDB Atlas as the traffic for this app will be fairly low.

## Nginx
For reverse proxying our audit tool, we forward it through Nginx that way our Node instance can safely run at port 3000. It is **best practice** to never have a node instance run on Port 80.

The configuration for our Nginx instance can be found in `_server/nginx.conf` and is to be used inside of your `/etc/nginx/sites-available/default` file.