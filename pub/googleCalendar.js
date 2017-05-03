/* 
*
* This program is free software; you can redistribute it
* and/or modify it under the terms of the GNU General
* Public License as published by the Free Software
* Foundation; either version 3 of the License, or (at your
* option) any later version. Available at
* https://www.gnu.org/licenses/gpl.txt
*
* Copyright 2017 Ling-San Meng (f95942117@gmail.com)
* Version 20170402
*/


// Use AJAX to trigger the server to retrieve google calendar events, and then get the 
// events as response.
window.addEventListener('load', function()
{
	// Find all the bullet elements under the UL elements of wikitext. Try parsing the 
	// text contents of the bullet elements to see if it is for diary.
	var dayElement = [];
	var childrenWikiText = document.getElementById('wikitext').children;
	var childrenWikiTextLen = childrenWikiText.length;
	for (var i=0;i<childrenWikiTextLen;i++)
	{
	  if (childrenWikiText[i].tagName == "UL")
	  {
	    var gChildrenWikiText = childrenWikiText[i].children;
	    var gChildrenWikiTextLen = gChildrenWikiText.length;
	    for (var j=0;j<gChildrenWikiTextLen;j++)
	    {
				// Text must begin with "DD, " to be identified as diary
				var match = gChildrenWikiText[j].textContent.match(/^\s*(\d{1,2})\s*,/);
			  if (match)
	      {
	      	dayElement.push(gChildrenWikiText[j]);
	      	dayElement[dayElement.length-1].day = match[1];
	      }
	    }
	  }
	}
	
	var dayElementLen = dayElement.length;
	if (dayElementLen == 0) { console.log("No bullet elements found!"); return; }

  var req = new XMLHttpRequest();
	var url = window.location.href;
	// Remove the ending hash
	var match = url.match(/#.*$/i);
	if (match) { url = url.replace(match[0],""); }
	url += '?getGC=true';
	req.open('GET',url,true);
	req.send();

	// Create an image element for signaling the status of GC
	var GCImg = document.createElement('img');
	var style = GCImg.style;
	style.position = "fixed";
	style.top = "0px";
	style.right = "80px";
	style.width = "30px";
	style.height = "auto";
	style.zIndex = 2;
	style.webkitFilter = 'drop-shadow(3px 3px 3px gray)';
	style.opacity = 0.3;
	style.cursor = "pointer";
	GCImg.onclick = function(){ window.open("https://calendar.google.com/calendar/", '_blank'); }
  GCImg.src = GCImgUrl;
	GCImg.onload = function() { document.body.appendChild(this); }

	req.onreadystatechange = function()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
			{
        var response = this.responseText;
        
        // In case the response begins with "https://", the credential file does not exist
        // and the client should go to the given link to generate an auth code
        if (response.slice(0,8) == "https://")
        {
        	var choice = confirm("Credential for Google calendar is missing. Got code already?");
        	// After the code has been generated, the code is sent to the server via AJAX
        	// again
        	if (choice)
        	{
						var authCode = prompt("Enter the verification code:");
        	
						// Send the code to the server
						// Make another calendar request immediately, and then runs the
						// onreadystatechange function again
						this.open('POST',url,true);
						this.send(authCode);        	  
						arguments.callee();
        	}
        	else { window.open(response, '_blank'); }
				
        	return;
        }
				
        // The response is an array of the calendar events. No internet connection could
        // result in JSON parsing error.
        try {	var eventList = JSON.parse(response); }
        catch(e)
        {
        	console.log(response);
        	console.log('Calendar error');
					GCImg.remove();
        	return;
        }
        
        // Sort the events by day; "eventByDay" is a 2-d array with entry i storing
        // the list of events on day i; eventByDay[0] is unused
				// Currently the text content of an event is of the form
        // "tCalendarID eventSummary startDateTime~endDateTime eventID", where 
        // t is a single char code for the event type, immdeidately followed by (no space)
        // the ID of the calendar it belongs, followed by the event summary, followed by
        // the time range of the event, followed by the ID of the event.        
        var eventByDay = [];
        for (var i=0;i<eventList.length;i++)
        {
          var match = JSON.parse(eventList[i])["timeRange"].match(/^\d{4}-\d{2}-(\d{2})/);
          var day = parseInt(match[1]);
          if (eventByDay[day] == null) { eventByDay[day] = []; }
          eventByDay[day].push(eventList[i]);
        }
				
				console.log('Calendar ready');
				        
				style.opacity = 1.0;
				
				// A fix to work with Imgfocus...
				if (GCImg.originalOpacity) { GCImg.originalOpacity = 1.0; }
				
				// The procedure for appending the calendar event elements to daily bullet
				// elements. To work with the "imgfocus" recipe, the whole procedure is wrapped as
				// a function.
				var appendGCEventElement = function()
				{
					// Also a workaround for Imgfocus. If the overflow is set to hidden by Imgfocus
					// while the event elements are being attached, the positions will be incorrect.
					// Fix this by setting it to auto then revert it afterwards.
					var originalScrollState = document.body.style.overflow;
					if (originalScrollState == "hidden") { document.body.style.overflow = "auto"; }
	
					// Attach the calendar events to the associated daily bullet elements
					for (var i=0;i<dayElementLen;i++)
					{  			  
						dayElement[i].onmousemove = function(event)
						{
							// Check if the click is right on the element not its children, and
							// if the click is not too far to the right
							if (event.target != this || event.clientX > 250 ||
							(Math.abs(event.clientY-this.getBoundingClientRect().top) > 30))
							{ this.style.cursor = "initial"; }
							else
							{ this.style.cursor = "pointer"; }
						}
						dayElement[i].onclick = function(event)
						{
							if (event.target == this)
							{
								if (event.clientX > 250 || 
								(Math.abs(event.clientY-this.getBoundingClientRect().top) > 30)) { return; }
								
								var date = window.location.href.match(/\?n=.+\.(\d{6})/)[1];
								var year = date.slice(0,4);
								var mon = date.slice(4);
	
								// Create a new infodiv with contents "NEW EVENT"
								var infoDiv = document.createElement('input');
								infoDiv.value = "New event";
								infoDiv.calendarType = "r";
								infoDiv.dayElement = this;
								infoDiv.day = this.day;
								document.body.appendChild(infoDiv);
								infoDiv.selectionStart = 0;
								infoDiv.selectionEnd = infoDiv.value.length;
								
								// Insert the event element into the event list of this day bullet element
								if (!this.eventElementList) { this.nEvent = 0; this.eventElementList = []; }
								this.nEvent++;
								this.eventElementList.push(infoDiv);
								
								setupEventElement(infoDiv, year+mon);
								
								infoDiv.focus();
							}
						};
						
						// If calendar event exists for this day, create a div right next to the
						// corresponding dayElement
						if (eventByDay[dayElement[i].day])
						{
							dayElement[i].nEvent = 0;
							dayElement[i].eventElementList = [];
							for(var j=0;j<eventByDay[dayElement[i].day].length;j++)
							{
								var infoDiv = document.createElement('input');
								infoDiv.dayElement = dayElement[i];
								infoDiv.day = dayElement[i].day;
								
								// Parse the event array
								var calendarEvent = JSON.parse(eventByDay[dayElement[i].day][j]);
								infoDiv.eventID = calendarEvent["eventID"];
								infoDiv.calendarID = calendarEvent["calendarID"];
								infoDiv.calendarType = infoDiv.calendarID[0];
								infoDiv.calendarID = infoDiv.calendarID.slice(1);
								
								// Handle the date time presentation
								var timeRange = calendarEvent["timeRange"];
								var startDate = timeRange.slice(0,10);
								var startTime = timeRange.slice(11,16);
								var endDate = timeRange.slice(26,36);
								var endTime = timeRange.slice(37,42);
								infoDiv.value = calendarEvent["eventSummary"];
								if (startDate == endDate)
								{ infoDiv.value += " "+startTime+"~"+endTime; }
								// For cross-day events, list the complete end date/time
								else if (endDate != "") 
								{ infoDiv.value += " "+startTime+"~"+timeRange.slice(26,42); }
								
								dayElement[i].nEvent++;
								dayElement[i].eventElementList.push(infoDiv);
								
								setupEventElement(infoDiv, startDate);
							}
						}
					}
					
					if (originalScrollState == "hidden") { document.body.style.overflow = "hidden"; }
									
					// On window resize, fix the position of all calendar event elements
					window.addEventListener('resize', function()
					{
						for (var i=0;i<31;i++) 
						{ if (dayElement[i]) { fixGCElementPos(dayElement[i]); } }
					}, false);
				};

				// Working with the "imgfocus" recipe; if a popup image currently occupies the 
				// screen, set the appending of the GC event list elements as a callback function
				// to be called when the image is removed.
				if (window.imgfocus && imgfocus.popupImgElement)
				{ imgfocus.callback = appendGCEventElement; }
				else { appendGCEventElement(); }
			}
		}
	}

  /**************************************************************************************/
  
	// A very long aux function for configuring the event element; startDate is YYYYMM
	function setupEventElement(eventElement, startDate)
	{
		eventElement.year = startDate.slice(0,4);
		eventElement.mon = startDate.slice(5,7);

		setupEventElementBgColor(eventElement);
		
		// Contact the server and provide the updated content on editing the event
		// text
		eventElement.onchange = function()
		{							
			var req = new XMLHttpRequest();
			var url = window.location.href+'?getGC=true';
			req.open('POST',url,true);
			req.setRequestHeader( 'Content-type', 'application/x-www-form-urlencoded' );
	
			// Remove the time range
			var match = this.value.match(/^(.*\S)\s+(((\d{4}-)?\d{1,2}-)?\d{1,2}T)?(\d{1,2}:\d{1,2})(~(((\d{4}-)?\d{1,2}-)?\d{1,2}T)?(\d{1,2}:\d{1,2}))?\s*$/);
			if (match)
			{
				var eventSummary = match[1].trim();
				
				var startTime = format2DigitTime(match[5]);
				var endTime = format2DigitTime(match[10]);
				
				[endYear,endMon,endDay] = [startYear,startMon,startDay] =
				parseDateTime(match,this.year,this.mon,this.day);
				
				// If the end date/time is not provided, make it an hour later; no day
				// crossing
				if (!match[6])                  
				{
					var endHour = parseInt(startTime.slice(0,startTime.indexOf(":")))+1;
					var endMin = startTime.slice(startTime.indexOf(":")+1);
					if (endHour == 24) { endHour = 23; endMin = 59; }
					var endTime = make2Digit(endHour)+":"+make2Digit(endMin);
				}
				else
				{ [endYear,endMon,endDay] = parseDateTime(match.slice(5),this.year,this.mon,this.day); }
					
				var startDateTime = startYear+"-"+startMon+"-"+startDay+"T"+startTime+":00";
				var endDateTime = endYear+"-"+endMon+"-"+endDay+"T"+endTime+":00";
			}
			else // no datetime provided; make it a whole day event today
			{
				var eventSummary = this.value.trim();
				var startDateTime = this.year+"-"+this.mon+"-"+this.day;
			}
	
			// insert if event summary begins with a calendar type code
			// replace the calendarID with it
			match = eventSummary.match(/^\s*(\w),\s*/);
			if (match)
			{
				this.calendarType = match[1]; 
				eventSummary = eventSummary.slice(match[0].length);
				this.value = this.value.slice(match[0].length);
			}

			// A quick deletion for new events that have not been recorded in GC
			if (eventSummary == "" && !this.eventID) {	removeEventElement(this); return;	}
			
			req.send("eventSummary="+eventSummary+"&eventID="+this.eventID+"&calendarType="+this.calendarType+"&calendarID="+this.calendarID+"&startDateTime="+startDateTime+"&endDateTime="+endDateTime);
			this.style.opacity = 0.5;
			req.onreadystatechange = function()
			{
				if (this.readyState == 4 && this.status == 200)
				{
					if (eventSummary == "") { removeEventElement(eventElement); }
					else
					{
						try
						{
							var response = JSON.parse(this.response);
							eventElement.calendarID = response[0];
							eventElement.eventID = response[1];
						}
						catch(e) {}
						eventElement.style.opacity = 0.85;
						setupEventElementBgColor(eventElement);
						eventElement.oninput();
						fixGCElementPos(eventElement.dayElement);
					}
				}
			};
			
			// Remove an event element and adjust the positions of the rest elements of the day.
			function removeEventElement(eventElement)
			{
				var dayElement = eventElement.dayElement;
				eventElement.remove();
				dayElement.nEvent--;
				var index = dayElement.eventElementList.indexOf(eventElement);
				dayElement.eventElementList.splice(index, 1);
				eventElement.oninput();
				fixGCElementPos(eventElement.dayElement);
			}
		
			// An aux function to parse the date/time; the parsing is completely
			// dependent on the regex
			function parseDateTime(match, year, mon, day)
			{
				if (match[2])
				{
					var day = match[2].match(/(\d{1,2})T/)[1];
					if (match[4])
					{
						var year = match[4].slice(0,-1);  
						var mon = match[3].match(/-(\d{1,2})-/);
						mon = mon[1];
					}
					else if (match[3]) { var mon = make2Digit(match[3].slice(0,-1)); }
				}
				mon = make2Digit(mon);
				day = make2Digit(day);
				return [year, mon, day];
			}
	
			// An aux function to format time to follow the 2-digit rule
			function format2DigitTime(time)
			{
				if (!time) { return; }
				var hour = time.slice(0,time.indexOf(":"));
				var min = time.slice(time.indexOf(":")+1);
				return make2Digit(hour)+":"+make2Digit(min);
			}
	
			// An aux function which makes the input a string and prepends a 0 to it
			// if it's a single char.
			function make2Digit(value)
			{
				value = value.toString();
				if (value.length == 1) { return "0" + value; }
				else { return value; }
			}
		};
									
		eventElement.style.fontWeight = 'bold';
		eventElement.style.fontSize = '11pt';
		eventElement.style.fontFamily = 'Arial,Helvetica,sans-serif';
		eventElement.style.padding = '2px';
		eventElement.style.borderRadius = '3px';
		eventElement.style.border = '0';
		eventElement.style.position = 'absolute';
		eventElement.style.boxShadow = '3px 3px 9px gray';

		// Input element by default does not fit its width to its content; this is
		// solved by creating an identical div element and measure its width								
		eventElement.oninput = function()
		{
			var dummyElement = document.createElement('div');
			dummyElement.textContent = this.value;
			dummyElement.style.whiteSpace = "pre";
			dummyElement.style.fontWeight = 'bold';
			dummyElement.style.fontSize = '11pt';
			dummyElement.style.fontFamily = 'Arial,Helvetica,sans-serif';
			dummyElement.style.visibility = "hidden";
			dummyElement.style.position = 'absolute';
			document.body.appendChild(dummyElement);
			this.style.width = dummyElement.clientWidth + "px";
			dummyElement.remove();
			fixGCElementPos(this.dayElement);
		};
		eventElement.oninput();
		
		eventElement.style.opacity = 0;
		document.body.appendChild(eventElement);
		if (window.imgfocus) { imgfocus.fadeElement(eventElement, 0, 0.85, 100, null); }
		else { eventElement.style.opacity = 0.85; }
		
		fixGCElementPos(dayElement[i]);
		
		// An aux function to configure the background color of the event element
		// based on the given calendar type
		function setupEventElementBgColor(eventElement)
		{
			// Set the div bg color according to the calendar type
			if (eventElement.calendarType == 'b') { eventElement.style.background = 'rgb(159,198,231)'; }
			else if (eventElement.calendarType == 'r') { eventElement.style.background = 'rgb(248,58,34)'; }
			else if (eventElement.calendarType == 'g') { eventElement.style.background = 'rgb(22,167,101)'; }
			else if (eventElement.calendarType == 'y') { eventElement.style.background = 'rgb(251,233,131)'; }
			else if (eventElement.calendarType == 'c') { eventElement.style.background = 'rgb(146,225,192)'; }
			else if (eventElement.calendarType == 'z') { eventElement.style.background = 'rgb(246,145,178)'; }
		}								
	}
	
	// Fix the position of event elements of a given day bullet element
	function fixGCElementPos(dayElement)
	{
		if (dayElement.nEvent)
		{
			var hPosition = dayElement.getBoundingClientRect().left + 85;
			for(var j=0;j<dayElement.nEvent;j++)
			{
				var infoDiv = dayElement.eventElementList[j];
				infoDiv.style.top = dayElement.getBoundingClientRect().top + document.body.scrollTop + 3 + 'px';
				infoDiv.style.left = hPosition + 'px';
				hPosition += infoDiv.clientWidth + 10;
			}
		}
	}
}, false);

