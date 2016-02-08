[@    1| <?php
    2| date_default_timezone_set('Asia/Taipei');
    3| set_time_limit(3);
    4| 
    5| 
    6| $file = '../../pmwikiTimeStamp/pmwikiTimeStamp.txt';
    7| #$file = 'cookbook/PLUGIN_LSMENG.php';
    8| #$file = 'pmwiki.php';
    9| 
   10| $str = file_get_contents($file);
   11| echo $str;
   12| #shell_exec("rm -f ".$file);
   13| 
   14| 
   15| /*
   16|   $today = getdate();
   17|   $minStr = $today[minutes];
   18|   if ($minStr<10) { $minStr = "0".$today[minutes]; }
   19|   $secStr = $today[seconds];
   20|   if ($secStr<10) { $secStr = "0".$today[seconds]; }
   21|   $formatTime = $today[year]."/".$today[mon]."/".$today[mday]." ".$today[hours].":".$minStr.":".$secStr;
   22| 
   23| mail('lsmeng@ece.gatech.edu', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   24| mail('sam.meng@gatech.edu', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   25| mail('f95942117@gmail.com', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   26| */@]