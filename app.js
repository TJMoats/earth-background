var CronJob = require('cron').CronJob;
var moment = require('moment');
var fs = require('fs-extra');
var request = require('request');
var Canvas = require('canvas'),
	Image = Canvas.Image,
	canvas = new Canvas(200, 200),
	ctx = canvas.getContext('2d');
var wallpaper = require('wallpaper');
var async = require("async");

var zone_offset = 0;
var width = 550;
var level = "4d"; //Level can be 4d, 8d, 16d, 20d
var numblocks = 4; //this apparently corresponds directly with the level, keep this exactly the same as level without the 'd'
var canvas_size = width * numblocks;
var local_storage = __dirname + '/images/';
var out_file = 'latest.png';

function init(cb)
{
	fs.ensureDir(local_storage, function (err) {
		if (err){
			cb(err);
		} else {
			cb(null);
		}
	})
}

function getImageBlocks(cb)
{
	console.log('Downloading image blocks.');
	var hours = moment().format('HH');
	var minutes = moment().format('mm');
	minutes = (parseInt(minutes) - (parseInt(minutes) % 10)).toString();
	var seconds = '00';
	
	var time = hours + minutes + seconds;
	var year = moment().format('YYYY');
	var month = moment().format('MM');
	var day = moment().format('DD');

	var url = "http://himawari8-dl.nict.go.jp/himawari8/img/D531106/" + level + "/" + width + "/" + year + "/" + month + "/" + day + "/" + time;
	var counter = 1;
	for(var y=0;y<numblocks;y++){
		for(var x=0;x<numblocks;x++){
			var file_name = "_" + x + "_" + y + ".png";
			var this_url = url + "_" + x + "_" + y + ".png";
			download(this_url, local_storage + 'block' + file_name, function(){
				if ((counter++) >= numblocks*numblocks){
					cb(null);
				}
			});
		}
	}
}

function stitchImageBlocks(cb)
{
	console.log('Stitching image blocks.');

	var canvas = new Canvas(canvas_size, canvas_size),
	    ctx = canvas.getContext('2d');

	var counter = 1;
	for(var y=0;y<numblocks;y++){
		for(var x=0;x<numblocks;x++){
			var file_name = "_" + x + "_" + y + ".png";

			//check to make sure the images exist
			if (!fs.existsSync(local_storage + 'block' + file_name, fs.F_OK)){
				console.err('File missing. Aborting.');
				return false;
			}

			var img = new Image;
			img.onload = function(){
				ctx.drawImage(img, x*width, y*width, img.width, img.height);
				if ((counter++) >= numblocks*numblocks){
					canvas.toBuffer(function(err, buf){
						if (err)
							cb(err);
						else
							console.log('Writing file ' + local_storage + out_file);
							fs.writeFile(local_storage + out_file, buf, function(err){
								if (err) {
									cb(err);
								} else {
									cb(null);
								}
							});
					});
				}
			};
			img.src = local_storage + 'block' + file_name;
		}
	}
}

function setBackground(cb)
{
	console.log('Setting background.');
	wallpaper.set(local_storage + out_file).then(function(){
		cb(null);
	});
}

function download(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

function run(cb){
	console.log('Running task.');
	async.series([
		getImageBlocks,
		stitchImageBlocks,
		setBackground,
	    function(){
		    cb(null);
	    }
	]);
}

run(function(){
	console.log('done');
});

init(function(err){
	if(err){
		throw err;
	}

	var job = new CronJob('*/5 * * * *', run, null,
		true, // Start the job right now
		'America/Phoenix' //Time zone of this job.
	);
});

