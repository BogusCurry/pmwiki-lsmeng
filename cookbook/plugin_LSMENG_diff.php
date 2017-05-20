<?php

require_once("$FarmD/cookbook/plugin_LSMENG_edit.php");

// Used as a page variable. Update the page history if the history is not up to date by
// setting the history update interval to 0 and then call PostPage()
// This also serves as a manual pageindex update mechanism; pageindex update will be 
// performed for the current page if called.
$FmtPV['$updatePageHistory'] = 'updatePageHistory()';
function updatePageHistory()
{
  $URI = $_SERVER['REQUEST_URI'];

  // Perform an immediate history update then redirect to normal history page
  global $pagename;
  if (strripos($URI,'?action=diff&updateHistoryNow') !== false)
  {
    // get auth page => page and new
    $page = RetrieveAuthPage($pagename, 'edit');
    if (!$page) Abort("Error in updatePageHistory()!");

    if ($page['LastVerText'] != $page['text'])
    {
      $new = $page;

      // set page history update interval to 0
      global $pageHistoryUpdateInterval;
      $pageHistoryUpdateInterval = 0;

      PostPage($pagename, $page, $new);
    }

    Redirect($pagename.'?action=diff');
  }
  else
  { return "[[".$pagename."?action=diff&updateHistoryNow|"."Update]]"; }
}
