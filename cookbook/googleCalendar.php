<?php if (!defined('PmWiki')) exit();

require_once 'cookbook/google-api-php-client-2.1.1/vendor/autoload.php';

define('APPLICATION_NAME', 'PmWiki GC Integration');
define('CREDENTIALS_PATH', '.credentials/myCalendarCredential.json');
define('CLIENT_SECRET_PATH', 'cookbook/google-api-php-client-2.1.1/client_secret.json');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/myCalendarCredential.json
define('SCOPES', implode(' ', array(
//   Google_Service_Calendar::CALENDAR_READONLY)
  Google_Service_Calendar::CALENDAR)
));

$CALENDAR_TYPE = ["b" => "Repeated Work", "r" => "One-time Work", "g" => "Repeated Event",
"y" => "One-time Event", "c" => "Contacts", "z" => "Others"];

// Return or edit calendar events by AJAX request
if ($action =='browse' && isset($_GET["getGC"]))
{
	// A post request with "startDateTime" is for editing calendar events
	$startDateTime = $_POST['startDateTime'];
	if (isset($startDateTime))
	{
		$client = getClient();
		$service = new Google_Service_Calendar($client);

	  $eventSummary = $_POST['eventSummary'];
	  $eventID = $_POST['eventID'];
	  $calendarID = $_POST['calendarID'];
 	  $calendarType = $_POST['calendarType'];
	  $endDateTime = $_POST['endDateTime'];

		// Empty event text deletes the event
		if ($eventSummary == "")
		{
		  $service->events->delete($calendarID, $eventID);
		  echo "Calendar event deleted";  
		  exit;
		}

		// If the user forgot to specify the calendar type, set a default one
		if ($calendarID == "undefined" && $calendarType == "undefined")
		{ $calendarType = "r"; }
    
    // if calendarID is a single char, translate it into the correct calendarid
    if ($calendarType != "undefined")
    {
			$calendarListNum = sizeof($_SESSION['CALENDAR_ID']);
			global $CALENDAR_TYPE;
			for ($i=0;$i<$calendarListNum;$i++)
			{
				if ($_SESSION['CALENDAR_SUMMARY'][$i] == $CALENDAR_TYPE[$calendarType])
				{ $requestCalendarID = $_SESSION['CALENDAR_ID'][$i]; break;	}
			}
    }

		// Create event
		$event = new Google_Service_Calendar_Event(array(
			'summary' => $eventSummary,
			'start' => array(
				'dateTime' => '',
				'date' => '',
				'timeZone' => '',
			),
			'end' => array(
				'dateTime' => '',
				'date' => '',
				'timeZone' => '',
			),
		));
	
		// An all-day event
		if ($endDateTime == "undefined")
		{
			$event->start->dateTime = null;
			$event->end->dateTime = null;
			$event->start->date = $startDateTime;
			$event->end->date = $startDateTime;
		}
		// Regular event with time range
		else
		{
			$event->start->date = null;
			$event->end->date = null;
			$event->start->dateTime = $startDateTime;
			$event->start->timeZone = "+08:00";
			$event->end->dateTime = $endDateTime;
			$event->end->timeZone = "+08:00";
		}
	  
	  // For creating new event
	  if ($eventID == "undefined")
	  {
	  	if (isset($requestCalendarID))
	  	{
				$event = $service->events->insert($requestCalendarID, $event);
				echo json_encode([$requestCalendarID, $event->id]);				  
	  	}
	  	else { echo "Calendar type not found!"; }
	    exit;
	  }
	  
		// Else update the event
		else
		{
			// if request calendar ID defined and not match, delete teh original, insert a new
			// one
			if (isset($requestCalendarID) && ($requestCalendarID != $calendarID))
			{
			  $service->events->delete($calendarID, $eventID);
			  $event = $service->events->insert($requestCalendarID, $event);
			  echo json_encode([$requestCalendarID, $event->id]);
			}
			else
			{
				$service->events->update($calendarID, $eventID, $event);
				echo json_encode([$calendarID, $eventID]);
			}
		}
	}
	// Else it's for retrieving calendar events
	else
	{
		// In case the client post the authorization code using text/plain
		// (for constructing the credentials), provide it to the GC function 
		$authCode = file_get_contents('php://input');
		echo json_encode(getGCByMon($authCode));
	}
	
	exit;
}

/**
 * Returns an authorized API client.
 * @return Google_Client the authorized client object
 */
function getClient($authCode = "") {
  $client = new Google_Client();
  $client->setApplicationName(APPLICATION_NAME);
  $client->setScopes(SCOPES);
  $client->setAuthConfig(CLIENT_SECRET_PATH);
  $client->setAccessType('offline');

//   @session_start();
  
  // Load previously authorized credentials from a file.
  $credentialsPath = CREDENTIALS_PATH;
  if (file_exists($credentialsPath))
  { $accessToken = json_decode(decryptStr(file_get_contents($credentialsPath)), true); } 
  else 
  {
    if ($authCode == "")
    {
//     	@session_write_close();
			// Provide the client with the link to generate the authrization code
			$authUrl = $client->createAuthUrl();
			echo $authUrl; exit;  
    }
    
    // Exchange authorization code for an access token.
    $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);

    // Store the credentials to disk.
    if(!file_exists(dirname($credentialsPath))) {
      mkdir(dirname($credentialsPath), 0700, true);
    }
    
    file_put_contents($credentialsPath, encryptStr(json_encode($accessToken)));
  }
  $client->setAccessToken($accessToken);

  // Refresh the token if it's expired.
  if ($client->isAccessTokenExpired()) {
    $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
    file_put_contents($credentialsPath, encryptStr(json_encode($client->getAccessToken())));
  }
  
//   @session_write_close();
  return $client;
}

// Integrate with PmWiki. Return all the calendar events of the year/month parsed from  
// the current pagename. It turns out one query takes a somewhat fixed amount of time, 
// and it's best to just query the whole month and then process the returned events
function getGCByMon($authCode = "")
{
	// Get the API client and construct the service object.
	$client = getClient($authCode);
	$service = new Google_Service_Calendar($client);

	// Get the list of calendar summaries and the corresponding calendar IDs. Store them
	// in session variables to speed up future queries.
  if (!isset($_SESSION['CALENDAR_ID']))
	{
		// Get all the calendar id and summary
		// ID is kinda a string of random characters; summary is the name of each calendar.
		$calendarList = $service->calendarList->listCalendarList();
		$calendarListNum = sizeof($calendarList->items);
		$calendarID = array();
		$calendarSummary = array();
		for ($i=0;$i<$calendarListNum;$i++)
		{
			$id = $calendarList->items[$i]->id;
			array_push($calendarID, $id);
			array_push($calendarSummary, $calendarList->items[$i]->summary);
		}
// 		@session_start();
		$_SESSION['CALENDAR_ID'] = $calendarID;
		$_SESSION['CALENDAR_SUMMARY'] = $calendarSummary;
// 		@session_write_close();
	}
	else
	{
	  $calendarID = $_SESSION['CALENDAR_ID'];
		$calendarSummary = $_SESSION['CALENDAR_SUMMARY'];
	}
	$calendarListNum = sizeof($calendarID);
	
	// Parse the year and month from the current pagename
  global $pagename;  
  $diaryYear = substr($pagename,5,4);
  $diaryMonth = substr($pagename,9,2);
  $dateStr = $diaryYear."-".$diaryMonth;
	$timeMin = $dateStr.'-01T00:00:00+08:00';
	// This returns the last day of the month
	$timeMax = date("Y-m-t", strtotime($dateStr)).'T23:59:59+08:00';
	$optParams = array
	(
		'orderBy' => 'startTime',
		'singleEvents' => TRUE,
		'timeMin' => $timeMin,
		'timeMax' => $timeMax,
		'timeZone' => '+08:00',
	);
  
  $msg = array();
  
	for ($i=0;$i<$calendarListNum;$i++)
	{
		$calendarId = $calendarID[$i];
	  
	  // Get the one-char calendar code
	  global $CALENDAR_TYPE;
		$calendarType = array_search ($calendarSummary[$i], $CALENDAR_TYPE);
		
		$results = $service->events->listEvents($calendarId, $optParams);
		
		if (count($results->getItems()) > 0)
		{
			foreach ($results->getItems() as $event)
			{
   			// List the complete end time including year mon day if the ending date is not the
				// same as the starting date (a cross day event).
				$start = $event->start->dateTime;
				if ($start == "")
				{
					$start = $event->start->date;
					$timeRange = $start;
				}
				else
				{
					$end = $event->end->dateTime;  
					$timeRange = $start."~".$end;
				}
        
				// The msg to respond to the client is an array of events, with the event itself
				// also being an array of event properties
				array_push($msg, json_encode(["calendarID"=>$calendarType.$calendarId,
				"eventSummary"=>$event->getSummary(), "timeRange"=>$timeRange, "eventID"=>$event->id]));
			}
		}	  
	}

	return $msg;
}

// For debugging purpose
function getGCByDate($dateStr)
{
	// These variables are declared as static in the hope that it can slightly speed up
	// the subsequent calls. Since now the events of the whole month are retrieved at once,
	// this is redundant.
	static $service, $calendarID, $calendarListNum;
	
	if (!isset($service))
	{
		// Get the API client and construct the service object.
		$client = getClient();
		$service = new Google_Service_Calendar($client);
		
		// Get all the calendar id and summary; skip "contacts" if it's present
		$calendarList = $service->calendarList->listCalendarList();
		$calendarListNum = sizeof($calendarList->items);
		$calendarID = array();
		for ($i=0;$i<$calendarListNum;$i++)
		{
		  $id = $calendarList->items[$i]->id;
		  if ($id == "#contacts@group.v.calendar.google.com") { continue; }
			array_push($calendarID, $id);
		}
		$calendarListNum = sizeof($calendarID);
	}
	
	$timeMin = $dateStr . 'T00:00:00+08:00';
	$timeMax = $dateStr . 'T23:59:59+08:00';
	$optParams = array
	(
		'orderBy' => 'startTime',
		'singleEvents' => TRUE,
		'timeMin' => $timeMin,
		'timeMax' => $timeMax,
		'timeZone' => '+08:00',
	);

  $msg = "Upcoming events:\n";
  
	for ($i=0;$i<$calendarListNum;$i++)
	{
		// Print the next 10 events on the user's calendar.
		$calendarId = $calendarID[$i];
		
		$results = $service->events->listEvents($calendarId, $optParams);
		
		if (count($results->getItems()) > 0)
		{
			foreach ($results->getItems() as $event)
			{
				$start = substr($event->start->dateTime, strlen($dateStr)+1, 5);
				$end = substr($event->end->dateTime, strlen($dateStr)+1, 5);
				
				$msg .= $event->getSummary()." ".$start."~".$end."\n";
			}
		}	  
	}
  
	return $msg;
}
