/**
 * Chrome extension named Series Tracker is used to get last episode of a watched series
 */
var alertEmptyQuery = "Your search key is empty!";
var alertNoResult = "No result for the search!";
var oneYear = 1000 * 60 * 60 * 24 * 365;
var maxResults = 5;
var sleepTime = 1000;
var threadCounter = 0;
var alertDiv;
var searchResultsTable;
var seriesUrl = /^(.+)(\d+)(.+)(\d+)(.*)$/g;
var navTypeSeason = 0;
var navTypeEpisode = 1;
$( document ).ready(function() {
	alertDiv = $("#alert_div");
	searchResultsTable = $("#search_results");
	$("#search_series").submit(function(e) {
		searchOnHistory(e, true);
	});
	$("#search_series_query").on("input", function(e){
		searchOnHistory(null, false);
	});
	$("#bt_next_episode").on("click", function(e){
		navigationOnClick(e, navTypeEpisode);
	});
	$("#bt_next_season").on("click", function(e){
		navigationOnClick(e, navTypeSeason);
	});
});

function navigationOnClick(e, navType) {
	if (e != null) {
		e.preventDefault();
	}
	chrome.tabs.getSelected(null,function(tab) {
		var url = tab.url;
		var match = seriesUrl.exec(url);
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
				}
				var toUrl = match[1] + seasonNumber + match[3] + episodeNumber;
				if (match.length > 5) {
					toUrl += match[5];
				}
				chrome.tabs.update(tab.id, {url: toUrl});
			}
		} else {
			alert("Url is not suitable for navigation");
		}
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