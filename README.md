# earth-background
Sets your desktop to the most recent image from the Himawari-8 satelite.

## Installation

### Mac
Clone the repo and run:

```bash
$ brew install pkg-config cairo libpng jpeg giflib
$ npm install
```

### Linux
Clone the repo and run:

```bash
$ npm install
```

### Windows
Windows requires some additional libraries to function properly. The setup instruction for those libraries can be found here:
https://github.com/Automattic/node-canvas/wiki/Installation---Windows

After following those steps, run:

```bash
$ npm install
```

## Simple run

```js
node app.js
```

## Automation

You can add an entry to your cron job to run the script every 10 minutes.

```
*/10 * * * * /path/to/earth-background/run.sh >> /logs/earth-background.txt
```

If you want to use the provided sh script, modify it to match your environment:

```
/path/to/node/executable/node /path/to/earth-background/app.js
```

## Example background

The image is 2200x2200 by default. The image will be scaled down to the height of the display and centered on a WxH black background.

![alt tag](https://raw.githubusercontent.com/TJMoats/earth-background/master/example/latest_201606101054.png)

## Todo

1. Check compatibility on Nix
2. Allow multiple monitors
