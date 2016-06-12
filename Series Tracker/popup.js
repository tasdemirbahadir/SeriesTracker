/**
 * Chrome extension named Series Tracker is used to get last episode of a watched series
 */
var alertEmptyQuery = "Your search key is empty!";
var alertNoResult = "No result for the search!";
var alertNextPartUnAvailable = "Url is not suitable for navigation";
var oneYear = 1000 * 60 * 60 * 24 * 365;
var maxResults = 5;
var sleepTime = 1000;
var threadCounter = 0;
var alertDiv;
var searchResultsTable;
var regexBundle = [
	/^([^\d]+)(\d+)([^\d]+)(\d+)([^\d]+)$/g,
	/^([^\d]+)(\d+)([^\d]+)(\d+)([^\d]+)(\d+)([^\d]*)$/g
];
var navTypeSeason = 0;
var navTypeEpisode = 1;
var navTypeSeasonPrev = 2;
var navTypeEpisodePrev = 3;
$( document ).ready(function() {
	alertDiv = $("#alert_div");
	searchResultsTable = $("#search_results");
	$("#search_series").submit(function(e) {
		searchOnHistory(e, true);
	});
	$("#search_series_query").on("input", function(e){
		searchOnHistory(null, false);
	});
	//Buttons
	$("#bt_next_episode").on("click", function(e){
		navigationOnClick(e, navTypeEpisode);
	});
	$("#bt_next_season").on("click", function(e){
		navigationOnClick(e, navTypeSeason);
	});
	$("#bt_prev_episode").on("click", function(e){
		navigationOnClick(e, navTypeEpisodePrev);
	});
	$("#bt_prev_season").on("click", function(e){
		navigationOnClick(e, navTypeSeasonPrev);
	});
});

function navigationOnClick(e, navType) {
	if (e != null) {
		e.preventDefault();
	}
	alertDiv.html("");
	chrome.tabs.getSelected(null,function(tab) {
		var url = tab.url;
		for (var i = 0; i < regexBundle.length; i++) {
			if (regexBundle[i].test(url)) {
				regexBundle[i].lastIndex = 0;
				var match = regexBundle[i].exec(url);
				if (match) {
					//(.+)(\d+)(.+)(\d+)(.*)
					if (match.length >= 5) {
						var seasonNumber = parseInt(match[2]);
						var episodeNumber = parseInt(match[4]);
						if (navType == navTypeSeason) {
							seasonNumber++;
							episodeNumber = 1;
						} else if (navType == navTypeEpisode) {
							episodeNumber++;
						} else if (navType == navTypeSeasonPrev) {
							seasonNumber--;
						} else if (navType == navTypeEpisodePrev) {
							episodeNumber--;
						}
						var toUrl = match[1] + seasonNumber + match[3] + episodeNumber;
						if (match.length > 5) {
							toUrl += match[5];
						}
						if (match.length > 6) {
							toUrl += match[6];
						}
						if (match.length > 7) {
							toUrl += match[7];
						}
						chrome.tabs.update(tab.id, {url: toUrl});
					}
				} else {
					alertDiv.html(alertNextPartUnAvailable);
				}
				return;
			}
		}
		alertDiv.html(alertNextPartUnAvailable);
	});
}

function searchOnHistory(e, isSubmit){
	var currentId = ++threadCounter;
	if (e != null) {
		e.preventDefault();
	}
	searchResultsTable.empty();
	alertDiv.html("");
	var query = $('#search_series_query').val();
	if (query == "") {
		if (isSubmit) {
			alertDiv.html(alertEmptyQuery);
			return;
		}
	} else {
		//if enter is pressed, search directly
		if (isSubmit) {
			searchUserHistory(query);
		} else {
			//sleep for key typing
			setTimeout(function(){
				//check if a new key is typed in sleepTime
				if (currentId == threadCounter) {
					searchUserHistory(query);
				} else {
					return;
				}
			}, sleepTime);
		}
	}
}

function searchUserHistory(query) {
	var queryObject = {};
	queryObject["text"] = query;
	queryObject["startTime"] = new Date().getTime() - oneYear;
	queryObject["endTime"] = new Date().getTime();
	queryObject["maxResults"] = maxResults;
	chrome.history.search(queryObject, function(results){
		alertDiv.html("");
		searchResultsTable.empty();
		if (results.length == 0) {
			alertDiv.html(alertNoResult);
		} else {
			var row;
			var info;
			var newlink;
			var newpharagraph
			var wrap;
			for (var i = 0; i < results.length; i++) {
				info = (results[i].title != "" ? results[i].title : results[i].url).replace(/\s+/g, ' ');
				wrap = document.createElement('div');
				newlink = document.createElement('a');
				newpharagraph = document.createElement('p');
				
				newlink.setAttribute('target', '_blank');
				newlink.setAttribute('href', results[i].url);
				
				newpharagraph.setAttribute('class', 'trancate');
				newpharagraph.appendChild(document.createTextNode(info));
				
				newlink.appendChild(newpharagraph.cloneNode(true));
				wrap.appendChild(newlink.cloneNode(true));
				row = $("<tr><td>" + wrap.innerHTML + "</td></tr>");
				searchResultsTable.append(row);
			}
		}
	});
}