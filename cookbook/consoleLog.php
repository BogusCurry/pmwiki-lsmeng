<?php
/**
 * Console log output for PHP
 * 
 * Copyright 2017 Ling-San Meng (f95942117@gmail.com)
 * Version 20170627
 */
 
$consoleMsgStyle = 'background: blue; color: white';
$consoleErrMsgStyle = 'background: red; color: white';
$consoleEndMsgStyle = 'background: yellow; color: green';
$skipErrMsg = array('E_NOTICE', 'E_DEPRECATED');
function consoleLog($data = null, $printStack = false)
{
  // Get the caller info
  $callClass = xdebug_call_class() == "" ? "" : xdebug_call_class()."::";
  $callFun = xdebug_call_function() == "{}" ? "" : xdebug_call_function()."() ";
  $caller = $callClass.$callFun."in ".str_replace(getcwd().'/', "", xdebug_call_file()).":".xdebug_call_line();

  // Inject the json encoded string as script. Note that the first json is to convert it
  // to JSON format; the 2nd call is to convert it into a valid string, as the whole thing
  // is passed as a string.
  global $consoleMsgStyle, $consoleErrMsgStyle;
  if (is_object($data) && strcasecmp(substr($data->class, 0, 2), "E_") === 0)
  {
    $msgTagStyle = $consoleErrMsgStyle;
    $errType = $data->class;
    global $skipErrMsg;
    if (!in_array($errType, $skipErrMsg))
    { echo "<script>console.log('%c PHP ' + '%c $errType', '$msgTagStyle', '');</script>"; }
    else { return; }
  }
  else
  {
    $msgTagStyle = $consoleMsgStyle;
    echo "<script>console.log('%c PHP ' + '%c $caller', '$msgTagStyle', '');</script>";
  }

  $_data = json_encode(json_encode($data));
  // If json encode failed, recursively utf8 encodes it and try again
  if ($_data === "false") { $_data = json_encode(json_encode(utf8ize($data))); }
  echo "<script>console.log(JSON.parse($_data));</script>";

  // Print the call stack by formatting xdebug_get_function_stack()
  // (the builtin Exception class's getTraceAsString() method truncates the parameters)
  if ($printStack)
  {
    $_data = xdebug_get_function_stack();
    $backtrace = "";
    foreach($_data as $key => $item)
    {
      if (end($_data) === $item) { break; }
      $file = str_replace(getcwd()."/", "", $item["file"]);
      $line = $item["line"];
      $fn = isset($item["function"]) ? $item["function"] : null;
      if (isset($fn))
      {
        $fn = isset($item["class"]) ? $item["class"]."->".$item["function"] : $item["function"];
        foreach($item["params"] as $i => $param)
        { if ($param === "") { $item["params"][$i] = "''"; } }
        $params = implode(",", $item["params"]);
        $fn = ": $fn($params)";
      }
      $backtrace .= "$key. $file($line)$fn\n";
    }
    $backtrace = json_encode(json_encode($backtrace));
    echo "<script>console.log(JSON.parse($backtrace));</script>"; // Inject as script
  }

  global $consoleEndMsgStyle;
  echo("<script>console.log('%c PHP ', '$consoleEndMsgStyle');</script>");
}

function utf8ize($data)
{
  if (is_string($data)) { $data = utf8_encode($data); }
  else if (is_array($data))
  { foreach($data as $key => $value) { $data[$key] = utf8ize($value); } }
  else if (is_object($data))
  { foreach($data as $key => $value) { $data->$key = utf8ize($value); } }
  return $data;
}

?>
