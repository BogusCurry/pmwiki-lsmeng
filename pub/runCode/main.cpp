[@    1| <?php
    2| date_default_timezone_set('Asia/Taipei');
    3| set_time_limit(3);
    4| 
    5| 
    6| #$file = 'wiki.d/.pageindex';
    7| $file = '../../pmwikiTimeStamp/pmwikiTimeStamp.txt';
    8| #$file = 'cookbook/PLUGIN_LSMENG.php';
    9| #$file = 'pmwiki.php';
   10| 
   11| $str = file_get_contents($file);
   12| echo $str;
   13| #shell_exec("rm -f ".$file);
   14|  
   15| $ciphers             = openssl_get_cipher_methods();
   16| $ciphers_and_aliases = openssl_get_cipher_methods(true);
   17| $cipher_aliases      = array_diff($ciphers_and_aliases, $ciphers);
   18| 
   19| print_r($ciphers);
   20| 
   21| print_r($cipher_aliases);
   22| 
   23| /*
   24|   $today = getdate();
   25|   $minStr = $today[minutes];
   26|   if ($minStr<10) { $minStr = "0".$today[minutes]; }
   27|   $secStr = $today[seconds];
   28|   if ($secStr<10) { $secStr = "0".$today[seconds]; }
   29|   $formatTime = $today[year]."/".$today[mon]."/".$today[mday]." ".$today[hours].":".$minStr.":".$secStr;
   30| 
   31| mail('lsmeng@ece.gatech.edu', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   32| mail('sam.meng@gatech.edu', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   33| mail('f95942117@gmail.com', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   34| */@]