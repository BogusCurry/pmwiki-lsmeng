[@    1| <?php
    2| date_default_timezone_set('Asia/Taipei');
    3| set_time_limit(3);
    4| 
    5| $file = '../../pmwikiTimeStamp/pmwikiTimeStamp.txt';
    6| #$file = 'cookbook/PLUGIN_LSMENG.php';
    7| #$file = 'pmwiki.php';
    8| 
    9| $str = file_get_contents($file);
   10| echo $str;
   11| #shell_exec("rm -f ".$file);
   12| 
   13| $expression = 'log(2)*exp(3)*pow(2,3)+  0';
   14| eval( '$result = (' . $expression . ');' );
   15| echo $result."\n\n";
   16| 
   17| 
   18| $string = 'It works ? Or not it works ?';
   19| $pass = '1234';
   20| $method = 'aes128';
   21| $iv = 'test';
   22| 
   23| $encryptedStr = @openssl_encrypt ($string, $method, $pass);
   24| $decrpytedStr = @openssl_decrypt ($encryptedStr, $method, $pass);
   25| echo $encryptedStr."\n";
   26| echo $decrpytedStr;
   27| 
   28| /*
   29|   $today = getdate();
   30|   $minStr = $today[minutes];
   31|   if ($minStr<10) { $minStr = "0".$today[minutes]; }
   32|   $secStr = $today[seconds];
   33|   if ($secStr<10) { $secStr = "0".$today[seconds]; }
   34|   $formatTime = $today[year]."/".$today[mon]."/".$today[mday]." ".$today[hours].":".$minStr.":".$secStr;
   35| 
   36| mail('lsmeng@ece.gatech.edu', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   37| mail('sam.meng@gatech.edu', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   38| mail('f95942117@gmail.com', 'Test mail at '.$formatTime, "dsdfsdfsrgfsd");
   39| */@]