var CronJob   = require('cron').CronJob;
var moment    = require('moment');
var fs        = require('fs-extra');
var request   = require('request');
var Canvas    = require('canvas');
var Image     = Canvas.Image;
var wallpaper = require('wallpaper');
var async     = require("async");

var width         = 550;
var level         = "4d"; //Level can be 4d, 8d, 16d, 20d
var numblocks     = 4; //this apparently corresponds directly with the level, keep this exactly the same as level without the 'd'
var canvas_size   = width * numblocks;
var local_storage = __dirname + '/images/';
var delete_old_backgrounds = false;

var desktop_width  = 1920;
var desktop_height = 1080;

function init(cb) {
	fs.ensureDir(local_storage, function (err) {
		if (err) {
			cb(err);
		} else {
			cb(null);
		}
	})
}

function getImageBlocks(cb) {
	console.log('Downloading image blocks.');
	var hours   = moment().format('HH');
	var minutes = moment().format('mm');
	minutes     = (parseInt(minutes) - (parseInt(minutes) % 10)).toString();
	var seconds = '00';

	var time  = hours + minutes + seconds;
	var year  = moment().format('YYYY');
	var month = moment().format('MM');
	var day   = moment().format('DD');

	var url     = "http://himawari8-dl.nict.go.jp/himawari8/img/D531106/" + level + "/" + width + "/" + year + "/" + month + "/" + day + "/" + time;
	var counter = 1;
	for (var y = 0; y < numblocks; y++) {
		for (var x = 0; x < numblocks; x++) {
			var file_name = "_" + x + "_" + y + ".png";
			var this_url  = url + "_" + x + "_" + y + ".png";
			download(this_url, local_storage + 'block' + file_name, function () {
				if ((counter++) >= numblocks * numblocks) {
					cb(null);
				}
			});
		}
	}
}

function stitchImageBlocks(cb) {
	console.log('Stitching image blocks.');

	var max_size     = desktop_width < desktop_height ? desktop_width : desktop_height;
	var default_size = width * numblocks;
	var scale        = max_size / default_size;
	var hor_offset   = (desktop_width - max_size) / 2;

	var out_file = 'latest_' + moment().format('YYYYMMDDHHmm') + '.png';
	var canvas   = new Canvas(desktop_width, desktop_height),
	    ctx      = canvas.getContext('2d');
	ctx.fillStyle="#000000";
	ctx.fillRect(0,0,desktop_width, desktop_height);

	var counter = 1;
	for (var y = 0; y < numblocks; y++) {
		for (var x = 0; x < numblocks; x++) {
			var file_name = "_" + x + "_" + y + ".png";

			//check to make sure the images exist
			if (!fs.existsSync(local_storage + 'block' + file_name, fs.F_OK)) {
				cb(new error('File missing. Aborting.'));
			}

			var img    = new Image;
			img.onload = function () {
				ctx.drawImage(img, (x * width * scale) + hor_offset, (y * width * scale), img.width * scale, img.height * scale);

				if ((counter++) >= numblocks * numblocks) {
					canvas.toBuffer(function (err, buf) {
						if (err) {
							cb(err);
						} else {
							console.log('Writing file ' + local_storage + out_file);
							fs.writeFile(local_storage + out_file, buf, function (err) {
								if (err) {
									cb(err);
								} else {
									cb(null, out_file);
								}
							});
						}
					
					});
				}
			};
			img.src    = local_storage + 'block' + file_name;
		}
	}
}

function setBackground(file_name, cb) {
	console.log('Setting background.');
	wallpaper.set(local_storage + file_name).then(function () {
		cb(null);
	});
}

function cleanUp(cb) {
	console.log('Cleaning up old files.');
	fs.emptyDir(local_storage, function (err) {
		if (err) {
			cb(err);
		} else {
			cb(null);
		}
	});
}

function download(uri, filename, callback) {
	console.log('Downloading ' + uri + ' to local file ' + filename);
	request.head(uri, function (err, res, body) {
		request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
	});
}

function run(cb) {
	console.log('Running task.');

	if (!delete_old_backgrounds){
		getImageBlocks(function (err) {
			if (err) {
				cb(err)
			} else {
				stitchImageBlocks(function (err, filename) {
					if (err) {
						cb(err)
					} else {
						setBackground(filename, function (err) {
							if (err) {
								cb(err)
							} else {
								cb(null)
							}
						})
					}
				})
			}
		});
	} else {
		cleanUp(function (err) {
			if (err) {
				cb(err)
			}
			getImageBlocks(function (err) {
				if (err) {
					cb(err)
				} else {
					stitchImageBlocks(function (err, filename) {
						if (err) {
							cb(err)
						} else {
							setBackground(filename, function (err) {
								if (err) {
									cb(err)
								} else {
									cb(null)
								}
							})
						}
					})
				}
			});
		});
	}
	
}

init(function (err) {
	if (err) {
		console.err(err);
		throw err;
	}

	run(function (err) {
		if (err) {
			console.err(err);
			throw err;
		} else {
			console.log('Done.');
		}
	});
});

