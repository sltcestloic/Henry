const fetch = require('node-fetch');
const auth = require('./auth.json');

runHenry();

async function runHenry() {
	var args = process.argv.slice(2);
	if (args.length != 1)
		console.log('Usage: node index.js <channel id>');
	else
		var channelId = await fetchChannelId(args[0]);
		var uploadsId = await fetchUploadsId(channelId);
		var videosId = await fetchVideosId(uploadsId);
		for (var i = 0; i < videosId.length; i++)
			console.log(`videosId[${i}] = ${videosId[i]}`);
}

async function fetchCaptionsText(trackUrl) {

	function decodeText(text) {
		return text.replace(/&[a-z]+;#\d+;/g, function(match) {
			return String.fromCharCode(match.match(/\d+/))
		})
	}

	var text
	await fetch(trackUrl, {method: "Get"})
		.then(res => res.text())
		.then(async (res) => {
			const expression = /<text start="[^"]+" dur="[^"]+">([^<]+)/g
			// Take the first group and decode it, for each match
			text = (res.match(expression) || []).map(e => decodeText(e.replace(expression, '$1')));
		})
		
	return text
}

async function fetchCaptionTracks(videoId) {

	var url = `https://youtube.com/watch?v=${videoId}`

	var captionTracks;
	await fetch(url, { method: "Get"})
		.then(res => res.text())
		.then(async (res) => {
			var expression = /"playerCaptionsTracklistRenderer":{"captionTracks":(\[[^\]]+\])/g
			var match = (res.match(expression) || []).map(e => e.replace(expression, '$1'));
			if(match.length > 0)
				captionTracks = JSON.parse(match)
			else 
				captionTracks = []
		})
	return captionTracks
}

async function fetchChannelId(query) {

	var url = `https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&q=${query}&type=channel&key=${auth.key}`
	
	var settings = { method: "Get" };

	var channelId;

	await fetch(url, settings)
    		.then(res => res.json())
    		.then((json) => {
			if (json.items == undefined)
				console.log('Channel not found');
			else {
				channelId = json.items[0].id.channelId;
				console.log(channelId);
			}
		});
	return channelId;
}

async function fetchUploadsId(channelId) {

	var url = `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${auth.key}&part=contentDetails`;

	var settings = { method: "Get" };

	var uploadsId;

	await fetch(url, settings)
    		.then(res => res.json())
    		.then((json) => {
			if (json.items == undefined)
				console.log('Channel not found');
			else {
				uploadsId = json.items[0].contentDetails.relatedPlaylists.uploads;
				console.log(uploadsId);
			}
		});
	return uploadsId;
}

async function fetchVideosId(uploadsId) {
	var url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsId}&key=${auth.key}&part=snippet&maxResults=20`;

	var settings = { method: "Get" };

	var videosId = [];
	
	await fetch(url, settings)
    	.then(res => res.json())
    	.then((json) => {
		if (json.items == undefined)
			console.log('No videos found..');
		else {
			for (let i = 0; i < json.items.length; i++) {
				var item = json.items[i];
				console.log(`video #${i}: ${item.snippet.resourceId.videoId}`);
				videosId[i] = item.snippet.resourceId.videoId;
			}
		}
	});
	return videosId;
}