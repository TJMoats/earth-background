# earth-background
Sets your desktop to the most recent image from the Himawari-8 satelite.

## Installation

### Mac/Linux
Clone the repo and run:

```bash
$ npm install
```

### Windows
Windows requires some additional libraries to function properly. The setup instruction for those libraries can be found here:
https://github.com/Automattic/node-canvas/wiki/Installation---Windows

## Simple run

```js
node app.js
```

## Automation

You can add an entry to your cron job to run the script every 10 minutes. Change the sh script to match your environment:

```
/path/to/node/executable/node /path/to/earth-background/app.js
```

And add an entry like this:

```
*/10 * * * * /path/to/earth-background/run.sh >> /logs/earth-background.txt
```

## Example background

The image is 2200x2200 by default. The image will be scaled down to the height of the display.

![alt tag](https://raw.githubusercontent.com/TJMoats/earth-background/master/example/latest_201606101054.png)

## Todo

2. Check compatibility on Nix
3. Allow multiple monitors
