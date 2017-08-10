<?php
/**
 * Perform routing and serve the right page.
 * Note that a file request is not processed here, including any direct access to .php
 * 
 */
// session_start();
// var_dump($_SESSION);exit;
define("INDEX_PMWIKI", 1);
define("DEBUG", 1);

if (DEBUG)
{
  error_reporting((E_ALL ^ E_NOTICE) & ~E_DEPRECATED);

  ini_set("xdebug.trace_output_dir", getcwd());
  // fxdebug_start_trace();
  // ini_set("xdebug.coverage_enable", 1);
  // xdebug_start_code_coverage();

  ini_set('xdebug.dump_globals', 1);
  ini_set('xdebug.dump_once', 1);
  ini_set('xdebug.dump_undefined', 1);
  ini_set('xdebug.dump.GET', '*');
  ini_set('xdebug.dump.FILES', '*');
  ini_set('xdebug.dump.GET', '*');
  ini_set('xdebug.dump.POST', '*');
  ini_set('xdebug.dump.REQUEST', '*');
  ini_set('xdebug.dump.SERVER', '*');
  ini_set('xdebug.dump.SESSION', '*');
  ini_set('xdebug.show_local_vars', 1);
  ini_set('xdebug.collect_params', 4); //Also affects function trace files
  ini_set('xdebug.show_exception_trace', 1);

  $phpConsolePath = "../../php-console/consoleLog.php";
  if (file_exists($phpConsolePath)) { include_once($phpConsolePath); }
  else { function consoleLog() { return; } }
}
else
{
  function consoleLog() { return; }
  error_reporting(0);
}

// The path under documentRoot for pmwiki home directory. A trailing slash is needed.
// In fact as long as the URL is formed as http://hostname/base/group/page/action
// It will work. Even if file system is not structured following $base
$base = "/";

// Get URI and strip $base from it
$URI = $_SERVER["REQUEST_URI"];
if ($base !== "/")
{
  $_base = preg_replace("/\/$/", '', $base);
  $_base = preg_replace("/\//", '\/', $_base);

  // If URI does not begin with $base, the request is invalid
  if(!preg_match("/^$_base(?=\/|$)/", $URI)) { echo "URL invalid!"; exit; }

  $URI = preg_replace("/^$_base(?=\/|$)/", '', $URI);
}

// now URI is of the form /main/test/edit or / or emtpy
// Redirect to homepage for accessing $base
if ($URI === "" || $URI === "/") { header("Location: $base"."Main/Homepage"); return; }

// Else parse the group/page/action from the URI
else
{
  preg_match("/^\/([\w-]+)[\/\.]?([\w-]+)?\/?([\w-]+)?\/?[^\/]*$/i", $URI, $match);

  if (!$match) { echo "URL invalid!"; exit; }

  $pagename = $match[1]."/";
  if (isset($match[2])) { $pagename .= $match[2]; }
  $_REQUEST["n"] = $_GET["n"] = $pagename;

  if (!isset($_GET["action"]) && isset($match[3]))
  { $_REQUEST["action"] = $_GET["action"] = $match[3]; }
}

include("pmwiki.php");
